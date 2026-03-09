import { Effect } from 'effect'
import { WorkflowInstanceServiceError } from '../../errors/WorkflowInstanceServiceError.js'
import { IbmWorkflowInstance, IbmWorkflowInstanceInsert } from '../../../domain/models/index.js'
import { DbQueryOptions } from '@aopslab/xf-db'

export interface IWorkflowInstanceServicePort {
  getById(id: string, options?: DbQueryOptions<IbmWorkflowInstance>): Effect.Effect<IbmWorkflowInstance | null, WorkflowInstanceServiceError>
  create(data: IbmWorkflowInstanceInsert): Effect.Effect<IbmWorkflowInstance, WorkflowInstanceServiceError>
}

export interface IWorkflowInstanceLookupPort {
  getById(id: string): Effect.Effect<IbmWorkflowInstance | null, WorkflowInstanceServiceError>
}
