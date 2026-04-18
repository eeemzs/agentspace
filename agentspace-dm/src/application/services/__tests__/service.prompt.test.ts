import { describe, it, expect, vi } from 'vitest'
import { Effect } from 'effect'

import { PromptService } from '../service.prompt.js'

const makePromptRepo = () => ({
  create: vi.fn(),
  findById: vi.fn(),
  patchById: vi.fn(),
  find: vi.fn(),
  deleteById: vi.fn(),
})

describe('PromptService', () => {
  it('normalizes projectId into scopeId for project-scoped prompt lists', async () => {
    const repo = makePromptRepo()
    repo.find.mockImplementation(() => Effect.succeed([]))

    const service = new PromptService({ promptRepository: repo as any })

    await Effect.runPromise(
      service.listPrompts({
        projectId: 'project-1',
        scopeResolution: 'explicit',
      } as any)
    )

    expect(repo.find).toHaveBeenCalledTimes(1)
    expect(repo.find.mock.calls[0][0]).toEqual({
      matchEq: {
        scopeId: 'project-1',
      },
      options: undefined,
    })
  })
})
