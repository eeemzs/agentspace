import { XfError, XfUpsertError, WithBaseErrorFields } from '@aopslab/xf-core'
import { RepositoryError } from '@aopslab/xf-db'
import { Data } from 'effect'

export enum WorkspaceErrorCode {
  NotFound = "NotFound",
  CreateFailed = "CreateFailed",
  UpdateFailed = "UpdateFailed",
  DeleteFailed = "DeleteFailed",
  //==> domain-specific error codes
  // CustomError = "CustomError",
  //<==//
}

export const WorkspaceErrorTag = {
  Domain: 'WorkspaceDomainError',
} as const

export class WorkspaceDomainError extends Data.TaggedError(WorkspaceErrorTag.Domain)<WithBaseErrorFields<{ id?: string }>> {}

export type WorkspaceServiceError = WorkspaceDomainError | XfError | RepositoryError | XfUpsertError
