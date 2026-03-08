import {
  buildAopsDomainCapabilityManifest,
  buildAopsHostRouteProjection,
} from './operations/index.js'
import {
  getAopsOperationById,
  getAopsOperationByToolId,
  listAopsOperationSpecs,
} from './operations/catalog.js'
import {
  runAopsKitOperationByToolId,
  runAopsKitOperationByTypedId,
} from './operations/executor.js'
import type { AopsOperationInput, AopsOperationOutput, AopsTypedOperationId } from './operations/index.js'
import type { AopsDomainCapabilityManifest } from './operations/dcm.js'
import type { AopsHostRouteProjectionEntry } from './operations/host-projection.js'
import type { AopsOperationSpec } from './operations/types.js'

export * from './domain-services/index.js'
export * from './domain-services/unified.js'
export * from './domain-services/provider.js'
export * from './domain-services/types.js'
export * from './domain-services/presets.js'
export * from './domain-services/resilience.js'
export * from './domain-services/metrics.js'
export * from './domain-services/jwt.js'
export * from './config/config.js'
export * from './calls/index.js'
export * from './errors/index.js'
export * from './resources/index.js'
export * from './operations/index.js'
export * from './shared/index.js'

export const AGENTSPACE_KIT_DOMAIN_ID = 'agentspace' as const

export type AgentspaceKitOperationSpec = AopsOperationSpec
export type AgentspaceKitOperationId = AopsOperationSpec['operationId']

function normalizeAgentspaceToolId(toolId: string): string {
  return String(toolId ?? '').trim().toLowerCase()
}

export function listAgentspaceKitOperations(
  options?: { refresh?: boolean },
): readonly AgentspaceKitOperationSpec[] {
  return listAopsOperationSpecs(options)
}

export function getAgentspaceKitOperationByTypedId(
  operationId: string,
  options?: { refresh?: boolean },
): AgentspaceKitOperationSpec | null {
  return getAopsOperationById(operationId, options)
}

export function getAgentspaceKitOperationByToolId(
  toolId: string,
  options?: { refresh?: boolean },
): AgentspaceKitOperationSpec | null {
  return getAopsOperationByToolId(normalizeAgentspaceToolId(toolId), options)
}

export async function runAgentspaceKitOperationByToolId(
  toolId: string,
  input: unknown,
): Promise<unknown> {
  return runAopsKitOperationByToolId(normalizeAgentspaceToolId(toolId), input)
}

export async function runAgentspaceKitOperationByTypedId<TId extends AopsTypedOperationId>(
  operationId: TId,
  input: AopsOperationInput<TId>,
): Promise<AopsOperationOutput<TId>> {
  return runAopsKitOperationByTypedId(operationId, input)
}

export function buildAgentspaceDomainCapabilityManifest(options?: {
  manifestVersion?: string
  domainVersion?: string
  includeDocs?: boolean
  refresh?: boolean
}): AopsDomainCapabilityManifest {
  return buildAopsDomainCapabilityManifest(options)
}

export function buildAgentspaceHostRouteProjection(options?: {
  refresh?: boolean
}): AopsHostRouteProjectionEntry[] {
  return buildAopsHostRouteProjection(options)
}
