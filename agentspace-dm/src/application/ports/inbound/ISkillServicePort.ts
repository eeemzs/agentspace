import { Effect } from 'effect'
import { SkillServiceError } from '../../errors/SkillServiceError.js'
import { IbmSkill, IbmSkillInsert } from '../../../domain/models/index.js'
import { DbQueryOptions } from '@aopslab/xf-db'

export interface ISkillServicePort {
  getById(id: string, options?: DbQueryOptions<IbmSkill>): Effect.Effect<IbmSkill | null, SkillServiceError>
  create(data: IbmSkillInsert): Effect.Effect<IbmSkill, SkillServiceError>
  getSkill(id: string, options?: DbQueryOptions<IbmSkill>): Effect.Effect<IbmSkill | null, SkillServiceError>
  listSkills(filter?: Partial<IbmSkill>, options?: DbQueryOptions<IbmSkill>): Effect.Effect<IbmSkill[], SkillServiceError>
  updateSkill(id: string, patch: Partial<IbmSkill>): Effect.Effect<IbmSkill, SkillServiceError>
  removeSkill(id: string): Effect.Effect<void, SkillServiceError>
}

export interface ISkillLookupPort {
  getById(id: string): Effect.Effect<IbmSkill | null, SkillServiceError>
}
