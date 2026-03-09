import type { XfLogger } from '@aopslab/xf-logger'
import { Effect } from 'effect'
import {
  cacheKeyFromLocale,
  CountersMetricsCollector,
  LoggerMetricsCollector,
  MultiMetricsCollector,
  inferRepoType,
  parseEnvConfig,
} from '@aopslab/xf-dm-kits'

import type { AgentspaceKitEnvConfig } from '../config/config.js'
import type { AgentspaceKitProvider, AgentspaceKitProviderOptions, AgentspaceKitContext, AgentspaceKitStaticConfig } from './types.js'
import { createAgentspaceKitProvider } from './provider.js'

export interface CreateAgentspaceKitOptions extends Omit<AgentspaceKitProviderOptions, 'getCacheKey'> {
  name?: string
  getCacheKey?: (context: AgentspaceKitContext) => string | null
}

export function createAgentspaceKit(options: CreateAgentspaceKitOptions) {
  const provider: AgentspaceKitProvider = createAgentspaceKitProvider({
    ...options,
    getCacheKey: options.getCacheKey ?? ((ctx) => cacheKeyFromLocale(ctx.locale, ctx.fallbackLocale)),
  })

  return {
    getStaticConfig(): AgentspaceKitStaticConfig {
      return options.staticConfig
    },
    getProjectService: provider.getProjectService,
    createProjectService: provider.createProjectService,
    getProjectPathService: provider.getProjectPathService,
    createProjectPathService: provider.createProjectPathService,
    getWorkspaceService: provider.getWorkspaceService,
    createWorkspaceService: provider.createWorkspaceService,
    getWorkspaceMemberService: provider.getWorkspaceMemberService,
    createWorkspaceMemberService: provider.createWorkspaceMemberService,
    getProjectMemberService: provider.getProjectMemberService,
    createProjectMemberService: provider.createProjectMemberService,
    getPromptService: provider.getPromptService,
    createPromptService: provider.createPromptService,
    getPromptVersionService: provider.getPromptVersionService,
    createPromptVersionService: provider.createPromptVersionService,
    getResourceService: provider.getResourceService,
    createResourceService: provider.createResourceService,
    getSkillService: provider.getSkillService,
    createSkillService: provider.createSkillService,
    getSkillVersionService: provider.getSkillVersionService,
    createSkillVersionService: provider.createSkillVersionService,
    getSkillSetService: provider.getSkillSetService,
    createSkillSetService: provider.createSkillSetService,
    getSkillSetItemService: provider.getSkillSetItemService,
    createSkillSetItemService: provider.createSkillSetItemService,
    getKanbanBoardService: provider.getKanbanBoardService,
    createKanbanBoardService: provider.createKanbanBoardService,
    getKanbanColumnService: provider.getKanbanColumnService,
    createKanbanColumnService: provider.createKanbanColumnService,
    getSprintService: provider.getSprintService,
    createSprintService: provider.createSprintService,
    getSprintItemService: provider.getSprintItemService,
    createSprintItemService: provider.createSprintItemService,
    getTaskService: provider.getTaskService,
    createTaskService: provider.createTaskService,
    getTaskCommentService: provider.getTaskCommentService,
    createTaskCommentService: provider.createTaskCommentService,
    getAgentSessionService: provider.getAgentSessionService,
    createAgentSessionService: provider.createAgentSessionService,
    getAgentRunService: provider.getAgentRunService,
    createAgentRunService: provider.createAgentRunService,
    getAgentRunEventService: provider.getAgentRunEventService,
    createAgentRunEventService: provider.createAgentRunEventService,
    getArtifactService: provider.getArtifactService,
    createArtifactService: provider.createArtifactService,
    getArtifactLinkService: provider.getArtifactLinkService,
    createArtifactLinkService: provider.createArtifactLinkService,
    getCodexChatThreadService: provider.getCodexChatThreadService,
    createCodexChatThreadService: provider.createCodexChatThreadService,
    getCodexChatMessageService: provider.getCodexChatMessageService,
    createCodexChatMessageService: provider.createCodexChatMessageService,
    getCodexChatSettingService: provider.getCodexChatSettingService,
    createCodexChatSettingService: provider.createCodexChatSettingService,
    getProjectSummaryService: provider.getProjectSummaryService,
    createProjectSummaryService: provider.createProjectSummaryService,
    getMemoryItemService: provider.getMemoryItemService,
    createMemoryItemService: provider.createMemoryItemService,
    getTagService: provider.getTagService,
    createTagService: provider.createTagService,
    getWorkflowInstanceService: provider.getWorkflowInstanceService,
    createWorkflowInstanceService: provider.createWorkflowInstanceService,
    getWorkflowStepRunService: provider.getWorkflowStepRunService,
    createWorkflowStepRunService: provider.createWorkflowStepRunService,
    getProjectRepository: provider.getProjectRepository,
    getProjectPathRepository: provider.getProjectPathRepository,
    getWorkspaceRepository: provider.getWorkspaceRepository,
    getWorkspaceMemberRepository: provider.getWorkspaceMemberRepository,
    getProjectMemberRepository: provider.getProjectMemberRepository,
    getPromptRepository: provider.getPromptRepository,
    getPromptVersionRepository: provider.getPromptVersionRepository,
    getResourceRepository: provider.getResourceRepository,
    getSkillRepository: provider.getSkillRepository,
    getSkillVersionRepository: provider.getSkillVersionRepository,
    getSkillSetRepository: provider.getSkillSetRepository,
    getSkillSetItemRepository: provider.getSkillSetItemRepository,
    getKanbanBoardRepository: provider.getKanbanBoardRepository,
    getKanbanColumnRepository: provider.getKanbanColumnRepository,
    getSprintRepository: provider.getSprintRepository,
    getSprintItemRepository: provider.getSprintItemRepository,
    getTaskRepository: provider.getTaskRepository,
    getTaskCommentRepository: provider.getTaskCommentRepository,
    getAgentSessionRepository: provider.getAgentSessionRepository,
    getAgentRunRepository: provider.getAgentRunRepository,
    getAgentRunEventRepository: provider.getAgentRunEventRepository,
    getArtifactRepository: provider.getArtifactRepository,
    getArtifactLinkRepository: provider.getArtifactLinkRepository,
    getCodexChatThreadRepository: provider.getCodexChatThreadRepository,
    getCodexChatMessageRepository: provider.getCodexChatMessageRepository,
    getCodexChatSettingRepository: provider.getCodexChatSettingRepository,
    getProjectSummaryRepository: provider.getProjectSummaryRepository,
    getMemoryItemRepository: provider.getMemoryItemRepository,
    getTagRepository: provider.getTagRepository,
    getWorkflowInstanceRepository: provider.getWorkflowInstanceRepository,
    getWorkflowStepRunRepository: provider.getWorkflowStepRunRepository,
    getAll: provider.getAll,
    createAll: provider.createAll,
    clearServiceCache: provider.clearServiceCache,
    clearProjectServiceCache: provider.clearProjectServiceCache,
    clearProjectPathServiceCache: provider.clearProjectPathServiceCache,
    clearWorkspaceServiceCache: provider.clearWorkspaceServiceCache,
    clearWorkspaceMemberServiceCache: provider.clearWorkspaceMemberServiceCache,
    clearProjectMemberServiceCache: provider.clearProjectMemberServiceCache,
    clearPromptServiceCache: provider.clearPromptServiceCache,
    clearPromptVersionServiceCache: provider.clearPromptVersionServiceCache,
    clearResourceServiceCache: provider.clearResourceServiceCache,
    clearSkillServiceCache: provider.clearSkillServiceCache,
    clearSkillVersionServiceCache: provider.clearSkillVersionServiceCache,
    clearSkillSetServiceCache: provider.clearSkillSetServiceCache,
    clearSkillSetItemServiceCache: provider.clearSkillSetItemServiceCache,
    clearKanbanBoardServiceCache: provider.clearKanbanBoardServiceCache,
    clearKanbanColumnServiceCache: provider.clearKanbanColumnServiceCache,
    clearSprintServiceCache: provider.clearSprintServiceCache,
    clearSprintItemServiceCache: provider.clearSprintItemServiceCache,
    clearTaskServiceCache: provider.clearTaskServiceCache,
    clearTaskCommentServiceCache: provider.clearTaskCommentServiceCache,
    clearAgentSessionServiceCache: provider.clearAgentSessionServiceCache,
    clearAgentRunServiceCache: provider.clearAgentRunServiceCache,
    clearAgentRunEventServiceCache: provider.clearAgentRunEventServiceCache,
    clearArtifactServiceCache: provider.clearArtifactServiceCache,
    clearArtifactLinkServiceCache: provider.clearArtifactLinkServiceCache,
    clearCodexChatThreadServiceCache: provider.clearCodexChatThreadServiceCache,
    clearCodexChatMessageServiceCache: provider.clearCodexChatMessageServiceCache,
    clearCodexChatSettingServiceCache: provider.clearCodexChatSettingServiceCache,
    clearProjectSummaryServiceCache: provider.clearProjectSummaryServiceCache,
    clearMemoryItemServiceCache: provider.clearMemoryItemServiceCache,
    clearTagServiceCache: provider.clearTagServiceCache,
    clearWorkflowInstanceServiceCache: provider.clearWorkflowInstanceServiceCache,
    clearWorkflowStepRunServiceCache: provider.clearWorkflowStepRunServiceCache,
    reset: provider.reset,
    getRegistryStats: provider.getRegistryStats,
    resolveLogger: provider.resolveLogger,

    withContext(overrides: Partial<AgentspaceKitContext>) {
      return {
        getStaticConfig(): AgentspaceKitStaticConfig {
          return options.staticConfig
        },
        getProjectService: (o?: Partial<AgentspaceKitContext>) => provider.getProjectService({ ...overrides, ...o }),
        getProjectPathService: (o?: Partial<AgentspaceKitContext>) => provider.getProjectPathService({ ...overrides, ...o }),
        getWorkspaceService: (o?: Partial<AgentspaceKitContext>) => provider.getWorkspaceService({ ...overrides, ...o }),
        getWorkspaceMemberService: (o?: Partial<AgentspaceKitContext>) => provider.getWorkspaceMemberService({ ...overrides, ...o }),
        getProjectMemberService: (o?: Partial<AgentspaceKitContext>) => provider.getProjectMemberService({ ...overrides, ...o }),
        getPromptService: (o?: Partial<AgentspaceKitContext>) => provider.getPromptService({ ...overrides, ...o }),
        getPromptVersionService: (o?: Partial<AgentspaceKitContext>) => provider.getPromptVersionService({ ...overrides, ...o }),
        getResourceService: (o?: Partial<AgentspaceKitContext>) => provider.getResourceService({ ...overrides, ...o }),
        getSkillService: (o?: Partial<AgentspaceKitContext>) => provider.getSkillService({ ...overrides, ...o }),
        getSkillVersionService: (o?: Partial<AgentspaceKitContext>) => provider.getSkillVersionService({ ...overrides, ...o }),
        getSkillSetService: (o?: Partial<AgentspaceKitContext>) => provider.getSkillSetService({ ...overrides, ...o }),
        getSkillSetItemService: (o?: Partial<AgentspaceKitContext>) => provider.getSkillSetItemService({ ...overrides, ...o }),
        getKanbanBoardService: (o?: Partial<AgentspaceKitContext>) => provider.getKanbanBoardService({ ...overrides, ...o }),
        getKanbanColumnService: (o?: Partial<AgentspaceKitContext>) => provider.getKanbanColumnService({ ...overrides, ...o }),
        getSprintService: (o?: Partial<AgentspaceKitContext>) => provider.getSprintService({ ...overrides, ...o }),
        getSprintItemService: (o?: Partial<AgentspaceKitContext>) => provider.getSprintItemService({ ...overrides, ...o }),
        getTaskService: (o?: Partial<AgentspaceKitContext>) => provider.getTaskService({ ...overrides, ...o }),
        getTaskCommentService: (o?: Partial<AgentspaceKitContext>) => provider.getTaskCommentService({ ...overrides, ...o }),
        getAgentSessionService: (o?: Partial<AgentspaceKitContext>) => provider.getAgentSessionService({ ...overrides, ...o }),
        getAgentRunService: (o?: Partial<AgentspaceKitContext>) => provider.getAgentRunService({ ...overrides, ...o }),
        getAgentRunEventService: (o?: Partial<AgentspaceKitContext>) => provider.getAgentRunEventService({ ...overrides, ...o }),
        getArtifactService: (o?: Partial<AgentspaceKitContext>) => provider.getArtifactService({ ...overrides, ...o }),
        getArtifactLinkService: (o?: Partial<AgentspaceKitContext>) => provider.getArtifactLinkService({ ...overrides, ...o }),
        getCodexChatThreadService: (o?: Partial<AgentspaceKitContext>) => provider.getCodexChatThreadService({ ...overrides, ...o }),
        getCodexChatMessageService: (o?: Partial<AgentspaceKitContext>) => provider.getCodexChatMessageService({ ...overrides, ...o }),
        getCodexChatSettingService: (o?: Partial<AgentspaceKitContext>) => provider.getCodexChatSettingService({ ...overrides, ...o }),
        getProjectSummaryService: (o?: Partial<AgentspaceKitContext>) => provider.getProjectSummaryService({ ...overrides, ...o }),
        getMemoryItemService: (o?: Partial<AgentspaceKitContext>) => provider.getMemoryItemService({ ...overrides, ...o }),
        getTagService: (o?: Partial<AgentspaceKitContext>) => provider.getTagService({ ...overrides, ...o }),
        getWorkflowInstanceService: (o?: Partial<AgentspaceKitContext>) => provider.getWorkflowInstanceService({ ...overrides, ...o }),
        getWorkflowStepRunService: (o?: Partial<AgentspaceKitContext>) => provider.getWorkflowStepRunService({ ...overrides, ...o }),
        getProjectRepository: (o?: Partial<AgentspaceKitContext>) => provider.getProjectRepository({ ...overrides, ...o }),
        getProjectPathRepository: (o?: Partial<AgentspaceKitContext>) => provider.getProjectPathRepository({ ...overrides, ...o }),
        getWorkspaceRepository: (o?: Partial<AgentspaceKitContext>) => provider.getWorkspaceRepository({ ...overrides, ...o }),
        getWorkspaceMemberRepository: (o?: Partial<AgentspaceKitContext>) => provider.getWorkspaceMemberRepository({ ...overrides, ...o }),
        getProjectMemberRepository: (o?: Partial<AgentspaceKitContext>) => provider.getProjectMemberRepository({ ...overrides, ...o }),
        getPromptRepository: (o?: Partial<AgentspaceKitContext>) => provider.getPromptRepository({ ...overrides, ...o }),
        getPromptVersionRepository: (o?: Partial<AgentspaceKitContext>) => provider.getPromptVersionRepository({ ...overrides, ...o }),
        getResourceRepository: (o?: Partial<AgentspaceKitContext>) => provider.getResourceRepository({ ...overrides, ...o }),
        getSkillRepository: (o?: Partial<AgentspaceKitContext>) => provider.getSkillRepository({ ...overrides, ...o }),
        getSkillVersionRepository: (o?: Partial<AgentspaceKitContext>) => provider.getSkillVersionRepository({ ...overrides, ...o }),
        getSkillSetRepository: (o?: Partial<AgentspaceKitContext>) => provider.getSkillSetRepository({ ...overrides, ...o }),
        getSkillSetItemRepository: (o?: Partial<AgentspaceKitContext>) => provider.getSkillSetItemRepository({ ...overrides, ...o }),
        getKanbanBoardRepository: (o?: Partial<AgentspaceKitContext>) => provider.getKanbanBoardRepository({ ...overrides, ...o }),
        getKanbanColumnRepository: (o?: Partial<AgentspaceKitContext>) => provider.getKanbanColumnRepository({ ...overrides, ...o }),
        getSprintRepository: (o?: Partial<AgentspaceKitContext>) => provider.getSprintRepository({ ...overrides, ...o }),
        getSprintItemRepository: (o?: Partial<AgentspaceKitContext>) => provider.getSprintItemRepository({ ...overrides, ...o }),
        getTaskRepository: (o?: Partial<AgentspaceKitContext>) => provider.getTaskRepository({ ...overrides, ...o }),
        getTaskCommentRepository: (o?: Partial<AgentspaceKitContext>) => provider.getTaskCommentRepository({ ...overrides, ...o }),
        getAgentSessionRepository: (o?: Partial<AgentspaceKitContext>) => provider.getAgentSessionRepository({ ...overrides, ...o }),
        getAgentRunRepository: (o?: Partial<AgentspaceKitContext>) => provider.getAgentRunRepository({ ...overrides, ...o }),
        getAgentRunEventRepository: (o?: Partial<AgentspaceKitContext>) => provider.getAgentRunEventRepository({ ...overrides, ...o }),
        getArtifactRepository: (o?: Partial<AgentspaceKitContext>) => provider.getArtifactRepository({ ...overrides, ...o }),
        getArtifactLinkRepository: (o?: Partial<AgentspaceKitContext>) => provider.getArtifactLinkRepository({ ...overrides, ...o }),
        getCodexChatThreadRepository: (o?: Partial<AgentspaceKitContext>) => provider.getCodexChatThreadRepository({ ...overrides, ...o }),
        getCodexChatMessageRepository: (o?: Partial<AgentspaceKitContext>) => provider.getCodexChatMessageRepository({ ...overrides, ...o }),
        getCodexChatSettingRepository: (o?: Partial<AgentspaceKitContext>) => provider.getCodexChatSettingRepository({ ...overrides, ...o }),
        getProjectSummaryRepository: (o?: Partial<AgentspaceKitContext>) => provider.getProjectSummaryRepository({ ...overrides, ...o }),
        getMemoryItemRepository: (o?: Partial<AgentspaceKitContext>) => provider.getMemoryItemRepository({ ...overrides, ...o }),
        getTagRepository: (o?: Partial<AgentspaceKitContext>) => provider.getTagRepository({ ...overrides, ...o }),
        getWorkflowInstanceRepository: (o?: Partial<AgentspaceKitContext>) => provider.getWorkflowInstanceRepository({ ...overrides, ...o }),
        getWorkflowStepRunRepository: (o?: Partial<AgentspaceKitContext>) => provider.getWorkflowStepRunRepository({ ...overrides, ...o }),
        getAll: (o?: Partial<AgentspaceKitContext>) => provider.getAll({ ...overrides, ...o }),
        createAll: (o?: Partial<AgentspaceKitContext>) => provider.createAll({ ...overrides, ...o }),
        clearServiceCache: (cacheKey?: string) => provider.clearServiceCache(cacheKey),
        clearProjectServiceCache: (cacheKey?: string) => provider.clearProjectServiceCache(cacheKey),
        clearProjectPathServiceCache: (cacheKey?: string) => provider.clearProjectPathServiceCache(cacheKey),
        clearWorkspaceServiceCache: (cacheKey?: string) => provider.clearWorkspaceServiceCache(cacheKey),
        clearWorkspaceMemberServiceCache: (cacheKey?: string) => provider.clearWorkspaceMemberServiceCache(cacheKey),
        clearProjectMemberServiceCache: (cacheKey?: string) => provider.clearProjectMemberServiceCache(cacheKey),
        clearPromptServiceCache: (cacheKey?: string) => provider.clearPromptServiceCache(cacheKey),
        clearPromptVersionServiceCache: (cacheKey?: string) => provider.clearPromptVersionServiceCache(cacheKey),
        clearResourceServiceCache: (cacheKey?: string) => provider.clearResourceServiceCache(cacheKey),
        clearSkillServiceCache: (cacheKey?: string) => provider.clearSkillServiceCache(cacheKey),
        clearSkillVersionServiceCache: (cacheKey?: string) => provider.clearSkillVersionServiceCache(cacheKey),
        clearSkillSetServiceCache: (cacheKey?: string) => provider.clearSkillSetServiceCache(cacheKey),
        clearSkillSetItemServiceCache: (cacheKey?: string) => provider.clearSkillSetItemServiceCache(cacheKey),
        clearKanbanBoardServiceCache: (cacheKey?: string) => provider.clearKanbanBoardServiceCache(cacheKey),
        clearKanbanColumnServiceCache: (cacheKey?: string) => provider.clearKanbanColumnServiceCache(cacheKey),
        clearSprintServiceCache: (cacheKey?: string) => provider.clearSprintServiceCache(cacheKey),
        clearSprintItemServiceCache: (cacheKey?: string) => provider.clearSprintItemServiceCache(cacheKey),
        clearTaskServiceCache: (cacheKey?: string) => provider.clearTaskServiceCache(cacheKey),
        clearTaskCommentServiceCache: (cacheKey?: string) => provider.clearTaskCommentServiceCache(cacheKey),
        clearAgentSessionServiceCache: (cacheKey?: string) => provider.clearAgentSessionServiceCache(cacheKey),
        clearAgentRunServiceCache: (cacheKey?: string) => provider.clearAgentRunServiceCache(cacheKey),
        clearAgentRunEventServiceCache: (cacheKey?: string) => provider.clearAgentRunEventServiceCache(cacheKey),
        clearArtifactServiceCache: (cacheKey?: string) => provider.clearArtifactServiceCache(cacheKey),
        clearArtifactLinkServiceCache: (cacheKey?: string) => provider.clearArtifactLinkServiceCache(cacheKey),
        clearCodexChatThreadServiceCache: (cacheKey?: string) => provider.clearCodexChatThreadServiceCache(cacheKey),
        clearCodexChatMessageServiceCache: (cacheKey?: string) => provider.clearCodexChatMessageServiceCache(cacheKey),
        clearCodexChatSettingServiceCache: (cacheKey?: string) => provider.clearCodexChatSettingServiceCache(cacheKey),
        clearProjectSummaryServiceCache: (cacheKey?: string) => provider.clearProjectSummaryServiceCache(cacheKey),
        clearMemoryItemServiceCache: (cacheKey?: string) => provider.clearMemoryItemServiceCache(cacheKey),
        clearTagServiceCache: (cacheKey?: string) => provider.clearTagServiceCache(cacheKey),
        clearWorkflowInstanceServiceCache: (cacheKey?: string) => provider.clearWorkflowInstanceServiceCache(cacheKey),
        clearWorkflowStepRunServiceCache: (cacheKey?: string) => provider.clearWorkflowStepRunServiceCache(cacheKey),
        reset: (opts?: { services?: boolean; repositories?: boolean }) => provider.reset(opts),
        getRegistryStats: () => provider.getRegistryStats(),
        resolveLogger: (o?: Partial<AgentspaceKitContext>) => provider.resolveLogger({ ...overrides, ...o }),
      }
    },
  }
}

export function buildAgentspaceKitStaticConfig(envConfig: AgentspaceKitEnvConfig): AgentspaceKitStaticConfig {
  const repoUrl = envConfig.repoUrl
  const repoType = inferRepoType(repoUrl)

  return {
    logLevel: envConfig.logLevel,
    projectRepository: { repositoryType: repoType, url: repoUrl },
    projectPathRepository: { repositoryType: repoType, url: repoUrl },
    workspaceRepository: { repositoryType: repoType, url: repoUrl },
    workspaceMemberRepository: { repositoryType: repoType, url: repoUrl },
    projectMemberRepository: { repositoryType: repoType, url: repoUrl },
    promptRepository: { repositoryType: repoType, url: repoUrl },
    promptVersionRepository: { repositoryType: repoType, url: repoUrl },
    resourceRepository: { repositoryType: repoType, url: repoUrl },
    skillRepository: { repositoryType: repoType, url: repoUrl },
    skillVersionRepository: { repositoryType: repoType, url: repoUrl },
    skillSetRepository: { repositoryType: repoType, url: repoUrl },
    skillSetItemRepository: { repositoryType: repoType, url: repoUrl },
    kanbanBoardRepository: { repositoryType: repoType, url: repoUrl },
    kanbanColumnRepository: { repositoryType: repoType, url: repoUrl },
    sprintRepository: { repositoryType: repoType, url: repoUrl },
    sprintItemRepository: { repositoryType: repoType, url: repoUrl },
    taskRepository: { repositoryType: repoType, url: repoUrl },
    taskCommentRepository: { repositoryType: repoType, url: repoUrl },
    agentSessionRepository: { repositoryType: repoType, url: repoUrl },
    agentRunRepository: { repositoryType: repoType, url: repoUrl },
    agentRunEventRepository: { repositoryType: repoType, url: repoUrl },
    artifactRepository: { repositoryType: repoType, url: repoUrl },
    artifactLinkRepository: { repositoryType: repoType, url: repoUrl },
    codexChatThreadRepository: { repositoryType: repoType, url: repoUrl },
    codexChatMessageRepository: { repositoryType: repoType, url: repoUrl },
    codexChatSettingRepository: { repositoryType: repoType, url: repoUrl },
    projectSummaryRepository: { repositoryType: repoType, url: repoUrl },
    memoryItemRepository: { repositoryType: repoType, url: repoUrl },
    tagRepository: { repositoryType: repoType, url: repoUrl },
    workflowInstanceRepository: { repositoryType: repoType, url: repoUrl },
    workflowStepRunRepository: { repositoryType: repoType, url: repoUrl },
  }
}

export type CreateAgentspaceKitWithEnvOptions = {
  name?: string
  envConfig: AgentspaceKitEnvConfig
  baseContext: {
    tenantId: string
    locale?: string
    fallbackLocale?: string
    logger?: XfLogger
  }
  getCacheKey?: (context: AgentspaceKitContext) => string | null
} & Pick<AgentspaceKitProviderOptions, 'cache' | 'metrics' | 'resilience' | 'transformService' | 'resolveLogger'>

export function createAgentspaceKitWithEnv(options: CreateAgentspaceKitWithEnvOptions) {
  const staticConfig = buildAgentspaceKitStaticConfig(options.envConfig)
  const envCfg = parseEnvConfig()

  const statsEnabled = envCfg.statsEnabled === true
  const counters = statsEnabled ? new CountersMetricsCollector() : undefined
  const loggerMetrics = statsEnabled ? new LoggerMetricsCollector(undefined) : undefined
  const metricsCollector =
    options.metrics ?? (counters && loggerMetrics ? new MultiMetricsCollector([counters, loggerMetrics]) : counters ?? loggerMetrics)

  const cacheMerged = (options.cache || envCfg.cacheGlobal)
    ? ({ ...(options.cache ?? {}), ...(envCfg.cacheGlobal ?? {}) } as AgentspaceKitProviderOptions['cache'])
    : undefined

  const resilienceMerged = (options.resilience || envCfg.resilience)
    ? ({ ...(options.resilience ?? {}), ...(envCfg.resilience ?? {}) })
    : undefined

  const kit = createAgentspaceKit({
    name: options.name ?? 'aops-kit',
    staticConfig,
    getContext: (overrides?: Partial<AgentspaceKitContext>) => ({
      tenantId: options.baseContext.tenantId,
      locale: options.baseContext.locale,
      fallbackLocale: options.baseContext.fallbackLocale,
      ...overrides,
      logger: overrides?.logger ?? options.baseContext.logger,
    }),
    resolveLogger: (ctx) => options.resolveLogger?.(ctx) ?? ctx.logger ?? options.baseContext.logger,
    getCacheKey: (ctx) => options.getCacheKey?.(ctx) ?? cacheKeyFromLocale(ctx.locale, ctx.fallbackLocale),
    cache: cacheMerged,
    metrics: metricsCollector,
    resilience: resilienceMerged as AgentspaceKitProviderOptions['resilience'],
    transformService: options.transformService,
  })

  return {
    kit,
    getMetricsSnapshot: () => (counters ? counters.snapshot() : null),
    validate: async () => {
      const svc = await kit.createAll()
      void svc
      return Effect.succeed(true)
    },
  }
}
