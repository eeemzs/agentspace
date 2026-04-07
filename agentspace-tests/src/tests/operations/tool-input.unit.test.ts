import { describe, expect, it } from 'vitest'

import { parseAgentspaceToolInput } from '@aopslab/domain-kit-agentspace'

describe('agentspace tool input parser', () => {
  it('normalizes flat create payloads into canonical data envelopes', () => {
    const parsed = parseAgentspaceToolInput('project.create', {
      projectId: 'project-1',
      name: 'ERP rollout',
    })

    expect(parsed).toEqual({
      data: {
        name: 'ERP rollout',
      },
    })
  })

  it('normalizes flat update payloads into canonical patch envelopes', () => {
    const parsed = parseAgentspaceToolInput('project.update-project', {
      id: 'project-1',
      name: 'Updated title',
      status: 'active',
    })

    expect(parsed).toEqual({
      id: 'project-1',
      patch: {
        name: 'Updated title',
        status: 'active',
      },
    })
  })

  it('keeps codex chat create inputs schema-valid while supporting flat payloads', () => {
    const parsed = parseAgentspaceToolInput('codex-chat-message.create', {
      projectId: 'project-1',
      threadId: 'thread-1',
      role: 'user',
      text: 'Hello',
      seq: 1,
    })

    expect(parsed).toMatchObject({
      data: {
        projectId: 'project-1',
        threadId: 'thread-1',
        role: 'user',
        text: 'Hello',
        seq: 1,
      },
    })
    expect(typeof parsed.data.messageAt).toBe('string')
  })

  it('normalizes legacy list compatibility inputs into canonical filter/options envelopes', () => {
    const parsed = parseAgentspaceToolInput('codex-chat-message.list-messages', {
      projectId: 'project-1',
      threadId: 'thread-1',
      limit: '5',
    })

    expect(parsed).toEqual({
      filter: {
        projectId: 'project-1',
        threadId: 'thread-1',
      },
      options: {
        limit: 5,
      },
    })
  })
})
