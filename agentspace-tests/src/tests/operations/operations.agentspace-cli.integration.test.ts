import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
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

    it('supports workspace CRUD across repo variants', async () => {
      const workspaceName = `Agentspace Test Workspace ${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`
      const ownerId = randomUUID()
      const created = (await runAgentspaceCli(
        [
          'tool',
          '--id',
          'agentspace.workspace.create',
          '--input',
          JSON.stringify({
            data: {
              ownerId,
              name: workspaceName,
              description: 'Created from agentspace CLI integration tests',
              createdBy: 'agentspace-tests',
              updatedBy: 'agentspace-tests',
            },
          }),
        ],
        variant.url,
      )) as { id?: string; name?: string }

      const workspaceId = String(created.id ?? '')
      expect(workspaceId).not.toBe('')
      expect(String(created.name ?? '')).toBe(workspaceName)

      try {
        const loadedViaOp = (await runAgentspaceCli(
          ['op', 'agentspace.workspace.get-by-id', '--id', workspaceId],
          variant.url,
        )) as { id?: string; name?: string; description?: string }
        expect(String(loadedViaOp.id ?? '')).toBe(workspaceId)
        expect(String(loadedViaOp.name ?? '')).toBe(workspaceName)

        const listed = await runAgentspaceCli(
          ['workspace', 'list-workspaces', '--filter', JSON.stringify({ id: workspaceId })],
          variant.url,
        )
        expect(toItems(listed).some((item) => String(item.id ?? '') === workspaceId)).toBe(true)

        const updated = (await runAgentspaceCli(
          [
            'op',
            'agentspace.workspace.update-workspace',
            '--id',
            workspaceId,
            '--patch',
            JSON.stringify({
              description: 'Updated from agentspace CLI integration tests',
              updatedBy: 'agentspace-tests-updated',
            }),
          ],
          variant.url,
        )) as { id?: string; description?: string; updatedBy?: string }
        expect(String(updated.id ?? '')).toBe(workspaceId)
        expect(String(updated.description ?? '')).toBe('Updated from agentspace CLI integration tests')
        expect(String(updated.updatedBy ?? '')).toBe('agentspace-tests-updated')
      } finally {
        await runAgentspaceCli(
          ['op', 'agentspace.workspace.remove-workspace', '--id', workspaceId],
          variant.url,
        )
      }
    }, 180_000)

    it('supports skill package import/export/materialize across repo variants', async () => {
      const workspaceName = `Agentspace Skill Package ${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`
      const ownerId = randomUUID()
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

      let workspaceId = ''
      let skillId = ''
      let skillVersionId = ''

      try {
        const createdWorkspace = (await runAgentspaceCli(
          [
            'tool',
            '--id',
            'agentspace.workspace.create',
            '--input',
            JSON.stringify({
              data: {
                ownerId,
                name: workspaceName,
                description: 'Workspace for skill package integration tests',
                createdBy: 'agentspace-tests',
                updatedBy: 'agentspace-tests',
              },
            }),
          ],
          variant.url,
        )) as { id?: string }

        workspaceId = String(createdWorkspace.id ?? '')
        expect(workspaceId).not.toBe('')

        const imported = (await runAgentspaceCli(
          [
            'tool',
            '--id',
            'agentspace.skill-version.import-skill-package',
            '--input',
            JSON.stringify({
              data: {
                workspaceId,
                scopeType: 'global',
                createdBy: 'agentspace-tests',
                updatedBy: 'agentspace-tests',
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
          package?: { entryFile?: string; standard?: string; format?: string; sourcePath?: string; fileCount?: number }
          files?: Array<{ path?: string; content?: string }>
        }

        expect(String(exported.package?.entryFile ?? '')).toBe('SKILL.md')
        expect(String(exported.package?.standard ?? '')).toBe('aops-skill-package-v1')
        expect(String(exported.package?.format ?? '')).toBe('filesystem-skill-package')
        expect(String(exported.package?.sourcePath ?? '')).toBe('/tmp/agentspace-skill-package-test')
        expect(Number(exported.package?.fileCount ?? 0)).toBe(2)
        expect(String(exported.metadata?.source ?? '')).toBe('agentspace-tests')
        expect(String(exported.metadata?.purpose ?? '')).toBe('round-trip')
        const filePaths = (exported.files ?? []).map((file) => String(file.path ?? ''))
        expect(filePaths).toContain('SKILL.md')
        expect(filePaths).toContain('references/checklist.md')
        expect(filePaths).not.toContain('agents/openai.yaml')

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
        if (workspaceId) {
          try {
            await runAgentspaceCli(
              [
                'tool',
                '--id',
                'agentspace.workspace.remove-workspace',
                '--input',
                JSON.stringify({ id: workspaceId }),
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
    const ownerId = randomUUID()
    const workspaceName = `Agentspace Default SQLite ${Date.now()}`

    let workspaceId = ''

    try {
      expect(fs.existsSync(localDbPath)).toBe(false)

      const created = (await runAgentspaceCliWithoutRepo(
        [
          'tool',
          '--id',
          'agentspace.workspace.create',
          '--input',
          JSON.stringify({
            data: {
              ownerId,
              name: workspaceName,
              description: 'Default sqlite fallback workspace',
              createdBy: 'agentspace-tests',
              updatedBy: 'agentspace-tests',
            },
          }),
        ],
        isolatedEnv,
      )) as { id?: string }

      workspaceId = String(created.id ?? '')
      expect(workspaceId).not.toBe('')
      expect(fs.existsSync(localDbPath)).toBe(true)

      const listed = await runAgentspaceCliWithoutRepo(
        ['workspace', 'list-workspaces', '--filter', JSON.stringify({ id: workspaceId })],
        isolatedEnv,
      )
      expect(toItems(listed).some((item) => String(item.id ?? '') === workspaceId)).toBe(true)
    } finally {
      if (workspaceId) {
        await runAgentspaceCliWithoutRepo(
          ['op', 'agentspace.workspace.remove-workspace', '--id', workspaceId],
          isolatedEnv,
        )
      }
      fs.rmSync(tempRoot, { recursive: true, force: true })
    }
  }, 180_000)
})
