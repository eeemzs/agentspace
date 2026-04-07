import { Ajv, type AnySchema, type ErrorObject, type ValidateFunction } from 'ajv'

import { normalizeAgentspaceOperationInputForCompatibility } from '../shared/codex-chat-input.js'
import {
  hasNonEmptyValue,
  resolveProjectContextValue,
  toMissingRequiredArgToken,
  toRecord,
} from '../shared/tool-input.js'
import { listAgentspaceOperationSpecs } from './catalog.js'
import { getAgentspaceContractSchema, getAgentspaceOperationIoSchemaRefs } from './schemas.js'
import type { AgentspaceOperationInput, AgentspaceTypedOperationId } from './io-types.js'

type FlattenEnvelopeKey<TInput, TKey extends string> =
  TInput extends Record<TKey, infer TInner>
    ? TInner extends Record<string, unknown>
      ? Omit<TInput, TKey> & TInner
      : TInput
    : TInput

type FlattenToolingEnvelopeInput<TInput> = FlattenEnvelopeKey<
  FlattenEnvelopeKey<FlattenEnvelopeKey<TInput, 'data'>, 'patch'>,
  'input'
>

export type AgentspaceToolInput<TId extends AgentspaceTypedOperationId> =
  FlattenToolingEnvelopeInput<AgentspaceOperationInput<TId>>

type AgentspaceRequiredArg = ReadonlyArray<{ name: string; optional: boolean }>

const AGENTSPACE_CONTEXT_KEYS = new Set([
  'tenantId',
  'projectId',
  'scopeId',
  'locale',
  'fallbackLocale',
  '__hostContext',
])

const AGENTSPACE_OPERATION_ARGS_BY_ID = new Map<AgentspaceTypedOperationId, AgentspaceRequiredArg>(
  listAgentspaceOperationSpecs({ refresh: true }).map((operation) => [
    operation.operationId as AgentspaceTypedOperationId,
    operation.args,
  ]),
)

const inputSchemaValidatorAjv = new Ajv({
  allErrors: true,
  strict: false,
  coerceTypes: false,
  allowUnionTypes: true,
})

const inputValidatorByOperationId = new Map<AgentspaceTypedOperationId, ValidateFunction>()

function resolveProjectValue(input: Record<string, unknown>): string | undefined {
  return resolveProjectContextValue(input) ?? resolveProjectContextValue(toRecord(input.__hostContext))
}

function resolveEnvelopeArgName(args: AgentspaceRequiredArg): 'data' | 'patch' | 'input' | null {
  const argNames = new Set(args.map((arg) => arg.name))
  if (argNames.has('data')) return 'data'
  if (argNames.has('patch')) return 'patch'
  if (argNames.has('input')) return 'input'
  return null
}

function normalizeEnvelopeInput(
  input: Record<string, unknown>,
  args: AgentspaceRequiredArg,
): Record<string, unknown> {
  const envelopeArgName = resolveEnvelopeArgName(args)
  if (!envelopeArgName) return input
  if (Object.prototype.hasOwnProperty.call(input, envelopeArgName)) return input

  const allowedArgNames = new Set(args.map((arg) => arg.name))
  const passthroughKeys = new Set<string>()
  const envelopePayload: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(input)) {
    if (AGENTSPACE_CONTEXT_KEYS.has(key) || allowedArgNames.has(key)) {
      passthroughKeys.add(key)
      continue
    }
    envelopePayload[key] = value
  }

  if (Object.keys(envelopePayload).length === 0) return input

  const normalized: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(input)) {
    if (!passthroughKeys.has(key)) continue
    normalized[key] = value
  }
  normalized[envelopeArgName] = envelopePayload
  return normalized
}

function formatSchemaErrors(errors: ErrorObject[] | null | undefined): string {
  if (!errors || errors.length === 0) return 'invalid_input'
  const first = errors[0]
  const path = first.instancePath && first.instancePath.length > 0 ? first.instancePath : '/'
  const message = first.message ?? first.keyword
  return `${path} ${message}`.trim()
}

function resolveInputValidator(operationId: AgentspaceTypedOperationId): ValidateFunction | null {
  const existing = inputValidatorByOperationId.get(operationId)
  if (existing) return existing

  const refs = getAgentspaceOperationIoSchemaRefs(operationId)
  const schema = getAgentspaceContractSchema(refs.inputRef)
  if (!schema || typeof schema !== 'object' || Array.isArray(schema)) return null

  const validator = inputSchemaValidatorAjv.compile(schema as AnySchema)
  inputValidatorByOperationId.set(operationId, validator)
  return validator
}

function validateInputBySchema(
  operationId: AgentspaceTypedOperationId,
  input: Record<string, unknown>,
): void {
  const validator = resolveInputValidator(operationId)
  if (!validator) return
  const valid = validator(input)
  if (valid) return
  const detail = formatSchemaErrors(validator.errors)
  throw new Error(`tool_input_schema_invalid:agentspace.${operationId}:${detail}`)
}

function hasRequiredOperationArg(input: Record<string, unknown>, argName: string): boolean {
  if (argName === 'projectId' || argName === 'scopeId') {
    return hasNonEmptyValue(resolveProjectValue(input))
  }
  return hasNonEmptyValue(input[argName])
}

function assignTypedValue<TInput>(
  target: Partial<TInput>,
  key: string,
  value: unknown,
): void {
  ;(target as Record<string, unknown>)[key] = value
}

export function getAgentspaceOperationArgs<TId extends AgentspaceTypedOperationId>(
  operationId: TId,
): AgentspaceRequiredArg {
  return AGENTSPACE_OPERATION_ARGS_BY_ID.get(operationId) ?? []
}

export function parseAgentspaceToolInput<TId extends AgentspaceTypedOperationId>(
  operationId: TId,
  input: AgentspaceToolInput<TId> | AgentspaceOperationInput<TId> | unknown,
): AgentspaceOperationInput<TId> {
  const args = AGENTSPACE_OPERATION_ARGS_BY_ID.get(operationId)
  if (!args) {
    throw new Error(`unknown_agentspace_operation:${operationId}`)
  }

  const normalizedEnvelopeInput = normalizeEnvelopeInput(toRecord(input), args)
  const normalizedInput = normalizeAgentspaceOperationInputForCompatibility(
    operationId,
    normalizedEnvelopeInput,
  )
  const allowedOperationArgs = new Set(args.map((arg) => arg.name))

  for (const key of Object.keys(normalizedInput)) {
    if (allowedOperationArgs.has(key)) continue
    if (AGENTSPACE_CONTEXT_KEYS.has(key)) continue
    throw new Error(`unknown_input_arg:${key}`)
  }

  const typed: Partial<AgentspaceOperationInput<TId>> = {}
  for (const arg of args) {
    const rawValue =
      arg.name === 'projectId' || arg.name === 'scopeId'
        ? resolveProjectValue(normalizedInput)
        : normalizedInput[arg.name]
    if (!arg.optional && !hasRequiredOperationArg(normalizedInput, arg.name)) {
      throw new Error(toMissingRequiredArgToken(arg.name))
    }
    if (rawValue !== undefined) {
      assignTypedValue<AgentspaceOperationInput<TId>>(typed, arg.name, rawValue)
    }
  }

  validateInputBySchema(operationId, typed as Record<string, unknown>)
  return typed as AgentspaceOperationInput<TId>
}
