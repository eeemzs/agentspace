import { XfError, XfUpsertError, WithBaseErrorFields } from '@aopslab/xf-core'
import { RepositoryError } from '@aopslab/xf-db'
import { Data } from 'effect'

export enum SkillSetErrorCode {
  NotFound = "NotFound",
  CreateFailed = "CreateFailed",
  UpdateFailed = "UpdateFailed",
  DeleteFailed = "DeleteFailed",
  //==> domain-specific error codes
  // CustomError = "CustomError",
  //<==//
}

export const SkillSetErrorTag = {
  Domain: 'SkillSetDomainError',
} as const

export class SkillSetDomainError extends Data.TaggedError(SkillSetErrorTag.Domain)<WithBaseErrorFields<{ id?: string }>> {}

export type SkillSetServiceError = SkillSetDomainError | XfError | RepositoryError | XfUpsertError

