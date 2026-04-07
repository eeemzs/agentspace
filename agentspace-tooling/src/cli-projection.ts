import {
  buildAgentspaceDomainCapabilityManifest,
  buildAgentspaceHostRouteProjection,
  listAgentspaceToolingOperations,
} from './tools.js'

type AgentspaceOperationSpec = ReturnType<typeof listAgentspaceToolingOperations>[number]
type AgentspaceDomainCapabilityManifest = ReturnType<typeof buildAgentspaceDomainCapabilityManifest>
type AgentspaceHostRouteProjectionEntry = ReturnType<typeof buildAgentspaceHostRouteProjection>[number]

export type AgentspaceCliHelpSection = {
  title: string
  lines: string[]
}

export type AgentspaceCliCommandDescriptor = {
  id: string
  kind: 'root' | 'static' | 'operation'
  title: string
  command: string[]
  aliases: string[]
  summary?: string
  operationId?: string
  toolId?: string
  localToolId?: string
  sections: AgentspaceCliHelpSection[]
}

export type AgentspaceCliManifestArtifact = {
  id: 'dcm' | 'routes' | 'agent' | 'cli' | 'host-registration' | 'ops'
  aliases?: string[]
  title: string
  summary: string
  canonicalRole: 'canonical' | 'projection' | 'registration' | 'list'
}

export type AgentspaceCliProjection = {
  kind: 'agentspace-cli-projection'
  version: 'v1'
  domain: 'agentspace'
  generatedAt: string
  sourceOfTruth: {
    canonical: 'dcm'
    notes: string[]
  }
  artifacts: AgentspaceCliManifestArtifact[]
  commands: AgentspaceCliCommandDescriptor[]
  commandsById: Record<string, AgentspaceCliCommandDescriptor>
}

const AGENTSPACE_MANIFEST_ARTIFACTS: AgentspaceCliManifestArtifact[] = [
  {
    id: 'dcm',
    title: 'Domain Capability Manifest',
    summary: 'Canonical capability source derived from Agentspace kit contracts, docs, policies, and schemas.',
    canonicalRole: 'canonical',
  },
  {
    id: 'routes',
    title: 'Host Route Projection',
    summary: 'HTTP route projection derived from the canonical DCM.',
    canonicalRole: 'projection',
  },
  {
    id: 'agent',
    title: 'Agent Tool Manifest',
    summary: 'Agent-oriented tool descriptor projection derived from DCM docs, aliases, routes, and policy.',
    canonicalRole: 'projection',
  },
  {
    id: 'cli',
    title: 'CLI Projection',
    summary: 'Derived command/help projection for standalone CLI users and local agents. DCM remains canonical.',
    canonicalRole: 'projection',
  },
  {
    id: 'host-registration',
    aliases: ['hrm'],
    title: 'Host Registration Manifest',
    summary: 'AOPS/runtime registration payload. HRM is not a capability source.',
    canonicalRole: 'registration',
  },
  {
    id: 'ops',
    aliases: ['operations'],
    title: 'Operation Specs',
    summary: 'Resolved shared operation specs and contract args used by tooling/CLI surfaces.',
    canonicalRole: 'list',
  },
]

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

function normalizeNonEmptyString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const normalized = value.trim()
  return normalized.length > 0 ? normalized : undefined
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

function toRecord(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {}
  return input as Record<string, unknown>
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

function toKebabCase(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[_\s.]+/g, '-')
    .toLowerCase()
}

function appendSection(target: AgentspaceCliHelpSection[], title: string, lines: string[]): void {
  const normalized = lines.map((line) => String(line ?? '').trimEnd()).filter(Boolean)
  if (normalized.length === 0) return
  target.push({ title, lines: normalized })
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
  return [...aliases].filter(Boolean)
}

function toRouteMap(
  routes: AgentspaceHostRouteProjectionEntry[],
): Map<string, AgentspaceHostRouteProjectionEntry> {
  return new Map(routes.map((route) => [normalizeOperationId(route.operation), route]))
}

function toOperationRefMap(
  manifest: AgentspaceDomainCapabilityManifest,
): Map<string, AgentspaceDomainCapabilityManifest['capabilities']['operations'][number]> {
  return new Map(
    manifest.capabilities.operations.map((operation) => [normalizeOperationId(operation.operationId), operation]),
  )
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

function buildOperationArgRows(spec: AgentspaceOperationSpec): string[] {
  return spec.args.map((arg) => {
    const flag = `--${toKebabCase(arg.name)}`
    const label = arg.optional ? `${flag} <${arg.name}>` : `${flag} <${arg.name}> (required)`
    return `${label}  Contract arg`
  })
}

function buildCommonRuntimeHelpRows(): string[] {
  return [
    '--repo-url <postgres-url>  Override repository URL for this invocation',
    '--project-id <id>  Provide project context for this invocation',
    '--tenant-id <uuid>  Override tenant id for this invocation',
    '--execution-mode <host|tooling>  Force host or tooling execution mode',
    '--log-level <level>  Override log level for this invocation',
    '--help  Show command help without executing the command',
  ]
}

function createCommandDescriptor(input: {
  id: string
  kind: AgentspaceCliCommandDescriptor['kind']
  title: string
  command: string[]
  aliases?: string[]
  summary?: string
  operationId?: string
  toolId?: string
  localToolId?: string
  sections: AgentspaceCliHelpSection[]
}): AgentspaceCliCommandDescriptor {
  return {
    id: input.id,
    kind: input.kind,
    title: input.title,
    command: input.command,
    aliases: [...new Set((input.aliases ?? []).map((entry) => String(entry ?? '').trim()).filter(Boolean))],
    ...(input.summary ? { summary: input.summary } : {}),
    ...(input.operationId ? { operationId: input.operationId } : {}),
    ...(input.toolId ? { toolId: input.toolId } : {}),
    ...(input.localToolId ? { localToolId: input.localToolId } : {}),
    sections: input.sections,
  }
}

function buildGeneratedCommandForms(operationId: string): { command: string[]; aliases: string[] } {
  const normalized = normalizeOperationId(operationId)
  const segments = normalized.split('.').filter(Boolean)
  if (segments.length < 2) {
    const command = ['agentspace', normalized]
    return {
      command,
      aliases: [command.join(' '), command.slice(1).join(' ')],
    }
  }

  const action = segments[segments.length - 1]
  const resourceSegments = segments.slice(0, -1)
  const compactTokens = resourceSegments
  const expandedTokens = resourceSegments.flatMap((segment) => segment.split('-').filter(Boolean))
  const compactCommand = ['agentspace', ...compactTokens, action]
  const expandedCommand = ['agentspace', ...expandedTokens, action]
  const aliases = new Set<string>([
    compactCommand.join(' '),
    compactCommand.slice(1).join(' '),
    expandedCommand.join(' '),
    expandedCommand.slice(1).join(' '),
  ])
  return { command: compactCommand, aliases: [...aliases] }
}

function buildRootCommandDescriptor(): AgentspaceCliCommandDescriptor {
  const sections: AgentspaceCliHelpSection[] = []
  appendSection(sections, 'Purpose', [
    'agentspace-cli is a standalone runtime for project-scoped agent data such as projects, prompts, tasks, skills, memory, chat, and runtime records.',
    'DCM is canonical. CLI/help/agent/routes are derived projections. HRM is registration-only metadata.',
  ])
  appendSection(sections, 'Usage', [
    'agentspace <command> [subcommand] [--options]',
    'agentspace <command> --help',
    'agentspace help <command> [subcommand]',
    'agentspace --version',
  ])
  appendSection(sections, 'Core commands', [
    'agentspace tools',
    'agentspace ops',
    'agentspace manifest [dcm|routes|agent|cli|host-registration|ops]',
    'agentspace manifest get <artifact> [--path <dot.path>]',
    'agentspace manifest show <artifact> [--path <dot.path>]',
    'agentspace tool --id <tool-or-operation-id> [--input <json|@file>]',
    'agentspace op <operation-or-tool-id> [--input <json|@file>]',
    'agentspace version',
  ])
  appendSection(sections, 'Generated sugar commands', [
    'agentspace project list-projects',
    'agentspace project create --data <json>',
    'agentspace task list-tasks --filter <json> --project-id <id>',
  ])
  appendSection(sections, 'Runtime options', buildCommonRuntimeHelpRows())
  appendSection(sections, 'Examples', [
    'agentspace manifest cli',
    'agentspace manifest get dcm --path docs.operations.project.list-projects',
    'agentspace manifest show hrm',
    'agentspace project list-projects --help',
    'agentspace op agentspace.project.list-projects --project-id <id>',
  ])

  return createCommandDescriptor({
    id: 'agentspace',
    kind: 'root',
    title: 'agentspace-cli',
    command: ['agentspace'],
    aliases: ['agentspace', 'help'],
    summary: 'Standalone Agentspace CLI runtime and manifest browser.',
    sections,
  })
}

function buildManifestCommandDescriptors(): AgentspaceCliCommandDescriptor[] {
  const manifestSections: AgentspaceCliHelpSection[] = []
  appendSection(manifestSections, 'Usage', [
    'agentspace manifest [all|dcm|routes|agent|cli|host-registration|ops]',
    'agentspace manifest get <artifact> [--path <dot.path>]',
    'agentspace manifest show <artifact> [--path <dot.path>]',
    'agentspace manifest --help',
  ])
  appendSection(manifestSections, 'Subcommands', [
    'all  Emit dcm + routes + agent + cli + host-registration + operations',
    'dcm  Emit Domain Capability Manifest; canonical capability source',
    'routes  Emit host route projection derived from DCM',
    'agent  Emit agent-oriented tool descriptor manifest',
    'cli  Emit derived CLI projection/help manifest',
    'host-registration  Emit installed host registration payload (HRM; runtime registration only)',
    'ops  Emit shared operation spec list',
    'get  Extract raw JSON from a manifest artifact or a sub-path',
    'show  Render a manifest artifact or a sub-path as human-readable text',
  ])
  appendSection(manifestSections, 'Artifacts', AGENTSPACE_MANIFEST_ARTIFACTS.map((artifact) => {
    const aliasLabel = artifact.aliases?.length ? ` (aliases: ${artifact.aliases.join(', ')})` : ''
    return `${artifact.id}${aliasLabel}  ${artifact.summary}`
  }))

  const createSimple = (
    id: AgentspaceCliCommandDescriptor['id'],
    title: string,
    command: string[],
    aliases: string[],
    summary: string,
    usage: string[],
    purpose: string[],
  ): AgentspaceCliCommandDescriptor => {
    const sections: AgentspaceCliHelpSection[] = []
    appendSection(sections, 'Usage', usage)
    appendSection(sections, 'Purpose', purpose)
    return createCommandDescriptor({ id, kind: 'static', title, command, aliases, summary, sections })
  }

  return [
    createCommandDescriptor({
      id: 'manifest',
      kind: 'static',
      title: 'agentspace manifest',
      command: ['agentspace', 'manifest'],
      aliases: ['manifest'],
      summary: 'Browse canonical and derived Agentspace manifests.',
      sections: manifestSections,
    }),
    createSimple(
      'manifest.dcm',
      'agentspace manifest dcm',
      ['agentspace', 'manifest', 'dcm'],
      ['manifest dcm'],
      'Emit canonical Agentspace DCM.',
      ['agentspace manifest dcm', 'agentspace manifest dcm --help'],
      ['Emit Agentspace Domain Capability Manifest (DCM). DCM is canonical.'],
    ),
    createSimple(
      'manifest.routes',
      'agentspace manifest routes',
      ['agentspace', 'manifest', 'routes'],
      ['manifest routes'],
      'Emit host route projection.',
      ['agentspace manifest routes', 'agentspace manifest routes --help'],
      ['Emit host route projection derived from the Agentspace manifest.'],
    ),
    createSimple(
      'manifest.agent',
      'agentspace manifest agent',
      ['agentspace', 'manifest', 'agent'],
      ['manifest agent'],
      'Emit agent tool projection.',
      ['agentspace manifest agent', 'agentspace manifest agent --help'],
      ['Emit agent-oriented tool descriptor list derived from DCM docs, aliases, routes, and policy.'],
    ),
    createSimple(
      'manifest.cli',
      'agentspace manifest cli',
      ['agentspace', 'manifest', 'cli'],
      ['manifest cli'],
      'Emit derived CLI projection.',
      ['agentspace manifest cli', 'agentspace manifest cli --help'],
      ['Emit the derived CLI projection used by standalone help and manifest show/get browse flows.'],
    ),
    createSimple(
      'manifest.host-registration',
      'agentspace manifest host-registration',
      ['agentspace', 'manifest', 'host-registration'],
      ['manifest host-registration', 'manifest hrm'],
      'Emit host registration payload.',
      ['agentspace manifest host-registration', 'agentspace manifest host-registration --help'],
      ['Emit installed-host registration payload. HRM is runtime registration metadata only; it is not a second capability source.'],
    ),
    createSimple(
      'manifest.ops',
      'agentspace manifest ops',
      ['agentspace', 'manifest', 'ops'],
      ['manifest ops', 'manifest operations'],
      'Emit shared operation spec list.',
      ['agentspace manifest ops', 'agentspace manifest ops --help'],
      ['Emit the shared resolved operation spec list that powers tooling and CLI projection.'],
    ),
    createSimple(
      'manifest.get',
      'agentspace manifest get',
      ['agentspace', 'manifest', 'get'],
      ['manifest get'],
      'Extract raw JSON from a manifest artifact.',
      [
        'agentspace manifest get <artifact>',
        'agentspace manifest get <artifact> --path <dot.path>',
        'agentspace manifest get dcm --path docs.operations.project.list-projects',
        'agentspace manifest get cli --path commandsById.project.list-projects',
      ],
      ['Print raw JSON from a selected manifest artifact or sub-path.'],
    ),
    createSimple(
      'manifest.show',
      'agentspace manifest show',
      ['agentspace', 'manifest', 'show'],
      ['manifest show'],
      'Render a manifest artifact as text.',
      [
        'agentspace manifest show <artifact>',
        'agentspace manifest show <artifact> --path <dot.path>',
        'agentspace manifest show hrm',
        'agentspace manifest show dcm --path docs.operations.project.list-projects',
      ],
      ['Render a selected manifest artifact or sub-path as human-readable text.'],
    ),
  ]
}

function buildToolsCommandDescriptor(): AgentspaceCliCommandDescriptor {
  const sections: AgentspaceCliHelpSection[] = []
  appendSection(sections, 'Usage', ['agentspace tools', 'agentspace tools --help'])
  appendSection(sections, 'Purpose', [
    'List Agentspace tool descriptors used by AOPS and agent discovery.',
    'Each item includes tool id, aliases, summary, notes, examples, policy, route, and schema refs.',
  ])
  return createCommandDescriptor({
    id: 'tools',
    kind: 'static',
    title: 'agentspace tools',
    command: ['agentspace', 'tools'],
    aliases: ['tools'],
    summary: 'List agent-facing Agentspace tool descriptors.',
    sections,
  })
}

function buildOpsCommandDescriptor(): AgentspaceCliCommandDescriptor {
  const sections: AgentspaceCliHelpSection[] = []
  appendSection(sections, 'Usage', ['agentspace ops', 'agentspace ops --help'])
  appendSection(sections, 'Purpose', [
    'List canonical Agentspace operation specs resolved from the shared contract surface.',
  ])
  return createCommandDescriptor({
    id: 'ops',
    kind: 'static',
    title: 'agentspace ops',
    command: ['agentspace', 'ops'],
    aliases: ['ops'],
    summary: 'List canonical Agentspace operation specs.',
    sections,
  })
}

function buildToolCommandDescriptor(): AgentspaceCliCommandDescriptor {
  const sections: AgentspaceCliHelpSection[] = []
  appendSection(sections, 'Usage', [
    'agentspace tool --id <tool-or-operation-id> --input <json|@file>',
    'agentspace tool --id agentspace.project.list-projects --help',
    'agentspace tool --help',
  ])
  appendSection(sections, 'Purpose', [
    'Invoke the exact canonical contract with an explicit JSON input payload.',
  ])
  appendSection(sections, 'Options', [
    '--id <tool-or-operation-id>  Accepts tool id, local alias, or operation id',
    '--input <json|@file>  Exact operation input payload as inline JSON or @file',
    ...buildCommonRuntimeHelpRows(),
  ])
  return createCommandDescriptor({
    id: 'tool',
    kind: 'static',
    title: 'agentspace tool',
    command: ['agentspace', 'tool'],
    aliases: ['tool', 'invoke'],
    summary: 'Invoke canonical Agentspace operations by explicit JSON input.',
    sections,
  })
}

function buildOpCommandDescriptor(): AgentspaceCliCommandDescriptor {
  const sections: AgentspaceCliHelpSection[] = []
  appendSection(sections, 'Usage', [
    'agentspace op <operation-or-tool-id> [--input <json|@file>] [--arg value]',
    'agentspace op agentspace.project.list-projects --help',
    'agentspace op --help',
  ])
  appendSection(sections, 'Purpose', [
    'Invoke canonical operations directly by operation id or tool id.',
    'Project-scoped operations should receive either explicit project input or --project-id context.',
  ])
  appendSection(sections, 'Options', [
    '--input <json|@file>  Exact operation input payload',
    'Or provide generated flags that match operation args such as --project-id or --filter',
    ...buildCommonRuntimeHelpRows(),
  ])
  return createCommandDescriptor({
    id: 'op',
    kind: 'static',
    title: 'agentspace op',
    command: ['agentspace', 'op'],
    aliases: ['op', 'operation', 'run'],
    summary: 'Invoke canonical Agentspace operations directly.',
    sections,
  })
}

function buildVersionCommandDescriptor(): AgentspaceCliCommandDescriptor {
  const sections: AgentspaceCliHelpSection[] = []
  appendSection(sections, 'Usage', ['agentspace --version', 'agentspace version'])
  appendSection(sections, 'Purpose', ['Print the installed @aopslab/domain-cli-agentspace package version and exit.'])
  return createCommandDescriptor({
    id: 'version',
    kind: 'static',
    title: 'agentspace version',
    command: ['agentspace', 'version'],
    aliases: ['version', '--version'],
    summary: 'Print the installed CLI package version.',
    sections,
  })
}

function buildOperationCommandDescriptor(
  spec: AgentspaceOperationSpec,
  manifest: AgentspaceDomainCapabilityManifest,
  routeMap: ReadonlyMap<string, AgentspaceHostRouteProjectionEntry>,
): AgentspaceCliCommandDescriptor {
  const normalizedOperationId = normalizeOperationId(spec.operationId)
  const fullOperationId = toGatewayToolId(normalizedOperationId)
  const localFallbackToolId = toLocalFallbackToolId(normalizedOperationId)
  const operationRef = toOperationRefMap(manifest).get(normalizedOperationId)
  const operationDoc = getOperationDocRecord(manifest, spec)
  const route = routeMap.get(normalizedOperationId)
  const tags = mergeStringLists(spec.tags, toStringList(operationDoc.tags))
  const examples = mergeStringLists(spec.examples, toStringList(operationDoc.examples)).slice(0, 3)
  const notes = toStringList(operationDoc.notes)
  const preconditions = toStringList(operationDoc.preconditions)
  const postconditions = toStringList(operationDoc.postconditions)
  const antiPatterns = toStringList(operationDoc.antiPatterns)
  const summary =
    normalizeNonEmptyString(operationDoc.summary)
    ?? normalizeNonEmptyString(spec.summary)
    ?? normalizeNonEmptyString(route?.summary)
    ?? fullOperationId
  const generated = buildGeneratedCommandForms(normalizedOperationId)

  const sections: AgentspaceCliHelpSection[] = []
  appendSection(sections, 'Summary', [summary])
  appendSection(sections, 'Identity', [
    `operation: ${fullOperationId}`,
    `tool id: ${fullOperationId}`,
    `local alias: ${localFallbackToolId}`,
    ...(tags.length > 0 ? [`tags: ${tags.join(', ')}`] : []),
  ])
  appendSection(sections, 'Usage', [
    `${generated.command.join(' ')} [--flags] [--help]`,
    `agentspace op ${fullOperationId} [--input <json|@file>] [--arg value] [--help]`,
    `agentspace tool --id ${fullOperationId} --input <json|@file> [--help]`,
  ])
  if (route) {
    appendSection(sections, 'Host Route', [`${route.method} ${route.pattern}`])
  }
  appendSection(sections, 'Arguments', [
    ...buildOperationArgRows(spec),
    ...buildCommonRuntimeHelpRows(),
  ])
  appendSection(sections, 'Examples', examples.length > 0 ? examples : [`${generated.command.join(' ')} [--flags]`])
  appendSection(sections, 'Notes', [...notes, ...preconditions, ...postconditions, ...antiPatterns])
  appendSection(sections, 'Schema Refs', [
    ...(normalizeNonEmptyString(operationRef?.inputSchemaRef) ? [`input: ${operationRef?.inputSchemaRef}`] : []),
    ...(normalizeNonEmptyString(operationRef?.outputSchemaRef) ? [`output: ${operationRef?.outputSchemaRef}`] : []),
  ])
  appendSection(sections, 'Source', [
    'Generated from Agentspace DCM docs, shared contract args/examples, and host route projection.',
  ])

  return createCommandDescriptor({
    id: normalizedOperationId,
    kind: 'operation',
    title: generated.command.join(' '),
    command: generated.command,
    aliases: [
      normalizedOperationId,
      fullOperationId,
      localFallbackToolId,
      ...buildAliases(spec),
      ...generated.aliases,
    ],
    summary,
    operationId: fullOperationId,
    toolId: fullOperationId,
    localToolId: localFallbackToolId,
    sections,
  })
}

export function buildAgentspaceCliProjection(options?: { refresh?: boolean }): AgentspaceCliProjection {
  const manifest = buildAgentspaceDomainCapabilityManifest({ includeDocs: true, refresh: options?.refresh })
  const routeMap = toRouteMap(buildAgentspaceHostRouteProjection({ refresh: options?.refresh }))
  const commands: AgentspaceCliCommandDescriptor[] = [
    buildRootCommandDescriptor(),
    buildVersionCommandDescriptor(),
    buildToolsCommandDescriptor(),
    buildOpsCommandDescriptor(),
    buildToolCommandDescriptor(),
    buildOpCommandDescriptor(),
    ...buildManifestCommandDescriptors(),
    ...listAgentspaceToolingOperations(options).map((spec) => buildOperationCommandDescriptor(spec, manifest, routeMap)),
  ]
  const commandsById = Object.fromEntries(commands.map((command) => [command.id, command]))

  return {
    kind: 'agentspace-cli-projection',
    version: 'v1',
    domain: 'agentspace',
    generatedAt: new Date().toISOString(),
    sourceOfTruth: {
      canonical: 'dcm',
      notes: [
        'DCM is the canonical capability source.',
        'CLI/help is a derived projection built from DCM docs, contract args/examples, and host routes.',
        'HRM is runtime registration metadata only; it is not a second capability source.',
      ],
    },
    artifacts: AGENTSPACE_MANIFEST_ARTIFACTS.map((artifact) => ({ ...artifact })),
    commands,
    commandsById,
  }
}
