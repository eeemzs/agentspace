import {
  buildAgentspaceDomainCapabilityManifest as buildAgentspaceDomainCapabilityManifestFromKit,
  buildAgentspaceHostRouteProjection as buildAgentspaceHostRouteProjectionFromKit,
  getAgentspaceKitOperationByToolId,
  getAgentspaceKitOperationByTypedId,
  listAgentspaceKitOperations as listAgentspaceKitOperationsFromKit,
  parseAgentspaceToolInput,
  runAgentspaceKitOperationByTypedId,
} from '@aopslab/domain-kit-agentspace'

type AgentspaceOperationSpec = ReturnType<typeof listAgentspaceKitOperationsFromKit>[number]
type AgentspaceDomainCapabilityManifest = ReturnType<typeof buildAgentspaceDomainCapabilityManifestFromKit>
type AgentspaceHostRouteProjectionEntry = ReturnType<typeof buildAgentspaceHostRouteProjectionFromKit>[number]

export type AgentspaceToolDescriptor = {
  toolId: string
  localToolId: string
  domain: 'agentspace'
  operationId: string
  title?: string
  summary?: string
  sideEffect?: 'none' | 'db' | 'fs' | 'network' | 'mixed'
  tags?: string[]
  inputSchemaRef?: string
  outputSchemaRef?: string
  policy?: unknown
  aliases: string[]
  notes?: string[]
  examples?: string[]
  route?: {
    method: string
    pattern: string
  }
}

export type AgentspaceAgentManifest = {
  kind: 'agentspace-agent-manifest'
  version: 'v1'
  domain: 'agentspace'
  generatedAt: string
  tools: AgentspaceToolDescriptor[]
}

function normalizeIdentifier(value: string): string {
  return String(value ?? '').trim().toLowerCase().replace(/^\/+/, '')
}

function normalizeOperationId(value: string): string {
  return normalizeIdentifier(value)
    .replace(/^operations\//, '')
    .replace(/^api\/agentspace\/operations\//, '')
    .replace(/\//g, '.')
    .replace(/\.+/g, '.')
    .replace(/^agentspace\./, '')
}

function toOperationPath(operationId: string): string {
  return `operations/${operationId.replace(/\./g, '/')}`
}

function toGatewayToolId(operationId: string): string {
  return `agentspace.${operationId}`
}

function toLocalFallbackToolId(operationId: string): string {
  return `agentspace-${operationId.replace(/\./g, '-')}`
}

function buildAliases(spec: AgentspaceOperationSpec): string[] {
  const aliases = new Set<string>()
  const operationId = normalizeOperationId(spec.operationId)
  aliases.add(operationId)
  aliases.add(toGatewayToolId(operationId))
  aliases.add(normalizeIdentifier(spec.toolId))
  aliases.add(toLocalFallbackToolId(operationId))
  aliases.add(toOperationPath(operationId))
  aliases.add(`/${toOperationPath(operationId)}`)
  return [...aliases]
}

function buildOperationAliasIndex(specs: AgentspaceOperationSpec[]): Map<string, string> {
  const index = new Map<string, string>()
  for (const spec of specs) {
    for (const alias of buildAliases(spec)) {
      index.set(normalizeIdentifier(alias), spec.operationId)
    }
  }
  return index
}

function toOperationMap(specs: AgentspaceOperationSpec[]): Map<string, AgentspaceOperationSpec> {
  return new Map(specs.map((spec) => [normalizeOperationId(spec.operationId), spec]))
}

function toOperationRefMap(
  manifest: AgentspaceDomainCapabilityManifest,
): Map<string, AgentspaceDomainCapabilityManifest['capabilities']['operations'][number]> {
  return new Map(
    manifest.capabilities.operations.map((operation) => [normalizeOperationId(operation.operationId), operation]),
  )
}

function toRouteMap(
  routes: AgentspaceHostRouteProjectionEntry[],
): Map<string, AgentspaceHostRouteProjectionEntry> {
  return new Map(routes.map((route) => [normalizeOperationId(route.operation), route]))
}

function toRecord(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {}
  return input as Record<string, unknown>
}

function normalizeNonEmptyString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const normalized = value.trim()
  return normalized.length > 0 ? normalized : undefined
}

function toStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .map((entry) => String(entry ?? '').trim())
    .filter(Boolean)
}

function mergeStringLists(...groups: Array<readonly string[] | undefined>): string[] {
  const merged = new Set<string>()
  for (const group of groups) {
    if (!group) continue
    for (const entry of group) {
      const normalized = String(entry ?? '').trim()
      if (!normalized) continue
      merged.add(normalized)
    }
  }
  return [...merged]
}

function getOperationDocRecord(
  manifest: AgentspaceDomainCapabilityManifest,
  spec: AgentspaceOperationSpec,
): Record<string, unknown> {
  const docsByOperation = toRecord(toRecord(manifest.docs).operations)
  const normalizedOperationId = normalizeOperationId(spec.operationId)
  const candidates = [
    normalizedOperationId,
    spec.operationId,
    toGatewayToolId(normalizedOperationId),
    spec.toolId,
  ]

  for (const candidate of candidates) {
    const key = normalizeNonEmptyString(candidate)
    if (!key) continue
    if (Object.prototype.hasOwnProperty.call(docsByOperation, key)) {
      return toRecord(docsByOperation[key])
    }
  }
  return {}
}

export function listAgentspaceToolingOperations(options?: { refresh?: boolean }): AgentspaceOperationSpec[] {
  return listAgentspaceKitOperationsFromKit(options).map((spec) => ({ ...spec }))
}

export function listAgentspaceToolingTools(options?: { refresh?: boolean }): AgentspaceToolDescriptor[] {
  const manifest = buildAgentspaceDomainCapabilityManifestFromKit({
    includeDocs: true,
    refresh: options?.refresh,
  })
  const policyByOperation = manifest.policies?.operations ?? {}
  const operationRefMap = toOperationRefMap(manifest)
  const routeMap = toRouteMap(buildAgentspaceHostRouteProjectionFromKit({ refresh: options?.refresh }))
  const specs = listAgentspaceToolingOperations(options)

  const tools: AgentspaceToolDescriptor[] = []
  for (const spec of specs) {
    const operationId = normalizeOperationId(spec.operationId)
    const operationRef = operationRefMap.get(operationId)
    const doc = getOperationDocRecord(manifest, spec)
    const route = routeMap.get(operationId)
    tools.push({
      toolId: toGatewayToolId(operationId),
      localToolId: spec.toolId,
      domain: 'agentspace',
      operationId,
      title: operationRef?.title,
      summary: normalizeNonEmptyString(doc.summary) ?? operationRef?.title,
      sideEffect: operationRef?.sideEffect,
      tags: mergeStringLists(operationRef?.tags, spec.tags, toStringList(doc.tags)),
      inputSchemaRef: operationRef?.inputSchemaRef,
      outputSchemaRef: operationRef?.outputSchemaRef,
      policy: policyByOperation[operationId],
      aliases: buildAliases(spec),
      notes: toStringList(doc.notes),
      examples: mergeStringLists(spec.examples, toStringList(doc.examples)),
      ...(route ? { route: { method: route.method, pattern: route.pattern } } : {}),
    })
  }

  return tools.sort((left, right) => left.operationId.localeCompare(right.operationId))
}

export function resolveAgentspaceOperationIdByToolId(
  identifier: string,
  options?: { refresh?: boolean },
): string | null {
  const specs = listAgentspaceToolingOperations(options)
  const aliases = buildOperationAliasIndex(specs)
  const operationId = aliases.get(normalizeIdentifier(identifier))
  return operationId ? normalizeOperationId(operationId) : null
}

export function getAgentspaceOperationSpecById(
  identifier: string,
  options?: { refresh?: boolean },
): AgentspaceOperationSpec | null {
  const specs = listAgentspaceToolingOperations(options)
  const aliases = buildOperationAliasIndex(specs)
  const operationId = aliases.get(normalizeIdentifier(identifier))
  if (!operationId) return null
  const map = toOperationMap(specs)
  return map.get(normalizeOperationId(operationId)) ?? null
}

export function resolveAgentspaceToolIdByOperationId(
  operationId: string,
  options?: { refresh?: boolean },
): string | null {
  const spec = getAgentspaceOperationSpecById(operationId, options)
  if (!spec) return null
  return toGatewayToolId(spec.operationId)
}

export function buildAgentspaceAgentManifest(options?: { refresh?: boolean }): AgentspaceAgentManifest {
  return {
    kind: 'agentspace-agent-manifest',
    version: 'v1',
    domain: 'agentspace',
    generatedAt: new Date().toISOString(),
    tools: listAgentspaceToolingTools(options),
  }
}

export async function runAgentspaceOperationById(
  operationId: string,
  input?: unknown,
  options?: { refresh?: boolean },
): Promise<unknown> {
  const spec =
    getAgentspaceOperationSpecById(operationId, options)
    ?? getAgentspaceKitOperationByTypedId(operationId, options)
  if (!spec) {
    throw new Error(`unknown_agentspace_operation:${operationId}`)
  }
  const parsedInput = parseAgentspaceToolInput(spec.operationId as never, toRecord(input))
  return runAgentspaceKitOperationByTypedId(spec.operationId as never, parsedInput as never)
}

export async function runAgentspaceToolById(
  identifier: string,
  input?: unknown,
  options?: { refresh?: boolean },
): Promise<unknown> {
  const operationId = resolveAgentspaceOperationIdByToolId(identifier, options)
  if (!operationId) {
    const normalized = normalizeIdentifier(identifier)
    const direct = getAgentspaceKitOperationByToolId(normalized, options)
    if (!direct) {
      throw new Error(`unknown_agentspace_tool:${identifier}`)
    }
    const parsedInput = parseAgentspaceToolInput(direct.operationId as never, toRecord(input))
    return runAgentspaceKitOperationByTypedId(direct.operationId as never, parsedInput as never)
  }
  return runAgentspaceOperationById(operationId, input, options)
}

export const buildAgentspaceDomainCapabilityManifest = buildAgentspaceDomainCapabilityManifestFromKit
export const buildAgentspaceHostRouteProjection = buildAgentspaceHostRouteProjectionFromKit
