import type {
  AopsOperationArgument,
  AopsOperationEffect,
  AopsOperationKind,
  AopsOperationPolicy,
  AopsOperationSchema,
  AopsOperationSpec,
} from './types.js'
import { listAopsOperationSpecs } from './catalog.js'
import { normalizeAopsOperationId } from './definition.js'

export type AopsOperationSideEffect = AopsOperationEffect

export type AopsOperationContract = {
  operationId: string
  toolId: string
  summary: string
  kind: AopsOperationKind
  sideEffect: AopsOperationSideEffect
  serviceKey: string
  serviceEntity: string
  methodName: string
  args: AopsOperationArgument[]
  tags?: string[]
  inputSchema?: AopsOperationSchema
  outputSchema?: AopsOperationSchema
  policy?: AopsOperationPolicy
  examples?: string[]
}

type AopsOperationPolicyRecord = {
  scope: 'tenant' | 'global'
  auth?: { required?: boolean; roles?: string[]; capabilities?: string[] }
  safety?: { destructive?: boolean; confirmationRequired?: boolean; applyRequired?: boolean }
  rateLimit?: { bucket: string; max: number; windowSeconds: number }
}

function toSummary(operationId: string): string {
  const normalized = operationId
    .split('.')
    .flatMap((segment) => segment.split('-'))
    .join(' ')
    .trim()
  if (!normalized) return operationId
  return normalized.charAt(0).toUpperCase() + normalized.slice(1)
}

function toSideEffect(kind: AopsOperationKind): AopsOperationSideEffect {
  if (kind === 'list' || kind === 'get') return 'none'
  if (kind === 'custom') return 'mixed'
  return 'db'
}

function isWriteOperation(spec: AopsOperationSpec): boolean {
  if (spec.kind === 'create' || spec.kind === 'update' || spec.kind === 'delete') return true
  return spec.operationId.endsWith('.push')
}

function toDefaultPolicy(spec: AopsOperationSpec): AopsOperationPolicy {
  const write = isWriteOperation(spec)
  const policy: AopsOperationPolicyRecord = {
    scope: 'tenant',
    auth: { required: true },
  }

  if (write) {
    policy.safety = {
      destructive: false,
      applyRequired: true,
      confirmationRequired: false,
    }
    policy.rateLimit = {
      bucket: 'aops-write',
      max: 100,
      windowSeconds: 60,
    }
    return policy
  }

  policy.rateLimit = {
    bucket: 'aops-read',
    max: 240,
    windowSeconds: 60,
  }
  return policy
}

function toJsonExample(input: Record<string, unknown>): string {
  return JSON.stringify(input)
}

function toDefaultExampleFromArgs(spec: AopsOperationSpec): string {
  const payload: Record<string, unknown> = {}
  for (const arg of spec.args) {
    if (arg.name === 'id') payload.id = '<id>'
    else if (arg.name === 'projectId') payload.projectId = '<projectId>'
    else if (arg.name === 'workspaceId') payload.workspaceId = '<workspaceId>'
    else if (arg.name === 'taskId') payload.taskId = '<taskId>'
    else if (arg.name === 'promptId') payload.promptId = '<promptId>'
    else if (arg.name === 'skillId') payload.skillId = '<skillId>'
    else if (arg.name === 'filter') payload.filter = {}
    else if (arg.name === 'criteria') payload.criteria = {}
    else if (arg.name === 'options') payload.options = { limit: 20 }
    else if (arg.name === 'opts') payload.opts = {}
    else if (arg.name === 'patch') payload.patch = {}
    else if (arg.name === 'data') payload.data = {}
    else payload[arg.name] = `<${arg.name}>`
  }

  if (Object.keys(payload).length === 0) payload.input = '<payload>'
  return toJsonExample(payload)
}

function toDefaultExamples(spec: AopsOperationSpec): string[] {
  return [toDefaultExampleFromArgs(spec)]
}

function fromSpec(spec: AopsOperationSpec): AopsOperationContract {
  const summary = typeof spec.summary === 'string' ? spec.summary.trim() : ''
  const policy = spec.policy ?? toDefaultPolicy(spec)
  const examples = spec.examples && spec.examples.length > 0 ? [...spec.examples] : toDefaultExamples(spec)

  return {
    operationId: spec.operationId,
    toolId: spec.toolId,
    summary: summary || toSummary(spec.operationId),
    kind: spec.kind,
    sideEffect: spec.sideEffect ?? toSideEffect(spec.kind),
    serviceKey: spec.serviceKey,
    serviceEntity: spec.serviceEntity,
    methodName: spec.methodName,
    args: spec.args.map((arg) => ({ ...arg })),
    ...(spec.tags ? { tags: [...spec.tags] } : {}),
    ...(spec.inputSchema !== undefined ? { inputSchema: spec.inputSchema } : {}),
    ...(spec.outputSchema !== undefined ? { outputSchema: spec.outputSchema } : {}),
    ...(policy !== undefined ? { policy } : {}),
    ...(examples.length > 0 ? { examples } : {}),
  }
}

export function listAopsOperationContracts(options?: { refresh?: boolean }): AopsOperationContract[] {
  return listAopsOperationSpecs(options).map(fromSpec)
}

export function getAopsOperationContractByToolId(toolId: string, options?: { refresh?: boolean }): AopsOperationContract | null {
  const operations = listAopsOperationContracts(options)
  return operations.find((operation) => operation.toolId === toolId) ?? null
}

export function getAopsOperationContractById(operationId: string, options?: { refresh?: boolean }): AopsOperationContract | null {
  const normalized = normalizeAopsOperationId(operationId)
  const operations = listAopsOperationContracts(options)
  return operations.find((operation) => operation.operationId === normalized) ?? null
}
