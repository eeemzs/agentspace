import { XfError, XfUpsertError, WithBaseErrorFields } from '@aopslab/xf-core'
import { RepositoryError } from '@aopslab/xf-db'
import { Data } from 'effect'

export enum ProjectSummaryErrorCode {
  NotFound = "NotFound",
  CreateFailed = "CreateFailed",
  UpdateFailed = "UpdateFailed",
  DeleteFailed = "DeleteFailed",
  //==> domain-specific error codes
  // CustomError = "CustomError",
  //<==//
}

export const ProjectSummaryErrorTag = {
  Domain: 'ProjectSummaryDomainError',
} as const

export class ProjectSummaryDomainError extends Data.TaggedError(ProjectSummaryErrorTag.Domain)<WithBaseErrorFields<{ id?: string }>> {}

export type ProjectSummaryServiceError = ProjectSummaryDomainError | XfError | RepositoryError | XfUpsertError

