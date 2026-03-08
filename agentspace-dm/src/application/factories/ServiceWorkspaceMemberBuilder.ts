/* eslint-disable @typescript-eslint/no-this-alias */
import { Effect } from 'effect'
import { XfConfigurationError } from '@aopslab/xf-core'
import { LocaleOptions, RepositoryCreateParams } from '@aopslab/xf-dm'
import { getParent, XfLogger } from '@aopslab/xf-logger'
import { RedisConfig } from '@aopslab/xf-db-redis'
import { RepositoryConfig } from '@aopslab/xf-db'
import type { IWorkspaceMemberServicePort } from '../ports/inbound/index.js'
import type { IRepositoryPortWorkspaceMember } from '../ports/repository-ports/index.js'
import { WorkspaceMemberService, type WorkspaceMemberServiceOptions } from '../services/index.js'
import { WorkspaceMemberServiceError } from '../errors/WorkspaceMemberServiceError.js'
import { RepositoryFactoryWorkspaceMember } from './RepositoryFactoryWorkspaceMember.js'

export interface WorkspaceMemberServiceFactoryConfig {
  repositoryConfig?: RepositoryConfig
  redisConfig?: RedisConfig
  options?: LocaleOptions
  logger?: XfLogger
  logLevel?: string
  //==> custom-factory-config
  // Add domain-specific config fields here (e.g., ttlSec, feature flags).
  //<==//
}

export interface WorkspaceMemberServiceFactoryOverrides {
  workspaceMemberRepository?: IRepositoryPortWorkspaceMember
  //==> custom-factory-overrides
  // Add domain-specific overrides here (e.g., dependent services).
  //<==//
}

export class ServiceBuilderWorkspaceMember {
  private config?: WorkspaceMemberServiceFactoryConfig
  private overrides: WorkspaceMemberServiceFactoryOverrides = {}
  private logLevel?: string

  static create(): ServiceBuilderWorkspaceMember {
    return new ServiceBuilderWorkspaceMember()
  }

  withConfig(config: WorkspaceMemberServiceFactoryConfig): this {
    this.config = config
    return this
  }

  withRepository(repository: IRepositoryPortWorkspaceMember): this {
    this.overrides.workspaceMemberRepository = repository
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

  withOverrides(overrides: WorkspaceMemberServiceFactoryOverrides): this {
    this.overrides = { ...this.overrides, ...overrides }
    return this
  }

  build(): Effect.Effect<IWorkspaceMemberServicePort, WorkspaceMemberServiceError> {
    const self = this
    return Effect.gen(function* (_) {
      if (!self.config && !self.overrides.workspaceMemberRepository) {
        return yield* _(
          Effect.fail(
            new XfConfigurationError({
              message: 'repository override veya repositoryConfig sağlamanız gerekiyor',
              operation: 'build',
              stage: 'ServiceBuilderWorkspaceMember::build',
            })
          )
        )
      }

      const config = self.config ?? {}
      const effectiveLogLevel = self.logLevel ?? config.logLevel ?? 'info'

      const logger = config.logger?.child(
        { module: 'ServiceBuilderWorkspaceMember', parent: getParent(config.logger) },
        { level: effectiveLogLevel },
      )

      let workspaceMemberRepository: IRepositoryPortWorkspaceMember;
      if (self.overrides.workspaceMemberRepository) {
        workspaceMemberRepository = self.overrides.workspaceMemberRepository as IRepositoryPortWorkspaceMember
      } else {
        if (!config.repositoryConfig) {
          return yield* _(
            Effect.fail(
              new XfConfigurationError({
                message: 'Repository konfigürasyonu gerekli. withConfig() sonrası repositoryConfig ayarlayın.',
                stage: 'ServiceBuilderWorkspaceMember::build',
              })
            )
          )
        }

        const repositoryParams: RepositoryCreateParams = {
          repositoryConfig: config.repositoryConfig,
          redisConfig: config.redisConfig,
          logger,
        };

        workspaceMemberRepository = yield* _(
          Effect.mapError(
            RepositoryFactoryWorkspaceMember.create(repositoryParams),
            (error) =>
              new XfConfigurationError({
                message: `RepositoryFactoryWorkspaceMember.create başarısız: ${(error as any)?.message ?? 'unknown'}`,
                stage: 'ServiceBuilderWorkspaceMember::build',
                cause: error,
              }),
          ),
        )
      }

      const serviceOptions: WorkspaceMemberServiceOptions = {
        workspaceMemberRepository,
        logger,
        //==> custom-service-options
        // Map factory config / overrides to service options here.
        //<==//
      };

      const service = new WorkspaceMemberService(serviceOptions)
      yield* _(Effect.sync(() => logger?.debug(`Service created: ${service.constructor.name}`)))
      return service as IWorkspaceMemberServicePort
    })
  }
}
