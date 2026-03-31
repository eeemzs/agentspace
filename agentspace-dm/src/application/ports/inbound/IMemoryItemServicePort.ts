import { Effect } from 'effect'
import { MemoryItemServiceError } from '../../errors/MemoryItemServiceError.js'
import { IbmMemoryItem, IbmMemoryItemInsert } from '../../../domain/models/index.js'
import { DbQueryOptions } from '@aopslab/xf-db'
import type { ScopeResolution } from '../../../domain/types.js'

export type MemorySearchRetrievalSubject = {
  type?: string
  id?: string
  label?: string
}

export type MemorySearchRetrievalRequest = {
  query?: string
  goal?: string
  runtimeProfile?: string
  workflowId?: string
  stepId?: string
  subject?: MemorySearchRetrievalSubject
  tags?: string[]
  sourceTypes?: string[]
  sourceIds?: string[]
  candidateLimit?: number
}

export type MemoryItemListFilter = Partial<IbmMemoryItem> & {
  scopeResolution?: ScopeResolution
}

export interface IMemoryItemServicePort {
  getById(id: string, options?: DbQueryOptions<IbmMemoryItem>): Effect.Effect<IbmMemoryItem | null, MemoryItemServiceError>
  create(data: IbmMemoryItemInsert): Effect.Effect<IbmMemoryItem, MemoryItemServiceError>
  addMemoryItem(data: IbmMemoryItemInsert): Effect.Effect<IbmMemoryItem, MemoryItemServiceError>
  updateMemoryItem(id: string, patch: Partial<IbmMemoryItem>): Effect.Effect<IbmMemoryItem, MemoryItemServiceError>
  setMemoryImportance(id: string, importance: number | null): Effect.Effect<IbmMemoryItem, MemoryItemServiceError>
  listMemoryItems(filter?: MemoryItemListFilter, options?: DbQueryOptions<IbmMemoryItem>): Effect.Effect<IbmMemoryItem[], MemoryItemServiceError>
  searchMemoryItems(
    filter?: MemoryItemListFilter,
    retrieval?: MemorySearchRetrievalRequest,
    options?: DbQueryOptions<IbmMemoryItem>
  ): Effect.Effect<IbmMemoryItem[], MemoryItemServiceError>
  removeMemoryItem(id: string): Effect.Effect<void, MemoryItemServiceError>
}

export interface IMemoryItemLookupPort {
  getById(id: string): Effect.Effect<IbmMemoryItem | null, MemoryItemServiceError>
}
