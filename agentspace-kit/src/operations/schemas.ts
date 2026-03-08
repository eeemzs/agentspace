import type { AopsOperationKind, AopsOperationSchemaRef } from './types.js'
import { normalizeAopsOperationId } from './definition.js'
import { AOPS_OPERATION_CATALOG_ROWS } from './catalog.data.js'

type JsonSchema = Record<string, unknown>
type SchemaDirection = 'input' | 'output'

const CRUD_KINDS = new Set<Exclude<AopsOperationKind, 'custom'>>(['list', 'get', 'create', 'update', 'delete'])

const GENERIC_LIST_INPUT_SCHEMA: JsonSchema = {
  type: 'object',
  additionalProperties: true,
  properties: {
    filter: { type: 'object', additionalProperties: true },
    options: { type: 'object', additionalProperties: true },
  },
}

const GENERIC_GET_INPUT_SCHEMA: JsonSchema = {
  type: 'object',
  additionalProperties: true,
  required: ['id'],
  properties: {
    id: { type: 'string', minLength: 1 },
  },
}

const GENERIC_CREATE_INPUT_SCHEMA: JsonSchema = {
  type: 'object',
  additionalProperties: true,
}

const GENERIC_UPDATE_INPUT_SCHEMA: JsonSchema = {
  type: 'object',
  additionalProperties: true,
}

const GENERIC_DELETE_INPUT_SCHEMA: JsonSchema = {
  type: 'object',
  additionalProperties: true,
  required: ['id'],
  properties: {
    id: { type: 'string', minLength: 1 },
  },
}

const GENERIC_LIST_OUTPUT_SCHEMA: JsonSchema = {
  type: 'array',
  items: { type: 'object', additionalProperties: true },
}

const GENERIC_GET_OUTPUT_SCHEMA: JsonSchema = {
  anyOf: [{ type: 'object', additionalProperties: true }, { type: 'null' }],
}

const GENERIC_OBJECT_OUTPUT_SCHEMA: JsonSchema = {
  type: 'object',
  additionalProperties: true,
}

const GENERIC_VOID_OUTPUT_SCHEMA: JsonSchema = {
  anyOf: [{ type: 'null' }, { type: 'object', additionalProperties: true }],
}

const GENERIC_CUSTOM_INPUT_SCHEMA: JsonSchema = {
  type: 'object',
  additionalProperties: true,
}

const GENERIC_CUSTOM_OUTPUT_SCHEMA: JsonSchema = {}

const GENERIC_FLEXIBLE_FIELD_SCHEMA: JsonSchema = {
  anyOf: [
    { type: 'string' },
    { type: 'number' },
    { type: 'integer' },
    { type: 'boolean' },
    { type: 'null' },
    { type: 'object', additionalProperties: true },
    { type: 'array', items: { type: 'object', additionalProperties: true } },
  ],
}

const CODEX_CHAT_MESSAGE_CREATE_INPUT_SCHEMA: JsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['data'],
  properties: {
    data: {
      type: 'object',
      additionalProperties: false,
      required: ['workspaceId', 'threadId', 'role', 'text', 'messageAt', 'seq'],
      properties: {
        workspaceId: { type: 'string', minLength: 1 },
        projectId: { type: ['string', 'null'] },
        threadId: { type: 'string', minLength: 1 },
        externalThreadId: { type: 'string', minLength: 1 },
        role: { type: 'string', enum: ['user', 'assistant', 'system'] },
        text: { type: 'string', minLength: 1 },
        turnId: { type: 'string', minLength: 1 },
        itemId: { type: 'string', minLength: 1 },
        messageAt: { type: 'string', minLength: 1 },
        seq: { type: 'integer', minimum: 1 },
        createdBy: { type: 'string', minLength: 1 },
        updatedBy: { type: 'string', minLength: 1 },
      },
    },
  },
}

const CODEX_CHAT_THREAD_CREATE_INPUT_SCHEMA: JsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['data'],
  properties: {
    data: {
      type: 'object',
      additionalProperties: false,
      required: ['workspaceId', 'externalThreadId'],
      properties: {
        workspaceId: { type: 'string', minLength: 1 },
        projectId: { type: ['string', 'null'] },
        externalThreadId: { type: 'string', minLength: 1 },
        scopeLabel: { type: 'string', minLength: 1 },
        cwd: { type: 'string', minLength: 1 },
        title: { type: 'string', minLength: 1 },
        tags: { type: 'array', items: { type: 'string', minLength: 1 } },
        lastPrompt: { type: 'string', minLength: 1 },
        lastAssistant: { type: 'string', minLength: 1 },
        tokenInput: { type: ['integer', 'null'], minimum: 0 },
        tokenOutput: { type: ['integer', 'null'], minimum: 0 },
        tokenTotal: { type: ['integer', 'null'], minimum: 0 },
        lastMessageAt: { type: 'string', minLength: 1 },
        createdBy: { type: 'string', minLength: 1 },
        updatedBy: { type: 'string', minLength: 1 },
      },
    },
  },
}

const PROJECT_CREATE_INPUT_SCHEMA: JsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['data'],
  properties: {
    data: {
      type: 'object',
      additionalProperties: true,
      required: ['workspaceId', 'name'],
      properties: {
        workspaceId: { type: 'string', minLength: 1 },
        name: { type: 'string', minLength: 1 },
      },
    },
  },
}

const PROJECT_PATH_UPSERT_INPUT_SCHEMA: JsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['data'],
  properties: {
    data: {
      type: 'object',
      additionalProperties: true,
      required: ['workspaceId', 'projectId', 'pathKey', 'path'],
      properties: {
        workspaceId: { type: 'string', minLength: 1 },
        projectId: { type: 'string', minLength: 1 },
        pathKey: { type: 'string', minLength: 1 },
        path: { type: 'string', minLength: 1 },
      },
    },
  },
}

const OBJECT_ARG_NAMES = new Set(['data', 'filter', 'criteria', 'options', 'opts', 'patch'])
const ARRAY_ARG_NAMES = new Set(['ids', 'tags', 'roles'])
const INTEGER_ARG_NAMES = new Set(['seq', 'limit', 'offset', 'tokenInput', 'tokenOutput', 'tokenTotal'])

const inputSchemaByOperationId = new Map<string, JsonSchema>()
const INPUT_SCHEMA_OVERRIDES_BY_OPERATION_ID = new Map<string, JsonSchema>([
  [normalizeAopsOperationId('codex-chat-message.add-message'), CODEX_CHAT_MESSAGE_CREATE_INPUT_SCHEMA],
  [normalizeAopsOperationId('codex-chat-message.create'), CODEX_CHAT_MESSAGE_CREATE_INPUT_SCHEMA],
  [normalizeAopsOperationId('codex-chat-thread.add-thread'), CODEX_CHAT_THREAD_CREATE_INPUT_SCHEMA],
  [normalizeAopsOperationId('codex-chat-thread.create'), CODEX_CHAT_THREAD_CREATE_INPUT_SCHEMA],
  [normalizeAopsOperationId('project.create'), PROJECT_CREATE_INPUT_SCHEMA],
  [normalizeAopsOperationId('project-path.create'), PROJECT_PATH_UPSERT_INPUT_SCHEMA],
  [normalizeAopsOperationId('project-path.upsert-project-path'), PROJECT_PATH_UPSERT_INPUT_SCHEMA],
])

function inferOperationKind(operationId: string): AopsOperationKind {
  const segments = operationId.split('.').map((segment) => segment.trim()).filter(Boolean)
  const last = segments[segments.length - 1] ?? ''
  if (CRUD_KINDS.has(last as Exclude<AopsOperationKind, 'custom'>)) {
    return last as Exclude<AopsOperationKind, 'custom'>
  }
  return 'custom'
}

function buildDefaultSchemaRefs(operationId: string): { inputRef: string; outputRef: string } {
  return {
    inputRef: `${operationId}.input`,
    outputRef: `${operationId}.output`,
  }
}

function parseSchemaRef(ref: string): { operationId: string; direction: SchemaDirection } | null {
  const normalized = String(ref ?? '').trim()
  if (!normalized) return null

  if (normalized.endsWith('.input')) {
    const operationId = normalized.slice(0, -'.input'.length)
    if (!operationId) return null
    return { operationId, direction: 'input' }
  }

  if (normalized.endsWith('.output')) {
    const operationId = normalized.slice(0, -'.output'.length)
    if (!operationId) return null
    return { operationId, direction: 'output' }
  }

  return null
}

function getDefaultSchemaForKind(kind: AopsOperationKind, direction: SchemaDirection): JsonSchema {
  if (kind === 'list' && direction === 'input') return GENERIC_LIST_INPUT_SCHEMA
  if (kind === 'list' && direction === 'output') return GENERIC_LIST_OUTPUT_SCHEMA

  if (kind === 'get' && direction === 'input') return GENERIC_GET_INPUT_SCHEMA
  if (kind === 'get' && direction === 'output') return GENERIC_GET_OUTPUT_SCHEMA

  if (kind === 'create' && direction === 'input') return GENERIC_CREATE_INPUT_SCHEMA
  if (kind === 'create' && direction === 'output') return GENERIC_OBJECT_OUTPUT_SCHEMA

  if (kind === 'update' && direction === 'input') return GENERIC_UPDATE_INPUT_SCHEMA
  if (kind === 'update' && direction === 'output') return GENERIC_OBJECT_OUTPUT_SCHEMA

  if (kind === 'delete' && direction === 'input') return GENERIC_DELETE_INPUT_SCHEMA
  if (kind === 'delete' && direction === 'output') return GENERIC_VOID_OUTPUT_SCHEMA

  if (direction === 'input') return GENERIC_CUSTOM_INPUT_SCHEMA
  return GENERIC_CUSTOM_OUTPUT_SCHEMA
}

function inferArgumentSchema(name: string): JsonSchema {
  const normalized = String(name ?? '').trim()
  const lowered = normalized.toLowerCase()

  if (!normalized) return GENERIC_FLEXIBLE_FIELD_SCHEMA
  if (OBJECT_ARG_NAMES.has(normalized)) return { type: 'object', additionalProperties: true }
  if (ARRAY_ARG_NAMES.has(normalized)) return { type: 'array', items: GENERIC_FLEXIBLE_FIELD_SCHEMA }
  if (INTEGER_ARG_NAMES.has(normalized)) return { type: 'integer' }
  if (lowered === 'id' || lowered.endsWith('id') || lowered.endsWith('uid')) return { type: 'string', minLength: 1 }
  if (lowered.endsWith('at') || lowered.includes('date') || lowered.includes('time')) return { type: 'string', minLength: 1 }
  if (lowered.includes('enabled') || lowered.startsWith('is') || lowered.startsWith('has')) return { type: 'boolean' }
  if (lowered.includes('count') || lowered.includes('index') || lowered.endsWith('size')) return { type: 'integer' }
  if (lowered.includes('path') || lowered.includes('slug') || lowered.includes('name') || lowered.includes('title')) {
    return { type: 'string', minLength: 1 }
  }

  return GENERIC_FLEXIBLE_FIELD_SCHEMA
}

function buildInputSchemaFromCatalog(operationId: string): JsonSchema | null {
  const normalizedOperationId = normalizeAopsOperationId(operationId)
  const cached = inputSchemaByOperationId.get(normalizedOperationId)
  if (cached) return cached

  const override = INPUT_SCHEMA_OVERRIDES_BY_OPERATION_ID.get(normalizedOperationId)
  if (override) {
    inputSchemaByOperationId.set(normalizedOperationId, override)
    return override
  }

  const row = AOPS_OPERATION_CATALOG_ROWS.find((item) => normalizeAopsOperationId(item.operationId) === normalizedOperationId)
  if (!row) return null

  const properties: Record<string, unknown> = {}
  const required: string[] = []

  for (const arg of row.args) {
    properties[arg.name] = inferArgumentSchema(arg.name)
    if (!arg.optional) required.push(arg.name)
  }

  const schema: JsonSchema = {
    type: 'object',
    additionalProperties: false,
    properties,
  }

  if (required.length > 0) {
    ;(schema as Record<string, unknown>).required = required
  }

  inputSchemaByOperationId.set(normalizedOperationId, schema)
  return schema
}

export function createAopsSchemaRef(name: string): AopsOperationSchemaRef {
  return { $ref: normalizeAopsSchemaRefName(name) }
}

export function normalizeAopsSchemaRefName(name: string): string {
  return normalizeAopsOperationId(name).replace(/\.-/g, '.')
}

export function resolveAopsSchemaRefName(schema: unknown): string | null {
  if (!schema || typeof schema !== 'object' || Array.isArray(schema)) return null
  const maybeRef = (schema as { $ref?: unknown }).$ref
  if (typeof maybeRef !== 'string') return null
  const normalized = maybeRef.trim()
  return normalized.length > 0 ? normalized : null
}

export function getAopsOperationIoSchemaRefs(operationId: string): { inputRef: string; outputRef: string } {
  return buildDefaultSchemaRefs(normalizeAopsOperationId(operationId))
}

export function getAopsContractSchema(ref: string): JsonSchema | null {
  const parsed = parseSchemaRef(ref)
  if (!parsed) return null

  const normalizedOperationId = normalizeAopsOperationId(parsed.operationId)
  if (parsed.direction === 'input') {
    const inputSchema = buildInputSchemaFromCatalog(normalizedOperationId)
    if (inputSchema) return inputSchema
  }

  const kind = inferOperationKind(normalizedOperationId)
  return getDefaultSchemaForKind(kind, parsed.direction)
}
