import { Effect } from 'effect'
import { SkillSetItemServiceError } from '../../errors/SkillSetItemServiceError.js'
import { IbmSkillSetItem, IbmSkillSetItemInsert } from '../../../domain/models/index.js'
import { DbQueryOptions } from '@aopslab/xf-db'

export type SkillSetItemCreateInput = Omit<IbmSkillSetItemInsert, 'position'> & { position?: number }

export interface ISkillSetItemServicePort {
  getById(id: string, options?: DbQueryOptions<IbmSkillSetItem>): Effect.Effect<IbmSkillSetItem | null, SkillSetItemServiceError>
  create(data: IbmSkillSetItemInsert): Effect.Effect<IbmSkillSetItem, SkillSetItemServiceError>
  addSkillSetItem(data: SkillSetItemCreateInput): Effect.Effect<IbmSkillSetItem, SkillSetItemServiceError>
  updateSkillSetItem(id: string, patch: Partial<IbmSkillSetItem>): Effect.Effect<IbmSkillSetItem, SkillSetItemServiceError>
  listSkillSetItems(
    filter?: Partial<IbmSkillSetItem>,
    options?: DbQueryOptions<IbmSkillSetItem>
  ): Effect.Effect<IbmSkillSetItem[], SkillSetItemServiceError>
  reorderSkillSetItems(skillSetId: string, orderedItemIds: string[]): Effect.Effect<number, SkillSetItemServiceError>
  removeSkillSetItem(id: string): Effect.Effect<void, SkillSetItemServiceError>
}

export interface ISkillSetItemLookupPort {
  getById(id: string): Effect.Effect<IbmSkillSetItem | null, SkillSetItemServiceError>
}
