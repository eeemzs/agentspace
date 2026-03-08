import type { AopsOperationContract, AopsOperationSideEffect } from './contract.js'
import type { AopsOperationPolicy } from './types.js'
import { listAopsOperationContracts } from './contract.js'
import { getAopsContractSchema, resolveAopsSchemaRefName } from './schemas.js'

export type AopsDomainCapabilityOperation = {
  operationId: string
  title?: string
  sideEffect?: AopsOperationSideEffect
  tags?: string[]
  inputSchemaRef?: string
  outputSchemaRef?: string
}

export type AopsDomainCapabilityOperationDocs = {
  summary?: string
  notes?: string[]
  examples?: string[]
}

export type AopsDomainCapabilityResource = {
  resourceId: string
  title: string
  kind?: string
}

export type AopsDomainDiscoveryDocs = {
  summary?: string
  notes?: string[]
}

export type AopsDomainCapabilityManifest = {
  manifestVersion: string
  domain: {
    id: string
    version: string
    displayName?: string
    description?: string
  }
  capabilities: {
    operations: AopsDomainCapabilityOperation[]
    resources?: AopsDomainCapabilityResource[]
  }
  contracts?: {
    schemas: Record<string, unknown>
  }
  policies?: {
    operations: Record<string, AopsOperationPolicy>
  }
  docs?: {
    domain?: AopsDomainDiscoveryDocs
    resources?: Record<string, AopsDomainDiscoveryDocs>
    operations?: Record<string, AopsDomainCapabilityOperationDocs>
  }
}

export type BuildAopsDomainCapabilityManifestOptions = {
  manifestVersion?: string
  domainVersion?: string
  includeDocs?: boolean
  refresh?: boolean
}

function humanizeResource(resource: string): string {
  const normalized = resource
    .replace(/^aops\./, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  return normalized
    .split(' ')
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ')
}

function inferResourceKind(resourceId: string): string | undefined {
  if (resourceId.includes('link') || resourceId.includes('member')) return 'relationship'
  if (resourceId.includes('version')) return 'versioned-record'
  if (resourceId.includes('thread') || resourceId.includes('message') || resourceId.includes('memory')) return 'conversation-state'
  return 'record'
}

function buildResourceSummary(resourceTitle: string, operationKinds: string[]): string {
  if (operationKinds.length === 0) {
    return `${resourceTitle} records used inside the Agentspace workspace and agent runtime.`
  }
  if (operationKinds.length === 1) {
    return `Supports ${operationKinds[0]} operations for ${resourceTitle.toLowerCase()} in Agentspace runtime workflows.`
  }
  return `Supports ${operationKinds.slice(0, 5).join(', ')} operations for ${resourceTitle.toLowerCase()} in Agentspace runtime workflows.`
}

function buildCapabilityResources(operations: AopsOperationContract[]): AopsDomainCapabilityResource[] {
  const seen = new Map<string, AopsDomainCapabilityResource>()

  for (const operation of operations) {
    const resourceId = String(operation.serviceEntity ?? '').trim()
    if (!resourceId || seen.has(resourceId)) continue
    seen.set(resourceId, {
      resourceId,
      title: humanizeResource(resourceId),
      kind: inferResourceKind(resourceId),
    })
  }

  return [...seen.values()].sort((left, right) => left.title.localeCompare(right.title))
}

function buildResourceDocs(operations: AopsOperationContract[]): Record<string, AopsDomainDiscoveryDocs> {
  const operationKindsByResource = new Map<string, Set<string>>()

  for (const operation of operations) {
    const resourceId = String(operation.serviceEntity ?? '').trim()
    if (!resourceId) continue
    const existing = operationKindsByResource.get(resourceId) ?? new Set<string>()
    existing.add(operation.kind)
    operationKindsByResource.set(resourceId, existing)
  }

  return Object.fromEntries(
    [...operationKindsByResource.entries()]
      .sort(([left], [right]) => humanizeResource(left).localeCompare(humanizeResource(right)))
      .map(([resourceId, operationKinds]) => [
        resourceId,
        {
          summary: buildResourceSummary(humanizeResource(resourceId), [...operationKinds]),
        },
      ]),
  )
}

function chooseOperationSummary(operation: AopsOperationContract): string {
  const resource = humanizeResource(operation.serviceEntity || operation.operationId.split('.')[0] || 'resource')
  const kind = operation.kind

  if (kind === 'list') return `List ${resource} records.`
  if (kind === 'get') return `Get a ${resource} record.`
  if (kind === 'create') return `Create a ${resource} record.`
  if (kind === 'update') return `Update a ${resource} record.`
  if (kind === 'delete') return `Delete a ${resource} record.`
  return `Run ${operation.operationId} on ${resource}.`
}

function toTags(operation: AopsOperationContract): string[] {
  const tags = new Set<string>()
  for (const tag of operation.tags ?? []) {
    const normalized = String(tag ?? '').trim()
    if (!normalized) continue
    tags.add(normalized)
  }
  tags.add(`kind:${operation.kind}`)
  tags.add(`resource:${operation.serviceEntity}`)
  tags.add(`service:${operation.serviceKey}`)
  return [...tags]
}

function toOperationDocs(operation: AopsOperationContract): AopsDomainCapabilityOperationDocs {
  const requiredArgs = operation.args.filter((arg) => !arg.optional).map((arg) => arg.name)
  const optionalArgs = operation.args.filter((arg) => arg.optional).map((arg) => arg.name)
  const notes: string[] = []

  if (requiredArgs.length > 0) notes.push(`required args: ${requiredArgs.join(', ')}`)
  if (optionalArgs.length > 0) notes.push(`optional args: ${optionalArgs.join(', ')}`)

  return {
    summary: chooseOperationSummary(operation),
    ...(notes.length > 0 ? { notes } : {}),
    ...(operation.examples && operation.examples.length > 0 ? { examples: [...operation.examples] } : {}),
  }
}

function toCapabilityOperation(operation: AopsOperationContract): AopsDomainCapabilityOperation {
  const inputSchemaRef = resolveAopsSchemaRefName(operation.inputSchema)
  const outputSchemaRef = resolveAopsSchemaRefName(operation.outputSchema)

  return {
    operationId: operation.operationId,
    title: operation.summary,
    sideEffect: operation.sideEffect,
    tags: toTags(operation),
    ...(inputSchemaRef ? { inputSchemaRef } : {}),
    ...(outputSchemaRef ? { outputSchemaRef } : {}),
  }
}

export function buildAopsDomainCapabilityManifest(
  options: BuildAopsDomainCapabilityManifestOptions = {},
): AopsDomainCapabilityManifest {
  const operations = listAopsOperationContracts({ refresh: options.refresh })

  const manifest: AopsDomainCapabilityManifest = {
    manifestVersion: options.manifestVersion ?? '1.0.0',
    domain: {
      id: 'agentspace',
      version: options.domainVersion ?? '0.0.0',
      displayName: 'Agentspace',
      description: 'Agent workspace tooling for projects, prompts, tasks, skills, memory, chat, and agent runtime records.',
    },
    capabilities: {
      operations: operations.map(toCapabilityOperation),
      resources: buildCapabilityResources(operations),
    },
  }

  if (options.includeDocs !== false) {
    manifest.docs = {
      domain: {
        summary: 'Manage Agentspace workspace state such as projects, tasks, prompts, skills, chat threads, memory items, agent runs, and related runtime records.',
      },
      resources: buildResourceDocs(operations),
      operations: Object.fromEntries(operations.map((operation) => [operation.operationId, toOperationDocs(operation)])),
    }
  }

  const operationPolicies: Record<string, AopsOperationPolicy> = {}
  for (const operation of operations) {
    if (!operation.policy) continue
    operationPolicies[operation.operationId] = operation.policy
  }
  if (Object.keys(operationPolicies).length > 0) {
    manifest.policies = { operations: operationPolicies }
  }

  const schemaRefs = new Set<string>()
  for (const operation of manifest.capabilities.operations) {
    if (operation.inputSchemaRef) schemaRefs.add(operation.inputSchemaRef)
    if (operation.outputSchemaRef) schemaRefs.add(operation.outputSchemaRef)
  }

  if (schemaRefs.size > 0) {
    const schemas: Record<string, unknown> = {}
    for (const ref of schemaRefs) {
      const schema = getAopsContractSchema(ref)
      if (!schema) continue
      schemas[ref] = schema
    }
    if (Object.keys(schemas).length > 0) {
      manifest.contracts = { schemas }
    }
  }

  return manifest
}
