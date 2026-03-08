import { describe, expect, it } from 'vitest'

import {
  normalizeAgentspaceOperationInputForCompatibility,
  normalizeAgentspaceToolInputForCompatibility,
  normalizeCodexChatMessageCreateInput,
} from './codex-chat-input.js'

describe('codex-chat input compatibility helper', () => {
  it('injects messageAt for codex-chat message create payloads', () => {
    const normalized = normalizeCodexChatMessageCreateInput({
      data: {
        workspaceId: 'workspace-1',
        threadId: 'thread-1',
        role: 'user',
        text: 'hello',
        seq: 1,
      },
    })

    expect(typeof normalized.data?.messageAt).toBe('string')
    expect(String(normalized.data?.messageAt).length).toBeGreaterThan(0)
  })

  it('normalizes Date messageAt to ISO string', () => {
    const normalized = normalizeCodexChatMessageCreateInput({
      data: {
        workspaceId: 'workspace-1',
        threadId: 'thread-1',
        role: 'user',
        text: 'hello',
        seq: 1,
        messageAt: new Date('2026-03-06T00:00:00.000Z'),
      },
    })

    expect(normalized.data?.messageAt).toBe('2026-03-06T00:00:00.000Z')
  })

  it('maps legacy top-level list-messages fields into filter/options', () => {
    const normalized = normalizeAgentspaceOperationInputForCompatibility('codex-chat-message.list-messages', {
      workspaceId: 'workspace-1',
      externalThreadId: 'thread-ext-1',
      role: 'user',
      limit: '50',
      offset: 10,
    })

    expect(normalized.externalThreadId).toBeUndefined()
    expect(normalized.limit).toBeUndefined()
    expect(normalized.filter).toMatchObject({
      workspaceId: 'workspace-1',
      externalThreadId: 'thread-ext-1',
      role: 'user',
    })
    expect(normalized.options).toMatchObject({
      limit: 50,
      offset: 10,
    })
  })

  it('maps top-level list-threads fields into filter/options for agentspace tool ids', () => {
    const normalized = normalizeAgentspaceToolInputForCompatibility('agentspace.codex-chat-thread.list-threads', {
      workspaceId: 'workspace-1',
      externalThreadId: 'thread-ext-2',
      limit: 25,
    })

    expect(normalized.filter).toMatchObject({
      workspaceId: 'workspace-1',
      externalThreadId: 'thread-ext-2',
    })
    expect(normalized.options).toMatchObject({
      limit: 25,
    })
  })
})
