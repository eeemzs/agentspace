import { Effect } from 'effect'
import { getParent } from '@aopslab/xf-logger'
import type { IWorkspaceServicePort } from '../ports/inbound/index.js'
import { ServiceBuilderWorkspace, type WorkspaceServiceFactoryConfig, type WorkspaceServiceFactoryOverrides } from './ServiceWorkspaceBuilder.js'
import { WorkspaceServiceError } from '../errors/WorkspaceServiceError.js'

export const ServiceFactoryWorkspace = {
  create({ config, overrides = {} }: { config: WorkspaceServiceFactoryConfig; overrides?: WorkspaceServiceFactoryOverrides }): Effect.Effect<IWorkspaceServicePort, WorkspaceServiceError> {
    config.logger?.child({ module: 'ServiceFactoryWorkspace', parent: getParent(config.logger) }, { level: config.logLevel ?? 'info' })
    return Effect.gen(function* (_) {
      const builder = ServiceBuilderWorkspace.create().withConfig(config).withOverrides(overrides)
      return yield* _(builder.build())
    })
  },
  builder() {
    return ServiceBuilderWorkspace.create()
  },
}
