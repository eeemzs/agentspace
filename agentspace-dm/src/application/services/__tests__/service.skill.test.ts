import { describe, expect, it, vi } from 'vitest'
import { Effect } from 'effect'

import { SkillService } from '../service.skill.js'

function makeSkillRepo(skills: unknown[]) {
  return {
    find: vi.fn(() => Effect.succeed(skills)),
    findById: vi.fn(),
    create: vi.fn(),
    patchById: vi.fn(),
    deleteById: vi.fn(),
  }
}

function makeVersionRepo(versions: Map<string, unknown>) {
  return {
    findById: vi.fn((id: string) => Effect.succeed(versions.get(id) ?? null)),
    find: vi.fn(),
    create: vi.fn(),
    patchById: vi.fn(),
    deleteById: vi.fn(),
  }
}

describe('SkillService metadata discovery', () => {
  it('ranks deterministic TR/EN raw metadata matches without reading skill bodies', async () => {
    const skills = [
      {
        id: 'skill-projectman',
        scopeId: 'project-1',
        name: 'aops-cli-projectman',
        shortDescription: 'Project planning CLI guide',
        description: 'Kanban and sprint command help.',
        tags: ['pm', 'planning'],
        currentVersionId: 'version-projectman',
      },
      {
        id: 'skill-draft',
        scopeId: 'project-1',
        name: 'draft-project-manager',
        currentVersionId: 'version-draft',
      },
    ]
    const versions = new Map<string, unknown>([
      ['version-projectman', {
        id: 'version-projectman',
        projectId: 'project-1',
        skillId: 'skill-projectman',
        version: 7,
        status: 'published',
        content: 'BODY-MUST-NOT-BE-SEARCHED',
        entryFile: 'SKILL.md',
        skillStandard: 'aops-skill-v1',
        meta: {
          discovery: {
            aliases: ['proje yönetimi', 'project management'],
            cliFamilies: ['pm'],
            domains: ['projectman'],
          },
        },
      }],
      ['version-draft', {
        id: 'version-draft',
        projectId: 'project-1',
        skillId: 'skill-draft',
        version: 1,
        status: 'draft',
        content: 'proje yönetimi kanban',
        entryFile: 'SKILL.md',
        skillStandard: 'aops-skill-v1',
      }],
    ])
    const skillRepo = makeSkillRepo(skills)
    const versionRepo = makeVersionRepo(versions)
    const service = new SkillService({
      skillRepository: skillRepo as any,
      skillVersionRepository: versionRepo as any,
    })

    const turkish = await Effect.runPromise(service.searchSkills('Proje yönetimi', 'project-1', 'explicit', 5))
    const english = await Effect.runPromise(service.searchSkills('kanban', 'project-1', 'explicit', 5))

    expect(turkish.candidates).toHaveLength(1)
    expect(turkish.candidates[0]).toMatchObject({
      skillId: 'skill-projectman',
      versionId: 'version-projectman',
      exactRef: 'skill-version:version-projectman',
      version: '7',
      origin: 'hosted',
    })
    expect(turkish.candidates[0]?.matchedBy).toContain('meta.discovery.aliases')
    expect(english.candidates[0]?.matchedBy).toContain('description')
    expect(english.candidates.some((candidate) => candidate.skillId === 'skill-draft')).toBe(false)
  })

  it('keeps the 1000-skill corpus bounded to five deterministic candidates', async () => {
    const skills = Array.from({ length: 1_000 }, (_, index) => ({
      id: `skill-${String(index).padStart(4, '0')}`,
      scopeId: 'project-1',
      name: index < 20 ? `kanban-${String(index).padStart(4, '0')}` : `fixture-${String(index).padStart(4, '0')}`,
      shortDescription: index < 20 ? 'Kanban CLI family' : 'Unrelated hosted skill',
      currentVersionId: `version-${String(index).padStart(4, '0')}`,
    }))
    const versions = new Map(skills.map((skill, index) => [skill.currentVersionId, {
      id: skill.currentVersionId,
      projectId: 'project-1',
      skillId: skill.id,
      version: 1,
      status: 'published',
      content: index >= 20 ? 'kanban appears only in body' : '# Matching package',
      entryFile: 'SKILL.md',
      skillStandard: 'aops-skill-v1',
      meta: {},
    }]))
    const service = new SkillService({
      skillRepository: makeSkillRepo(skills) as any,
      skillVersionRepository: makeVersionRepo(versions) as any,
    })

    const result = await Effect.runPromise(service.searchSkills('kanban', 'project-1', 'explicit', 5))

    expect(result.count).toBe(5)
    expect(result.candidates.map((candidate) => candidate.name)).toEqual([
      'kanban-0000',
      'kanban-0001',
      'kanban-0002',
      'kanban-0003',
      'kanban-0004',
    ])
  })

  it('builds ask as a bounded projection of one search retrieval', async () => {
    const skills = [{
      id: 'skill-1',
      scopeId: 'project-1',
      name: 'aops-cli-projectman',
      shortDescription: 'Kanban CLI guide',
      currentVersionId: 'version-1',
    }]
    const versionRepo = makeVersionRepo(new Map([['version-1', {
      id: 'version-1',
      projectId: 'project-1',
      skillId: 'skill-1',
      version: 3,
      status: 'published',
      content: '# Body',
      entryFile: 'SKILL.md',
      skillStandard: 'aops-skill-v1',
      meta: {},
    }]]))
    const service = new SkillService({
      skillRepository: makeSkillRepo(skills) as any,
      skillVersionRepository: versionRepo as any,
    })

    const result = await Effect.runPromise(service.askSkills('kanban', 'project-1', 'explicit', 3))

    expect(result.candidates).toHaveLength(1)
    expect(result.answer).toContain('skill-version:version-1')
    expect(result.answer).not.toContain('# Body')
    expect(versionRepo.findById).toHaveBeenCalledTimes(1)
  })
})
