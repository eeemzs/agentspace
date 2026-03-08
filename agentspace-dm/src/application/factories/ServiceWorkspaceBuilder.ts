/* eslint-disable @typescript-eslint/no-this-alias */
import { Effect } from 'effect'
import { XfConfigurationError } from '@aopslab/xf-core'
import { LocaleOptions, RepositoryCreateParams } from '@aopslab/xf-dm'
import { getParent, XfLogger } from '@aopslab/xf-logger'
import { RedisConfig } from '@aopslab/xf-db-redis'
import { RepositoryConfig } from '@aopslab/xf-db'
import type { IWorkspaceServicePort } from '../ports/inbound/index.js'
import type { IRepositoryPortWorkspace } from '../ports/repository-ports/index.js'
import { WorkspaceService, type WorkspaceServiceOptions } from '../services/index.js'
import { WorkspaceServiceError } from '../errors/WorkspaceServiceError.js'
import { RepositoryFactoryWorkspace } from './RepositoryFactoryWorkspace.js'

export interface WorkspaceServiceFactoryConfig {
  repositoryConfig?: RepositoryConfig
  redisConfig?: RedisConfig
  options?: LocaleOptions
  logger?: XfLogger
  logLevel?: string
  //==> custom-factory-config
  // Add domain-specific config fields here (e.g., ttlSec, feature flags).
  //<==//
}

export interface WorkspaceServiceFactoryOverrides {
  workspaceRepository?: IRepositoryPortWorkspace
  //==> custom-factory-overrides
  // Add domain-specific overrides here (e.g., dependent services).
  //<==//
}

export class ServiceBuilderWorkspace {
  private config?: WorkspaceServiceFactoryConfig
  private overrides: WorkspaceServiceFactoryOverrides = {}
  private logLevel?: string

  static create(): ServiceBuilderWorkspace {
    return new ServiceBuilderWorkspace()
  }

  withConfig(config: WorkspaceServiceFactoryConfig): this {
    this.config = config
    return this
  }

  withRepository(repository: IRepositoryPortWorkspace): this {
    this.overrides.workspaceRepository = repository
    return this
  }

  withLogger(logger?: XfLogger): this {
    if (this.config) {
      this.config.logger = logger
    }
    return this
  }

  withLogLevel(logLevel?: string): this {
    this.logLevel = logLevel
    return this
  }

  withOverrides(overrides: WorkspaceServiceFactoryOverrides): this {
    this.overrides = { ...this.overrides, ...overrides }
    return this
  }

  build(): Effect.Effect<IWorkspaceServicePort, WorkspaceServiceError> {
    const self = this
    return Effect.gen(function* (_) {
      if (!self.config && !self.overrides.workspaceRepository) {
        return yield* _(
          Effect.fail(
            new XfConfigurationError({
              message: 'repository override veya repositoryConfig sağlamanız gerekiyor',
              operation: 'build',
              stage: 'ServiceBuilderWorkspace::build',
            })
          )
        )
      }

      const config = self.config ?? {}
      const effectiveLogLevel = self.logLevel ?? config.logLevel ?? 'info'

      const logger = config.logger?.child(
        { module: 'ServiceBuilderWorkspace', parent: getParent(config.logger) },
        { level: effectiveLogLevel },
      )

      let workspaceRepository: IRepositoryPortWorkspace;
      if (self.overrides.workspaceRepository) {
        workspaceRepository = self.overrides.workspaceRepository as IRepositoryPortWorkspace
      } else {
        if (!config.repositoryConfig) {
          return yield* _(
            Effect.fail(
              new XfConfigurationError({
                message: 'Repository konfigürasyonu gerekli. withConfig() sonrası repositoryConfig ayarlayın.',
                stage: 'ServiceBuilderWorkspace::build',
              })
            )
          )
        }

        const repositoryParams: RepositoryCreateParams = {
          repositoryConfig: config.repositoryConfig,
          redisConfig: config.redisConfig,
          logger,
        };

        workspaceRepository = yield* _(
          Effect.mapError(
            RepositoryFactoryWorkspace.create(repositoryParams),
            (error) =>
              new XfConfigurationError({
                message: `RepositoryFactoryWorkspace.create başarısız: ${(error as any)?.message ?? 'unknown'}`,
                stage: 'ServiceBuilderWorkspace::build',
                cause: error,
              }),
          ),
        )
      }

      const serviceOptions: WorkspaceServiceOptions = {
        workspaceRepository,
        logger,
        //==> custom-service-options
        // Map factory config / overrides to service options here.
        //<==//
      };

      const service = new WorkspaceService(serviceOptions)
      yield* _(Effect.sync(() => logger?.debug(`Service created: ${service.constructor.name}`)))
      return service as IWorkspaceServicePort
    })
  }
}
