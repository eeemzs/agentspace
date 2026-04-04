import { Effect } from 'effect'
import { pipe } from 'effect/Function'
import { validateInput, XfErrorFactory, effectErrorInfo } from '@aopslab/xf-core'
import { XfLogger } from '@aopslab/xf-logger'
import type { IRepositoryPortMemoryItem, IRepositoryPortProjectSummary, IRepositoryPortScope } from '../ports/repository-ports/index.js'
import type {
  IMemoryItemServicePort,
  MemoryItemListFilter,
  MemoryResumePack,
  MemoryResumePackItem,
  MemoryResumePackOptions,
  MemoryResumePackRef,
  MemorySearchRetrievalRequest,
} from '../ports/inbound/index.js'
import { MemoryItemServiceError } from '../errors/MemoryItemServiceError.js'
import { IbmMemoryItem, IbmMemoryItemInsert, memoryItemZodSchemaInsert } from '../../domain/models/index.js'
import { validateBmInputWithSchema } from './service.zod-validation.js'
import { DbQueryOptions, mapDbError } from '@aopslab/xf-db'
import { listRecordsByScopeResolution } from './service.scope-resolution.js'

export interface MemoryItemServiceDependencies {}

export interface MemoryItemServiceOptions {
  memoryItemRepository: IRepositoryPortMemoryItem
  projectSummaryRepository?: IRepositoryPortProjectSummary
  scopeRepository?: IRepositoryPortScope
  serviceDependencies?: Partial<MemoryItemServiceDependencies>
  logger?: XfLogger
  locale?: string
}

const DEFAULT_SEARCH_CANDIDATE_LIMIT = 48
const MAX_SEARCH_CANDIDATE_LIMIT = 200
const DEFAULT_RECENCY_WINDOW_DAYS = 30
const DEFAULT_RESUME_PACK_LIMIT = 8
const MAX_RESUME_PACK_LIMIT = 24

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

function readMetaRecord(item: IbmMemoryItem): Record<string, unknown> {
  return isPlainObject(item.meta) ? item.meta : {}
}

function clampResumePackLimit(value: unknown): number {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_RESUME_PACK_LIMIT
  return Math.min(Math.max(Math.trunc(parsed), 1), MAX_RESUME_PACK_LIMIT)
}

function normalizeResumePackOptions(options?: MemoryResumePackOptions): Required<MemoryResumePackOptions> {
  return {
    depth: options?.depth === 'deep' ? 'deep' : 'light',
    limit: clampResumePackLimit(options?.limit),
    includeProjectSummary: Boolean(options?.includeProjectSummary !== false),
  }
}

function normalizeRefRecord(value: unknown): MemoryResumePackRef | null {
  if (typeof value === 'string') {
    const normalized = normalizeNonEmpty(value)
    return normalized ? { ref: normalized } : null
  }
  if (!isPlainObject(value)) return null
  const pageNumberRaw = value.pageNumber
  const pageNumber =
    typeof pageNumberRaw === 'number'
      ? Math.trunc(pageNumberRaw)
      : typeof pageNumberRaw === 'string' && pageNumberRaw.trim()
        ? Number.parseInt(pageNumberRaw, 10)
        : undefined
  const normalized: MemoryResumePackRef = {
    kind: normalizeNonEmpty(value.kind) || undefined,
    uri: normalizeNonEmpty(value.uri) || undefined,
    resourceId: normalizeNonEmpty(value.resourceId) || undefined,
    ref: normalizeNonEmpty(value.ref) || normalizeNonEmpty(value.id) || undefined,
    documentVersionId: normalizeNonEmpty(value.documentVersionId) || undefined,
    sectionId: normalizeNonEmpty(value.sectionId) || undefined,
    pageVersionId: normalizeNonEmpty(value.pageVersionId) || undefined,
    pageNumber: Number.isInteger(pageNumber) ? pageNumber : undefined,
    target: normalizeNonEmpty(value.target) || undefined,
    locale: normalizeNonEmpty(value.locale) || undefined,
    fallbackLocale: normalizeNonEmpty(value.fallbackLocale) || undefined,
  }
  return normalized.kind ||
    normalized.uri ||
    normalized.resourceId ||
    normalized.ref ||
    normalized.documentVersionId ||
    normalized.sectionId ||
    normalized.pageVersionId ||
    normalized.pageNumber !== undefined
    ? normalized
    : null
}

function collectItemRefs(item: IbmMemoryItem): MemoryResumePackRef[] {
  const meta = readMetaRecord(item)
  const nextReadRefs = toArray(meta.nextReadRefs).map((entry) => normalizeRefRecord(entry)).filter(Boolean) as MemoryResumePackRef[]
  const sourceRefs = toArray(meta.sourceRefs).map((entry) => normalizeRefRecord(entry)).filter(Boolean) as MemoryResumePackRef[]
  return [...nextReadRefs, ...sourceRefs]
}

function uniqueRefs(refs: MemoryResumePackRef[]): MemoryResumePackRef[] {
  const seen = new Set<string>()
  const result: MemoryResumePackRef[] = []
  for (const ref of refs) {
    const key = [
      normalizeTextToken(ref.kind),
      normalizeTextToken(ref.uri),
      normalizeTextToken(ref.resourceId),
      normalizeTextToken(ref.ref),
      normalizeTextToken(ref.documentVersionId),
      normalizeTextToken(ref.sectionId),
      normalizeTextToken(ref.pageVersionId),
      ref.pageNumber === undefined ? '' : String(ref.pageNumber),
      normalizeTextToken(ref.target),
      normalizeTextToken(ref.locale),
      normalizeTextToken(ref.fallbackLocale),
    ].join('|')
    if (!key || seen.has(key)) continue
    seen.add(key)
    result.push(ref)
  }
  return result
}

function collectNextActions(items: IbmMemoryItem[]): string[] {
  return uniqueStrings(items.flatMap((item) => {
    const meta = readMetaRecord(item)
    return [
      normalizeNonEmpty(meta.nextAction),
      ...toArray(meta.nextSteps).map((entry) => normalizeNonEmpty(entry)),
    ]
  }))
}

function toResumePackItem(item: IbmMemoryItem): MemoryResumePackItem {
  return {
    id: normalizeNonEmpty(item.id),
    kind: normalizeNonEmpty(item.kind),
    content: normalizeNonEmpty(item.content),
    importance: typeof item.importance === 'number' ? item.importance : undefined,
    sourceType: normalizeNonEmpty(item.sourceType),
    sourceId: normalizeNonEmpty(item.sourceId),
    tags: toArray(item.tags).map((entry) => String(entry)).filter(Boolean),
    meta: item.meta,
  }
}

function readMetaSubjectType(item: IbmMemoryItem): string {
  return normalizeTextToken(readMetaRecord(item).subjectType)
}

function readMetaSubjectId(item: IbmMemoryItem): string {
  return normalizeNonEmpty(readMetaRecord(item).subjectId) ?? ''
}

function readMetaBoolean(item: IbmMemoryItem, key: string): boolean {
  return readMetaRecord(item)[key] === true
}

function readStickyScope(item: IbmMemoryItem): string {
  return normalizeTextToken(readMetaRecord(item).stickyScope)
}

function readSummaryRole(item: IbmMemoryItem): string {
  return normalizeTextToken(readMetaRecord(item).summaryRole)
}

function readSupersedesId(item: IbmMemoryItem): string {
  return normalizeNonEmpty(readMetaRecord(item).supersedes)
}

function isExactSubjectMatch(item: IbmMemoryItem, retrieval?: MemorySearchRetrievalRequest): boolean {
  const subjectType = normalizeTextToken(retrieval?.subject?.type)
  const subjectId = normalizeNonEmpty(retrieval?.subject?.id) ?? ''
  if (!subjectType || !subjectId) return false
  return (
    (normalizeTextToken(item.sourceType) === subjectType && normalizeNonEmpty(item.sourceId) === subjectId) ||
    (readMetaSubjectType(item) === subjectType && readMetaSubjectId(item) === subjectId)
  )
}

function isLineageMatch(item: IbmMemoryItem, retrieval?: MemorySearchRetrievalRequest): boolean {
  const sourceType = normalizeTextToken(item.sourceType)
  const sourceId = normalizeNonEmpty(item.sourceId) ?? ''
  const meta = readMetaRecord(item)
  const candidates = new Set(uniqueStrings([
    retrieval?.subject?.id,
    retrieval?.workflowId,
    retrieval?.stepId,
    ...toArray(retrieval?.sourceIds),
  ]))
  const typeCandidates = new Set(
    uniqueStrings([
      retrieval?.subject?.type,
      ...toArray(retrieval?.sourceTypes),
    ]).map((entry) => normalizeTextToken(entry))
  )

  return Boolean(
    (sourceId && candidates.has(sourceId)) ||
    (readMetaSubjectId(item) && candidates.has(readMetaSubjectId(item))) ||
    (normalizeNonEmpty(meta.sprintId) && candidates.has(normalizeNonEmpty(meta.sprintId))) ||
    (normalizeNonEmpty(meta.phaseId) && candidates.has(normalizeNonEmpty(meta.phaseId))) ||
    (normalizeNonEmpty(meta.microtaskId) && candidates.has(normalizeNonEmpty(meta.microtaskId))) ||
    (normalizeNonEmpty(meta.kanbanTaskId) && candidates.has(normalizeNonEmpty(meta.kanbanTaskId))) ||
    (sourceType && typeCandidates.has(sourceType)) ||
    (readMetaSubjectType(item) && typeCandidates.has(readMetaSubjectType(item)))
  )
}

function normalizeContentSignature(value: unknown): string {
  return normalizeNonEmpty(value).toLowerCase().replace(/\s+/g, ' ').trim()
}

function readItemTimestamp(item: IbmMemoryItem): number {
  const timestamp = parseDateValue(item.updatedAt) ?? parseDateValue(item.createdAt)
  return timestamp?.getTime() ?? 0
}

function readProjectTag(item: IbmMemoryItem): string {
  const tags = toArray(item.tags).map((entry) => normalizeNonEmpty(entry))
  const projectTag = tags.find((entry) => entry.startsWith('project:'))
  return projectTag ? projectTag.slice('project:'.length) : ''
}

function readProjectId(item: IbmMemoryItem): string {
  const meta = readMetaRecord(item)
  return (
    normalizeNonEmpty(meta.projectId) ||
    readProjectTag(item) ||
    (normalizeTextToken(item.sourceType) === 'projectman.plan' ? normalizeNonEmpty(item.sourceId) : '') ||
    (readMetaSubjectType(item) === 'projectman.plan' ? readMetaSubjectId(item) : '')
  )
}

function isProjectRuleMatch(item: IbmMemoryItem, projectId: string): boolean {
  return Boolean(
    item.kind === 'rule' &&
    projectId &&
    readProjectId(item) === projectId
  )
}

function isProjectGenericMatch(item: IbmMemoryItem, projectId: string): boolean {
  if (!projectId) return false
  if (item.kind === 'rule') return false
  return readProjectId(item) === projectId
}

function isStickyProjectGuidance(item: IbmMemoryItem, projectId: string): boolean {
  if (!readMetaBoolean(item, 'sticky')) return false
  if (readStickyScope(item) && readStickyScope(item) !== 'project') return false
  if (!projectId) return false
  return readProjectId(item) === projectId
}

function isStickySubjectGuidance(item: IbmMemoryItem, retrieval?: MemorySearchRetrievalRequest): boolean {
  if (!readMetaBoolean(item, 'sticky')) return false
  if (readStickyScope(item) !== 'subject') return false
  return isExactSubjectMatch(item, retrieval) || isLineageMatch(item, retrieval)
}

function filterSupersededItems(entries: IbmMemoryItem[]): IbmMemoryItem[] {
  const supersededIds = new Set(entries.map((entry) => readSupersedesId(entry)).filter(Boolean))
  return entries.filter((entry) => !supersededIds.has(normalizeNonEmpty(entry.id)))
}

function scoreStickyRole(item: IbmMemoryItem): number {
  const role = readSummaryRole(item)
  if (role === 'bootstrap') return 3
  if (role === 'guidance') return 2
  if (role === 'rule') return 1
  return 0
}

function dedupeMemoryItems(entries: IbmMemoryItem[]): IbmMemoryItem[] {
  const bestByKey = new Map<string, IbmMemoryItem>()
  for (const entry of entries) {
    const key = [
      normalizeTextToken(entry.kind),
      readMetaSubjectType(entry) || normalizeTextToken(entry.sourceType),
      readMetaSubjectId(entry) || normalizeNonEmpty(entry.sourceId),
      normalizeContentSignature(entry.content),
    ].join('|')

    const current = bestByKey.get(key)
    if (!current) {
      bestByKey.set(key, entry)
      continue
    }

    if (readItemTimestamp(entry) > readItemTimestamp(current)) {
      bestByKey.set(key, entry)
    }
  }

  const bestSet = new Set(Array.from(bestByKey.values()))
  return entries.filter((entry) => bestSet.has(entry))
}

function takeGroup(entries: IbmMemoryItem[], limit: number): IbmMemoryItem[] {
  return limit <= 0 ? [] : entries.slice(0, limit)
}

function curateRelatedMemory(
  entries: IbmMemoryItem[],
  normalizedRetrieval: MemorySearchRetrievalRequest | undefined,
  projectId: string,
  limit: number,
  depth: 'light' | 'deep',
): {
  bootstrapGuidance: IbmMemoryItem[]
  relatedMemory: IbmMemoryItem[]
  exactMatches: IbmMemoryItem[]
  lineageMatches: IbmMemoryItem[]
  ruleMatches: IbmMemoryItem[]
  projectMatches: IbmMemoryItem[]
  fallbackMatches: IbmMemoryItem[]
} {
  const deduped = filterSupersededItems(dedupeMemoryItems(entries))
  const stickyProjectMatches = deduped.filter((item) => isStickyProjectGuidance(item, projectId))
  const stickySubjectMatches = depth === 'deep'
    ? deduped.filter((item) => !stickyProjectMatches.includes(item) && isStickySubjectGuidance(item, normalizedRetrieval))
    : []
  const bootstrapGuidance = [...stickyProjectMatches, ...stickySubjectMatches]
    .sort((left, right) => {
      const roleDelta = scoreStickyRole(right) - scoreStickyRole(left)
      if (roleDelta !== 0) return roleDelta
      const rankDelta = Number(readMetaRecord(right).stickyRank ?? 0) - Number(readMetaRecord(left).stickyRank ?? 0)
      if (rankDelta !== 0) return rankDelta
      return readItemTimestamp(right) - readItemTimestamp(left)
    })
    .slice(0, 3)

  const activeEntries = deduped.filter((item) => !bootstrapGuidance.includes(item))
  const exactMatches = activeEntries.filter((item) => isExactSubjectMatch(item, normalizedRetrieval))
  const lineageMatches = activeEntries.filter((item) => !exactMatches.includes(item) && isLineageMatch(item, normalizedRetrieval))
  const ruleMatches = activeEntries.filter((item) => !exactMatches.includes(item) && !lineageMatches.includes(item) && isProjectRuleMatch(item, projectId))
  const projectMatches = activeEntries.filter((item) =>
    !exactMatches.includes(item) &&
    !lineageMatches.includes(item) &&
    !ruleMatches.includes(item) &&
    isProjectGenericMatch(item, projectId),
  )
  const fallbackMatches = activeEntries.filter((item) =>
    !exactMatches.includes(item) &&
    !lineageMatches.includes(item) &&
    !ruleMatches.includes(item) &&
    !projectMatches.includes(item),
  )

  const hasExactContext = exactMatches.length > 0
  const hasSpecificContext = hasExactContext || lineageMatches.length > 0
  const selectedExact = takeGroup(exactMatches, limit)
  const selectedLineage = takeGroup(lineageMatches, Math.max(limit - selectedExact.length, 0))
  const remainingAfterSpecific = Math.max(limit - selectedExact.length - selectedLineage.length, 0)

  const ruleLimit = (() => {
    if (remainingAfterSpecific <= 0) return 0
    if (depth === 'deep') {
      return hasExactContext ? 1 : hasSpecificContext ? 2 : remainingAfterSpecific
    }
    if (hasExactContext) return 0
    return hasSpecificContext ? 1 : remainingAfterSpecific
  })()

  const selectedRules = takeGroup(ruleMatches, Math.min(ruleLimit, remainingAfterSpecific))
  const remainingAfterRules = Math.max(limit - selectedExact.length - selectedLineage.length - selectedRules.length, 0)

  const projectLimit = (() => {
    if (remainingAfterRules <= 0) return 0
    if (hasExactContext) return depth === 'deep' ? 1 : 0
    if (hasSpecificContext) return depth === 'deep' ? 1 : 0
    return remainingAfterRules
  })()

  const selectedProject = takeGroup(projectMatches, Math.min(projectLimit, remainingAfterRules))
  const remainingAfterProject = Math.max(
    limit - selectedExact.length - selectedLineage.length - selectedRules.length - selectedProject.length,
    0,
  )
  const selectedFallback = hasSpecificContext ? [] : takeGroup(fallbackMatches, Math.min(1, remainingAfterProject))
  const curated = [
    ...selectedExact,
    ...selectedLineage,
    ...selectedRules,
    ...selectedProject,
    ...selectedFallback,
  ]

  return {
    bootstrapGuidance,
    relatedMemory: uniqueStrings(curated.map((item) => item.id)).map((id) => curated.find((item) => item.id === id)!).slice(0, limit),
    exactMatches,
    lineageMatches,
    ruleMatches,
    projectMatches,
    fallbackMatches,
  }
}

function buildBootstrapGuidance(items: IbmMemoryItem[]): string[] {
  return uniqueStrings(
    items.map((item) => normalizeNonEmpty(item.content)).filter((entry): entry is string => Boolean(entry)),
  ).slice(0, 3)
}

function buildProjectSummaryText(projectSummary: unknown): string | undefined {
  const summaryRecord = isPlainObject(projectSummary) ? projectSummary : {}
  return normalizeNonEmpty(summaryRecord.summary) || undefined
}

function buildResumeSummary(items: IbmMemoryItem[], projectSummary?: unknown): string | undefined {
  const topContents = items
    .map((item) => normalizeNonEmpty(item.content))
    .filter((entry): entry is string => Boolean(entry))
    .slice(0, 3)

  if (topContents.length > 0) return topContents.join('\n\n')

  const summaryRecord = isPlainObject(projectSummary) ? projectSummary : {}
  return normalizeNonEmpty(summaryRecord.summary)
}

function inferCurrentFocus(items: IbmMemoryItem[], nextActions: string[], retrieval?: MemorySearchRetrievalRequest): string | undefined {
  const firstAction = nextActions[0]
  if (firstAction) return firstAction

  const primary = items[0]
  if (primary) {
    const meta = readMetaRecord(primary)
    return (
      normalizeNonEmpty(meta.subjectTitle) ??
      normalizeNonEmpty(retrieval?.subject?.label) ??
      normalizeNonEmpty(primary.content)
    )
  }

  return normalizeNonEmpty(retrieval?.goal) ?? normalizeNonEmpty(retrieval?.query)
}

function inferConfidence(params: {
  exactMatches: IbmMemoryItem[]
  lineageMatches: IbmMemoryItem[]
  ruleMatches: IbmMemoryItem[]
  projectMatches: IbmMemoryItem[]
  total: number
  relatedTotal: number
}): number {
  let base = 10
  if (params.exactMatches.length > 0) base = 92
  else if (params.lineageMatches.length > 0) base = 78
  else if (params.ruleMatches.length > 0) base = 62
  else if (params.projectMatches.length > 0) base = 48
  else if (params.total > 0) base = 28

  const noiseRatio =
    params.total > 0
      ? Math.max(params.total - params.relatedTotal, 0) / params.total
      : 0

  const penaltyScale = params.exactMatches.length > 0 ? 6 : 14
  const penalty = Math.round(noiseRatio * penaltyScale)
  return Math.max(5, Math.min(98, base - penalty))
}

function inferReadStrategy(confidence: number, refs: MemoryResumePackRef[], gaps: string[], depth: 'light' | 'deep'): 'none' | 'recommended' | 'expand' {
  if (depth === 'deep') return refs.length > 0 || gaps.length > 0 ? 'expand' : 'recommended'
  if (confidence >= 75 && refs.length === 0 && gaps.length === 0) return 'none'
  if (confidence >= 45) return refs.length > 0 ? 'recommended' : 'none'
  return refs.length > 0 || gaps.length > 0 ? 'expand' : 'recommended'
}

function normalizeMemoryItemQueryFilter(filter: MemoryItemListFilter): MemoryItemListFilter {
  const normalized = { ...(filter as Record<string, unknown>) }
  delete normalized.projectId
  return normalized as MemoryItemListFilter
}

export class MemoryItemService implements IMemoryItemServicePort {
  private readonly memoryItemRepository: IRepositoryPortMemoryItem
  private readonly projectSummaryRepository?: IRepositoryPortProjectSummary
  private readonly scopeRepository?: IRepositoryPortScope
  private readonly logger?: XfLogger

  constructor(options: MemoryItemServiceOptions) {
    this.memoryItemRepository = options.memoryItemRepository
    this.projectSummaryRepository = options.projectSummaryRepository
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
      Effect.flatMap((value) => listRecordsByScopeResolution(this.memoryItemRepository as any, this.scopeRepository, normalizeMemoryItemQueryFilter(value), options, {
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
        listRecordsByScopeResolution(this.memoryItemRepository as any, this.scopeRepository, normalizeMemoryItemQueryFilter(validatedFilter), {
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

  buildResumePack(
    filter: MemoryItemListFilter,
    retrieval?: MemorySearchRetrievalRequest,
    options?: MemoryResumePackOptions
  ): Effect.Effect<MemoryResumePack, MemoryItemServiceError> {
    const stage = 'MemoryItemService::buildResumePack'
    const normalizedRetrieval = normalizeRetrievalRequest(retrieval)
    const normalizedOptions = normalizeResumePackOptions(options)
    const scopeId = normalizeNonEmpty(filter?.scopeId)
    if (!scopeId) {
      return Effect.fail(XfErrorFactory.inputRequired({ field: 'filter.scopeId', stage }))
    }

    const filterRecord = filter as Record<string, unknown>
    const projectId = normalizeNonEmpty(filterRecord.projectId)
    const searchFilter = normalizeMemoryItemQueryFilter(filter)
    const listOptions: DbQueryOptions<IbmMemoryItem> = {
      limit: Math.max(
        normalizedOptions.limit * (normalizedOptions.depth === 'deep' ? 3 : 2),
        clampCandidateLimit(normalizedRetrieval?.candidateLimit),
      ),
    }

    return pipe(
      this.searchMemoryItems(searchFilter, normalizedRetrieval, listOptions),
      Effect.flatMap((rows) => {
        const limitedRows = rows.slice(0, listOptions.limit as number)
        const curated = curateRelatedMemory(
          limitedRows,
          normalizedRetrieval,
          projectId,
          normalizedOptions.limit,
          normalizedOptions.depth,
        )
        const relatedMemory = curated.relatedMemory
        const decisions = relatedMemory
          .filter((item) => item.kind === 'decision')
          .map((item) => normalizeNonEmpty(item.content))
          .filter((entry): entry is string => Boolean(entry))
          .slice(0, normalizedOptions.limit)
        const blockers = relatedMemory
          .filter((item) => item.kind === 'constraint')
          .map((item) => normalizeNonEmpty(item.content))
          .filter((entry): entry is string => Boolean(entry))
          .slice(0, normalizedOptions.limit)
        const nextActions = collectNextActions(relatedMemory).slice(0, normalizedOptions.limit)
        const recommendedRefs = uniqueRefs(
          [...curated.bootstrapGuidance, ...relatedMemory].flatMap((item) => collectItemRefs(item))
        ).slice(0, normalizedOptions.depth === 'deep' ? normalizedOptions.limit * 2 : normalizedOptions.limit)
        const confidence = inferConfidence({
          exactMatches: curated.exactMatches,
          lineageMatches: curated.lineageMatches,
          ruleMatches: curated.ruleMatches,
          projectMatches: curated.projectMatches,
          total: limitedRows.length,
          relatedTotal: relatedMemory.length,
        })
        const gaps = uniqueStrings([
          curated.exactMatches.length === 0 && normalizeNonEmpty(normalizedRetrieval?.subject?.id) ? 'exact-subject-memory-missing' : undefined,
          relatedMemory.length === 0 ? 'no-related-memory' : undefined,
          nextActions.length === 0 ? 'next-action-missing' : undefined,
          recommendedRefs.length === 0 ? 'recommended-refs-missing' : undefined,
        ])
        const readStrategy = inferReadStrategy(confidence, recommendedRefs, gaps, normalizedOptions.depth)

        const fetchProjectSummary: Effect.Effect<unknown | null, MemoryItemServiceError> =
          normalizedOptions.includeProjectSummary && this.projectSummaryRepository && projectId
            ? this.projectSummaryRepository.find({ matchEq: { projectId }, options: { limit: 1 } } as any).pipe(
                Effect.mapError(mapDbError({ stage, operation: 'find', factory: XfErrorFactory.notFound })),
                Effect.map((items) => items?.[0] ?? null),
              )
            : Effect.succeed(null)

        return pipe(
          fetchProjectSummary,
          Effect.map((projectSummary): MemoryResumePack => ({
            subject: normalizedRetrieval?.subject,
            projectSummary: projectSummary ?? undefined,
            projectSummaryText: buildProjectSummaryText(projectSummary ?? undefined),
            bootstrapGuidance: buildBootstrapGuidance(curated.bootstrapGuidance),
            resumeSummary: buildResumeSummary(relatedMemory, projectSummary ?? undefined),
            currentFocus: inferCurrentFocus(relatedMemory, nextActions, normalizedRetrieval),
            openDecisions: decisions,
            openBlockers: blockers,
            nextActions,
            recommendedRefs,
            relatedMemory: relatedMemory.map((item) => toResumePackItem(item)),
            confidence,
            gaps,
            readStrategy,
          })),
        )
      }),
      Effect.tapError((e) => Effect.sync(() => {
        const info = effectErrorInfo(e)
        this.logger?.error({ error: info.unwrapped, stage }, 'Error in buildResumePack')
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
