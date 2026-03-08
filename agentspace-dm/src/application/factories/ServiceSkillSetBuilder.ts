/* eslint-disable @typescript-eslint/no-this-alias */
import { Effect } from 'effect'
import { XfConfigurationError } from '@aopslab/xf-core'
import { LocaleOptions, RepositoryCreateParams } from '@aopslab/xf-dm'
import { getParent, XfLogger } from '@aopslab/xf-logger'
import { RedisConfig } from '@aopslab/xf-db-redis'
import { RepositoryConfig } from '@aopslab/xf-db'
import type { ISkillSetServicePort, ISkillSetItemServicePort } from '../ports/inbound/index.js'
import type { IRepositoryPortSkillSet } from '../ports/repository-ports/index.js'
import { SkillSetService, type SkillSetServiceOptions } from '../services/index.js'
import { SkillSetServiceError } from '../errors/SkillSetServiceError.js'
import { RepositoryFactorySkillSet } from './RepositoryFactorySkillSet.js'

export interface SkillSetServiceFactoryConfig {
  repositoryConfig?: RepositoryConfig
  redisConfig?: RedisConfig
  options?: LocaleOptions
  logger?: XfLogger
  logLevel?: string
  //==> custom-factory-config
  // Add domain-specific config fields here (e.g., ttlSec, feature flags).
  //<==//
}

export interface SkillSetServiceFactoryOverrides {
  skillSetRepository?: IRepositoryPortSkillSet
  //==> custom-factory-overrides
  // Add domain-specific overrides here (e.g., dependent services).
  //<==//
}

export interface SkillSetServiceFactoryDependencies {
  skillSetItemService?: ISkillSetItemServicePort
}

export class ServiceBuilderSkillSet {
  private serviceDependencies: Partial<SkillSetServiceFactoryDependencies> = {}
  private config?: SkillSetServiceFactoryConfig
  private overrides: SkillSetServiceFactoryOverrides = {}
  private logLevel?: string

  static create(): ServiceBuilderSkillSet {
    return new ServiceBuilderSkillSet()
  }

  withConfig(config: SkillSetServiceFactoryConfig): this {
    this.config = config
    return this
  }

  withRepository(repository: IRepositoryPortSkillSet): this {
    this.overrides.skillSetRepository = repository
    return this
  }

  withServiceDependencies(dependencies: Partial<SkillSetServiceFactoryDependencies>): this {
    this.serviceDependencies = { ...this.serviceDependencies, ...dependencies }
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

  withOverrides(overrides: SkillSetServiceFactoryOverrides): this {
    this.overrides = { ...this.overrides, ...overrides }
    return this
  }

  build(): Effect.Effect<ISkillSetServicePort, SkillSetServiceError> {
    const self = this
    return Effect.gen(function* (_) {
      if (!self.config && !self.overrides.skillSetRepository) {
        return yield* _(
          Effect.fail(
            new XfConfigurationError({
              message: 'repository override veya repositoryConfig sağlamanız gerekiyor',
              operation: 'build',
              stage: 'ServiceBuilderSkillSet::build',
            })
          )
        )
      }

      const config = self.config ?? {}
      const effectiveLogLevel = self.logLevel ?? config.logLevel ?? 'info'

      const logger = config.logger?.child(
        { module: 'ServiceBuilderSkillSet', parent: getParent(config.logger) },
        { level: effectiveLogLevel },
      )

      let skillSetRepository: IRepositoryPortSkillSet;
      if (self.overrides.skillSetRepository) {
        skillSetRepository = self.overrides.skillSetRepository as IRepositoryPortSkillSet
      } else {
        if (!config.repositoryConfig) {
          return yield* _(
            Effect.fail(
              new XfConfigurationError({
                message: 'Repository konfigürasyonu gerekli. withConfig() sonrası repositoryConfig ayarlayın.',
                stage: 'ServiceBuilderSkillSet::build',
              })
            )
          )
        }

        const repositoryParams: RepositoryCreateParams = {
          repositoryConfig: config.repositoryConfig,
          redisConfig: config.redisConfig,
          logger,
        };

        skillSetRepository = yield* _(
          Effect.mapError(
            RepositoryFactorySkillSet.create(repositoryParams),
            (error) =>
              new XfConfigurationError({
                message: `RepositoryFactorySkillSet.create başarısız: ${(error as any)?.message ?? 'unknown'}`,
                stage: 'ServiceBuilderSkillSet::build',
                cause: error,
              }),
          ),
        )
      }

      if (!self.serviceDependencies.skillSetItemService) {
        return yield* _(
          Effect.fail(
            new XfConfigurationError({
              message: 'SkillSetItemService dependency olarak saglanmali.',
              stage: 'ServiceBuilderSkillSet::build',
            })
          )
        )
      }

      const serviceOptions: SkillSetServiceOptions = {
        skillSetRepository,
        skillSetItemService: self.serviceDependencies.skillSetItemService as ISkillSetItemServicePort,
        logger,
        //==> custom-service-options
        // Map factory config / overrides to service options here.
        //<==//
      };

      const service = new SkillSetService(serviceOptions)
      yield* _(Effect.sync(() => logger?.debug(`Service created: ${service.constructor.name}`)))
      return service as ISkillSetServicePort
    })
  }
}
