import { Effect } from 'effect'
import { pipe } from 'effect/Function'
import { validateInput, XfErrorFactory, effectErrorInfo } from '@aopslab/xf-core'
import { XfLogger } from '@aopslab/xf-logger'
import type { IRepositoryPortMemoryItem, IRepositoryPortScope } from '../ports/repository-ports/index.js'
import type { IMemoryItemServicePort, MemoryItemListFilter, MemorySearchRetrievalRequest } from '../ports/inbound/index.js'
import { MemoryItemServiceError } from '../errors/MemoryItemServiceError.js'
import { IbmMemoryItem, IbmMemoryItemInsert, memoryItemZodSchemaInsert } from '../../domain/models/index.js'
import { validateBmInputWithSchema } from './service.zod-validation.js'
import { DbQueryOptions, mapDbError } from '@aopslab/xf-db'
import { listRecordsByScopeResolution } from './service.scope-resolution.js'

export interface MemoryItemServiceDependencies {}

export interface MemoryItemServiceOptions {
  memoryItemRepository: IRepositoryPortMemoryItem
  scopeRepository?: IRepositoryPortScope
  serviceDependencies?: Partial<MemoryItemServiceDependencies>
  logger?: XfLogger
  locale?: string
}

const DEFAULT_SEARCH_CANDIDATE_LIMIT = 48
const MAX_SEARCH_CANDIDATE_LIMIT = 200
const DEFAULT_RECENCY_WINDOW_DAYS = 30

function normalizeNonEmpty(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeTextToken(value: unknown): string {
  return normalizeNonEmpty(value).toLowerCase()
}

function tokenizeLoose(value: unknown): string[] {
  return normalizeNonEmpty(value)
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length >= 3)
}

function uniqueStrings(values: unknown[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const value of values) {
    const normalized = normalizeNonEmpty(value)
    if (!normalized) continue
    const key = normalized.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    result.push(normalized)
  }
  return result
}

function toArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : []
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function parseDateValue(value: unknown): Date | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value
  if (typeof value !== 'string') return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function clampCandidateLimit(value: unknown): number {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_SEARCH_CANDIDATE_LIMIT
  return Math.min(Math.max(Math.trunc(parsed), 1), MAX_SEARCH_CANDIDATE_LIMIT)
}

function resolveFetchLimit(
  retrieval: MemorySearchRetrievalRequest | undefined,
  options: DbQueryOptions<IbmMemoryItem> | undefined
): number {
  if (retrieval?.candidateLimit) {
    return clampCandidateLimit(retrieval.candidateLimit)
  }
  const requestedLimit = Number(options?.limit)
  if (Number.isFinite(requestedLimit) && requestedLimit > 0) {
    return clampCandidateLimit(Math.max(requestedLimit * 4, DEFAULT_SEARCH_CANDIDATE_LIMIT))
  }
  return DEFAULT_SEARCH_CANDIDATE_LIMIT
}

function readQueryOptionNumber(
  options: DbQueryOptions<IbmMemoryItem> | undefined,
  key: 'limit' | 'offset'
): number | undefined {
  const record = options as Record<string, unknown> | undefined
  const parsed = Number(record?.[key])
  return Number.isFinite(parsed) ? parsed : undefined
}

function normalizeRetrievalRequest(retrieval?: MemorySearchRetrievalRequest): MemorySearchRetrievalRequest | undefined {
  if (!retrieval) return undefined

  const subject = retrieval.subject ? {
    type: normalizeNonEmpty(retrieval.subject.type) || undefined,
    id: normalizeNonEmpty(retrieval.subject.id) || undefined,
    label: normalizeNonEmpty(retrieval.subject.label) || undefined,
  } : undefined

  const normalized: MemorySearchRetrievalRequest = {
    query: normalizeNonEmpty(retrieval.query) || undefined,
    goal: normalizeNonEmpty(retrieval.goal) || undefined,
    runtimeProfile: normalizeNonEmpty(retrieval.runtimeProfile) || undefined,
    workflowId: normalizeNonEmpty(retrieval.workflowId) || undefined,
    stepId: normalizeNonEmpty(retrieval.stepId) || undefined,
    subject,
    tags: uniqueStrings(toArray(retrieval.tags)),
    sourceTypes: uniqueStrings(toArray(retrieval.sourceTypes)),
    sourceIds: uniqueStrings(toArray(retrieval.sourceIds)),
    candidateLimit: retrieval.candidateLimit,
  }

  const hasValue = Boolean(
    normalized.query ||
      normalized.goal ||
      normalized.runtimeProfile ||
      normalized.workflowId ||
      normalized.stepId ||
      normalized.subject?.type ||
      normalized.subject?.id ||
      normalized.subject?.label ||
      normalized.tags?.length ||
      normalized.sourceTypes?.length ||
      normalized.sourceIds?.length
  )

  return hasValue ? normalized : undefined
}

function collectMetaTokens(value: unknown, depth = 0): string[] {
  if (depth > 3 || value === null || value === undefined) return []
  if (typeof value === 'string') return tokenizeLoose(value)
  if (typeof value === 'number' || typeof value === 'boolean') return tokenizeLoose(String(value))
  if (Array.isArray(value)) return value.flatMap((entry) => collectMetaTokens(entry, depth + 1))
  if (!isPlainObject(value)) return []
  return Object.entries(value).flatMap(([key, entry]) => [
    ...tokenizeLoose(key),
    ...collectMetaTokens(entry, depth + 1),
  ])
}

function collectRetrievalTokens(retrieval?: MemorySearchRetrievalRequest): string[] {
  if (!retrieval) return []
  return uniqueStrings([
    ...tokenizeLoose(retrieval.query),
    ...tokenizeLoose(retrieval.goal),
    ...tokenizeLoose(retrieval.runtimeProfile),
    ...tokenizeLoose(retrieval.subject?.type?.replace(/^projectman\./, '')),
    ...tokenizeLoose(retrieval.subject?.label),
    ...toArray(retrieval.tags).flatMap((entry) => tokenizeLoose(entry)),
    ...toArray(retrieval.sourceTypes).flatMap((entry) => tokenizeLoose(String(entry).replace(/^projectman\./, ''))),
  ])
}

function collectMemoryTokens(item: IbmMemoryItem): string[] {
  return uniqueStrings([
    ...tokenizeLoose(item.kind),
    ...tokenizeLoose(item.content),
    ...toArray(item.tags).flatMap((entry) => tokenizeLoose(entry)),
    ...tokenizeLoose(item.sourceType?.replace(/^projectman\./, '')),
    ...tokenizeLoose(item.sourceId),
    ...collectMetaTokens(item.meta),
  ])
}

function scoreLexical(itemTokens: string[], retrievalTokens: string[]): { score: number; matches: string[] } {
  if (retrievalTokens.length === 0 || itemTokens.length === 0) {
    return { score: 0, matches: [] }
  }

  const itemTokenSet = new Set(itemTokens)
  const matches: string[] = []
  let score = 0

  for (const token of retrievalTokens) {
    if (itemTokenSet.has(token)) {
      score += 8
      matches.push(token)
      continue
    }
    if (itemTokens.some((entry) => entry.includes(token) || token.includes(entry))) {
      score += 3
      matches.push(token)
    }
  }

  return { score, matches: uniqueStrings(matches) }
}

function scoreSemantic(item: IbmMemoryItem, retrieval: MemorySearchRetrievalRequest | undefined): number {
  if (!retrieval) return 0

  const tagSet = new Set(toArray(item.tags).map((entry) => normalizeTextToken(entry)))
  const sourceType = normalizeTextToken(item.sourceType)
  const kind = normalizeTextToken(item.kind)
  let score = 0

  for (const tag of toArray(retrieval.tags)) {
    const normalizedTag = normalizeTextToken(tag)
    if (normalizedTag && tagSet.has(normalizedTag)) score += 6
  }

  for (const sourceTypeCandidate of toArray(retrieval.sourceTypes)) {
    const normalizedSourceType = normalizeTextToken(sourceTypeCandidate)
    if (!normalizedSourceType) continue
    if (sourceType === normalizedSourceType) {
      score += 12
      continue
    }
    if (sourceType.includes(normalizedSourceType) || normalizedSourceType.includes(sourceType)) {
      score += 6
    }
  }

  const subjectType = normalizeTextToken(retrieval.subject?.type)
  if (subjectType) {
    if (sourceType === subjectType) score += 14
    else if (sourceType.includes(subjectType) || subjectType.includes(sourceType)) score += 8
  }

  const runtimeProfileTokens = tokenizeLoose(retrieval.runtimeProfile)
  if (runtimeProfileTokens.some((token) => kind.includes(token) || tagSet.has(token))) {
    score += 6
  }

  return score
}

function scoreLinkage(item: IbmMemoryItem, retrieval: MemorySearchRetrievalRequest | undefined): number {
  if (!retrieval) return 0

  const sourceId = normalizeNonEmpty(item.sourceId)
  const sourceType = normalizeNonEmpty(item.sourceType)
  const sourceIds = uniqueStrings([
    retrieval.subject?.id,
    retrieval.workflowId,
    retrieval.stepId,
    ...toArray(retrieval.sourceIds),
  ])
  const sourceTypes = uniqueStrings([
    retrieval.subject?.type,
    ...toArray(retrieval.sourceTypes),
  ])

  let score = 0

  if (sourceId) {
    for (const candidate of sourceIds) {
      if (candidate === sourceId) score += 18
    }
  }

  if (sourceType) {
    for (const candidate of sourceTypes) {
      if (candidate === sourceType) score += 12
    }
  }

  return score
}

function scoreRecency(item: IbmMemoryItem): number {
  const timestamp = parseDateValue(item.updatedAt) ?? parseDateValue(item.createdAt)
  if (!timestamp) return 0
  const ageInMs = Date.now() - timestamp.getTime()
  const ageInDays = Math.max(ageInMs / (1000 * 60 * 60 * 24), 0)
  const normalized = Math.max(0, 1 - (ageInDays / DEFAULT_RECENCY_WINDOW_DAYS))
  return normalized * 6
}

function scoreImportance(item: IbmMemoryItem): number {
  const importance = Number(item.importance)
  if (!Number.isFinite(importance) || importance <= 0) return 0
  return Math.min(Math.max(importance, 0), 100) / 10
}

function rankMemoryItems(
  entries: IbmMemoryItem[],
  retrieval: MemorySearchRetrievalRequest | undefined,
  options?: DbQueryOptions<IbmMemoryItem>
): IbmMemoryItem[] {
  const retrievalTokens = collectRetrievalTokens(retrieval)
  const requestedOffset = readQueryOptionNumber(options, 'offset')
  const requestedLimit = readQueryOptionNumber(options, 'limit')
  const offset = typeof requestedOffset === 'number' && requestedOffset > 0
    ? Math.trunc(requestedOffset)
    : 0
  const limit = typeof requestedLimit === 'number' && requestedLimit > 0
    ? Math.trunc(requestedLimit)
    : undefined

  const ranked = entries
    .map((entry, index) => {
      const itemTokens = collectMemoryTokens(entry)
      const lexical = scoreLexical(itemTokens, retrievalTokens)
      const semantic = scoreSemantic(entry, retrieval)
      const linkage = scoreLinkage(entry, retrieval)
      const recency = scoreRecency(entry)
      const importance = scoreImportance(entry)
      const score = lexical.score + semantic + linkage + recency + importance

      return {
        entry,
        index,
        score,
        lexicalMatches: lexical.matches.length,
        linkage,
        importance,
      }
    })
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score
      if (right.linkage !== left.linkage) return right.linkage - left.linkage
      if (right.lexicalMatches !== left.lexicalMatches) return right.lexicalMatches - left.lexicalMatches
      if (right.importance !== left.importance) return right.importance - left.importance
      return left.index - right.index
    })
    .map((item) => item.entry)

  const sliced = limit === undefined ? ranked.slice(offset) : ranked.slice(offset, offset + limit)
  return sliced
}

export class MemoryItemService implements IMemoryItemServicePort {
  private readonly memoryItemRepository: IRepositoryPortMemoryItem
  private readonly scopeRepository?: IRepositoryPortScope
  private readonly logger?: XfLogger

  constructor(options: MemoryItemServiceOptions) {
    this.memoryItemRepository = options.memoryItemRepository
    this.scopeRepository = options.scopeRepository
    this.logger = options.logger?.child({ module: this.constructor.name })
  }

  getById(id: string, options?: DbQueryOptions<IbmMemoryItem>): Effect.Effect<IbmMemoryItem | null, MemoryItemServiceError> {
    const stage = 'MemoryItemService::getById'
    return pipe(
      validateInput(id, 'id', { stage }),
      Effect.flatMap((id) => this.memoryItemRepository.findById(id, options).pipe(
        Effect.mapError(mapDbError({ stage, operation: 'findById', factory: XfErrorFactory.notFound }))
      )),
      Effect.tapError((e) => Effect.sync(() => {
        const info = effectErrorInfo(e)
        this.logger?.error({ error: info.unwrapped, stage }, 'Error in getById')
      }))
    )
  }

  create(data: IbmMemoryItemInsert): Effect.Effect<IbmMemoryItem, MemoryItemServiceError> {
    const stage = 'MemoryItemService::create'
    return pipe(
      validateInput(data, 'data', { stage }),
      Effect.flatMap((data) =>
        validateBmInputWithSchema({
          input: data,
          schema: memoryItemZodSchemaInsert,
          stage,
          operation: 'MemoryItemService::create.memoryItemZodSchemaInsert',
          field: 'data',
        })
      ),
      Effect.flatMap((data) => this.memoryItemRepository.create(data).pipe(
        Effect.mapError(mapDbError({ stage, operation: 'create', factory: XfErrorFactory.createFailed }))
      ))
    )
  }

  addMemoryItem(data: IbmMemoryItemInsert): Effect.Effect<IbmMemoryItem, MemoryItemServiceError> {
    const stage = 'MemoryItemService::addMemoryItem'
    return pipe(
      validateInput(data, 'data', { stage }),
      Effect.flatMap((data) =>
        validateBmInputWithSchema({
          input: data,
          schema: memoryItemZodSchemaInsert,
          stage,
          operation: 'MemoryItemService::addMemoryItem.memoryItemZodSchemaInsert',
          field: 'data',
        })
      ),
      Effect.flatMap((payload) => this.create(payload)),
      Effect.tapError((e) => Effect.sync(() => {
        const info = effectErrorInfo(e)
        this.logger?.error({ error: info.unwrapped, stage }, 'Error in addMemoryItem')
      }))
    )
  }

  updateMemoryItem(id: string, patch: Partial<IbmMemoryItem>): Effect.Effect<IbmMemoryItem, MemoryItemServiceError> {
    const stage = 'MemoryItemService::updateMemoryItem'
    if (!patch || Object.keys(patch).length === 0) {
      return Effect.fail(XfErrorFactory.inputRequired({ field: 'patch', stage }))
    }
    return pipe(
      validateInput(id, 'id', { stage }),
      Effect.flatMap((entityId) =>
        validateBmInputWithSchema({
          input: patch,
          schema: memoryItemZodSchemaInsert.partial().strict(),
          stage,
          operation: 'MemoryItemService::updateMemoryItem.memoryItemZodSchemaInsert.patch',
          field: 'patch',
        }).pipe(
          Effect.map(() => entityId)
        )
      ),
      Effect.flatMap((itemId) =>
        this.memoryItemRepository.patchById(itemId, patch).pipe(
          Effect.mapError(mapDbError({ stage, operation: 'patchById', factory: XfErrorFactory.upsertFailed }))
        )
      ),
      Effect.tapError((e) => Effect.sync(() => {
        const info = effectErrorInfo(e)
        this.logger?.error({ error: info.unwrapped, stage }, 'Error in updateMemoryItem')
      }))
    )
  }

  setMemoryImportance(id: string, importance: number | null): Effect.Effect<IbmMemoryItem, MemoryItemServiceError> {
    const stage = 'MemoryItemService::setMemoryImportance'
    return pipe(
      validateInput(id, 'id', { stage }),
      Effect.flatMap(() => this.updateMemoryItem(id, { importance: importance === null ? (null as any) : importance }))
    )
  }

  listMemoryItems(
    filter: MemoryItemListFilter = {},
    options?: DbQueryOptions<IbmMemoryItem>
  ): Effect.Effect<IbmMemoryItem[], MemoryItemServiceError> {
    const stage = 'MemoryItemService::listMemoryItems'
    return pipe(
      validateInput(filter, 'filter', { stage }),
      Effect.flatMap((value) => listRecordsByScopeResolution(this.memoryItemRepository as any, this.scopeRepository, value, options, {
        stage,
        defaultResolution: 'cascade',
      }).pipe(
        Effect.mapError(mapDbError({ stage, operation: 'find', factory: XfErrorFactory.notFound }))
      )),
      Effect.tapError((e) => Effect.sync(() => {
        const info = effectErrorInfo(e)
        this.logger?.error({ error: info.unwrapped, stage }, 'Error in listMemoryItems')
      }))
    )
  }

  searchMemoryItems(
    filter: MemoryItemListFilter = {},
    retrieval?: MemorySearchRetrievalRequest,
    options?: DbQueryOptions<IbmMemoryItem>
  ): Effect.Effect<IbmMemoryItem[], MemoryItemServiceError> {
    const stage = 'MemoryItemService::searchMemoryItems'
    const normalizedRetrieval = normalizeRetrievalRequest(retrieval)
    return pipe(
      validateInput(filter, 'filter', { stage }),
      Effect.flatMap((validatedFilter) =>
        listRecordsByScopeResolution(this.memoryItemRepository as any, this.scopeRepository, validatedFilter, {
          ...options,
          offset: undefined,
          limit: resolveFetchLimit(normalizedRetrieval, options),
        }, {
          stage,
          defaultResolution: 'cascade',
        }).pipe(
          Effect.mapError(mapDbError({ stage, operation: 'find', factory: XfErrorFactory.notFound }))
        )
      ),
      Effect.map((rows) => rankMemoryItems(rows, normalizedRetrieval, options)),
      Effect.tapError((e) => Effect.sync(() => {
        const info = effectErrorInfo(e)
        this.logger?.error({ error: info.unwrapped, stage }, 'Error in searchMemoryItems')
      }))
    )
  }

  removeMemoryItem(id: string): Effect.Effect<void, MemoryItemServiceError> {
    const stage = 'MemoryItemService::removeMemoryItem'
    return pipe(
      validateInput(id, 'id', { stage }),
      Effect.flatMap((itemId) =>
        this.memoryItemRepository.deleteById(itemId).pipe(
          Effect.mapError(mapDbError({ stage, operation: 'deleteById', factory: XfErrorFactory.upsertFailed }))
        )
      ),
      Effect.map(() => undefined)
    )
  }
}
