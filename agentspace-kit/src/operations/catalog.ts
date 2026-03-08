import type { AopsOperationSpec } from './types.js'
import {
  cloneAopsOperationSpec,
  defineAopsKitOperation,
  normalizeAopsOperationId,
} from './definition.js'
import { createAopsSchemaRef, getAopsOperationIoSchemaRefs } from './schemas.js'
import { AOPS_OPERATION_CATALOG_ROWS } from './catalog.data.js'

let cachedOperations: AopsOperationSpec[] | null = null

function toRecord(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {}
  return input as Record<string, unknown>
}

function toOperationSchemaRefs(operationId: string): {
  inputSchema?: { $ref: string }
  outputSchema?: { $ref: string }
} {
  const refs = getAopsOperationIoSchemaRefs(operationId)
  return {
    inputSchema: createAopsSchemaRef(refs.inputRef),
    outputSchema: createAopsSchemaRef(refs.outputRef),
  }
}

function cloneArgs(args: ReadonlyArray<{ name: string; optional: boolean }>): { name: string; optional: boolean }[] {
  return args.map((arg) => ({ ...arg }))
}

function buildOperationsInternal(): AopsOperationSpec[] {
  const operations: AopsOperationSpec[] = []

  for (const row of AOPS_OPERATION_CATALOG_ROWS) {
    const action = row.operationId.split('.').slice(1).join('.') || 'custom'
    const operation = defineAopsKitOperation({
      operationId: row.operationId,
      toolId: row.toolId,
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

  const unique = new Map<string, AopsOperationSpec>()
  for (const operation of operations) {
    unique.set(operation.operationId, operation)
  }

  return [...unique.values()].sort((left, right) => left.operationId.localeCompare(right.operationId))
}

export function listAopsOperationSpecs(options?: { refresh?: boolean }): AopsOperationSpec[] {
  const opts = toRecord(options)
  const refresh = opts.refresh === true
  if (!cachedOperations || refresh) {
    cachedOperations = buildOperationsInternal()
  }
  return cachedOperations.map(cloneAopsOperationSpec)
}

export function getAopsOperationByToolId(toolId: string, options?: { refresh?: boolean }): AopsOperationSpec | null {
  const operations = listAopsOperationSpecs(options)
  return operations.find((operation) => operation.toolId === toolId) ?? null
}

export function getAopsOperationById(operationId: string, options?: { refresh?: boolean }): AopsOperationSpec | null {
  const normalized = normalizeAopsOperationId(operationId)
  const operations = listAopsOperationSpecs(options)
  return operations.find((operation) => operation.operationId === normalized) ?? null
}
