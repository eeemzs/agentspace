import { describe, expect, it } from 'vitest'

import { listAgentspaceToolingTools, resolveAgentspaceOperationIdByToolId } from './tools.js'

describe('official catalog agent tools', () => {
  it('projects inspect, reconcile, and rollback with live schema refs and routes', () => {
    const tools = listAgentspaceToolingTools({ refresh: true })
      .filter((tool) => tool.operationId.startsWith('official-catalog.'))

    expect(tools.map((tool) => tool.toolId)).toEqual([
      'agentspace.official-catalog.inspect',
      'agentspace.official-catalog.reconcile',
      'agentspace.official-catalog.rollback',
    ])
    expect(tools.map((tool) => tool.inputSchemaRef)).toEqual([
      'official-catalog.inspect.input',
      'official-catalog.reconcile.input',
      'official-catalog.rollback.input',
    ])
    expect(tools.map((tool) => tool.outputSchemaRef)).toEqual([
      'official-catalog.inspect.output',
      'official-catalog.reconcile.output',
      'official-catalog.rollback.output',
    ])
    expect(tools.every((tool) => tool.route?.pattern.startsWith('/operations/official-catalog/'))).toBe(true)
    expect(resolveAgentspaceOperationIdByToolId('agentspace.official-catalog.rollback')).toBe('official-catalog.rollback')
  })
})
