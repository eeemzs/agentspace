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
        workspaceId: 'workspace-1',
        name: 'Spec',
        resourceType: 'spec',
        scopeType: 'project',
        scopeId: 'project-1',
      })
    )

    const listed = await Effect.runPromise(service.listResources({ scopeId: 'project-1' }))

    expect(repo.create).toHaveBeenCalledTimes(1)
    expect(created.id).toBe('res-1')
    expect(repo.find).toHaveBeenCalledWith({ matchEq: { scopeId: 'project-1' }, options: undefined })
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
        workspaceId: 'workspace-1',
        scopeType: 'project',
        projectId: 'project-1',
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
        workspaceId: 'workspace-1',
        projectId: 'project-1',
        scopeType: 'project',
        kind: 'decision',
        content: 'General retrospective note',
        importance: 95,
        updatedAt: '2025-11-01T00:00:00.000Z',
      },
      {
        id: 'mem-linked',
        workspaceId: 'workspace-1',
        projectId: 'project-1',
        scopeType: 'project',
        kind: 'issue',
        content: 'Triage flaky workflow run before approval loop repeats',
        tags: ['triage', 'workflow'],
        sourceType: 'projectman.issue',
        sourceId: 'issue-7',
        importance: 20,
        updatedAt: '2026-03-09T10:00:00.000Z',
      },
      {
        id: 'mem-unrelated',
        workspaceId: 'workspace-1',
        projectId: 'project-1',
        scopeType: 'project',
        kind: 'note',
        content: 'Marketing launch prep',
        importance: 5,
        updatedAt: '2026-03-09T11:00:00.000Z',
      },
    ]))

    const service = new MemoryItemService({ memoryItemRepository: repo as any })

    const results = await Effect.runPromise(
      service.searchMemoryItems(
        { projectId: 'project-1' },
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
      matchEq: { projectId: 'project-1' },
      options: expect.objectContaining({ limit: 48, offset: undefined }),
    })
  })
})

describe('ProjectSummaryService', () => {
  it('upserts summary by creating when missing', async () => {
    const repo = makeRepo()
    repo.find.mockImplementation(() => Effect.succeed([]))
    repo.create.mockImplementation((data) => Effect.succeed({ ...data, id: 'sum-1' }))

    const service = new ProjectSummaryService({ projectSummaryRepository: repo as any })
    const result = await Effect.runPromise(
      service.upsertProjectSummary({ workspaceId: 'workspace-1', projectId: 'project-1', summary: 'Kickoff done' })
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
      service.upsertProjectSummary({ workspaceId: 'workspace-1', projectId: 'project-1', summary: 'Updated' })
    )

    expect(repo.patchById).toHaveBeenCalledWith('sum-1', { summary: 'Updated' })
    expect(result.summary).toBe('Updated')
  })
})
