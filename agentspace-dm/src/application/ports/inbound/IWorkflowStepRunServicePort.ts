import { Effect } from 'effect'
import { WorkflowStepRunServiceError } from '../../errors/WorkflowStepRunServiceError.js'
import { IbmWorkflowStepRun, IbmWorkflowStepRunInsert } from '../../../domain/models/index.js'
import { DbQueryOptions } from '@aopslab/xf-db'

export interface WorkflowStepRunListFilter {
  workspaceId?: string
  projectId?: string
  workflowId?: string
  workflowInstanceId?: string
  stepId?: string
  kind?: string
  status?: string
  agentRunId?: string
  approvalId?: string
  childWorkflowId?: string
  childWorkflowInstanceId?: string
}

export interface IWorkflowStepRunServicePort {
  getById(id: string, options?: DbQueryOptions<IbmWorkflowStepRun>): Effect.Effect<IbmWorkflowStepRun | null, WorkflowStepRunServiceError>
  create(data: IbmWorkflowStepRunInsert): Effect.Effect<IbmWorkflowStepRun, WorkflowStepRunServiceError>
  listWorkflowStepRuns(
    filter?: WorkflowStepRunListFilter,
    options?: DbQueryOptions<IbmWorkflowStepRun>
  ): Effect.Effect<IbmWorkflowStepRun[], WorkflowStepRunServiceError>
}

export interface IWorkflowStepRunLookupPort {
  getById(id: string): Effect.Effect<IbmWorkflowStepRun | null, WorkflowStepRunServiceError>
}
