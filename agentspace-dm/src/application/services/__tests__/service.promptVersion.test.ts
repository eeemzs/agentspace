import { describe, it, expect, vi } from 'vitest'
import { Effect } from 'effect'

import { PromptVersionService } from '../service.promptVersion.js'

const makePromptVersionRepo = () => ({
  create: vi.fn(),
  findById: vi.fn(),
  patchById: vi.fn(),
  find: vi.fn(),
  deleteById: vi.fn(),
})

const makePromptService = () => ({
  getById: vi.fn(),
  updatePrompt: vi.fn(),
})

describe('PromptVersionService', () => {
  it('resolves workspaceId from prompt before create validation', async () => {
    const repo = makePromptVersionRepo()
    const promptService = makePromptService()

    const promptId = 'prompt-1'
    const workspaceId = 'workspace-1'
    const createdVersionId = 'version-1'
    let createdVersionNumber = 0

    promptService.getById.mockImplementation(() =>
      Effect.succeed({
        id: promptId,
        workspaceId,
        scopeType: 'global',
        name: 'Prompt',
      } as any)
    )

    repo.find.mockImplementation(() => {
      if (createdVersionNumber > 0) {
        return Effect.succeed([
          {
            id: createdVersionId,
            promptId,
            workspaceId,
            version: createdVersionNumber,
            status: 'draft',
            content: 'hello',
          },
        ])
      }
      return Effect.succeed([])
    })

    repo.create.mockImplementation((data) => {
      createdVersionNumber = data.version
      return Effect.succeed({
        id: createdVersionId,
        promptId,
        workspaceId: data.workspaceId,
        version: data.version,
        status: data.status,
        content: data.content,
      } as any)
    })

    promptService.updatePrompt.mockImplementation((id, patch) =>
      Effect.succeed({
        id,
        workspaceId,
        scopeType: 'global',
        name: 'Prompt',
        ...patch,
      } as any)
    )

    const service = new PromptVersionService({
      promptVersionRepository: repo as any,
      promptService: promptService as any,
    })

    const result = await Effect.runPromise(
      service.create({
        promptId,
        status: 'draft',
        content: 'hello',
      } as any)
    )

    expect(repo.create).toHaveBeenCalledTimes(1)
    expect(repo.create.mock.calls[0][0].workspaceId).toBe(workspaceId)
    expect(repo.create.mock.calls[0][0].version).toBe(1)
    expect(result.workspaceId).toBe(workspaceId)
  })
})
