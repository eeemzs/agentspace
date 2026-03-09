import { Effect } from 'effect'
import { DbQueryOptions } from '@aopslab/xf-db'
import { WorkflowDefinitionServiceError } from '../../errors/WorkflowDefinitionServiceError.js'
import { IbmWorkflowDefinition, IbmWorkflowDefinitionInsert } from '../../../domain/models/index.js'

export interface WorkflowDefinitionListFilter {
  workspaceId?: string
  projectId?: string
  definitionId?: string
  mode?: string
  subjectType?: string
}

export interface WorkflowDefinitionUpsertInput extends IbmWorkflowDefinitionInsert {
  matchEq?: Partial<Pick<IbmWorkflowDefinition, 'workspaceId' | 'projectId' | 'definitionId' | 'mode' | 'subjectType'>>
}

export interface IWorkflowDefinitionServicePort {
  getById(
    id: string,
    options?: DbQueryOptions<IbmWorkflowDefinition>
  ): Effect.Effect<IbmWorkflowDefinition | null, WorkflowDefinitionServiceError>
  create(data: IbmWorkflowDefinitionInsert): Effect.Effect<IbmWorkflowDefinition, WorkflowDefinitionServiceError>
  listWorkflowDefinitions(
    filter?: WorkflowDefinitionListFilter,
    options?: DbQueryOptions<IbmWorkflowDefinition>
  ): Effect.Effect<IbmWorkflowDefinition[], WorkflowDefinitionServiceError>
  upsertWorkflowDefinition(
    data: WorkflowDefinitionUpsertInput
  ): Effect.Effect<IbmWorkflowDefinition, WorkflowDefinitionServiceError>
}

export interface IWorkflowDefinitionLookupPort {
  getById(id: string): Effect.Effect<IbmWorkflowDefinition | null, WorkflowDefinitionServiceError>
}
