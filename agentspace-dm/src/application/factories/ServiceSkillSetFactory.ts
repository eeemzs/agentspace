import { Effect } from 'effect'
import { getParent } from '@aopslab/xf-logger'
import type { ISkillSetServicePort } from '../ports/inbound/index.js'
import { ServiceBuilderSkillSet, type SkillSetServiceFactoryConfig, type SkillSetServiceFactoryOverrides, type SkillSetServiceFactoryDependencies } from './ServiceSkillSetBuilder.js'
import { SkillSetServiceError } from '../errors/SkillSetServiceError.js'

export const ServiceFactorySkillSet = {
  create({
    config,
    overrides = {},
    dependencies = {},
  }: {
    config: SkillSetServiceFactoryConfig;
    overrides?: SkillSetServiceFactoryOverrides;
    dependencies?: Partial<SkillSetServiceFactoryDependencies>;
  }): Effect.Effect<ISkillSetServicePort, SkillSetServiceError> {
    config.logger?.child({ module: 'ServiceFactorySkillSet', parent: getParent(config.logger) }, { level: config.logLevel ?? 'info' })
    return Effect.gen(function* (_) {
      const builder = ServiceBuilderSkillSet.create()
        .withConfig(config)
        .withOverrides(overrides)
        .withServiceDependencies(dependencies)
      return yield* _(builder.build())
    })
  },
  builder() {
    return ServiceBuilderSkillSet.create()
  },
}
