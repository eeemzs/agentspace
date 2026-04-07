import { describe, it, expect, vi } from 'vitest'
import { Effect } from 'effect'
import { ResourceService } from '../service.resource.js'
import { MemoryItemService } from '../service.memoryItem.js'
import { ProjectSummaryService } from '../service.projectSummary.js'

const makeRepo = () => ({
  create: vi.fn(),
  findById: vi.fn(),
  patchById: vi.fn(),
  find: vi.fn(),
})

describe('ResourceService', () => {
  it('creates and lists resources', async () => {
    const repo = makeRepo()
    repo.create.mockImplementation((data) => Effect.succeed({ ...data, id: 'res-1' }))
    repo.find.mockImplementation(() => Effect.succeed([{ id: 'res-1' }]))

    const service = new ResourceService({ resourceRepository: repo as any })

    const created = await Effect.runPromise(
      service.createResource({
        scopeId: 'scope-project-1',
        name: 'Spec',
        resourceType: 'spec',
      })
    )

    const listed = await Effect.runPromise(service.listResources({ scopeId: 'scope-project-1', scopeResolution: 'explicit' }))

    expect(repo.create).toHaveBeenCalledTimes(1)
    expect(created.id).toBe('res-1')
    expect(repo.find).toHaveBeenCalledWith({ matchEq: { scopeId: 'scope-project-1' }, options: undefined })
    expect(listed).toEqual([{ id: 'res-1' }])
  })

  it('updates resource patch', async () => {
    const repo = makeRepo()
    repo.patchById.mockImplementation((id, patch) => Effect.succeed({ id, ...patch }))

    const service = new ResourceService({ resourceRepository: repo as any })
    const result = await Effect.runPromise(service.updateResource('res-1', { name: 'Updated' }))

    expect(repo.patchById).toHaveBeenCalledWith('res-1', { name: 'Updated' })
    expect(result.name).toBe('Updated')
  })
})

describe('MemoryItemService', () => {
  it('adds memory item and sets importance', async () => {
    const repo = makeRepo()
    repo.create.mockImplementation((data) => Effect.succeed({ ...data, id: 'mem-1' }))
    repo.patchById.mockImplementation((id, patch) => Effect.succeed({ id, ...patch }))

    const service = new MemoryItemService({ memoryItemRepository: repo as any })

    const created = await Effect.runPromise(
      service.addMemoryItem({
        scopeId: 'scope-project-1',
        kind: 'decision',
        content: 'Use Kanban',
      })
    )

    const updated = await Effect.runPromise(service.setMemoryImportance('mem-1', 3))

    expect(repo.create).toHaveBeenCalledTimes(1)
    expect(created.id).toBe('mem-1')
    expect(repo.patchById).toHaveBeenCalledWith('mem-1', { importance: 3 })
    expect(updated.importance).toBe(3)
  })

  it('searches memory items with retrieval ranking instead of raw importance order', async () => {
    const repo = makeRepo()
    repo.find.mockImplementation(() => Effect.succeed([
      {
        id: 'mem-legacy',
        scopeId: 'scope-project-1',
        kind: 'decision',
        content: 'General retrospective note',
        importance: 95,
        updatedAt: '2025-11-01T00:00:00.000Z',
      },
      {
        id: 'mem-linked',
        scopeId: 'scope-project-1',
        kind: 'constraint',
        content: 'Triage flaky workflow run before approval loop repeats',
        tags: ['triage', 'workflow'],
        sourceType: 'projectman.issue',
        sourceId: 'issue-7',
        importance: 20,
        updatedAt: '2026-03-09T10:00:00.000Z',
      },
      {
        id: 'mem-unrelated',
        scopeId: 'scope-project-1',
        kind: 'note',
        content: 'Marketing launch prep',
        importance: 5,
        updatedAt: '2026-03-09T11:00:00.000Z',
      },
    ]))

    const service = new MemoryItemService({ memoryItemRepository: repo as any })

    const results = await Effect.runPromise(
      service.searchMemoryItems(
        { scopeId: 'scope-project-1', scopeResolution: 'explicit' },
        {
          query: 'triage flaky workflow approval',
          runtimeProfile: 'workflow-triage',
          workflowId: 'workflow-1',
          subject: { type: 'projectman.issue', id: 'issue-7' },
          tags: ['triage', 'workflow'],
        },
        { limit: 2 }
      )
    )

    expect(results.map((entry) => entry.id)).toEqual(['mem-linked', 'mem-legacy'])
    expect(repo.find).toHaveBeenCalledWith({
      matchEq: { scopeId: 'scope-project-1' },
      options: expect.objectContaining({ limit: 48, offset: undefined }),
    })
  })

  it('builds a curated resume pack with exact subject priority and project summary', async () => {
    const repo = makeRepo()
    const projectSummaryRepo = makeRepo()
    repo.find.mockImplementation(() => Effect.succeed([
      {
        id: 'mem-context-noise',
        scopeId: 'scope-project-1',
        kind: 'resume',
        content: 'Generic top-level note that should stay low priority.',
        sourceType: 'aops.smoke',
        sourceId: 'scope-project-1',
        updatedAt: '2026-04-01T08:00:00.000Z',
      },
      {
        id: 'mem-project-generic',
        scopeId: 'scope-project-1',
        kind: 'resume',
        content: 'Project carry-forward: rerun API smoke before handoff.',
        tags: ['project:project-1'],
        meta: {
          horizon: 'short',
          subjectType: 'projectman.plan',
          subjectId: 'project-1',
          projectId: 'project-1',
          nextAction: 'Run API smoke first.',
        },
        updatedAt: '2026-04-01T08:30:00.000Z',
      },
      {
        id: 'mem-rule',
        scopeId: 'scope-project-1',
        kind: 'rule',
        content: 'Use the staged migration flow for this repo.',
        sourceType: 'projectman.plan',
        sourceId: 'project-1',
        meta: { horizon: 'long', patternName: 'staged-migration' },
        updatedAt: '2026-03-01T00:00:00.000Z',
      },
      {
        id: 'mem-sticky-old',
        scopeId: 'scope-project-1',
        kind: 'rule',
        content: 'Old sticky guidance.',
        tags: ['project:project-1', 'sticky', 'guidance'],
        meta: {
          sticky: true,
          stickyScope: 'project',
          stickyRank: 2,
          summaryRole: 'guidance',
          projectId: 'project-1',
        },
        updatedAt: '2026-03-01T09:00:00.000Z',
      },
      {
        id: 'mem-sticky-new',
        scopeId: 'scope-project-1',
        kind: 'rule',
        content: 'Always read /docs/pagination.md before touching cursor pagination.',
        tags: ['project:project-1', 'sticky', 'bootstrap'],
        meta: {
          sticky: true,
          stickyScope: 'project',
          stickyRank: 9,
          summaryRole: 'bootstrap',
          supersedes: 'mem-sticky-old',
          projectId: 'project-1',
          nextReadRefs: [{ kind: 'doc', uri: '/docs/pagination.md', documentVersionId: 'docver-1', sectionId: 'section-1' }],
        },
        updatedAt: '2026-04-01T11:00:00.000Z',
      },
      {
        id: 'mem-exact',
        scopeId: 'scope-project-1',
        kind: 'resume',
        content: 'Active sprint handoff: continue API pagination fix.',
        sourceType: 'projectman.sprint',
        sourceId: 'sprint-1',
        tags: ['phase:resume', 'sprint:sprint-1'],
        meta: {
          horizon: 'short',
          subjectType: 'projectman.sprint',
          subjectId: 'sprint-1',
          nextAction: 'Open pagination adapter tests first.',
          nextReadRefs: [{ kind: 'doc', uri: '/docs/pagination.md', documentVersionId: 'docver-1', sectionId: 'section-1' }],
        },
        updatedAt: '2026-04-01T10:00:00.000Z',
      },
      {
        id: 'mem-exact-older',
        scopeId: 'scope-project-1',
        kind: 'resume',
        content: 'Active sprint handoff: continue API pagination fix.',
        sourceType: 'projectman.sprint',
        sourceId: 'sprint-1',
        tags: ['phase:resume', 'sprint:sprint-1'],
        meta: {
          horizon: 'short',
          subjectType: 'projectman.sprint',
          subjectId: 'sprint-1',
          nextAction: 'Open pagination adapter tests first.',
        },
        updatedAt: '2026-03-31T10:00:00.000Z',
      },
      {
        id: 'mem-decision',
        scopeId: 'scope-project-1',
        kind: 'decision',
        content: 'Decision: keep cursor token opaque.',
        sourceType: 'projectman.sprint',
        sourceId: 'sprint-1',
        updatedAt: '2026-04-01T09:00:00.000Z',
      },
    ]))
    projectSummaryRepo.find.mockImplementation(() => Effect.succeed([
      { id: 'sum-1', projectId: 'project-1', summary: 'Project summary' },
    ]))

    const service = new MemoryItemService({
      memoryItemRepository: repo as any,
      projectSummaryRepository: projectSummaryRepo as any,
    })

    const result = await Effect.runPromise(
      service.buildResumePack(
        { scopeId: 'scope-project-1', projectId: 'project-1', scopeResolution: 'explicit' },
        {
          query: 'resume active sprint context',
          runtimeProfile: 'planning',
          subject: { type: 'projectman.sprint', id: 'sprint-1', label: 'Sprint 1' },
          sourceTypes: ['projectman.sprint'],
          sourceIds: ['sprint-1'],
        },
        { depth: 'light', limit: 4, includeProjectSummary: true },
      ),
    )

    expect(result.projectSummary).toMatchObject({ projectId: 'project-1' })
    expect(result.projectSummaryText).toBe('Project summary')
    expect(result.bootstrapGuidance).toEqual(['Always read /docs/pagination.md before touching cursor pagination.'])
    expect(result.relatedMemory.map((entry) => entry.id)).toEqual(['mem-exact', 'mem-decision'])
    expect(result.relatedMemory.map((entry) => entry.id)).not.toContain('mem-exact-older')
    expect(result.relatedMemory.map((entry) => entry.id)).not.toContain('mem-scope-noise')
    expect(result.relatedMemory.map((entry) => entry.id)).not.toContain('mem-sticky-new')
    expect(result.nextActions).toEqual(['Open pagination adapter tests first.'])
    expect(result.recommendedRefs).toEqual([{ kind: 'doc', uri: '/docs/pagination.md', documentVersionId: 'docver-1', sectionId: 'section-1' }])
    expect(result.openDecisions).toEqual(['Decision: keep cursor token opaque.'])
    expect(result.readStrategy).toBe('recommended')
    expect(result.confidence).toBeGreaterThanOrEqual(85)
  })

  it('keeps project-level rule and generic memory available in deep mode when exact subject is missing', async () => {
    const repo = makeRepo()
    repo.find.mockImplementation(() => Effect.succeed([
      {
        id: 'mem-project-resume',
        scopeId: 'scope-project-1',
        kind: 'resume',
        content: 'Project carry-forward: rerun smoke before opening PR.',
        tags: ['project:project-1'],
        meta: {
          horizon: 'short',
          subjectType: 'projectman.plan',
          subjectId: 'project-1',
          projectId: 'project-1',
          nextAction: 'Rerun project smoke before PR.',
        },
        updatedAt: '2026-04-01T08:30:00.000Z',
      },
      {
        id: 'mem-project-rule',
        scopeId: 'scope-project-1',
        kind: 'rule',
        content: 'Prefer staged migrations for risky refactors.',
        sourceType: 'projectman.plan',
        sourceId: 'project-1',
        meta: { horizon: 'long', patternName: 'staged-migration' },
        updatedAt: '2026-03-01T00:00:00.000Z',
      },
      {
        id: 'mem-scope-noise',
        scopeId: 'scope-project-1',
        kind: 'resume',
        content: 'Cross-scope note.',
        sourceType: 'aops.smoke',
        sourceId: 'scope-project-1',
        updatedAt: '2026-04-01T07:00:00.000Z',
      },
    ]))

    const service = new MemoryItemService({ memoryItemRepository: repo as any })

    const result = await Effect.runPromise(
      service.buildResumePack(
        { scopeId: 'scope-project-1', projectId: 'project-1', scopeResolution: 'explicit' },
        {
          query: 'resume project context',
          subject: { type: 'projectman.plan', id: 'project-1' },
          sourceTypes: ['projectman.plan'],
          sourceIds: ['project-1'],
        },
        { depth: 'deep', limit: 4, includeProjectSummary: false },
      ),
    )

    expect(result.relatedMemory.map((entry) => entry.id)).toEqual(['mem-project-rule', 'mem-project-resume'])
    expect(result.nextActions).toEqual(['Rerun project smoke before PR.'])
    expect(result.resumeSummary).toContain('Project carry-forward')
    expect(result.relatedMemory.map((entry) => entry.id)).not.toContain('mem-scope-noise')
  })

  it('prefers newer sticky guidance and keeps bootstrap guidance outside relatedMemory', async () => {
    const repo = makeRepo()
    repo.find.mockImplementation(() => Effect.succeed([
      {
        id: 'sticky-legacy',
        scopeId: 'scope-project-1',
        kind: 'rule',
        content: 'Legacy bootstrap note.',
        tags: ['project:project-1', 'sticky', 'guidance'],
        meta: {
          sticky: true,
          stickyScope: 'project',
          stickyRank: 1,
          summaryRole: 'guidance',
          projectId: 'project-1',
        },
        updatedAt: '2026-03-01T10:00:00.000Z',
      },
      {
        id: 'sticky-bootstrap',
        scopeId: 'scope-project-1',
        kind: 'rule',
        content: 'Hexagen kullan; plan before generate.',
        tags: ['project:project-1', 'sticky', 'bootstrap'],
        meta: {
          sticky: true,
          stickyScope: 'project',
          stickyRank: 3,
          summaryRole: 'bootstrap',
          projectId: 'project-1',
          supersedes: 'sticky-legacy',
          nextReadRefs: [{ kind: 'doc', uri: '/docs/hexagen.md', documentVersionId: 'docver-hex', sectionId: 'section-hex' }],
        },
        updatedAt: '2026-04-02T10:00:00.000Z',
      },
      {
        id: 'resume-current',
        scopeId: 'scope-project-1',
        kind: 'resume',
        content: 'Sprintfe devam et.',
        sourceType: 'projectman.sprint',
        sourceId: 'sprint-1',
        meta: {
          subjectType: 'projectman.sprint',
          subjectId: 'sprint-1',
          nextAction: 'Sprint diffini ac.',
          projectId: 'project-1',
        },
        updatedAt: '2026-04-02T11:00:00.000Z',
      },
    ]))

    const service = new MemoryItemService({ memoryItemRepository: repo as any })
    const result = await Effect.runPromise(
      service.buildResumePack(
        { scopeId: 'scope-project-1', projectId: 'project-1', scopeResolution: 'explicit' },
        {
          subject: { type: 'projectman.sprint', id: 'sprint-1' },
          sourceTypes: ['projectman.sprint'],
          sourceIds: ['sprint-1'],
        },
        { depth: 'light', limit: 4, includeProjectSummary: false },
      ),
    )

    expect(result.bootstrapGuidance).toEqual(['Hexagen kullan; plan before generate.'])
    expect(result.relatedMemory.map((entry) => entry.id)).toEqual(['resume-current'])
    expect(result.resumeSummary).toContain('Sprintfe devam et.')
    expect(result.recommendedRefs).toEqual([{ kind: 'doc', uri: '/docs/hexagen.md', documentVersionId: 'docver-hex', sectionId: 'section-hex' }])
  })
})

describe('ProjectSummaryService', () => {
  it('upserts summary by creating when missing', async () => {
    const repo = makeRepo()
    repo.find.mockImplementation(() => Effect.succeed([]))
    repo.create.mockImplementation((data) => Effect.succeed({ ...data, id: 'sum-1' }))

    const service = new ProjectSummaryService({ projectSummaryRepository: repo as any })
    const result = await Effect.runPromise(
      service.upsertProjectSummary({ projectId: 'project-1', summary: 'Kickoff done' })
    )

    expect(repo.create).toHaveBeenCalledTimes(1)
    expect(result.id).toBe('sum-1')
  })

  it('upserts summary by patching when exists', async () => {
    const repo = makeRepo()
    repo.find.mockImplementation(() => Effect.succeed([{ id: 'sum-1', projectId: 'project-1' }]))
    repo.patchById.mockImplementation((id, patch) => Effect.succeed({ id, ...patch }))

    const service = new ProjectSummaryService({ projectSummaryRepository: repo as any })
    const result = await Effect.runPromise(
      service.upsertProjectSummary({ projectId: 'project-1', summary: 'Updated' })
    )

    expect(repo.patchById).toHaveBeenCalledWith('sum-1', { summary: 'Updated' })
    expect(result.summary).toBe('Updated')
  })
})
