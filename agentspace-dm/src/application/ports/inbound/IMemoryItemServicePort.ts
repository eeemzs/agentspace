import { Effect } from 'effect'
import { MemoryItemServiceError } from '../../errors/MemoryItemServiceError.js'
import { IbmMemoryItem, IbmMemoryItemInsert } from '../../../domain/models/index.js'
import { DbQueryOptions } from '@aopslab/xf-db'

export interface IMemoryItemServicePort {
  getById(id: string, options?: DbQueryOptions<IbmMemoryItem>): Effect.Effect<IbmMemoryItem | null, MemoryItemServiceError>
  create(data: IbmMemoryItemInsert): Effect.Effect<IbmMemoryItem, MemoryItemServiceError>
  addMemoryItem(data: IbmMemoryItemInsert): Effect.Effect<IbmMemoryItem, MemoryItemServiceError>
  updateMemoryItem(id: string, patch: Partial<IbmMemoryItem>): Effect.Effect<IbmMemoryItem, MemoryItemServiceError>
  setMemoryImportance(id: string, importance: number | null): Effect.Effect<IbmMemoryItem, MemoryItemServiceError>
  listMemoryItems(filter?: Partial<IbmMemoryItem>, options?: DbQueryOptions<IbmMemoryItem>): Effect.Effect<IbmMemoryItem[], MemoryItemServiceError>
  searchMemoryItems(filter?: Partial<IbmMemoryItem>, options?: DbQueryOptions<IbmMemoryItem>): Effect.Effect<IbmMemoryItem[], MemoryItemServiceError>
  removeMemoryItem(id: string): Effect.Effect<void, MemoryItemServiceError>
}

export interface IMemoryItemLookupPort {
  getById(id: string): Effect.Effect<IbmMemoryItem | null, MemoryItemServiceError>
}
