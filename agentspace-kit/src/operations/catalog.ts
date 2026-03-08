import type { AgentspaceOperationSpec } from './types.js'
import {
  buildAgentspaceToolIdFromOperation,
  cloneAgentspaceOperationSpec,
  defineAgentspaceKitOperation,
  normalizeAgentspaceOperationId,
} from './definition.js'
import { createAgentspaceSchemaRef, getAgentspaceOperationIoSchemaRefs } from './schemas.js'
import { AGENTSPACE_OPERATION_CATALOG_ROWS } from './catalog.data.js'

let cachedOperations: AgentspaceOperationSpec[] | null = null

function toRecord(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {}
  return input as Record<string, unknown>
}

function toOperationSchemaRefs(operationId: string): {
  inputSchema?: { $ref: string }
  outputSchema?: { $ref: string }
} {
  const refs = getAgentspaceOperationIoSchemaRefs(operationId)
  return {
    inputSchema: createAgentspaceSchemaRef(refs.inputRef),
    outputSchema: createAgentspaceSchemaRef(refs.outputRef),
  }
}

function cloneArgs(args: ReadonlyArray<{ name: string; optional: boolean }>): { name: string; optional: boolean }[] {
  return args.map((arg) => ({ ...arg }))
}

function buildOperationsInternal(): AgentspaceOperationSpec[] {
  const operations: AgentspaceOperationSpec[] = []

  for (const row of AGENTSPACE_OPERATION_CATALOG_ROWS) {
    const action = row.operationId.split('.').slice(1).join('.') || 'custom'
    const operation = defineAgentspaceKitOperation({
      operationId: row.operationId,
      toolId: buildAgentspaceToolIdFromOperation(row.operationId),
      serviceKey: row.serviceKey,
      serviceEntity: row.serviceEntity,
      methodName: row.methodName,
      kind: row.kind,
      args: cloneArgs(row.args),
      summary: row.summary,
      tags: [`resource:${row.serviceEntity}`, `action:${action}`],
      ...toOperationSchemaRefs(row.operationId),
    })
    operations.push(operation)
  }

  const unique = new Map<string, AgentspaceOperationSpec>()
  for (const operation of operations) {
    unique.set(operation.operationId, operation)
  }

  return [...unique.values()].sort((left, right) => left.operationId.localeCompare(right.operationId))
}

export function listAgentspaceOperationSpecs(options?: { refresh?: boolean }): AgentspaceOperationSpec[] {
  const opts = toRecord(options)
  const refresh = opts.refresh === true
  if (!cachedOperations || refresh) {
    cachedOperations = buildOperationsInternal()
  }
  return cachedOperations.map(cloneAgentspaceOperationSpec)
}

export function getAgentspaceOperationByToolId(toolId: string, options?: { refresh?: boolean }): AgentspaceOperationSpec | null {
  const operations = listAgentspaceOperationSpecs(options)
  return operations.find((operation) => operation.toolId === toolId) ?? null
}

export function getAgentspaceOperationById(operationId: string, options?: { refresh?: boolean }): AgentspaceOperationSpec | null {
  const normalized = normalizeAgentspaceOperationId(operationId)
  const operations = listAgentspaceOperationSpecs(options)
  return operations.find((operation) => operation.operationId === normalized) ?? null
}
