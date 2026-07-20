import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { beforeAll, describe, expect, it } from 'vitest'
import { ensureCliRuntimeReady, ensureVariantReady, repoVariants } from '../../config/config.js'
import {
  runAgentspaceCli,
  runAgentspaceCliWithoutRepo,
  toItems,
} from './agentspace-cli.harness.js'

for (const variant of repoVariants) {
  describe(`agentspace-cli integration (${variant.label})`, () => {
    beforeAll(async () => {
      await ensureCliRuntimeReady()
      await ensureVariantReady(variant)
    })

    it('supports project CRUD across repo variants', async () => {
      const projectName = `Agentspace Test Project ${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`
      const projectSlug = `agentspace-test-project-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`
      const created = (await runAgentspaceCli(
        [
          'tool',
          '--id',
          'agentspace.project.create',
          '--input',
          JSON.stringify({
            data: {
              name: projectName,
              slug: projectSlug,
              description: 'Created from agentspace CLI integration tests',
              createdBy: 'agentspace-tests',
              updatedBy: 'agentspace-tests',
            },
          }),
        ],
        variant.url,
      )) as { id?: string; name?: string; scopeId?: string }

      const projectId = String(created.id ?? '')
      expect(projectId).not.toBe('')
      expect(String(created.name ?? '')).toBe(projectName)
      expect(String(created.scopeId ?? '')).toBe(projectId)

      try {
        const loadedViaOp = (await runAgentspaceCli(
          ['op', 'agentspace.project.get-by-id', '--id', projectId],
          variant.url,
        )) as { id?: string; name?: string; description?: string }
        expect(String(loadedViaOp.id ?? '')).toBe(projectId)
        expect(String(loadedViaOp.name ?? '')).toBe(projectName)

        const listed = await runAgentspaceCli(
          ['project', 'list-projects', '--filter', JSON.stringify({ id: projectId })],
          variant.url,
        )
        expect(toItems(listed).some((item) => String(item.id ?? '') === projectId)).toBe(true)

        const updated = (await runAgentspaceCli(
          [
            'op',
            'agentspace.project.update-project',
            '--id',
            projectId,
            '--patch',
            JSON.stringify({
              description: 'Updated from agentspace CLI integration tests',
              updatedBy: 'agentspace-tests-updated',
            }),
          ],
          variant.url,
        )) as { id?: string; description?: string; updatedBy?: string }
        expect(String(updated.id ?? '')).toBe(projectId)
        expect(String(updated.description ?? '')).toBe('Updated from agentspace CLI integration tests')
        expect(String(updated.updatedBy ?? '')).toBe('agentspace-tests-updated')
      } finally {
        await runAgentspaceCli(
          ['op', 'agentspace.project.remove-project', '--id', projectId],
          variant.url,
        )
      }
    }, 180_000)

    it('supports skill package import/export/materialize across repo variants', async () => {
      const projectName = `Agentspace Skill Package ${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`
      const projectSlug = `agentspace-skill-package-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`
      const skillName = `skill-package-${Date.now()}`
      const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'agentspace-skill-package-'))
      const outputDir = path.join(tempRoot, 'materialized')

      const skillMarkdown = [
        '---',
        `name: ${skillName}`,
        'description: Skill package integration test',
        '---',
        '',
        `# ${skillName}`,
        '',
        '## Instructions',
        '- Verify canonical skill package import/export/materialize flow.',
      ].join('\n')

      let projectId = ''
      let skillId = ''
      let skillVersionId = ''

      try {
        const createdProject = (await runAgentspaceCli(
          [
            'tool',
            '--id',
            'agentspace.project.create',
            '--input',
            JSON.stringify({
              data: {
                name: projectName,
                slug: projectSlug,
                description: 'Project for skill package integration tests',
                createdBy: 'agentspace-tests',
                updatedBy: 'agentspace-tests',
              },
            }),
          ],
          variant.url,
        )) as { id?: string; scopeId?: string }

        projectId = String(createdProject.id ?? '')
        expect(projectId).not.toBe('')
        expect(String(createdProject.scopeId ?? '')).toBe(projectId)

        const imported = (await runAgentspaceCli(
          [
            'tool',
            '--id',
            'agentspace.skill-version.import-skill-package',
            '--input',
            JSON.stringify({
              data: {
                projectId,
                scopeType: 'project',
                scopeId: projectId,
                createdBy: 'agentspace-tests',
                updatedBy: 'agentspace-tests',
                publish: true,
                bundle: {
                  sourcePath: '/tmp/agentspace-skill-package-test',
                  metadata: {
                    source: 'agentspace-tests',
                    purpose: 'round-trip',
                  },
                  files: [
                    {
                      path: 'SKILL.md',
                      kind: 'instruction',
                      content: skillMarkdown,
                    },
                    {
                      path: 'references/checklist.md',
                      kind: 'reference',
                      content: '# Checklist\n- Round-trip verified.\n',
                    },
                  ],
                },
              },
            }),
          ],
          variant.url,
        )) as {
          skill?: { id?: string; name?: string; tags?: string[] }
          skillVersion?: { id?: string; skillStandard?: string; entryFile?: string }
        }

        skillId = String(imported.skill?.id ?? '')
        skillVersionId = String(imported.skillVersion?.id ?? '')
        expect(skillId).not.toBe('')
        expect(skillVersionId).not.toBe('')
        expect(String(imported.skill?.name ?? '')).toBe(skillName)
        expect(Array.isArray(imported.skill?.tags) && imported.skill?.tags.includes('skill-package')).toBe(true)
        expect(String(imported.skillVersion?.skillStandard ?? '')).toBe('aops-skill-package-v1')
        expect(String(imported.skillVersion?.entryFile ?? '')).toBe('SKILL.md')

        const exported = (await runAgentspaceCli(
          [
            'tool',
            '--id',
            'agentspace.skill-version.export-skill-package',
            '--input',
            JSON.stringify({ id: skillVersionId }),
          ],
          variant.url,
        )) as {
          metadata?: { source?: string; purpose?: string }
          manifest?: {
            versionId?: string
            packageSha256?: string
            files?: Array<{ path?: string; sha256?: string; byteLength?: number }>
            provenance?: { trustClass?: string; expectedDigestSource?: string }
          }
          package?: { entryFile?: string; standard?: string; format?: string; sourcePath?: string; fileCount?: number }
          files?: Array<{ path?: string; content?: string }>
        }

        expect(String(exported.package?.entryFile ?? '')).toBe('SKILL.md')
        expect(String(exported.package?.standard ?? '')).toBe('aops-skill-package-v1')
        expect(String(exported.package?.format ?? '')).toBe('filesystem-skill-package')
        expect(exported.package?.sourcePath).toBeUndefined()
        expect(Number(exported.package?.fileCount ?? 0)).toBe(2)
        expect(String(exported.metadata?.source ?? '')).toBe('agentspace-tests')
        expect(String(exported.metadata?.purpose ?? '')).toBe('round-trip')
        const filePaths = (exported.files ?? []).map((file) => String(file.path ?? ''))
        expect(filePaths).toContain('SKILL.md')
        expect(filePaths).toContain('references/checklist.md')
        expect(filePaths).not.toContain('agents/openai.yaml')
        expect(String(exported.manifest?.versionId ?? '')).toBe(skillVersionId)
        expect(String(exported.manifest?.packageSha256 ?? '')).toMatch(/^[a-f0-9]{64}$/)
        expect(exported.manifest?.files).toHaveLength(2)
        expect(exported.manifest?.provenance).toMatchObject({
          trustClass: 'verified-hosted-package',
          expectedDigestSource: 'immutable-hosted-metadata',
        })
        expect(JSON.stringify(exported)).not.toContain('/tmp/agentspace-skill-package-test')

        const searched = (await runAgentspaceCli(
          [
            'tool',
            '--id',
            'agentspace.skill.search',
            '--input',
            JSON.stringify({ query: skillName, scopeId: projectId, limit: 5 }),
          ],
          variant.url,
        )) as {
          candidates?: Array<{
            skillId?: string
            versionId?: string
            exactRef?: string
            packageSha256?: string
            contentSha256?: string
            origin?: string
            computedTrustClass?: string
            matchedBy?: string[]
            rationale?: string
          }>
        }
        expect(searched.candidates?.[0]).toMatchObject({
          skillId,
          versionId: skillVersionId,
          exactRef: `skill-version:${skillVersionId}`,
          packageSha256: exported.manifest?.packageSha256,
          origin: 'hosted',
          computedTrustClass: 'verified-hosted-package',
        })
        expect(String(searched.candidates?.[0]?.contentSha256 ?? '')).toMatch(/^[a-f0-9]{64}$/)
        expect(searched.candidates?.[0]?.matchedBy).toContain('name')
        expect(String(searched.candidates?.[0]?.rationale ?? '')).toContain('score')
        expect(Buffer.byteLength(JSON.stringify(searched), 'utf8')).toBeLessThanOrEqual(2 * 1024)

        const asked = (await runAgentspaceCli(
          [
            'tool',
            '--id',
            'agentspace.skill.ask',
            '--input',
            JSON.stringify({ query: skillName, scopeId: projectId, limit: 3 }),
          ],
          variant.url,
        )) as { answer?: string; candidates?: Array<{ versionId?: string }> }
        expect(String(asked.answer ?? '')).toContain(`skill-version:${skillVersionId}`)
        expect(asked.candidates?.[0]?.versionId).toBe(skillVersionId)

        const materialized = (await runAgentspaceCli(
          [
            'tool',
            '--id',
            'agentspace.skill-version.materialize-skill-package',
            '--input',
            JSON.stringify({
              id: skillVersionId,
              data: {
                outputDir,
                overwrite: true,
              },
            }),
          ],
          variant.url,
        )) as {
          outputDir?: string
          writtenFiles?: Array<{ path?: string }>
        }

        expect(String(materialized.outputDir ?? '')).toBe(outputDir)
        const writtenPaths = (materialized.writtenFiles ?? []).map((file) => String(file.path ?? ''))
        expect(writtenPaths).toHaveLength(2)
        expect(writtenPaths).toEqual(expect.arrayContaining(['SKILL.md', 'references/checklist.md']))
        expect(fs.readFileSync(path.join(outputDir, 'SKILL.md'), 'utf8')).toContain(`# ${skillName}`)
        expect(fs.readFileSync(path.join(outputDir, 'references', 'checklist.md'), 'utf8')).toContain('Round-trip verified')
      } finally {
        if (skillVersionId) {
          try {
            await runAgentspaceCli(
              [
                'tool',
                '--id',
                'agentspace.skill-version.remove-skill-version',
                '--input',
                JSON.stringify({ id: skillVersionId }),
              ],
              variant.url,
            )
          } catch {}
        }
        if (skillId) {
          try {
            await runAgentspaceCli(
              [
                'tool',
                '--id',
                'agentspace.skill.remove-skill',
                '--input',
                JSON.stringify({ id: skillId }),
              ],
              variant.url,
            )
          } catch {}
        }
        if (projectId) {
          try {
            await runAgentspaceCli(
              [
                'tool',
                '--id',
                'agentspace.project.remove-project',
                '--input',
                JSON.stringify({ id: projectId }),
              ],
              variant.url,
            )
          } catch {}
        }
        fs.rmSync(tempRoot, { recursive: true, force: true })
      }
    }, 180_000)
  })
}

describe('agentspace-cli default sqlite fallback', () => {
  beforeAll(async () => {
    await ensureCliRuntimeReady()
  })

  it('boots with the default sqlite fallback for runtime commands in an isolated home', async () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'agentspace-cli-default-sqlite-'))
    const tempHome = path.join(tempRoot, 'home')
    const localDbPath = path.join(tempHome, '.aops', 'agentspace.aops.sqlite')
    const isolatedEnv = {
      HOME: tempHome,
      USERPROFILE: tempHome,
    }
    const projectName = `Agentspace Default SQLite ${Date.now()}`

    let projectId = ''

    try {
      expect(fs.existsSync(localDbPath)).toBe(false)

      const created = (await runAgentspaceCliWithoutRepo(
        [
          'tool',
          '--id',
          'agentspace.project.create',
          '--input',
          JSON.stringify({
            data: {
              name: projectName,
              description: 'Default sqlite fallback project',
              createdBy: 'agentspace-tests',
              updatedBy: 'agentspace-tests',
            },
          }),
        ],
        isolatedEnv,
      )) as { id?: string; scopeId?: string }

      projectId = String(created.id ?? '')
      expect(projectId).not.toBe('')
      expect(String(created.scopeId ?? '')).toBe(projectId)
      expect(fs.existsSync(localDbPath)).toBe(true)

      const listed = await runAgentspaceCliWithoutRepo(
        ['project', 'list-projects', '--filter', JSON.stringify({ id: projectId })],
        isolatedEnv,
      )
      expect(toItems(listed).some((item) => String(item.id ?? '') === projectId)).toBe(true)
    } finally {
      if (projectId) {
        await runAgentspaceCliWithoutRepo(
          ['op', 'agentspace.project.remove-project', '--id', projectId],
          isolatedEnv,
        )
      }
      fs.rmSync(tempRoot, { recursive: true, force: true })
    }
  }, 180_000)
})
