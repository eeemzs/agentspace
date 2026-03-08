import fs from 'node:fs'
import path from 'node:path'

import { Effect } from 'effect'
import { config as loadDotEnv } from 'dotenv'

import { createAopsKitWithEnv } from '../domain-services/unified.js'
import type { AopsKitServices } from '../domain-services/types.js'
import { getAopsKitEnvConfig } from '../config/config.js'
import { hardDeleteAopsProjectCascade } from '../calls/project-delete.js'
import {
  normalizeNonEmpty,
  resolveWorkspaceAliasValue,
  toMissingRequiredArgToken,
  toRecord,
} from '../shared/tool-input.js'
import { normalizeAopsOperationInputForCompatibility } from '../shared/codex-chat-input.js'
import type { AopsOperationContract } from './contract.js'
import { getAopsOperationContractById, getAopsOperationContractByToolId } from './contract.js'
import type { AopsOperationInput, AopsOperationOutput, AopsTypedOperationId } from './io-types.js'

type ToolInput = Record<string, unknown>
type AopsKitInstance = ReturnType<typeof createAopsKitWithEnv>['kit']

let envLoaded = false
let cachedServices: Promise<AopsKitServices> | null = null
let cachedKit: Promise<AopsKitInstance> | null = null

function resolveWorkspaceIdFromHostContext(payload: ToolInput): string | undefined {
  const hostContext = toRecord(payload.__hostContext)
  return resolveWorkspaceAliasValue(hostContext)
}

function resolveWorkspaceIdValue(payload: ToolInput): string | undefined {
  return resolveWorkspaceAliasValue(payload) ?? resolveWorkspaceIdFromHostContext(payload)
}

function parseJsonValue(value: unknown): unknown {
  if (typeof value !== 'string') return value
  const trimmed = value.trim()
  if (!trimmed) return undefined
  try {
    return JSON.parse(trimmed)
  } catch {
    return value
  }
}

function parseNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  if (!trimmed) return undefined
  const parsed = Number(trimmed)
  if (!Number.isFinite(parsed)) return undefined
  return parsed
}

function parseDate(value: unknown): Date | undefined {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  if (!trimmed) return undefined
  const parsed = new Date(trimmed)
  if (Number.isNaN(parsed.getTime())) return undefined
  return parsed
}

function parseStringArray(value: unknown): string[] | undefined {
  if (Array.isArray(value)) {
    const items = value.map((item) => String(item).trim()).filter(Boolean)
    return items.length > 0 ? items : undefined
  }
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  if (!trimmed) return undefined
  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed)
      if (Array.isArray(parsed)) {
        const items = parsed.map((item) => String(item).trim()).filter(Boolean)
        return items.length > 0 ? items : undefined
      }
    } catch {
      // ignore and fallback to csv
    }
  }
  const items = trimmed.split(',').map((item) => item.trim()).filter(Boolean)
  return items.length > 0 ? items : undefined
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)
}

function normalizeNestedValue(value: unknown, keyName?: string): unknown {
  if (value === undefined || value === null) return value

  if (Array.isArray(value)) {
    return value.map((item) => normalizeNestedValue(item))
  }

  if (!isPlainObject(value)) {
    if (typeof value === 'string' && keyName?.toLowerCase().endsWith('at')) {
      return parseDate(value) ?? value
    }
    return value
  }

  const normalized: Record<string, unknown> = {}
  for (const [key, entry] of Object.entries(value)) {
    normalized[key] = normalizeNestedValue(entry, key)
  }
  return normalized
}

function normalizeArgValue(argName: string, value: unknown): unknown {
  if (value === undefined) return undefined
  if (value === null) return null

  const parsed = parseJsonValue(value)
  const name = argName.toLowerCase()

  if (name.endsWith('ids') && typeof parsed === 'string') {
    return parseStringArray(parsed) ?? parsed
  }

  if (name.endsWith('at') && typeof parsed === 'string') {
    return parseDate(parsed) ?? parsed
  }

  if (
    (name === 'data' ||
      name === 'patch' ||
      name === 'filter' ||
      name === 'criteria' ||
      name === 'options' ||
      name === 'opts') &&
    typeof parsed === 'string'
  ) {
    return normalizeNestedValue(parseJsonValue(parsed))
  }

  if (
    typeof parsed === 'string' &&
    (name.includes('position') ||
      name.includes('priority') ||
      name.includes('limit') ||
      name.includes('offset') ||
      name.includes('count'))
  ) {
    return parseNumber(parsed) ?? parsed
  }

  if (isPlainObject(parsed) || Array.isArray(parsed)) {
    return normalizeNestedValue(parsed)
  }

  return parsed
}

function loadEnvOnce(): void {
  if (envLoaded) return
  envLoaded = true

  const candidates = [
    process.env.DOTENV_CONFIG_PATH,
    process.env.AOPS_ENV_PATH,
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), '..', '.env'),
    path.resolve(process.cwd(), '../..', '.env'),
  ].filter(Boolean) as string[]

  for (const candidate of candidates) {
    if (!candidate) continue
    if (!fs.existsSync(candidate)) continue
    loadDotEnv({ path: candidate })
    break
  }
}

async function getKit(): Promise<AopsKitInstance> {
  if (cachedKit) return cachedKit
  cachedKit = (async () => {
    loadEnvOnce()
    const envConfig = getAopsKitEnvConfig()
    const { kit } = createAopsKitWithEnv({
      envConfig,
      baseContext: { tenantId: envConfig.tenantId },
    })
    return kit
  })()
  return cachedKit
}

async function getServices(): Promise<AopsKitServices> {
  if (cachedServices) return cachedServices
  cachedServices = (async () => {
    const kit = await getKit()
    return kit.createAll()
  })()
  return cachedServices
}

function resolveOperationByToolId(toolId: string): AopsOperationContract {
  const operation = getAopsOperationContractByToolId(toolId)
  if (operation) return operation
  throw new Error(`unknown_aops_tool:${toolId}`)
}

function resolveOperationById(operationId: string): AopsOperationContract {
  const operation = getAopsOperationContractById(operationId)
  if (operation) return operation
  throw new Error(`unknown_aops_operation:${operationId}`)
}

async function runSpecialOperation(operation: AopsOperationContract, payload: ToolInput): Promise<unknown> {
  if (operation.methodName !== 'hardDeleteAopsProjectCascade') {
    throw new Error(`unknown_aops_special_operation:${operation.operationId}`)
  }

  const workspaceId = resolveWorkspaceIdValue(payload)
  const projectId = normalizeNonEmpty(payload.projectId)
  if (!workspaceId) throw new Error(toMissingRequiredArgToken('workspaceId'))
  if (!projectId) throw new Error(toMissingRequiredArgToken('projectId'))

  const kit = await getKit()
  return hardDeleteAopsProjectCascade({ kit, workspaceId, projectId })
}

async function runResolvedOperation(operation: AopsOperationContract, input: unknown): Promise<unknown> {
  const payload = normalizeAopsOperationInputForCompatibility(
    operation.operationId as AopsTypedOperationId,
    toRecord(input),
  )

  if (operation.serviceKey === '__calls__') {
    return runSpecialOperation(operation, payload)
  }

  const services = await getServices()
  const service = services[operation.serviceKey as keyof AopsKitServices]
  if (!service || typeof service !== 'object') {
    throw new Error(`missing_aops_service:${operation.serviceKey}`)
  }

  const method = Reflect.get(service, operation.methodName)
  if (typeof method !== 'function') {
    throw new Error(`missing_aops_service_method:${operation.serviceKey}.${operation.methodName}`)
  }

  const args: unknown[] = []
  for (const arg of operation.args) {
    const rawValue =
      arg.name === 'workspaceId'
        ? resolveWorkspaceIdValue(payload)
        : payload[arg.name]
    const normalized = normalizeArgValue(arg.name, rawValue)
    if (normalized === undefined && arg.optional !== true) {
      throw new Error(toMissingRequiredArgToken(arg.name))
    }
    args.push(normalized)
  }

  const effect = (method as (...methodArgs: unknown[]) => unknown).apply(service, args)
  return Effect.runPromise(effect as Effect.Effect<unknown, unknown>)
}

export async function runAopsKitOperationByToolId(toolId: string, input: unknown): Promise<unknown> {
  const operation = resolveOperationByToolId(toolId)
  return runResolvedOperation(operation, input)
}

export async function runAopsKitOperationById<TId extends AopsTypedOperationId>(
  operationId: TId,
  input: AopsOperationInput<TId>,
): Promise<AopsOperationOutput<TId>>
export async function runAopsKitOperationById(operationId: string, input: unknown): Promise<unknown>
export async function runAopsKitOperationById(operationId: string, input: unknown): Promise<unknown> {
  const operation = resolveOperationById(operationId)
  return runResolvedOperation(operation, input)
}

export async function runAopsKitOperationByTypedId<TId extends AopsTypedOperationId>(
  operationId: TId,
  input: AopsOperationInput<TId>,
): Promise<AopsOperationOutput<TId>> {
  return runAopsKitOperationById(operationId, input)
}

export async function runAopsKitOperation(
  input: unknown,
  identifier: { toolId: string } | { operationId: string },
): Promise<unknown> {
  if ('toolId' in identifier) {
    return runAopsKitOperationByToolId(identifier.toolId, input)
  }
  return runAopsKitOperationById(identifier.operationId, input)
}

export function clearAopsKitOperationCaches(): void {
  cachedServices = null
  cachedKit = null
}
