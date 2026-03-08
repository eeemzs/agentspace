/* eslint-disable @typescript-eslint/no-this-alias */
import { Effect } from 'effect'
import { XfConfigurationError } from '@aopslab/xf-core'
import { LocaleOptions, RepositoryCreateParams } from '@aopslab/xf-dm'
import { getParent, XfLogger } from '@aopslab/xf-logger'
import { RedisConfig } from '@aopslab/xf-db-redis'
import { RepositoryConfig } from '@aopslab/xf-db'
import type { IProjectSummaryServicePort } from '../ports/inbound/index.js'
import type { IRepositoryPortProjectSummary } from '../ports/repository-ports/index.js'
import { ProjectSummaryService, type ProjectSummaryServiceOptions } from '../services/index.js'
import { ProjectSummaryServiceError } from '../errors/ProjectSummaryServiceError.js'
import { RepositoryFactoryProjectSummary } from './RepositoryFactoryProjectSummary.js'

export interface ProjectSummaryServiceFactoryConfig {
  repositoryConfig?: RepositoryConfig
  redisConfig?: RedisConfig
  options?: LocaleOptions
  logger?: XfLogger
  logLevel?: string
  //==> custom-factory-config
  // Add domain-specific config fields here (e.g., ttlSec, feature flags).
  //<==//
}

export interface ProjectSummaryServiceFactoryOverrides {
  projectSummaryRepository?: IRepositoryPortProjectSummary
  //==> custom-factory-overrides
  // Add domain-specific overrides here (e.g., dependent services).
  //<==//
}

export class ServiceBuilderProjectSummary {
  private config?: ProjectSummaryServiceFactoryConfig
  private overrides: ProjectSummaryServiceFactoryOverrides = {}
  private logLevel?: string

  static create(): ServiceBuilderProjectSummary {
    return new ServiceBuilderProjectSummary()
  }

  withConfig(config: ProjectSummaryServiceFactoryConfig): this {
    this.config = config
    return this
  }

  withRepository(repository: IRepositoryPortProjectSummary): this {
    this.overrides.projectSummaryRepository = repository
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

  withOverrides(overrides: ProjectSummaryServiceFactoryOverrides): this {
    this.overrides = { ...this.overrides, ...overrides }
    return this
  }

  build(): Effect.Effect<IProjectSummaryServicePort, ProjectSummaryServiceError> {
    const self = this
    return Effect.gen(function* (_) {
      if (!self.config && !self.overrides.projectSummaryRepository) {
        return yield* _(
          Effect.fail(
            new XfConfigurationError({
              message: 'repository override veya repositoryConfig sağlamanız gerekiyor',
              operation: 'build',
              stage: 'ServiceBuilderProjectSummary::build',
            })
          )
        )
      }

      const config = self.config ?? {}
      const effectiveLogLevel = self.logLevel ?? config.logLevel ?? 'info'

      const logger = config.logger?.child(
        { module: 'ServiceBuilderProjectSummary', parent: getParent(config.logger) },
        { level: effectiveLogLevel },
      )

      let projectSummaryRepository: IRepositoryPortProjectSummary;
      if (self.overrides.projectSummaryRepository) {
        projectSummaryRepository = self.overrides.projectSummaryRepository as IRepositoryPortProjectSummary
      } else {
        if (!config.repositoryConfig) {
          return yield* _(
            Effect.fail(
              new XfConfigurationError({
                message: 'Repository konfigürasyonu gerekli. withConfig() sonrası repositoryConfig ayarlayın.',
                stage: 'ServiceBuilderProjectSummary::build',
              })
            )
          )
        }

        const repositoryParams: RepositoryCreateParams = {
          repositoryConfig: config.repositoryConfig,
          redisConfig: config.redisConfig,
          logger,
        };

        projectSummaryRepository = yield* _(
          Effect.mapError(
            RepositoryFactoryProjectSummary.create(repositoryParams),
            (error) =>
              new XfConfigurationError({
                message: `RepositoryFactoryProjectSummary.create başarısız: ${(error as any)?.message ?? 'unknown'}`,
                stage: 'ServiceBuilderProjectSummary::build',
                cause: error,
              }),
          ),
        )
      }

      const serviceOptions: ProjectSummaryServiceOptions = {
        projectSummaryRepository,
        logger,
        //==> custom-service-options
        // Map factory config / overrides to service options here.
        //<==//
      };

      const service = new ProjectSummaryService(serviceOptions)
      yield* _(Effect.sync(() => logger?.debug(`Service created: ${service.constructor.name}`)))
      return service as IProjectSummaryServicePort
    })
  }
}
