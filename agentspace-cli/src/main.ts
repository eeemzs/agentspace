#!/usr/bin/env node
import { config as dotenvConfig } from 'dotenv'
import { DEFAULT_TENANT_AS_UUID_STRING } from '@aopslab/xf-core'
import {
  buildAgentspaceAgentManifest,
  buildAgentspaceCliProjection,
  buildAgentspaceDomainCapabilityManifest,
  buildAgentspaceHostRouteProjection,
  getAgentspaceOperationSpecById,
  listAgentspaceToolingOperations,
  listAgentspaceToolingTools,
  resolveAgentspaceOperationIdByToolId,
  runAgentspaceOperationById as runAgentspaceOperationByIdFromTooling,
  runAgentspaceToolById as runAgentspaceToolByIdFromTooling,
  type AgentspaceCliCommandDescriptor,
  type AgentspaceCliManifestArtifact,
  type AgentspaceCliProjection,
} from '@aopslab/domain-tooling-agentspace'
import { createAgentspacePlugin } from '@aopslab/domain-host-plugin-agentspace'
import type { DomainRequest, DomainRouteManifestEntry } from '@aopslab/domain-host-plugin-agentspace'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildAgentspaceHostRegistrationManifest } from './host-registration.js'
import {
  ensureAgentspaceSqliteSchemaReady,
  getDefaultAgentspaceSqliteRepoUrl,
  isSqliteRepoUrl,
} from './sqlite-bootstrap.js'

type OptionValue = boolean | string | string[]

type ParsedArgv = {
  positionals: string[]
  options: Record<string, OptionValue>
}

type RuntimeContext = {
  tenantId: string
  workspaceId?: string
}

type AgentspaceOperationSpec = ReturnType<typeof listAgentspaceToolingOperations>[number]
type AgentspaceExecutionMode = 'host' | 'tooling'
type AgentspaceHostRuntime = {
  plugin: ReturnType<typeof createAgentspacePlugin>
  routesByOperationId: ReadonlyMap<string, DomainRouteManifestEntry>
}

const cliRoot = fileURLToPath(new URL('../', import.meta.url))
const envPaths = [
  resolve(cliRoot, '..', '.env'),
  resolve(cliRoot, '..', '..', '..', 'apps', 'aops', '.env'),
]
const DIRECT_OPERATION_COMMANDS = new Set(['op', 'operation', 'run'])
const RESERVED_NON_OPERATION_COMMANDS = new Set(['help', 'tools', 'ops', 'manifest', 'tool', 'invoke', 'version'])
const GENERATED_OPERATION_JSON_ARGS = new Set(['input', 'data', 'patch', 'filter', 'options', 'config', 'rule'])

let agentspaceHostRuntimePromise: Promise<AgentspaceHostRuntime> | null = null
let agentspaceCliPackageVersionCache: string | null = null

for (const envPath of envPaths) {
  if (existsSync(envPath)) {
    dotenvConfig({ path: envPath, override: false, quiet: true })
  }
}

function normalizeOptionKey(raw: string): string {
  return raw.trim().replace(/^--+/, '').toLowerCase()
}

function pushOptionValue(target: Record<string, OptionValue>, key: string, value: OptionValue): void {
  const existing = target[key]
  if (existing === undefined) {
    target[key] = value
    return
  }
  if (Array.isArray(existing)) {
    existing.push(String(value))
    target[key] = existing
    return
  }
  target[key] = [String(existing), String(value)]
}

function parseArgv(argv: string[]): ParsedArgv {
  const positionals: string[] = []
  const options: Record<string, OptionValue> = {}

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index]
    if (token === '--') continue

    if (!token.startsWith('--')) {
      positionals.push(token)
      continue
    }

    const eqAt = token.indexOf('=')
    if (eqAt > -1) {
      const key = normalizeOptionKey(token.slice(0, eqAt))
      const value = token.slice(eqAt + 1)
      pushOptionValue(options, key, value)
      continue
    }

    const key = normalizeOptionKey(token)
    const next = argv[index + 1]
    if (!next || next.startsWith('--')) {
      pushOptionValue(options, key, true)
      continue
    }
    pushOptionValue(options, key, next)
    index += 1
  }

  return { positionals, options }
}

function getOptionValue(parsed: ParsedArgv, key: string): OptionValue | undefined {
  return parsed.options[key]
}

function getStringOption(parsed: ParsedArgv, key: string): string | undefined {
  const value = getOptionValue(parsed, key)
  if (Array.isArray(value)) {
    const last = value[value.length - 1]
    return String(last).trim() || undefined
  }
  if (value === undefined || value === null || value === true || value === false) return undefined
  const normalized = String(value).trim()
  return normalized.length > 0 ? normalized : undefined
}

function getBooleanFromString(value: string, fallback: boolean): boolean {
  const normalized = String(value).trim().toLowerCase()
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false
  return fallback
}

function getBooleanOption(parsed: ParsedArgv, key: string, fallback = false): boolean {
  const value = getOptionValue(parsed, key)
  if (value === undefined) return fallback
  if (Array.isArray(value)) return getBooleanFromString(value[value.length - 1], fallback)
  if (typeof value === 'boolean') return value
  return getBooleanFromString(value, fallback)
}

function parseJsonInput(raw: unknown, label: string): unknown {
  if (raw === undefined || raw === null) return undefined
  if (typeof raw !== 'string') return raw
  const trimmed = raw.trim()
  if (!trimmed) return undefined
  if (trimmed.startsWith('@')) {
    const filePath = trimmed.slice(1).trim()
    if (!filePath) throw new Error(`invalid_json_${label}`)
    const content = readFileSync(filePath, 'utf8')
    return JSON.parse(content)
  }
  return JSON.parse(trimmed)
}

function normalizeOperationIdentifier(raw: string): string {
  const normalized = raw
    .trim()
    .toLowerCase()
    .replace(/^\/+/, '')
    .replace(/^operations\//, '')
    .replace(/^api\/agentspace\/operations\//, '')
    .replace(/\//g, '.')
    .replace(/\.+/g, '.')
  if (!normalized) return normalized
  return normalized.startsWith('agentspace.') ? normalized : `agentspace.${normalized}`
}

function toKebabCase(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[_\s.]+/g, '-')
    .toLowerCase()
}

function toOptionKeyCandidatesFromArgName(argName: string): string[] {
  const kebab = toKebabCase(argName)
  const compact = kebab.replace(/-/g, '')
  const lowered = argName.toLowerCase()
  return [...new Set([kebab, compact, lowered])]
}

function getOptionValueByAnyKey(parsed: ParsedArgv, keys: string[]): OptionValue | undefined {
  for (const key of keys) {
    const value = getOptionValue(parsed, key)
    if (value !== undefined) return value
  }
  return undefined
}

function splitCsvStrings(values: string[]): string[] {
  return values
    .flatMap((value) => value.split(','))
    .map((value) => value.trim())
    .filter(Boolean)
}

function tryParseBooleanToken(value: string): boolean | undefined {
  const normalized = value.trim().toLowerCase()
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false
  return undefined
}

function shouldTreatAsArrayArg(argName: string): boolean {
  return argName.endsWith('Ids') || argName.endsWith('Paths') || argName.endsWith('tags')
}

function coerceOperationArgValue(raw: OptionValue, argName: string): unknown {
  if (typeof raw === 'boolean') return raw

  const argKey = argName.trim().toLowerCase()
  const asArray = Array.isArray(raw) ? raw.map((item) => String(item)) : null
  if (asArray) {
    if (shouldTreatAsArrayArg(argName)) return splitCsvStrings(asArray)
    if (GENERATED_OPERATION_JSON_ARGS.has(argKey) && asArray.length > 0) {
      return parseJsonInput(asArray[asArray.length - 1], argName)
    }
    return asArray.map((item) => {
      const boolValue = tryParseBooleanToken(item)
      return boolValue ?? item
    })
  }

  const value = String(raw).trim()
  if (!value) return value
  if (GENERATED_OPERATION_JSON_ARGS.has(argKey)) {
    return parseJsonInput(value, argName)
  }
  if (shouldTreatAsArrayArg(argName)) {
    return splitCsvStrings([value])
  }
  const boolValue = tryParseBooleanToken(value)
  if (boolValue !== undefined) return boolValue
  return value
}

function resolveOperationIdentifier(
  rawIdentifier: string,
  operationMap: ReadonlyMap<string, AgentspaceOperationSpec>,
): string | null {
  const resolvedByToolId = resolveAgentspaceOperationIdByToolId(rawIdentifier, { refresh: true })
  if (resolvedByToolId) {
    const normalizedByToolId = normalizeOperationIdentifier(resolvedByToolId)
    if (operationMap.has(normalizedByToolId)) return normalizedByToolId
  }

  const normalized = normalizeOperationIdentifier(rawIdentifier)
  if (normalized && operationMap.has(normalized)) return normalized

  const spec = getAgentspaceOperationSpecById(rawIdentifier, { refresh: true })
  if (!spec) return null
  const normalizedFromSpec = normalizeOperationIdentifier(spec.operationId)
  return operationMap.has(normalizedFromSpec) ? normalizedFromSpec : null
}

function resolveGeneratedOperationId(
  parsed: ParsedArgv,
  operationMap: ReadonlyMap<string, AgentspaceOperationSpec>,
): string | null {
  const command = parsed.positionals[0]?.toLowerCase()
  const subcommand = parsed.positionals[1]?.toLowerCase()
  const third = parsed.positionals[2]?.toLowerCase()
  const fourth = parsed.positionals[3]?.toLowerCase()
  if (!command) return null

  if (DIRECT_OPERATION_COMMANDS.has(command)) {
    const identifier = parsed.positionals[1] ?? getStringOption(parsed, 'id') ?? getStringOption(parsed, 'operation-id')
    if (!identifier) throw new Error('missing_required_option:<operation-id-or-tool-id>')
    const resolved = resolveOperationIdentifier(identifier, operationMap)
    if (!resolved) throw new Error(`unknown_agentspace_operation_identifier:${identifier}`)
    return resolved
  }

  if (RESERVED_NON_OPERATION_COMMANDS.has(command)) return null

  if (command.includes('.')) {
    const direct = resolveOperationIdentifier(command, operationMap)
    if (direct) return direct
  }

  if (subcommand && third) {
    const threeToken = normalizeOperationIdentifier(`${command}-${subcommand}.${third}`)
    if (operationMap.has(threeToken)) return threeToken

    if (fourth) {
      const fourToken = normalizeOperationIdentifier(`${command}-${subcommand}-${third}.${fourth}`)
      if (operationMap.has(fourToken)) return fourToken
    }
  }

  if (subcommand) {
    const nested = normalizeOperationIdentifier(`${command}.${subcommand}`)
    if (operationMap.has(nested)) return nested
  }

  const topLevel = normalizeOperationIdentifier(command)
  if (operationMap.has(topLevel)) return topLevel

  return null
}

function buildGeneratedOperationInput(
  operation: AgentspaceOperationSpec,
  parsed: ParsedArgv,
  runtime: RuntimeContext,
): Record<string, unknown> {
  const explicitInput = parseJsonInput(getStringOption(parsed, 'input'), 'input')
  if (explicitInput !== undefined) {
    if (!explicitInput || typeof explicitInput !== 'object' || Array.isArray(explicitInput)) {
      throw new Error('invalid_json_input:expected_object')
    }
    return explicitInput as Record<string, unknown>
  }

  const input: Record<string, unknown> = {}
  for (const arg of operation.args) {
    const rawValue = getOptionValueByAnyKey(parsed, toOptionKeyCandidatesFromArgName(arg.name))
    if (rawValue === undefined) {
      if (arg.name === 'workspaceId' && runtime.workspaceId) {
        input.workspaceId = runtime.workspaceId
        continue
      }
      if (!arg.optional) {
        throw new Error(`missing_required_option:--${toKebabCase(arg.name)}`)
      }
      continue
    }
    input[arg.name] = coerceOperationArgValue(rawValue, arg.name)
  }
  return input
}

function printJson(value: unknown): void {
  process.stdout.write(`${JSON.stringify(value === undefined ? null : value, null, 2)}\n`)
}

function resolveCliPackageVersion(): string {
  if (agentspaceCliPackageVersionCache) return agentspaceCliPackageVersionCache
  const packageJsonPath = resolve(cliRoot, 'package.json')
  const parsed = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as { version?: unknown }
  agentspaceCliPackageVersionCache =
    typeof parsed.version === 'string' && parsed.version.trim().length > 0
      ? parsed.version.trim()
      : '0.0.0'
  return agentspaceCliPackageVersionCache
}

function printVersion(): void {
  process.stdout.write(`${resolveCliPackageVersion()}\n`)
}

function printHelpLines(lines: string[]): void {
  process.stdout.write(`${lines.join('\n')}\n`)
}

function appendTextSection(target: string[], title: string, lines: string[]): void {
  const normalized = lines.map((line) => String(line ?? '').trimEnd()).filter(Boolean)
  if (normalized.length === 0) return
  if (target.length > 0 && target[target.length - 1] !== '') target.push('')
  target.push(`${title}:`)
  for (const line of normalized) {
    target.push(`  ${line}`)
  }
}

function renderCommandDescriptor(descriptor: AgentspaceCliCommandDescriptor): string[] {
  const lines = [descriptor.title]
  for (const section of descriptor.sections) {
    appendTextSection(lines, section.title, section.lines)
  }
  return lines
}

function findCommandDescriptorById(
  projection: AgentspaceCliProjection,
  id: string,
): AgentspaceCliCommandDescriptor | null {
  return projection.commandsById[id] ?? null
}

async function buildCliProjection(): Promise<AgentspaceCliProjection> {
  return buildAgentspaceCliProjection({ refresh: true })
}

function toProjectionOperationId(operationId: string): string {
  return normalizeOperationIdentifier(operationId).replace(/^agentspace\./, '')
}

function normalizeManifestHelpSubcommand(subcommand: string | undefined): string | undefined {
  if (!subcommand) return undefined
  if (subcommand === 'hrm') return 'host-registration'
  if (subcommand === 'operations') return 'ops'
  return subcommand
}

async function printHelp(): Promise<void> {
  const projection = await buildCliProjection()
  const descriptor = findCommandDescriptorById(projection, 'agentspace')
  if (!descriptor) throw new Error('missing_cli_help_root')
  printHelpLines(renderCommandDescriptor(descriptor))
}

async function tryPrintCommandHelp(parsed: ParsedArgv): Promise<boolean> {
  const command = parsed.positionals[0]?.toLowerCase()
  const subcommand = normalizeManifestHelpSubcommand(parsed.positionals[1]?.toLowerCase())
  if (!command) return false

  const projection = await buildCliProjection()
  const renderDescriptor = (id: string, trailingMessage?: string): boolean => {
    const descriptor = findCommandDescriptorById(projection, id)
    if (!descriptor) return false
    const lines = renderCommandDescriptor(descriptor)
    if (trailingMessage) lines.push('', trailingMessage)
    printHelpLines(lines)
    return true
  }

  if (command === 'version') return renderDescriptor('version')
  if (command === 'manifest') {
    if (!subcommand) return renderDescriptor('manifest')
    if (subcommand === 'get') return renderDescriptor('manifest.get')
    if (subcommand === 'show') return renderDescriptor('manifest.show')
    if (subcommand === 'dcm') return renderDescriptor('manifest.dcm')
    if (subcommand === 'routes') return renderDescriptor('manifest.routes')
    if (subcommand === 'agent') return renderDescriptor('manifest.agent')
    if (subcommand === 'cli') return renderDescriptor('manifest.cli')
    if (subcommand === 'host-registration') return renderDescriptor('manifest.host-registration')
    if (subcommand === 'ops') return renderDescriptor('manifest.ops')
    return renderDescriptor('manifest')
  }
  if (command === 'tools') return renderDescriptor('tools')
  if (command === 'ops') return renderDescriptor('ops')
  if (command === 'tool' || command === 'invoke') {
    const identifier = getStringOption(parsed, 'id') ?? getStringOption(parsed, 'tool-id') ?? parsed.positionals[1]
    if (!identifier) return renderDescriptor('tool')
    const spec = getAgentspaceOperationSpecById(identifier, { refresh: true })
    if (!spec) return renderDescriptor('tool', `Unknown tool or operation id: ${identifier}`)
    return renderDescriptor(toProjectionOperationId(spec.operationId))
  }
  if (DIRECT_OPERATION_COMMANDS.has(command)) {
    const identifier = parsed.positionals[1] ?? getStringOption(parsed, 'id') ?? getStringOption(parsed, 'operation-id')
    if (!identifier) return renderDescriptor('op')
    const spec = getAgentspaceOperationSpecById(identifier, { refresh: true })
    if (!spec) return renderDescriptor('op', `Unknown operation or tool id: ${identifier}`)
    return renderDescriptor(toProjectionOperationId(spec.operationId))
  }

  const operationMap = new Map(
    listAgentspaceToolingOperations({ refresh: true }).map((operation) => [
      normalizeOperationIdentifier(operation.operationId),
      operation,
    ]),
  )
  const resolvedOperationId = resolveGeneratedOperationId(parsed, operationMap)
  if (resolvedOperationId) {
    return renderDescriptor(toProjectionOperationId(resolvedOperationId))
  }
  return false
}

type AgentspaceManifestPayloads = {
  dcm: unknown
  routes: unknown
  agent: unknown
  cli: AgentspaceCliProjection
  hostRegistration: ReturnType<typeof buildAgentspaceHostRegistrationManifest>
  operations: unknown
}

async function buildManifestPayloads(): Promise<AgentspaceManifestPayloads> {
  return {
    dcm: buildAgentspaceDomainCapabilityManifest({ includeDocs: true, refresh: true }),
    routes: buildAgentspaceHostRouteProjection({ refresh: true }),
    agent: buildAgentspaceAgentManifest({ refresh: true }),
    cli: buildAgentspaceCliProjection({ refresh: true }),
    hostRegistration: buildAgentspaceHostRegistrationManifest(),
    operations: listAgentspaceToolingOperations({ refresh: true }),
  }
}

function resolveManifestArtifactId(
  identifier: string,
  projection: AgentspaceCliProjection,
): AgentspaceCliManifestArtifact['id'] | null {
  const normalized = normalizeNonEmptyString(identifier)?.toLowerCase() ?? ''
  for (const artifact of projection.artifacts) {
    if (artifact.id === normalized) return artifact.id
    for (const alias of artifact.aliases ?? []) {
      if ((normalizeNonEmptyString(alias)?.toLowerCase() ?? '') === normalized) return artifact.id
    }
  }
  return null
}

function getManifestArtifactValue(
  payloads: AgentspaceManifestPayloads,
  artifactId: AgentspaceCliManifestArtifact['id'],
): unknown {
  if (artifactId === 'dcm') return payloads.dcm
  if (artifactId === 'routes') return payloads.routes
  if (artifactId === 'agent') return payloads.agent
  if (artifactId === 'cli') return payloads.cli
  if (artifactId === 'host-registration') return payloads.hostRegistration
  return payloads.operations
}

function tokenizeManifestPath(rawPath: string): string[] {
  return rawPath
    .replace(/\[(\d+)\]/g, '.$1')
    .split('.')
    .map((segment) => segment.trim())
    .filter(Boolean)
}

function resolveManifestPathValue(
  root: unknown,
  rawPath: string | undefined,
): { found: boolean; value: unknown } {
  if (!rawPath) return { found: true, value: root }
  const segments = tokenizeManifestPath(rawPath)
  let current: unknown = root
  let index = 0

  while (index < segments.length) {
    const segment = segments[index]
    if (Array.isArray(current)) {
      const numericIndex = Number(segment)
      if (!Number.isInteger(numericIndex) || numericIndex < 0 || numericIndex >= current.length) {
        return { found: false, value: null }
      }
      current = current[numericIndex]
      index += 1
      continue
    }
    if (!current || typeof current !== 'object') return { found: false, value: null }
    const record = current as Record<string, unknown>
    let matched = false
    for (let end = segments.length; end > index; end -= 1) {
      const composite = segments.slice(index, end).join('.')
      if (!Object.prototype.hasOwnProperty.call(record, composite)) continue
      current = record[composite]
      index = end
      matched = true
      break
    }
    if (matched) continue
    if (!Object.prototype.hasOwnProperty.call(record, segment)) return { found: false, value: null }
    current = record[segment]
    index += 1
  }
  return { found: true, value: current }
}

function renderManifestScalar(value: unknown): string {
  if (value === null) return 'null'
  if (value === undefined) return 'undefined'
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return JSON.stringify(value)
}

function renderManifestValueLines(value: unknown, indent = ''): string[] {
  if (
    value === null ||
    value === undefined ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return [`${indent}${renderManifestScalar(value)}`]
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return [`${indent}[]`]
    const lines: string[] = []
    for (const item of value) {
      if (
        item === null ||
        item === undefined ||
        typeof item === 'string' ||
        typeof item === 'number' ||
        typeof item === 'boolean'
      ) {
        lines.push(`${indent}- ${renderManifestScalar(item)}`)
        continue
      }
      lines.push(`${indent}-`)
      lines.push(...renderManifestValueLines(item, `${indent}  `))
    }
    return lines
  }
  const record = value as Record<string, unknown>
  const keys = Object.keys(record).sort()
  if (keys.length === 0) return [`${indent}{}`]
  const lines: string[] = []
  for (const key of keys) {
    const entry = record[key]
    if (
      entry === null ||
      entry === undefined ||
      typeof entry === 'string' ||
      typeof entry === 'number' ||
      typeof entry === 'boolean'
    ) {
      lines.push(`${indent}${key}: ${renderManifestScalar(entry)}`)
      continue
    }
    lines.push(`${indent}${key}:`)
    lines.push(...renderManifestValueLines(entry, `${indent}  `))
  }
  return lines
}

function buildManifestShowLines(
  artifactId: AgentspaceCliManifestArtifact['id'],
  value: unknown,
  rawPath?: string,
): string[] {
  const title = `agentspace manifest show ${artifactId}${rawPath ? ` --path ${rawPath}` : ''}`
  if (rawPath) {
    const lines = [title]
    appendTextSection(lines, 'Value', renderManifestValueLines(value))
    return lines
  }
  if (artifactId === 'cli') {
    const projection = value as AgentspaceCliProjection
    const commands = Array.isArray(projection.commands) ? projection.commands : []
    const lines = [title]
    appendTextSection(lines, 'Identity', [
      `kind: ${projection.kind}`,
      `version: ${projection.version}`,
      `domain: ${projection.domain}`,
    ])
    appendTextSection(lines, 'Counts', [
      `commands: ${commands.length}`,
      `artifacts: ${projection.artifacts.length}`,
    ])
    appendTextSection(lines, 'Source of Truth', projection.sourceOfTruth.notes)
    appendTextSection(lines, 'Browse', [
      'agentspace manifest get cli --path commandsById.tool',
      'agentspace manifest get cli --path commandsById.workspace.list-workspaces',
      'agentspace manifest show cli --path commandsById.workspace.list-workspaces',
    ])
    appendTextSection(lines, 'Commands', commands.map((command: AgentspaceCliCommandDescriptor) => {
      const summary = normalizeNonEmptyString(command.summary)
      return summary ? `${command.id}  ${summary}` : command.id
    }))
    return lines
  }
  if (artifactId === 'host-registration') {
    const manifest =
      value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
    const lines = [title]
    appendTextSection(lines, 'Identity', [
      `domainId: ${renderManifestScalar(manifest.domainId)}`,
      `packageName: ${renderManifestScalar(manifest.packageName)}`,
      `binary: ${renderManifestScalar(manifest.binary)}`,
    ])
    appendTextSection(lines, 'Notes', [
      'HRM is runtime registration metadata only; it is not a second capability source.',
    ])
    return lines
  }
  const lines = [title]
  appendTextSection(lines, 'Value', renderManifestValueLines(value))
  return lines
}

function normalizeNonEmptyString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const normalized = value.trim()
  return normalized.length > 0 ? normalized : undefined
}

function toRecord(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {}
  return input as Record<string, unknown>
}

function resolveExecutionMode(): AgentspaceExecutionMode {
  const configured = normalizeNonEmptyString(process.env.AGENTSPACE_CLI_EXECUTION_MODE)?.toLowerCase()
  if (configured === 'tooling') return 'tooling'
  return 'host'
}

function buildHostRequestContext(): DomainRequest['context'] {
  const workspaceId = normalizeNonEmptyString(process.env.AGENTSPACE_WORKSPACE_ID)
  return {
    tenantId: normalizeNonEmptyString(process.env.TENANT_ID) ?? DEFAULT_TENANT_AS_UUID_STRING,
    ...(workspaceId ? { workspaceId } : {}),
    locale: normalizeNonEmptyString(process.env.AGENTSPACE_LOCALE) ?? 'tr',
    fallbackLocale: normalizeNonEmptyString(process.env.AGENTSPACE_FALLBACK_LOCALE) ?? 'en',
    principal: null,
  }
}

function patternToPathSegments(pattern: string, params: Record<string, string>): string[] {
  const raw = pattern.trim().replace(/^\/+|\/+$/g, '')
  if (!raw) return []
  const output: string[] = []
  const segments = raw.split('/').map((segment) => segment.trim()).filter(Boolean)
  for (const patternSegment of segments) {
    if (patternSegment === '*') {
      const splat = normalizeNonEmptyString(params.splat)
      if (!splat) continue
      output.push(...splat.split('/').map((part) => encodeURIComponent(part)))
      continue
    }
    if (patternSegment.startsWith(':')) {
      const key = patternSegment.slice(1).trim()
      const value = normalizeNonEmptyString(params[key])
      if (!key || !value) {
        throw new Error(`missing_required_arg:${key || 'path'}`)
      }
      output.push(encodeURIComponent(value))
      continue
    }
    output.push(patternSegment)
  }
  return output
}

function resolveRouteParams(route: DomainRouteManifestEntry, input: unknown): Record<string, string> {
  const inputRecord = toRecord(input)
  const pathParamCandidates = toRecord(inputRecord.pathParams)
  const params: Record<string, string> = {}
  const segments = route.pattern
    .trim()
    .replace(/^\/+|\/+$/g, '')
    .split('/')
    .map((segment) => segment.trim())
    .filter(Boolean)

  for (const segment of segments) {
    if (segment === '*') {
      const splatValue = normalizeNonEmptyString(pathParamCandidates.splat) ?? normalizeNonEmptyString(inputRecord.splat)
      if (splatValue) params.splat = splatValue
      continue
    }
    if (!segment.startsWith(':')) continue
    const key = segment.slice(1).trim()
    if (!key) continue
    const value = normalizeNonEmptyString(pathParamCandidates[key]) ?? normalizeNonEmptyString(inputRecord[key])
    if (!value) {
      throw new Error(`missing_required_arg:${key}`)
    }
    params[key] = value
  }

  return params
}

function buildHostDomainRequest(
  route: DomainRouteManifestEntry,
  pathSegments: string[],
  input: unknown,
): DomainRequest {
  const baseUrl = `https://agentspace-cli.local/api/agentspace${pathSegments.length > 0 ? `/${pathSegments.join('/')}` : ''}`
  return {
    method: route.method,
    domain: 'agentspace',
    path: pathSegments,
    query: new URLSearchParams(),
    body: input,
    headers: new Headers(),
    url: new URL(baseUrl),
    context: buildHostRequestContext(),
  }
}

async function getAgentspaceHostRuntime(): Promise<AgentspaceHostRuntime> {
  if (agentspaceHostRuntimePromise) return agentspaceHostRuntimePromise

  agentspaceHostRuntimePromise = (async () => {
    const plugin = createAgentspacePlugin()
    const routesByOperationId = new Map<string, DomainRouteManifestEntry>()
    for (const route of plugin.manifest.routes) {
      const normalizedOperationId = normalizeOperationIdentifier(route.operation)
      if (!normalizedOperationId) continue
      routesByOperationId.set(normalizedOperationId, route)
    }
    return { plugin, routesByOperationId }
  })()

  return agentspaceHostRuntimePromise
}

function resolveOperationIdFromIdentifier(identifier: string): string | null {
  const normalizedDirect = normalizeOperationIdentifier(identifier)
  const directSpec = getAgentspaceOperationSpecById(normalizedDirect || identifier, { refresh: true })
  if (directSpec) return normalizeOperationIdentifier(directSpec.operationId)

  const resolvedByAlias = resolveAgentspaceOperationIdByToolId(identifier, { refresh: true })
  if (resolvedByAlias) return normalizeOperationIdentifier(resolvedByAlias)

  return null
}

async function runAgentspaceOperationById(operationId: string, input: unknown = {}): Promise<unknown> {
  if (resolveExecutionMode() === 'tooling') {
    return runAgentspaceOperationByIdFromTooling(operationId, input, { refresh: true })
  }

  const runtime = await getAgentspaceHostRuntime()
  const normalizedOperationId = normalizeOperationIdentifier(operationId)
  const route = runtime.routesByOperationId.get(normalizedOperationId)
  if (!route) {
    return runAgentspaceOperationByIdFromTooling(operationId, input, { refresh: true })
  }

  const params = resolveRouteParams(route, input)
  const path = patternToPathSegments(route.pattern, params)
  const request = buildHostDomainRequest(route, path, input)
  return runtime.plugin.execute({
    request,
    match: { route, params },
  })
}

async function runAgentspaceToolById(identifier: string, input: unknown = {}): Promise<unknown> {
  if (resolveExecutionMode() === 'tooling') {
    return runAgentspaceToolByIdFromTooling(identifier, input, { refresh: true })
  }
  const operationId = resolveOperationIdFromIdentifier(identifier)
  if (!operationId) {
    return runAgentspaceToolByIdFromTooling(identifier, input, { refresh: true })
  }
  return runAgentspaceOperationById(operationId, input)
}

function inferDefaultRepoUrl(processEnv: NodeJS.ProcessEnv): string {
  const envFallback =
    normalizeNonEmptyString(processEnv.AGENTSPACE_REPO_URL) ??
    normalizeNonEmptyString(processEnv.AGENTSPACE_SQLITE_URL) ??
    normalizeNonEmptyString(processEnv.AGENTSPACE_PG_URL) ??
    normalizeNonEmptyString(processEnv.AOPS_PG_URL) ??
    normalizeNonEmptyString(processEnv.DEV_PG_URL)
  return envFallback ?? getDefaultAgentspaceSqliteRepoUrl()
}

function buildRuntimeContext(parsed: ParsedArgv): RuntimeContext {
  const executionMode = getStringOption(parsed, 'execution-mode')
  if (executionMode) {
    const normalizedMode = executionMode.trim().toLowerCase()
    if (normalizedMode === 'host' || normalizedMode === 'tooling') {
      process.env.AGENTSPACE_CLI_EXECUTION_MODE = normalizedMode
    } else {
      throw new Error(`invalid_execution_mode:${executionMode}`)
    }
  }

  const repoUrlOption = getStringOption(parsed, 'repo-url')
  const repoUrl = repoUrlOption ? repoUrlOption.trim() : inferDefaultRepoUrl(process.env)

  process.env.AGENTSPACE_REPO_URL = repoUrl
  process.env.AGENTSPACE_SQLITE_URL = isSqliteRepoUrl(repoUrl) ? repoUrl : ''
  process.env.AGENTSPACE_PG_URL = isSqliteRepoUrl(repoUrl) ? '' : repoUrl
  process.env.AOPS_PG_URL = repoUrl
  ensureAgentspaceSqliteSchemaReady(repoUrl)

  if (!normalizeNonEmptyString(process.env.AOPS_PG_URL)) {
    throw new Error('missing_repo_url:empty')
  }

  const tenantId = getStringOption(parsed, 'tenant-id') ?? process.env.TENANT_ID ?? DEFAULT_TENANT_AS_UUID_STRING
  const workspaceId = getStringOption(parsed, 'workspace-id') ?? process.env.AGENTSPACE_WORKSPACE_ID
  const logLevel = getStringOption(parsed, 'log-level')

  process.env.TENANT_ID = tenantId
  if (workspaceId) process.env.AGENTSPACE_WORKSPACE_ID = workspaceId
  if (logLevel) process.env.LOG_LEVEL = logLevel

  return { tenantId, ...(workspaceId ? { workspaceId } : {}) }
}

async function handleManifest(parsed: ParsedArgv): Promise<void> {
  const subcommand = normalizeManifestHelpSubcommand((parsed.positionals[1] ?? 'all').trim().toLowerCase())
  const rawPath = getStringOption(parsed, 'path')
  const payloads = await buildManifestPayloads()
  const projection = payloads.cli

  if (subcommand === 'get') {
    const artifactIdentifier = parsed.positionals[2] ?? getStringOption(parsed, 'artifact')
    if (!artifactIdentifier) throw new Error('missing_manifest_artifact')
    const artifactId = resolveManifestArtifactId(artifactIdentifier, projection)
    if (!artifactId) throw new Error(`invalid_manifest_artifact:${artifactIdentifier}`)
    const resolved = resolveManifestPathValue(getManifestArtifactValue(payloads, artifactId), rawPath)
    if (!resolved.found) throw new Error(`manifest_path_not_found:${artifactId}:${rawPath ?? '<root>'}`)
    printJson(resolved.value)
    return
  }

  if (subcommand === 'show') {
    const artifactIdentifier = parsed.positionals[2] ?? getStringOption(parsed, 'artifact')
    if (!artifactIdentifier) throw new Error('missing_manifest_artifact')
    const artifactId = resolveManifestArtifactId(artifactIdentifier, projection)
    if (!artifactId) throw new Error(`invalid_manifest_artifact:${artifactIdentifier}`)
    const resolved = resolveManifestPathValue(getManifestArtifactValue(payloads, artifactId), rawPath)
    if (!resolved.found) throw new Error(`manifest_path_not_found:${artifactId}:${rawPath ?? '<root>'}`)
    printHelpLines(buildManifestShowLines(artifactId, resolved.value, rawPath))
    return
  }

  if (!subcommand || subcommand === 'all') {
    printJson({
      dcm: payloads.dcm,
      routes: payloads.routes,
      agent: payloads.agent,
      cli: payloads.cli,
      operations: payloads.operations,
      hostRegistration: payloads.hostRegistration,
    })
    return
  }
  if (subcommand === 'dcm') return printJson(payloads.dcm)
  if (subcommand === 'routes') return printJson(payloads.routes)
  if (subcommand === 'agent') return printJson(payloads.agent)
  if (subcommand === 'cli') return printJson(payloads.cli)
  if (subcommand === 'ops') return printJson(payloads.operations)
  if (subcommand === 'host-registration') return printJson(payloads.hostRegistration)
  throw new Error(`unknown_manifest_subcommand:${subcommand}`)
}

async function executeResolvedOperation(
  operationId: string,
  parsed: ParsedArgv,
  runtime: RuntimeContext,
  operationMap: ReadonlyMap<string, AgentspaceOperationSpec>,
): Promise<void> {
  const operation = operationMap.get(operationId) ?? getAgentspaceOperationSpecById(operationId, { refresh: true })
  if (!operation) {
    throw new Error(`unknown_agentspace_operation:${operationId}`)
  }

  const input = buildGeneratedOperationInput(operation, parsed, runtime)
  const output = await runAgentspaceOperationById(operation.operationId, input)
  printJson(output)
}

async function main(): Promise<void> {
  const parsed = parseArgv(process.argv.slice(2))
  const command = parsed.positionals[0]?.toLowerCase()

  if (getBooleanOption(parsed, 'version', false) || command === 'version') {
    printVersion()
    return
  }

  if (!command) {
    await printHelp()
    return
  }

  if (command === 'help') {
    if (parsed.positionals.length <= 1) {
      await printHelp()
      return
    }
    const helpParsed = {
      positionals: parsed.positionals.slice(1),
      options: parsed.options,
    }
    if (await tryPrintCommandHelp(helpParsed)) return
    await printHelp()
    return
  }

  if (getBooleanOption(parsed, 'help', false)) {
    if (await tryPrintCommandHelp(parsed)) return
    await printHelp()
    return
  }

  if (command === 'tools') {
    printJson(listAgentspaceToolingTools({ refresh: true }))
    return
  }

  if (command === 'ops') {
    printJson(listAgentspaceToolingOperations({ refresh: true }))
    return
  }

  if (command === 'manifest') {
    await handleManifest(parsed)
    return
  }

  const operationSpecs = listAgentspaceToolingOperations({ refresh: true })
  const operationMap = new Map(
    operationSpecs.map((operation) => [normalizeOperationIdentifier(operation.operationId), operation]),
  )
  const resolvedOperationId = resolveGeneratedOperationId(parsed, operationMap)

  if (!resolvedOperationId && command && DIRECT_OPERATION_COMMANDS.has(command)) {
    throw new Error(`unknown_operation_command:${command}`)
  }

  if (command === 'tool' || command === 'invoke') {
    buildRuntimeContext(parsed)
    const identifier =
      parsed.positionals[1]
      ?? getStringOption(parsed, 'id')
      ?? getStringOption(parsed, 'tool-id')
    if (!identifier) {
      throw new Error('missing_required_option:--id')
    }
    const input = parseJsonInput(getStringOption(parsed, 'input'), 'input') ?? {}
    const output = await runAgentspaceToolById(identifier, input)
    printJson(output)
    return
  }

  const runtime = buildRuntimeContext(parsed)

  if (resolvedOperationId) {
    await executeResolvedOperation(resolvedOperationId, parsed, runtime, operationMap)
    return
  }

  throw new Error(`unknown_command:${command}`)
}

void main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error)
  process.stderr.write(`${message}\n`)
  process.exitCode = 1
})
