import { Effect } from 'effect'
import { getParent } from '@aopslab/xf-logger'
import type { ISkillSetItemServicePort } from '../ports/inbound/index.js'
import { ServiceBuilderSkillSetItem, type SkillSetItemServiceFactoryConfig, type SkillSetItemServiceFactoryOverrides } from './ServiceSkillSetItemBuilder.js'
import { SkillSetItemServiceError } from '../errors/SkillSetItemServiceError.js'

export const ServiceFactorySkillSetItem = {
  create({ config, overrides = {} }: { config: SkillSetItemServiceFactoryConfig; overrides?: SkillSetItemServiceFactoryOverrides }): Effect.Effect<ISkillSetItemServicePort, SkillSetItemServiceError> {
    config.logger?.child({ module: 'ServiceFactorySkillSetItem', parent: getParent(config.logger) }, { level: config.logLevel ?? 'info' })
    return Effect.gen(function* (_) {
      const builder = ServiceBuilderSkillSetItem.create().withConfig(config).withOverrides(overrides)
      return yield* _(builder.build())
    })
  },
  builder() {
    return ServiceBuilderSkillSetItem.create()
  },
}
