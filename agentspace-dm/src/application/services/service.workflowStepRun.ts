import { Effect } from 'effect'
import { pipe } from 'effect/Function'
import { validateInput, XfErrorFactory, effectErrorInfo } from '@aopslab/xf-core'
import { XfLogger } from '@aopslab/xf-logger'
import type { IRepositoryPortWorkflowStepRun } from '../ports/repository-ports/index.js'
import type { IWorkflowStepRunServicePort } from '../ports/inbound/index.js'
import { WorkflowStepRunServiceError } from '../errors/WorkflowStepRunServiceError.js'
import { IbmWorkflowStepRun, IbmWorkflowStepRunInsert, workflowStepRunZodSchemaInsert } from '../../domain/models/index.js'
import { validateBmInputWithSchema } from './service.zod-validation.js'
import { DbQueryOptions, mapDbError } from '@aopslab/xf-db'

export interface WorkflowStepRunServiceDependencies {}

export interface WorkflowStepRunServiceOptions {
  workflowStepRunRepository: IRepositoryPortWorkflowStepRun
  serviceDependencies?: Partial<WorkflowStepRunServiceDependencies>
  logger?: XfLogger
  locale?: string
}

export class WorkflowStepRunService implements IWorkflowStepRunServicePort {
  private readonly workflowStepRunRepository: IRepositoryPortWorkflowStepRun
  private readonly logger?: XfLogger

  constructor(options: WorkflowStepRunServiceOptions) {
    this.workflowStepRunRepository = options.workflowStepRunRepository
    this.logger = options.logger?.child({ module: this.constructor.name })
  }

  getById(id: string, options?: DbQueryOptions<IbmWorkflowStepRun>): Effect.Effect<IbmWorkflowStepRun | null, WorkflowStepRunServiceError> {
    const stage = 'WorkflowStepRunService::getById'
    return pipe(
      validateInput(id, 'id', { stage }),
      Effect.flatMap((id) => this.workflowStepRunRepository.findById(id, options).pipe(
        Effect.mapError(mapDbError({ stage, operation: 'findById', factory: XfErrorFactory.notFound }))
      )),
      Effect.tapError((e) => Effect.sync(() => {
        const info = effectErrorInfo(e)
        this.logger?.error({ error: info.unwrapped, stage }, 'Error in getById')
      }))
    )
  }

  create(data: IbmWorkflowStepRunInsert): Effect.Effect<IbmWorkflowStepRun, WorkflowStepRunServiceError> {
    const stage = 'WorkflowStepRunService::create'
    return pipe(
      validateInput(data, 'data', { stage }),
      Effect.flatMap((data) =>
        validateBmInputWithSchema({
          input: data,
          schema: workflowStepRunZodSchemaInsert,
          stage,
          operation: 'WorkflowStepRunService::create.workflowStepRunZodSchemaInsert',
          field: 'data',
        })
      ),
      Effect.flatMap((data) => this.workflowStepRunRepository.create(data).pipe(
        Effect.mapError(mapDbError({ stage, operation: 'create', factory: XfErrorFactory.createFailed }))
      ))
    )
  }
}
