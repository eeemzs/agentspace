import { XfError, XfUpsertError, WithBaseErrorFields } from '@aopslab/xf-core'
import { RepositoryError } from '@aopslab/xf-db'
import { Data } from 'effect'

export enum WorkspaceMemberErrorCode {
  NotFound = "NotFound",
  CreateFailed = "CreateFailed",
  UpdateFailed = "UpdateFailed",
  DeleteFailed = "DeleteFailed",
  //==> domain-specific error codes
  // CustomError = "CustomError",
  //<==//
}

export const WorkspaceMemberErrorTag = {
  Domain: 'WorkspaceMemberDomainError',
} as const

export class WorkspaceMemberDomainError extends Data.TaggedError(WorkspaceMemberErrorTag.Domain)<WithBaseErrorFields<{ id?: string }>> {}

export type WorkspaceMemberServiceError = WorkspaceMemberDomainError | XfError | RepositoryError | XfUpsertError
