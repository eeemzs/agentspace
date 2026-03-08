import { Effect } from 'effect'
import { getParent } from '@aopslab/xf-logger'
import type { IWorkspaceMemberServicePort } from '../ports/inbound/index.js'
import { ServiceBuilderWorkspaceMember, type WorkspaceMemberServiceFactoryConfig, type WorkspaceMemberServiceFactoryOverrides } from './ServiceWorkspaceMemberBuilder.js'
import { WorkspaceMemberServiceError } from '../errors/WorkspaceMemberServiceError.js'

export const ServiceFactoryWorkspaceMember = {
  create({ config, overrides = {} }: { config: WorkspaceMemberServiceFactoryConfig; overrides?: WorkspaceMemberServiceFactoryOverrides }): Effect.Effect<IWorkspaceMemberServicePort, WorkspaceMemberServiceError> {
    config.logger?.child({ module: 'ServiceFactoryWorkspaceMember', parent: getParent(config.logger) }, { level: config.logLevel ?? 'info' })
    return Effect.gen(function* (_) {
      const builder = ServiceBuilderWorkspaceMember.create().withConfig(config).withOverrides(overrides)
      return yield* _(builder.build())
    })
  },
  builder() {
    return ServiceBuilderWorkspaceMember.create()
  },
}
