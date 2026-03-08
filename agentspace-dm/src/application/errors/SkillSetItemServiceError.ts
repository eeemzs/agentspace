import { XfError, XfUpsertError, WithBaseErrorFields } from '@aopslab/xf-core'
import { RepositoryError } from '@aopslab/xf-db'
import { Data } from 'effect'

export enum SkillSetItemErrorCode {
  NotFound = "NotFound",
  CreateFailed = "CreateFailed",
  UpdateFailed = "UpdateFailed",
  DeleteFailed = "DeleteFailed",
  //==> domain-specific error codes
  // CustomError = "CustomError",
  //<==//
}

export const SkillSetItemErrorTag = {
  Domain: 'SkillSetItemDomainError',
} as const

export class SkillSetItemDomainError extends Data.TaggedError(SkillSetItemErrorTag.Domain)<WithBaseErrorFields<{ id?: string }>> {}

export type SkillSetItemServiceError = SkillSetItemDomainError | XfError | RepositoryError | XfUpsertError

