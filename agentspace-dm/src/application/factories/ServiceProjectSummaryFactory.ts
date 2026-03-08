import { Effect } from 'effect'
import { getParent } from '@aopslab/xf-logger'
import type { IProjectSummaryServicePort } from '../ports/inbound/index.js'
import { ServiceBuilderProjectSummary, type ProjectSummaryServiceFactoryConfig, type ProjectSummaryServiceFactoryOverrides } from './ServiceProjectSummaryBuilder.js'
import { ProjectSummaryServiceError } from '../errors/ProjectSummaryServiceError.js'

export const ServiceFactoryProjectSummary = {
  create({ config, overrides = {} }: { config: ProjectSummaryServiceFactoryConfig; overrides?: ProjectSummaryServiceFactoryOverrides }): Effect.Effect<IProjectSummaryServicePort, ProjectSummaryServiceError> {
    config.logger?.child({ module: 'ServiceFactoryProjectSummary', parent: getParent(config.logger) }, { level: config.logLevel ?? 'info' })
    return Effect.gen(function* (_) {
      const builder = ServiceBuilderProjectSummary.create().withConfig(config).withOverrides(overrides)
      return yield* _(builder.build())
    })
  },
  builder() {
    return ServiceBuilderProjectSummary.create()
  },
}
