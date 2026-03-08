import type { DomainPlugin, DomainRequest, DomainRouteManifestEntry } from './types.js'
import { Ajv, type AnySchema, type ErrorObject, type ValidateFunction } from 'ajv'
import {
  buildAgentspaceHostRouteProjection,
  getAgentspaceContractSchema,
  getAgentspaceOperationIoSchemaRefs,
  listAgentspaceOperationSpecs,
  mapErrorToFriendly,
  runAgentspaceKitOperationByTypedId,
  type AgentspaceOperationInput,
  type AgentspaceTypedOperationId,
} from '@aopslab/domain-kit-agentspace'
import {
  hasNonEmptyValue,
  isWorkspaceArgName,
  normalizeAgentspaceOperationInputForCompatibility,
  normalizeNonEmpty,
  resolveWorkspaceAliasValue,
  toMissingRequiredArgToken,
  toRecord,
} from '@aopslab/domain-kit-agentspace/shared'
import {
  buildContextScopedInput,
  resolveOperationTimeoutMs,
  runWithOperationTimeout,
  toSafeFailureEnvelope,
} from './lifecycle-guards.js'
import {
  resolveAgentspacePluginOptions,
  type AgentspacePluginOptions,
  type AgentspaceResolvedPluginOptions,
  type AgentspaceRunner,
} from './plugin-config.js'
import { assertRuntimeEnv, resolveMissingRuntimeEnvKeys } from './runtime-env.js'

export type {
  AgentspacePluginOptions,
  AgentspaceRunner,
} from './plugin-config.js'

const HOST_CONTEXT_INPUT_KEYS = new Set([
  'tenantId',
  'workspaceId',
  'workspaceUuid',
  'workspaceUid',
  'workspaceName',
  'locale',
  'fallbackLocale',
])

const DATA_WORKSPACE_FALLBACK_OPERATIONS = new Set<AgentspaceTypedOperationId>([
  'prompt.create',
  'project.create',
  'project-path.create',
  'project-path.upsert-project-path',
])

const inputSchemaValidatorAjv = new Ajv({
  allErrors: true,
  strict: false,
  coerceTypes: false,
  allowUnionTypes: true,
})

type AgentspaceRequiredArg = ReadonlyArray<{ name: string; optional: boolean }>

type AgentspacePluginSetupStatus = 'idle' | 'ready' | 'failed'

type AgentspacePluginState = {
  routes: DomainRouteManifestEntry[]
  requiredArgsByOperationId: Map<AgentspaceTypedOperationId, AgentspaceRequiredArg>
  inputValidatorByOperationId: Map<AgentspaceTypedOperationId, ValidateFunction>
  workspaceInDataRequirementByOperationId: Map<AgentspaceTypedOperationId, boolean>
  projectionRefreshedAt: string
  runtimeEnvVerifiedAt: string | null
  setup: {
    attempts: number
    status: AgentspacePluginSetupStatus
    lastAttemptAt: string | null
    readyAt: string | null
    lastError: string | null
  }
}

const UNSAFE_RUNTIME_MESSAGE_PATTERNS = [
  /failed query:/i,
  /\bparams:\s*\[/i,
  /\binsert into\b/i,
  /\bupdate\b.+\bset\b/i,
  /\bdelete from\b/i,
  /\bselect\b.+\bfrom\b/i,
  /\bsqlite/i,
  /\bpostgres/i,
  /\bdrizzle/i,
]
const RUNTIME_FAILURE_MESSAGE = 'Runtime operation failed. Check server logs for details.'

function buildRoutes(refresh: boolean): DomainRouteManifestEntry[] {
  return buildAgentspaceHostRouteProjection({ refresh }).map((route) => ({
    id: route.id,
    method: route.method,
    pattern: route.pattern,
    operation: route.operation,
    summary: route.summary,
    buildInput: (request, params) => buildInputForOperation(route.operation as AgentspaceTypedOperationId, request, params),
  }))
}

function buildRequiredArgsByOperationId(refresh: boolean): Map<AgentspaceTypedOperationId, AgentspaceRequiredArg> {
  return new Map<AgentspaceTypedOperationId, AgentspaceRequiredArg>(
    listAgentspaceOperationSpecs({ refresh }).map((operation) => [
      operation.operationId as AgentspaceTypedOperationId,
      operation.args,
    ]),
  )
}

function createPluginState(options: AgentspaceResolvedPluginOptions): AgentspacePluginState {
  const refresh = options.refreshProjectionOnCreate
  return {
    routes: buildRoutes(refresh),
    requiredArgsByOperationId: buildRequiredArgsByOperationId(refresh),
    inputValidatorByOperationId: new Map<AgentspaceTypedOperationId, ValidateFunction>(),
    workspaceInDataRequirementByOperationId: new Map<AgentspaceTypedOperationId, boolean>(),
    projectionRefreshedAt: new Date().toISOString(),
    runtimeEnvVerifiedAt: null,
    setup: {
      attempts: 0,
      status: 'idle',
      lastAttemptAt: null,
      readyAt: null,
      lastError: null,
    },
  }
}

function extractErrorMessage(error: unknown): string | null {
  return normalizeNonEmpty(error instanceof Error ? error.message : error) ?? null
}

function ensureRuntimeEnvReady(
  state: AgentspacePluginState,
  requiredRuntimeEnv: string[],
  enforceRuntimeEnv: boolean,
): void {
  if (!enforceRuntimeEnv) return
  if (state.runtimeEnvVerifiedAt) return
  assertRuntimeEnv(requiredRuntimeEnv)
  state.runtimeEnvVerifiedAt = new Date().toISOString()
}

function runPluginSetup(
  state: AgentspacePluginState,
  options: AgentspaceResolvedPluginOptions,
  enforceRuntimeEnv: boolean,
): void {
  state.setup.attempts += 1
  state.setup.lastAttemptAt = new Date().toISOString()

  try {
    ensureRuntimeEnvReady(state, options.requiredRuntimeEnv, enforceRuntimeEnv)
    state.setup.status = 'ready'
    state.setup.readyAt = new Date().toISOString()
    state.setup.lastError = null
  } catch (error) {
    state.setup.status = 'failed'
    state.setup.readyAt = null
    state.setup.lastError = extractErrorMessage(error) ?? 'plugin_setup_failed'
    throw error
  }
}

function isAgentspaceTypedOperationId(
  operationId: string,
  requiredArgsByOperationId: Map<AgentspaceTypedOperationId, AgentspaceRequiredArg>,
): operationId is AgentspaceTypedOperationId {
  return requiredArgsByOperationId.has(operationId as AgentspaceTypedOperationId)
}

function formatSchemaErrors(errors: ErrorObject[] | null | undefined): string {
  if (!errors || errors.length === 0) return 'invalid_input'
  const first = errors[0]
  const path = first.instancePath && first.instancePath.length > 0 ? first.instancePath : '/'
  const message = first.message ?? first.keyword
  return `${path} ${message}`.trim()
}

function resolveInputValidator(state: AgentspacePluginState, operationId: AgentspaceTypedOperationId): ValidateFunction | null {
  const existing = state.inputValidatorByOperationId.get(operationId)
  if (existing) return existing

  const refs = getAgentspaceOperationIoSchemaRefs(operationId)
  const schema = getAgentspaceContractSchema(refs.inputRef)
  if (!schema || typeof schema !== 'object' || Array.isArray(schema)) return null

  const validator = inputSchemaValidatorAjv.compile(schema as AnySchema)
  state.inputValidatorByOperationId.set(operationId, validator)
  return validator
}

function validateInputBySchema(
  state: AgentspacePluginState,
  operationId: AgentspaceTypedOperationId,
  input: Record<string, unknown>,
): void {
  const validator = resolveInputValidator(state, operationId)
  if (!validator) return
  const valid = validator(input)
  if (valid) return
  const detail = formatSchemaErrors(validator.errors)
  throw new Error(`tool_input_schema_invalid:agentspace.${operationId}:${detail}`)
}

function hasRequiredOperationArg(input: Record<string, unknown>, argName: string): boolean {
  if (isWorkspaceArgName(argName)) return hasNonEmptyValue(resolveWorkspaceAliasValue(input))
  return hasNonEmptyValue(input[argName])
}

function assignTypedValue<TInput>(
  target: Partial<TInput>,
  key: string,
  value: unknown,
): void {
  ;(target as Record<string, unknown>)[key] = value
}

function requiresWorkspaceIdInDataArg(state: AgentspacePluginState, operationId: AgentspaceTypedOperationId): boolean {
  const existing = state.workspaceInDataRequirementByOperationId.get(operationId)
  if (existing !== undefined) return existing

  const refs = getAgentspaceOperationIoSchemaRefs(operationId)
  const schema = getAgentspaceContractSchema(refs.inputRef)
  const root = toRecord(schema)
  const properties = toRecord(root.properties)
  const dataSchema = toRecord(properties.data)
  const required = Array.isArray(dataSchema.required) ? dataSchema.required : []
  const requiresWorkspace = required.some((field: unknown) => normalizeNonEmpty(field) === 'workspaceId')
  state.workspaceInDataRequirementByOperationId.set(operationId, requiresWorkspace)
  return requiresWorkspace
}

function injectWorkspaceIdIntoDataArg(
  state: AgentspacePluginState,
  operationId: AgentspaceTypedOperationId,
  input: Record<string, unknown>,
  argName: string,
  rawValue: unknown,
): unknown {
  if (argName !== 'data') return rawValue
  const needsWorkspaceInData =
    DATA_WORKSPACE_FALLBACK_OPERATIONS.has(operationId) || requiresWorkspaceIdInDataArg(state, operationId)
  if (!needsWorkspaceInData) return rawValue
  if (!rawValue || typeof rawValue !== 'object' || Array.isArray(rawValue)) {
    throw new Error(toMissingRequiredArgToken('data.workspaceId'))
  }

  const data = rawValue as Record<string, unknown>
  if (normalizeNonEmpty(data.workspaceId)) return rawValue

  const workspaceId = resolveWorkspaceAliasValue(input)
  if (!workspaceId) {
    throw new Error(toMissingRequiredArgToken('data.workspaceId'))
  }

  return { ...data, workspaceId }
}

function isUnsafeRuntimeMessage(message: string): boolean {
  return UNSAFE_RUNTIME_MESSAGE_PATTERNS.some((pattern) => pattern.test(message))
}

function toExecutionReason(error: unknown, friendlyCode?: string, friendlyMessage?: string): string {
  const candidates = [
    normalizeNonEmpty(friendlyCode),
    normalizeNonEmpty(friendlyMessage),
    normalizeNonEmpty(error instanceof Error ? error.message : error),
  ].filter(Boolean) as string[]

  for (const candidate of candidates) {
    const lower = candidate.trim().toLowerCase()
    if (!lower) continue

    if (lower.startsWith('agentspace.validation')) return 'invalid_input'
    if (lower.startsWith('agentspace.notfound')) return 'not_found'
    if (lower.startsWith('agentspace.unauthorized')) return 'unauthorized'
    if (lower.startsWith('agentspace.forbidden')) return 'forbidden'
    if (lower.startsWith('agentspace.conflict')) return 'conflict'
    if (lower.startsWith('agentspace.ratelimit')) return 'rate_limit'
    if (lower.startsWith('agentspace.serviceunavailable')) return 'service_unavailable'

    const colonPrefix = lower.match(/^([a-z][a-z0-9_]+):/)
    if (colonPrefix && colonPrefix[1] !== 'failed') {
      return colonPrefix[1]
    }

    const knownCode = lower.match(
      /\b(runtime_env_missing|plugin_contract_invalid|workspace_context_required|workspace_scope_required|missing_required_[a-z0-9_]+|invalid_[a-z0-9_]+|tool_input_schema_invalid|unknown_input_[a-z0-9_]+|not_found|unauthorized|forbidden)\b/
    )
    if (knownCode) return knownCode[1]
    if (lower.includes('record not found') || lower.includes('not found')) return 'not_found'
    if (lower === 'unauthorized') return 'unauthorized'
    if (lower === 'forbidden') return 'forbidden'
    if (lower.includes('input required') || lower.includes('validation')) return 'invalid_input'
  }

  return 'runtime'
}

function toErrorStatus(reason: string, message: string): number {
  if (reason === 'unauthorized' || message.toLowerCase() === 'unauthorized') return 401
  if (reason === 'forbidden' || message.toLowerCase() === 'forbidden') return 403
  if (reason === 'not_found' || /record not found/i.test(message)) return 404
  if (reason === 'conflict') return 409
  if (reason === 'workspace_context_required' || reason === 'workspace_scope_required') return 409
  if (reason === 'rate_limit') return 429
  if (reason === 'runtime_env_missing') return 503
  if (reason === 'service_unavailable') return 503
  if (
    reason === 'invalid_input' ||
    reason === 'validation_failed' ||
    reason === 'missing_required_arg' ||
    reason === 'unknown_input_arg' ||
    reason === 'tool_input_schema_invalid' ||
    reason.startsWith('missing_required_') ||
    reason.startsWith('invalid_') ||
    reason.startsWith('unknown_input_') ||
    /validation_failed:/i.test(message) ||
    /missing_required_arg:/i.test(message) ||
    /unknown_input_arg:/i.test(message) ||
    /tool_input_schema_invalid:/i.test(message)
  ) {
    return 400
  }
  return 500
}

function toSafeErrorMessage(message: string, status: number): string {
  const normalized = normalizeNonEmpty(message) ?? ''
  if (status === 404) {
    if (!normalized || normalized === RUNTIME_FAILURE_MESSAGE || isUnsafeRuntimeMessage(normalized)) {
      return 'Record not found'
    }
    return normalized
  }

  if (status >= 500) {
    if (!normalized || isUnsafeRuntimeMessage(normalized)) {
      return RUNTIME_FAILURE_MESSAGE
    }
  }
  if (normalized) return normalized
  if (status === 400) return 'Invalid input'
  if (status === 401) return 'Unauthorized'
  if (status === 403) return 'Forbidden'
  return RUNTIME_FAILURE_MESSAGE
}

function toTypedOperationInput<TId extends AgentspaceTypedOperationId>(
  state: AgentspacePluginState,
  operationId: TId,
  input: Record<string, unknown>,
): AgentspaceOperationInput<TId> {
  const args = state.requiredArgsByOperationId.get(operationId) ?? []
  const allowedOperationArgs = new Set(args.map((arg) => arg.name))
  for (const key of Object.keys(input)) {
    if (allowedOperationArgs.has(key)) continue
    if (HOST_CONTEXT_INPUT_KEYS.has(key)) continue
    throw new Error(`unknown_input_arg:${key}`)
  }

  const typed: Partial<AgentspaceOperationInput<TId>> = {}
  for (const arg of args) {
    const rawValue =
      arg.name === 'workspaceId'
        ? resolveWorkspaceAliasValue(input)
        : input[arg.name]
    const normalizedRawValue = injectWorkspaceIdIntoDataArg(state, operationId, input, arg.name, rawValue)
    if (!arg.optional && !hasRequiredOperationArg(input, arg.name)) {
      throw new Error(toMissingRequiredArgToken(arg.name))
    }
    if (normalizedRawValue !== undefined) assignTypedValue<AgentspaceOperationInput<TId>>(typed, arg.name, normalizedRawValue)
  }
  return typed as AgentspaceOperationInput<TId>
}

function parseMaybeJson(value: string): unknown {
  const trimmed = value.trim()
  if (!trimmed) return value
  if (trimmed === 'true') return true
  if (trimmed === 'false') return false
  if (!Number.isNaN(Number(trimmed)) && trimmed !== '') return Number(trimmed)
  if (
    (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
    (trimmed.startsWith('[') && trimmed.endsWith(']'))
  ) {
    try {
      return JSON.parse(trimmed)
    } catch {
      return value
    }
  }
  return value
}

function buildQueryPayload(query: URLSearchParams): Record<string, unknown> {
  const payload: Record<string, unknown> = {}
  for (const [key, rawValue] of query.entries()) {
    payload[key] = parseMaybeJson(rawValue)
  }
  return payload
}

function payloadFromBody(body: unknown): Record<string, unknown> {
  return toRecord(body)
}

function buildInputForOperation(
  _operationId: AgentspaceTypedOperationId,
  request: DomainRequest,
  params: Record<string, string>,
): Record<string, unknown> {
  const query = buildQueryPayload(request.query)
  const body = payloadFromBody(request.body)
  const payload: Record<string, unknown> = {
    ...query,
    ...body,
    ...params,
  }

  return payload
}

function resolveRunner(options: AgentspaceResolvedPluginOptions): AgentspaceRunner {
  const defaultRunner: AgentspaceRunner = <TId extends AgentspaceTypedOperationId>(
    operationId: TId,
    input: AgentspaceOperationInput<TId>,
  ) => runAgentspaceKitOperationByTypedId(operationId, input)
  return options.runner ?? defaultRunner
}

export function createAgentspacePlugin(options: AgentspacePluginOptions = {}): DomainPlugin {
  const resolvedOptions = resolveAgentspacePluginOptions(options)
  const state = createPluginState(resolvedOptions)
  const runner = resolveRunner(resolvedOptions)
  const runnerMode = resolvedOptions.runner
    ? 'custom'
    : '@aopslab/domain-kit-agentspace#runAgentspaceKitOperationByTypedId'
  const enforceRuntimeEnv = resolvedOptions.runner === undefined

  return {
    contract: 'v1',
    domain: 'agentspace',
    version: 'v1',
    capabilities: ['workspace', 'project', 'task', 'prompt', 'skill', 'agent'],
    manifest: {
      domain: 'agentspace',
      version: 'v1',
      routes: state.routes,
      meta: {
        adapter: 'agentspace-kit-operation-runner',
        runner: resolvedOptions.runner
          ? 'custom'
          : '@aopslab/domain-kit-agentspace#runAgentspaceKitOperationByTypedId',
        routeProjection: '@aopslab/domain-kit-agentspace#buildAgentspaceHostRouteProjection',
        projectionRefreshedAt: state.projectionRefreshedAt,
      },
    },
    setup: async () => {
      runPluginSetup(state, resolvedOptions, enforceRuntimeEnv)
    },
    health: async () => {
      const missingRuntimeEnv = enforceRuntimeEnv
        ? resolveMissingRuntimeEnvKeys(resolvedOptions.requiredRuntimeEnv)
        : []
      const runtimeOk = missingRuntimeEnv.length === 0
      return {
        ok: runtimeOk,
        details: {
          runner: runnerMode,
          operationTimeoutMs: resolvedOptions.operationTimeoutMs ?? 'default',
          requiredRuntimeEnv: enforceRuntimeEnv ? resolvedOptions.requiredRuntimeEnv : [],
          missingRuntimeEnv,
          projectionRefreshOnCreate: resolvedOptions.refreshProjectionOnCreate,
          projectionRefreshedAt: state.projectionRefreshedAt,
          routesCount: state.routes.length,
          validatorCacheSize: state.inputValidatorByOperationId.size,
          setupStatus: state.setup.status,
          setupAttempts: state.setup.attempts,
          setupLastAttemptAt: state.setup.lastAttemptAt,
          setupReadyAt: state.setup.readyAt,
          setupLastError: state.setup.lastError,
          runtimeEnvVerifiedAt: state.runtimeEnvVerifiedAt,
        },
      }
    },
    execute: async ({ request, match }) => {
      const operationIdRaw = match.route.operation
      if (!isAgentspaceTypedOperationId(operationIdRaw, state.requiredArgsByOperationId)) {
        throw new Error(`unknown_agentspace_operation:${operationIdRaw}`)
      }
      const operationId = operationIdRaw

      const inputBase = match.route.buildInput ? match.route.buildInput(request, match.params) : {}
      const operationTimeoutMs = resolveOperationTimeoutMs(operationId, resolvedOptions)
      const locale =
        normalizeNonEmpty(request.context.locale) ??
        normalizeNonEmpty(request.context.fallbackLocale)
      const localeOpts = locale ? { locale } : undefined

      try {
        ensureRuntimeEnvReady(state, resolvedOptions.requiredRuntimeEnv, enforceRuntimeEnv)
        const scopedInput = buildContextScopedInput(inputBase, request.context, resolvedOptions.defaultTenantId)
        const input = normalizeAgentspaceOperationInputForCompatibility(operationId, scopedInput)
        const typedInput = toTypedOperationInput(state, operationId, input)
        validateInputBySchema(state, operationId, typedInput as Record<string, unknown>)
        const output = await runWithOperationTimeout(operationId, operationTimeoutMs, () =>
          runner(operationId, typedInput)
        )
        return output
      } catch (error) {
        const friendly = mapErrorToFriendly(error, localeOpts)
        const rawMessage =
          normalizeNonEmpty(error instanceof Error ? error.message : error) ??
          normalizeNonEmpty(friendly.message) ??
          ''
        const reason = toExecutionReason(error, friendly.code, rawMessage)
        const derivedStatus = toErrorStatus(reason, rawMessage)
        const status =
          derivedStatus === 500 && typeof friendly.status === 'number' && Number.isFinite(friendly.status)
            ? friendly.status
            : derivedStatus
        const safeMessage = toSafeErrorMessage(rawMessage || friendly.message, status)

        console.error('[agentspace-plugin] operation failed', {
          operationId,
          operationTimeoutMs,
          status,
          reason,
          code: friendly.code,
          message: rawMessage,
          error,
        })

        return toSafeFailureEnvelope({
          operationId,
          reason,
          status,
          message: safeMessage,
        })
      }
    },
  }
}
