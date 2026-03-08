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

function rewriteAgentspaceManifest(
  manifest: AopsDomainCapabilityManifest,
): AopsDomainCapabilityManifest {
  return {
    ...manifest,
    domain: {
      ...manifest.domain,
      id: 'agentspace',
      displayName: 'Agentspace',
      description:
        'Agent workspace tooling for prompts, skills, resources, memory, projects, chat, and agent runtime records.',
    },
  }
}

function rewriteRouteId(route: AopsHostRouteProjectionEntry): AopsHostRouteProjectionEntry {
  return {
    ...route,
    id: route.id.startsWith('aops.') ? `agentspace.${route.id.slice('aops.'.length)}` : route.id,
  }
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
  const resolvedToolId = toolId.startsWith('agentspace-') ? `aops-${toolId.slice('agentspace-'.length)}` : toolId
  return getAopsOperationByToolId(resolvedToolId, options)
}

export async function runAgentspaceKitOperationByToolId(
  toolId: string,
  input: unknown,
): Promise<unknown> {
  const resolvedToolId = toolId.startsWith('agentspace-') ? `aops-${toolId.slice('agentspace-'.length)}` : toolId
  return runAopsKitOperationByToolId(resolvedToolId, input)
}

export async function runAgentspaceKitOperationByTypedId(
  operationId: string,
  input?: unknown,
): Promise<unknown> {
  return runAopsKitOperationByTypedId(operationId as never, input as never)
}

export function buildAgentspaceDomainCapabilityManifest(options?: {
  manifestVersion?: string
  domainVersion?: string
  includeDocs?: boolean
  refresh?: boolean
}): AopsDomainCapabilityManifest {
  return rewriteAgentspaceManifest(buildAopsDomainCapabilityManifest(options))
}

export function buildAgentspaceHostRouteProjection(options?: {
  refresh?: boolean
}): AopsHostRouteProjectionEntry[] {
  return buildAopsHostRouteProjection(options).map(rewriteRouteId)
}
