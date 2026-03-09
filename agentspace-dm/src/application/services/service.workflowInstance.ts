import { Effect } from 'effect'
import { pipe } from 'effect/Function'
import { validateInput, XfErrorFactory, effectErrorInfo } from '@aopslab/xf-core'
import { XfLogger } from '@aopslab/xf-logger'
import type { IRepositoryPortWorkflowInstance } from '../ports/repository-ports/index.js'
import type { IWorkflowInstanceServicePort } from '../ports/inbound/index.js'
import { WorkflowInstanceServiceError } from '../errors/WorkflowInstanceServiceError.js'
import { IbmWorkflowInstance, IbmWorkflowInstanceInsert, workflowInstanceZodSchemaInsert } from '../../domain/models/index.js'
import { validateBmInputWithSchema } from './service.zod-validation.js'
import { DbQueryOptions, mapDbError } from '@aopslab/xf-db'

export interface WorkflowInstanceServiceDependencies {}

export interface WorkflowInstanceServiceOptions {
  workflowInstanceRepository: IRepositoryPortWorkflowInstance
  serviceDependencies?: Partial<WorkflowInstanceServiceDependencies>
  logger?: XfLogger
  locale?: string
}

export class WorkflowInstanceService implements IWorkflowInstanceServicePort {
  private readonly workflowInstanceRepository: IRepositoryPortWorkflowInstance
  private readonly logger?: XfLogger

  constructor(options: WorkflowInstanceServiceOptions) {
    this.workflowInstanceRepository = options.workflowInstanceRepository
    this.logger = options.logger?.child({ module: this.constructor.name })
  }

  getById(id: string, options?: DbQueryOptions<IbmWorkflowInstance>): Effect.Effect<IbmWorkflowInstance | null, WorkflowInstanceServiceError> {
    const stage = 'WorkflowInstanceService::getById'
    return pipe(
      validateInput(id, 'id', { stage }),
      Effect.flatMap((id) => this.workflowInstanceRepository.findById(id, options).pipe(
        Effect.mapError(mapDbError({ stage, operation: 'findById', factory: XfErrorFactory.notFound }))
      )),
      Effect.tapError((e) => Effect.sync(() => {
        const info = effectErrorInfo(e)
        this.logger?.error({ error: info.unwrapped, stage }, 'Error in getById')
      }))
    )
  }

  create(data: IbmWorkflowInstanceInsert): Effect.Effect<IbmWorkflowInstance, WorkflowInstanceServiceError> {
    const stage = 'WorkflowInstanceService::create'
    return pipe(
      validateInput(data, 'data', { stage }),
      Effect.flatMap((data) =>
        validateBmInputWithSchema({
          input: data,
          schema: workflowInstanceZodSchemaInsert,
          stage,
          operation: 'WorkflowInstanceService::create.workflowInstanceZodSchemaInsert',
          field: 'data',
        })
      ),
      Effect.flatMap((data) => this.workflowInstanceRepository.create(data).pipe(
        Effect.mapError(mapDbError({ stage, operation: 'create', factory: XfErrorFactory.createFailed }))
      ))
    )
  }
}
