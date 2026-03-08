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

import type { AopsKitEnvConfig } from '../config/config.js'
import type { AopsKitProvider, AopsKitProviderOptions, AopsKitContext, AopsKitStaticConfig } from './types.js'
import { createAopsKitProvider } from './provider.js'

export interface CreateAopsKitOptions extends Omit<AopsKitProviderOptions, 'getCacheKey'> {
  name?: string
  getCacheKey?: (context: AopsKitContext) => string | null
}

export function createAopsKit(options: CreateAopsKitOptions) {
  const provider: AopsKitProvider = createAopsKitProvider({
    ...options,
    getCacheKey: options.getCacheKey ?? ((ctx) => cacheKeyFromLocale(ctx.locale, ctx.fallbackLocale)),
  })

  return {
    getStaticConfig(): AopsKitStaticConfig {
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
    getArtifactRepository: provider.getArtifactRepository,
    getArtifactLinkRepository: provider.getArtifactLinkRepository,
    getCodexChatThreadRepository: provider.getCodexChatThreadRepository,
    getCodexChatMessageRepository: provider.getCodexChatMessageRepository,
    getCodexChatSettingRepository: provider.getCodexChatSettingRepository,
    getProjectSummaryRepository: provider.getProjectSummaryRepository,
    getMemoryItemRepository: provider.getMemoryItemRepository,
    getTagRepository: provider.getTagRepository,
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
    clearArtifactServiceCache: provider.clearArtifactServiceCache,
    clearArtifactLinkServiceCache: provider.clearArtifactLinkServiceCache,
    clearCodexChatThreadServiceCache: provider.clearCodexChatThreadServiceCache,
    clearCodexChatMessageServiceCache: provider.clearCodexChatMessageServiceCache,
    clearCodexChatSettingServiceCache: provider.clearCodexChatSettingServiceCache,
    clearProjectSummaryServiceCache: provider.clearProjectSummaryServiceCache,
    clearMemoryItemServiceCache: provider.clearMemoryItemServiceCache,
    clearTagServiceCache: provider.clearTagServiceCache,
    reset: provider.reset,
    getRegistryStats: provider.getRegistryStats,
    resolveLogger: provider.resolveLogger,

    withContext(overrides: Partial<AopsKitContext>) {
      return {
        getStaticConfig(): AopsKitStaticConfig {
          return options.staticConfig
        },
        getProjectService: (o?: Partial<AopsKitContext>) => provider.getProjectService({ ...overrides, ...o }),
        getProjectPathService: (o?: Partial<AopsKitContext>) => provider.getProjectPathService({ ...overrides, ...o }),
        getWorkspaceService: (o?: Partial<AopsKitContext>) => provider.getWorkspaceService({ ...overrides, ...o }),
        getWorkspaceMemberService: (o?: Partial<AopsKitContext>) => provider.getWorkspaceMemberService({ ...overrides, ...o }),
        getProjectMemberService: (o?: Partial<AopsKitContext>) => provider.getProjectMemberService({ ...overrides, ...o }),
        getPromptService: (o?: Partial<AopsKitContext>) => provider.getPromptService({ ...overrides, ...o }),
        getPromptVersionService: (o?: Partial<AopsKitContext>) => provider.getPromptVersionService({ ...overrides, ...o }),
        getResourceService: (o?: Partial<AopsKitContext>) => provider.getResourceService({ ...overrides, ...o }),
        getSkillService: (o?: Partial<AopsKitContext>) => provider.getSkillService({ ...overrides, ...o }),
        getSkillVersionService: (o?: Partial<AopsKitContext>) => provider.getSkillVersionService({ ...overrides, ...o }),
        getSkillSetService: (o?: Partial<AopsKitContext>) => provider.getSkillSetService({ ...overrides, ...o }),
        getSkillSetItemService: (o?: Partial<AopsKitContext>) => provider.getSkillSetItemService({ ...overrides, ...o }),
        getKanbanBoardService: (o?: Partial<AopsKitContext>) => provider.getKanbanBoardService({ ...overrides, ...o }),
        getKanbanColumnService: (o?: Partial<AopsKitContext>) => provider.getKanbanColumnService({ ...overrides, ...o }),
        getSprintService: (o?: Partial<AopsKitContext>) => provider.getSprintService({ ...overrides, ...o }),
        getSprintItemService: (o?: Partial<AopsKitContext>) => provider.getSprintItemService({ ...overrides, ...o }),
        getTaskService: (o?: Partial<AopsKitContext>) => provider.getTaskService({ ...overrides, ...o }),
        getTaskCommentService: (o?: Partial<AopsKitContext>) => provider.getTaskCommentService({ ...overrides, ...o }),
        getAgentSessionService: (o?: Partial<AopsKitContext>) => provider.getAgentSessionService({ ...overrides, ...o }),
        getAgentRunService: (o?: Partial<AopsKitContext>) => provider.getAgentRunService({ ...overrides, ...o }),
        getArtifactService: (o?: Partial<AopsKitContext>) => provider.getArtifactService({ ...overrides, ...o }),
        getArtifactLinkService: (o?: Partial<AopsKitContext>) => provider.getArtifactLinkService({ ...overrides, ...o }),
        getCodexChatThreadService: (o?: Partial<AopsKitContext>) => provider.getCodexChatThreadService({ ...overrides, ...o }),
        getCodexChatMessageService: (o?: Partial<AopsKitContext>) => provider.getCodexChatMessageService({ ...overrides, ...o }),
        getCodexChatSettingService: (o?: Partial<AopsKitContext>) => provider.getCodexChatSettingService({ ...overrides, ...o }),
        getProjectSummaryService: (o?: Partial<AopsKitContext>) => provider.getProjectSummaryService({ ...overrides, ...o }),
        getMemoryItemService: (o?: Partial<AopsKitContext>) => provider.getMemoryItemService({ ...overrides, ...o }),
        getTagService: (o?: Partial<AopsKitContext>) => provider.getTagService({ ...overrides, ...o }),
        getProjectRepository: (o?: Partial<AopsKitContext>) => provider.getProjectRepository({ ...overrides, ...o }),
        getProjectPathRepository: (o?: Partial<AopsKitContext>) => provider.getProjectPathRepository({ ...overrides, ...o }),
        getWorkspaceRepository: (o?: Partial<AopsKitContext>) => provider.getWorkspaceRepository({ ...overrides, ...o }),
        getWorkspaceMemberRepository: (o?: Partial<AopsKitContext>) => provider.getWorkspaceMemberRepository({ ...overrides, ...o }),
        getProjectMemberRepository: (o?: Partial<AopsKitContext>) => provider.getProjectMemberRepository({ ...overrides, ...o }),
        getPromptRepository: (o?: Partial<AopsKitContext>) => provider.getPromptRepository({ ...overrides, ...o }),
        getPromptVersionRepository: (o?: Partial<AopsKitContext>) => provider.getPromptVersionRepository({ ...overrides, ...o }),
        getResourceRepository: (o?: Partial<AopsKitContext>) => provider.getResourceRepository({ ...overrides, ...o }),
        getSkillRepository: (o?: Partial<AopsKitContext>) => provider.getSkillRepository({ ...overrides, ...o }),
        getSkillVersionRepository: (o?: Partial<AopsKitContext>) => provider.getSkillVersionRepository({ ...overrides, ...o }),
        getSkillSetRepository: (o?: Partial<AopsKitContext>) => provider.getSkillSetRepository({ ...overrides, ...o }),
        getSkillSetItemRepository: (o?: Partial<AopsKitContext>) => provider.getSkillSetItemRepository({ ...overrides, ...o }),
        getKanbanBoardRepository: (o?: Partial<AopsKitContext>) => provider.getKanbanBoardRepository({ ...overrides, ...o }),
        getKanbanColumnRepository: (o?: Partial<AopsKitContext>) => provider.getKanbanColumnRepository({ ...overrides, ...o }),
        getSprintRepository: (o?: Partial<AopsKitContext>) => provider.getSprintRepository({ ...overrides, ...o }),
        getSprintItemRepository: (o?: Partial<AopsKitContext>) => provider.getSprintItemRepository({ ...overrides, ...o }),
        getTaskRepository: (o?: Partial<AopsKitContext>) => provider.getTaskRepository({ ...overrides, ...o }),
        getTaskCommentRepository: (o?: Partial<AopsKitContext>) => provider.getTaskCommentRepository({ ...overrides, ...o }),
        getAgentSessionRepository: (o?: Partial<AopsKitContext>) => provider.getAgentSessionRepository({ ...overrides, ...o }),
        getAgentRunRepository: (o?: Partial<AopsKitContext>) => provider.getAgentRunRepository({ ...overrides, ...o }),
        getArtifactRepository: (o?: Partial<AopsKitContext>) => provider.getArtifactRepository({ ...overrides, ...o }),
        getArtifactLinkRepository: (o?: Partial<AopsKitContext>) => provider.getArtifactLinkRepository({ ...overrides, ...o }),
        getCodexChatThreadRepository: (o?: Partial<AopsKitContext>) => provider.getCodexChatThreadRepository({ ...overrides, ...o }),
        getCodexChatMessageRepository: (o?: Partial<AopsKitContext>) => provider.getCodexChatMessageRepository({ ...overrides, ...o }),
        getCodexChatSettingRepository: (o?: Partial<AopsKitContext>) => provider.getCodexChatSettingRepository({ ...overrides, ...o }),
        getProjectSummaryRepository: (o?: Partial<AopsKitContext>) => provider.getProjectSummaryRepository({ ...overrides, ...o }),
        getMemoryItemRepository: (o?: Partial<AopsKitContext>) => provider.getMemoryItemRepository({ ...overrides, ...o }),
        getTagRepository: (o?: Partial<AopsKitContext>) => provider.getTagRepository({ ...overrides, ...o }),
        getAll: (o?: Partial<AopsKitContext>) => provider.getAll({ ...overrides, ...o }),
        createAll: (o?: Partial<AopsKitContext>) => provider.createAll({ ...overrides, ...o }),
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
        clearArtifactServiceCache: (cacheKey?: string) => provider.clearArtifactServiceCache(cacheKey),
        clearArtifactLinkServiceCache: (cacheKey?: string) => provider.clearArtifactLinkServiceCache(cacheKey),
        clearCodexChatThreadServiceCache: (cacheKey?: string) => provider.clearCodexChatThreadServiceCache(cacheKey),
        clearCodexChatMessageServiceCache: (cacheKey?: string) => provider.clearCodexChatMessageServiceCache(cacheKey),
        clearCodexChatSettingServiceCache: (cacheKey?: string) => provider.clearCodexChatSettingServiceCache(cacheKey),
        clearProjectSummaryServiceCache: (cacheKey?: string) => provider.clearProjectSummaryServiceCache(cacheKey),
        clearMemoryItemServiceCache: (cacheKey?: string) => provider.clearMemoryItemServiceCache(cacheKey),
        clearTagServiceCache: (cacheKey?: string) => provider.clearTagServiceCache(cacheKey),
        reset: (opts?: { services?: boolean; repositories?: boolean }) => provider.reset(opts),
        getRegistryStats: () => provider.getRegistryStats(),
        resolveLogger: (o?: Partial<AopsKitContext>) => provider.resolveLogger({ ...overrides, ...o }),
      }
    },
  }
}

export function buildAopsKitStaticConfig(envConfig: AopsKitEnvConfig): AopsKitStaticConfig {
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
    artifactRepository: { repositoryType: repoType, url: repoUrl },
    artifactLinkRepository: { repositoryType: repoType, url: repoUrl },
    codexChatThreadRepository: { repositoryType: repoType, url: repoUrl },
    codexChatMessageRepository: { repositoryType: repoType, url: repoUrl },
    codexChatSettingRepository: { repositoryType: repoType, url: repoUrl },
    projectSummaryRepository: { repositoryType: repoType, url: repoUrl },
    memoryItemRepository: { repositoryType: repoType, url: repoUrl },
    tagRepository: { repositoryType: repoType, url: repoUrl },
  }
}

export type CreateAopsKitWithEnvOptions = {
  name?: string
  envConfig: AopsKitEnvConfig
  baseContext: {
    tenantId: string
    locale?: string
    fallbackLocale?: string
    logger?: XfLogger
  }
  getCacheKey?: (context: AopsKitContext) => string | null
} & Pick<AopsKitProviderOptions, 'cache' | 'metrics' | 'resilience' | 'transformService' | 'resolveLogger'>

export function createAopsKitWithEnv(options: CreateAopsKitWithEnvOptions) {
  const staticConfig = buildAopsKitStaticConfig(options.envConfig)
  const envCfg = parseEnvConfig()

  const statsEnabled = envCfg.statsEnabled === true
  const counters = statsEnabled ? new CountersMetricsCollector() : undefined
  const loggerMetrics = statsEnabled ? new LoggerMetricsCollector(undefined) : undefined
  const metricsCollector =
    options.metrics ?? (counters && loggerMetrics ? new MultiMetricsCollector([counters, loggerMetrics]) : counters ?? loggerMetrics)

  const cacheMerged = (options.cache || envCfg.cacheGlobal)
    ? ({ ...(options.cache ?? {}), ...(envCfg.cacheGlobal ?? {}) } as AopsKitProviderOptions['cache'])
    : undefined

  const resilienceMerged = (options.resilience || envCfg.resilience)
    ? ({ ...(options.resilience ?? {}), ...(envCfg.resilience ?? {}) })
    : undefined

  const kit = createAopsKit({
    name: options.name ?? 'aops-kit',
    staticConfig,
    getContext: (overrides?: Partial<AopsKitContext>) => ({
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
    resilience: resilienceMerged as AopsKitProviderOptions['resilience'],
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
