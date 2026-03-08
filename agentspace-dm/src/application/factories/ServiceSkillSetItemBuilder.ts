/* eslint-disable @typescript-eslint/no-this-alias */
import { Effect } from 'effect'
import { XfConfigurationError } from '@aopslab/xf-core'
import { LocaleOptions, RepositoryCreateParams } from '@aopslab/xf-dm'
import { getParent, XfLogger } from '@aopslab/xf-logger'
import { RedisConfig } from '@aopslab/xf-db-redis'
import { RepositoryConfig } from '@aopslab/xf-db'
import type { ISkillSetItemServicePort } from '../ports/inbound/index.js'
import type { IRepositoryPortSkillSetItem } from '../ports/repository-ports/index.js'
import { SkillSetItemService, type SkillSetItemServiceOptions } from '../services/index.js'
import { SkillSetItemServiceError } from '../errors/SkillSetItemServiceError.js'
import { RepositoryFactorySkillSetItem } from './RepositoryFactorySkillSetItem.js'

export interface SkillSetItemServiceFactoryConfig {
  repositoryConfig?: RepositoryConfig
  redisConfig?: RedisConfig
  options?: LocaleOptions
  logger?: XfLogger
  logLevel?: string
  //==> custom-factory-config
  // Add domain-specific config fields here (e.g., ttlSec, feature flags).
  //<==//
}

export interface SkillSetItemServiceFactoryOverrides {
  skillSetItemRepository?: IRepositoryPortSkillSetItem
  //==> custom-factory-overrides
  // Add domain-specific overrides here (e.g., dependent services).
  //<==//
}

export class ServiceBuilderSkillSetItem {
  private config?: SkillSetItemServiceFactoryConfig
  private overrides: SkillSetItemServiceFactoryOverrides = {}
  private logLevel?: string

  static create(): ServiceBuilderSkillSetItem {
    return new ServiceBuilderSkillSetItem()
  }

  withConfig(config: SkillSetItemServiceFactoryConfig): this {
    this.config = config
    return this
  }

  withRepository(repository: IRepositoryPortSkillSetItem): this {
    this.overrides.skillSetItemRepository = repository
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

  withOverrides(overrides: SkillSetItemServiceFactoryOverrides): this {
    this.overrides = { ...this.overrides, ...overrides }
    return this
  }

  build(): Effect.Effect<ISkillSetItemServicePort, SkillSetItemServiceError> {
    const self = this
    return Effect.gen(function* (_) {
      if (!self.config && !self.overrides.skillSetItemRepository) {
        return yield* _(
          Effect.fail(
            new XfConfigurationError({
              message: 'repository override veya repositoryConfig sağlamanız gerekiyor',
              operation: 'build',
              stage: 'ServiceBuilderSkillSetItem::build',
            })
          )
        )
      }

      const config = self.config ?? {}
      const effectiveLogLevel = self.logLevel ?? config.logLevel ?? 'info'

      const logger = config.logger?.child(
        { module: 'ServiceBuilderSkillSetItem', parent: getParent(config.logger) },
        { level: effectiveLogLevel },
      )

      let skillSetItemRepository: IRepositoryPortSkillSetItem;
      if (self.overrides.skillSetItemRepository) {
        skillSetItemRepository = self.overrides.skillSetItemRepository as IRepositoryPortSkillSetItem
      } else {
        if (!config.repositoryConfig) {
          return yield* _(
            Effect.fail(
              new XfConfigurationError({
                message: 'Repository konfigürasyonu gerekli. withConfig() sonrası repositoryConfig ayarlayın.',
                stage: 'ServiceBuilderSkillSetItem::build',
              })
            )
          )
        }

        const repositoryParams: RepositoryCreateParams = {
          repositoryConfig: config.repositoryConfig,
          redisConfig: config.redisConfig,
          logger,
        };

        skillSetItemRepository = yield* _(
          Effect.mapError(
            RepositoryFactorySkillSetItem.create(repositoryParams),
            (error) =>
              new XfConfigurationError({
                message: `RepositoryFactorySkillSetItem.create başarısız: ${(error as any)?.message ?? 'unknown'}`,
                stage: 'ServiceBuilderSkillSetItem::build',
                cause: error,
              }),
          ),
        )
      }

      const serviceOptions: SkillSetItemServiceOptions = {
        skillSetItemRepository,
        logger,
        //==> custom-service-options
        // Map factory config / overrides to service options here.
        //<==//
      };

      const service = new SkillSetItemService(serviceOptions)
      yield* _(Effect.sync(() => logger?.debug(`Service created: ${service.constructor.name}`)))
      return service as ISkillSetItemServicePort
    })
  }
}
