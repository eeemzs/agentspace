import { Effect } from 'effect'
import { SkillSetServiceError } from '../../errors/SkillSetServiceError.js'
import { IbmSkillSet, IbmSkillSetInsert, IbmSkillSetItem } from '../../../domain/models/index.js'
import { DbQueryOptions } from '@aopslab/xf-db'
import type { SkillSetItemCreateInput } from './ISkillSetItemServicePort.js'

export interface ISkillSetServicePort {
  getById(id: string, options?: DbQueryOptions<IbmSkillSet>): Effect.Effect<IbmSkillSet | null, SkillSetServiceError>
  create(data: IbmSkillSetInsert): Effect.Effect<IbmSkillSet, SkillSetServiceError>
  listSkillSets(filter?: Partial<IbmSkillSet>, options?: DbQueryOptions<IbmSkillSet>): Effect.Effect<IbmSkillSet[], SkillSetServiceError>
  updateSkillSet(id: string, patch: Partial<IbmSkillSet>): Effect.Effect<IbmSkillSet, SkillSetServiceError>
  addSkillVersionToSkillSet(data: SkillSetItemCreateInput): Effect.Effect<IbmSkillSetItem, SkillSetServiceError>
  removeSkillVersionFromSkillSet(
    skillSetId: string,
    skillVersionId: string
  ): Effect.Effect<IbmSkillSetItem, SkillSetServiceError>
  reorderSkillSetItems(skillSetId: string, orderedItemIds: string[]): Effect.Effect<number, SkillSetServiceError>
}

export interface ISkillSetLookupPort {
  getById(id: string): Effect.Effect<IbmSkillSet | null, SkillSetServiceError>
}
