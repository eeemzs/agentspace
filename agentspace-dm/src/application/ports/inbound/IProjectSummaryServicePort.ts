import { Effect } from 'effect'
import { ProjectSummaryServiceError } from '../../errors/ProjectSummaryServiceError.js'
import { IbmProjectSummary, IbmProjectSummaryInsert } from '../../../domain/models/index.js'
import { DbQueryOptions } from '@aopslab/xf-db'

export type ProjectSummaryUpsertInput = Omit<IbmProjectSummaryInsert, 'projectId'> & {
  projectId: string
}

export interface IProjectSummaryServicePort {
  getById(id: string, options?: DbQueryOptions<IbmProjectSummary>): Effect.Effect<IbmProjectSummary | null, ProjectSummaryServiceError>
  create(data: IbmProjectSummaryInsert): Effect.Effect<IbmProjectSummary, ProjectSummaryServiceError>
  getProjectSummary(projectId: string): Effect.Effect<IbmProjectSummary | null, ProjectSummaryServiceError>
  upsertProjectSummary(data: ProjectSummaryUpsertInput): Effect.Effect<IbmProjectSummary, ProjectSummaryServiceError>
  appendDecision(projectId: string, decision: unknown, lastRunId?: string, lastSessionId?: string): Effect.Effect<IbmProjectSummary, ProjectSummaryServiceError>
  setOpenItems(projectId: string, openItems: unknown, lastRunId?: string, lastSessionId?: string): Effect.Effect<IbmProjectSummary, ProjectSummaryServiceError>
}

export interface IProjectSummaryLookupPort {
  getById(id: string): Effect.Effect<IbmProjectSummary | null, ProjectSummaryServiceError>
}
