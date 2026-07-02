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

  it('defaults scopeable list reads to exact project scope from project context', () => {
    const parsed = parseAgentspaceToolInput('memory-item.list-memory-items', {
      projectId: 'project-1',
    })

    expect(parsed).toEqual({
      filter: {
        scopeId: 'project-1',
        scopeResolution: 'explicit',
      },
    })
  })

  it('prefers scopeId over projectId when defaulting scopeable list filters', () => {
    const parsed = parseAgentspaceToolInput('prompt.list-prompts', {
      projectId: 'project-1',
      scopeId: 'scope-project-1',
    })

    expect(parsed).toEqual({
      filter: {
        scopeId: 'scope-project-1',
        scopeResolution: 'explicit',
      },
    })
  })

  it('preserves explicit scope filters for scopeable list reads', () => {
    const parsed = parseAgentspaceToolInput('skill.list-skills', {
      projectId: 'project-1',
      filter: {
        scopeId: 'shared-scope',
        scopeResolution: 'cascade',
      },
    })

    expect(parsed).toEqual({
      filter: {
        scopeId: 'shared-scope',
        scopeResolution: 'cascade',
      },
    })
  })

  it('preserves explicit global filter intent for scopeable list reads', () => {
    const parsed = parseAgentspaceToolInput('resource.list-resources', {
      projectId: 'project-1',
      filter: {
        global: true,
      },
      options: {
        limit: 10,
      },
    })

    expect(parsed).toEqual({
      filter: {
        global: true,
      },
      options: {
        limit: 10,
      },
    })
  })

  it('keeps scopeable list reads valid without project context', () => {
    const parsed = parseAgentspaceToolInput('memory-item.list-memory-items', {})

    expect(parsed).toEqual({})
  })

  it('does not inject scope filters into non-scopeable list operations', () => {
    const parsed = parseAgentspaceToolInput('project.list-projects', {
      projectId: 'project-1',
    })

    expect(parsed).toEqual({})
  })
})
