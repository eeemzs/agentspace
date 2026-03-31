import { describe, expect, it, vi } from 'vitest'

import { createAgentspacePlugin } from './plugin.js'
import type { DomainRequest, DomainRouteManifestEntry } from './types.js'

function findRouteByOperation(
  routes: DomainRouteManifestEntry[],
  operationId: string,
): DomainRouteManifestEntry {
  const route = routes.find((entry) => entry.operation === operationId)
  if (!route) throw new Error(`missing_test_route:${operationId}`)
  return route
}

function createDomainRequest(input: {
  method: DomainRequest['method']
  body?: unknown
  context?: DomainRequest['context']
}): DomainRequest {
  return {
    method: input.method,
    domain: 'agentspace',
    path: [],
    query: new URLSearchParams(),
    body: input.body ?? {},
    headers: new Headers(),
    url: new URL('http://localhost/api/aops'),
    context: input.context ?? {},
  }
}

describe('agentspace host-plugin lifecycle guards', () => {
  it('stores setup diagnostics in health details after successful setup', async () => {
    const plugin = createAgentspacePlugin({
      runner: vi.fn(async () => ({ ok: true })),
    })
    if (!plugin.setup) throw new Error('setup_hook_missing')

    await plugin.setup()
    const health = await plugin.health?.()

    expect(health).toBeDefined()
    expect(health?.details).toMatchObject({
      setupStatus: 'ready',
      setupAttempts: 1,
      setupLastError: null,
    })
    expect(typeof (health?.details as { setupReadyAt?: string }).setupReadyAt).toBe('string')
  })

  it('tracks setup failure when required runtime env is missing', async () => {
    const plugin = createAgentspacePlugin({
      requiredRuntimeEnv: ['AOPS_TEST_REQUIRED_ENV_KEY_MISSING'],
    })
    if (!plugin.setup) throw new Error('setup_hook_missing')

    await expect(plugin.setup()).rejects.toThrow(/runtime_env_missing:AOPS_TEST_REQUIRED_ENV_KEY_MISSING/)
    const health = await plugin.health?.()

    expect(health).toBeDefined()
    expect(health?.details).toMatchObject({
      setupStatus: 'failed',
      setupAttempts: 1,
      setupLastError: 'runtime_env_missing:AOPS_TEST_REQUIRED_ENV_KEY_MISSING',
    })
  })

  it('injects workspace from request context when payload does not include workspace alias', async () => {
    const runner = vi.fn(async () => ({ ok: true }))
    const plugin = createAgentspacePlugin({ runner })
    const route = findRouteByOperation(plugin.manifest.routes, 'project.delete-cascade')

    const response = await plugin.execute({
      request: createDomainRequest({
        method: route.method,
        body: { projectId: 'project-1' },
        context: { tenantId: 'tenant-1', workspaceId: 'workspace-context-1' },
      }),
      match: { route, params: {} },
    })

    expect(runner).toHaveBeenCalledTimes(1)
    expect(runner).toHaveBeenCalledWith(
      'project.delete-cascade',
      expect.objectContaining({
        projectId: 'project-1',
        workspaceId: 'workspace-context-1',
      }),
    )
    expect(response).toEqual({ ok: true })
  })

  it('returns validation failure when payload workspace conflicts with request context workspace', async () => {
    const runner = vi.fn(async () => ({ ok: true }))
    const plugin = createAgentspacePlugin({ runner })
    const route = findRouteByOperation(plugin.manifest.routes, 'project.delete-cascade')

    const response = await plugin.execute({
      request: createDomainRequest({
        method: route.method,
        body: { projectId: 'project-2', workspaceId: 'workspace-input-2' },
        context: { tenantId: 'tenant-1', workspaceId: 'workspace-context-2' },
      }),
      match: { route, params: {} },
    })

    expect(runner).toHaveBeenCalledTimes(0)
    expect(response).toMatchObject({
      status: 400,
      data: {
        ok: false,
        errorCode: 'agentspace_operation_failed.invalid_input',
        operation: 'project.delete-cascade',
      },
    })
    expect((response as { data: { message: string } }).data.message).toContain(
      'validation_failed:workspace_context_mismatch',
    )
  })

  it('returns service unavailable envelope when operation timeout is exceeded', async () => {
    const runner = vi.fn(async () => await new Promise<never>(() => {}))
    const plugin = createAgentspacePlugin({ runner, operationTimeoutMs: 100 })
    const route = findRouteByOperation(plugin.manifest.routes, 'project.delete-cascade')

    const startedAt = Date.now()
    const response = await plugin.execute({
      request: createDomainRequest({
        method: route.method,
        body: { projectId: 'project-3', workspaceId: 'workspace-input-3' },
        context: { tenantId: 'tenant-1' },
      }),
      match: { route, params: {} },
    })
    const elapsedMs = Date.now() - startedAt

    expect(elapsedMs).toBeGreaterThanOrEqual(90)
    expect(response).toMatchObject({
      status: 503,
      data: {
        ok: false,
        errorCode: 'agentspace_operation_failed.service_unavailable',
        operation: 'project.delete-cascade',
      },
    })
  })

  it('returns a not_found envelope for foreign-key reference failures', async () => {
    const runner = vi.fn(async () => {
      throw new Error(
        'insert into "memory_items" violates foreign key constraint "memory_items_workspaceId_workspaces_id_fk"',
      )
    })
    const plugin = createAgentspacePlugin({ runner })
    const route = findRouteByOperation(plugin.manifest.routes, 'memory-item.add-memory-item')

    const response = await plugin.execute({
      request: createDomainRequest({
        method: route.method,
        body: {
          data: {
            workspaceId: 'workspace-input-5',
            projectId: 'project-5',
            scopeType: 'project',
            scopeId: 'project-5',
            kind: 'start',
            content: 'probe',
          },
        },
        context: { tenantId: 'tenant-1' },
      }),
      match: { route, params: {} },
    })

    expect(response).toMatchObject({
      status: 404,
      data: {
        ok: false,
        errorCode: 'agentspace_operation_failed.invalid_reference',
        operation: 'memory-item.add-memory-item',
        message: 'Referenced workspace, project, or owner scope record was not found for the supplied ids.',
      },
    })
  })

  it('returns runtime_env_missing envelope for default runner when required env is absent', async () => {
    const plugin = createAgentspacePlugin({
      requiredRuntimeEnv: ['AOPS_TEST_REQUIRED_ENV_KEY_MISSING'],
    })
    const route = findRouteByOperation(plugin.manifest.routes, 'project.delete-cascade')

    const response = await plugin.execute({
      request: createDomainRequest({
        method: route.method,
        body: { projectId: 'project-4', workspaceId: 'workspace-input-4' },
        context: { tenantId: 'tenant-1' },
      }),
      match: { route, params: {} },
    })

    expect(response).toMatchObject({
      status: 503,
      data: {
        ok: false,
        errorCode: 'agentspace_operation_failed.runtime_env_missing',
        operation: 'project.delete-cascade',
      },
    })
    expect((response as { data: { message: string } }).data.message).toContain(
      'runtime_env_missing:AOPS_TEST_REQUIRED_ENV_KEY_MISSING',
    )
  })

  it('normalizes codex-chat message create input when messageAt is omitted', async () => {
    const runner = vi.fn(async () => ({ ok: true }))
    const plugin = createAgentspacePlugin({ runner })
    const route = findRouteByOperation(plugin.manifest.routes, 'codex-chat-message.create')

    const response = await plugin.execute({
      request: createDomainRequest({
        method: route.method,
        body: {
          data: {
            workspaceId: 'workspace-input-1',
            threadId: 'thread-1',
            role: 'user',
            text: 'hello',
            seq: 1,
          },
        },
        context: { tenantId: 'tenant-1', workspaceId: 'workspace-context-1' },
      }),
      match: { route, params: {} },
    })

    expect(response).toEqual({ ok: true })
    expect(runner).toHaveBeenCalledTimes(1)
    const payload = runner.mock.calls[0][1] as { data?: Record<string, unknown> }
    expect(typeof payload.data?.messageAt).toBe('string')
    expect(String(payload.data?.messageAt)).toMatch(/\d{4}-\d{2}-\d{2}T/)
  })

  it('normalizes legacy top-level codex-chat list payload into filter/options', async () => {
    const runner = vi.fn(async () => ({ ok: true }))
    const plugin = createAgentspacePlugin({ runner })
    const route = findRouteByOperation(plugin.manifest.routes, 'codex-chat-message.list-messages')

    const response = await plugin.execute({
      request: createDomainRequest({
        method: route.method,
        body: {
          externalThreadId: 'thread-ext-1',
          role: 'user',
          limit: 25,
        },
        context: { tenantId: 'tenant-1', workspaceId: 'workspace-context-1' },
      }),
      match: { route, params: {} },
    })

    expect(response).toEqual({ ok: true })
    expect(runner).toHaveBeenCalledTimes(1)
    const payload = runner.mock.calls[0][1] as { filter?: Record<string, unknown>; options?: Record<string, unknown> }
    expect(payload.filter).toMatchObject({
      workspaceId: 'workspace-context-1',
      externalThreadId: 'thread-ext-1',
      role: 'user',
    })
    expect(payload.options).toMatchObject({
      limit: 25,
    })
  })

  it('does not inject legacy workspace fields into scope-owned create payloads', async () => {
    const runner = vi.fn(async () => ({ ok: true }))
    const plugin = createAgentspacePlugin({ runner })
    const route = findRouteByOperation(plugin.manifest.routes, 'prompt.create')

    const response = await plugin.execute({
      request: createDomainRequest({
        method: route.method,
        body: {
          data: {
            scopeId: 'project-scope-1',
            name: 'Resume Prompt',
            status: 'draft',
          },
        },
        context: { tenantId: 'tenant-1', workspaceId: 'workspace-context-1' },
      }),
      match: { route, params: {} },
    })

    expect(response).toEqual({ ok: true })
    expect(runner).toHaveBeenCalledTimes(1)
    expect(runner).toHaveBeenCalledWith(
      'prompt.create',
      expect.objectContaining({
        data: expect.objectContaining({
          scopeId: 'project-scope-1',
          name: 'Resume Prompt',
        }),
      }),
    )
    const payload = runner.mock.calls[0][1] as { data?: Record<string, unknown> }
    expect(payload.data?.workspaceId).toBeUndefined()
  })

  it('reports runtime env readiness in health details', async () => {
    const plugin = createAgentspacePlugin({
      requiredRuntimeEnv: ['AOPS_TEST_REQUIRED_ENV_KEY_MISSING'],
    })

    const health = await plugin.health?.()
    expect(health).toBeDefined()
    expect(health?.ok).toBe(false)
    expect(health?.details).toMatchObject({
      requiredRuntimeEnv: ['AOPS_TEST_REQUIRED_ENV_KEY_MISSING'],
      missingRuntimeEnv: ['AOPS_TEST_REQUIRED_ENV_KEY_MISSING'],
    })
  })

  it('validates plugin options with plugin_contract_invalid token', async () => {
    expect(() =>
      createAgentspacePlugin({
        operationTimeoutMs: Number.NaN,
      }),
    ).toThrowError(/plugin_contract_invalid:operationTimeoutMs/)
  })
})
