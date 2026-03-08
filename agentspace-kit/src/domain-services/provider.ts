import { Effect } from 'effect'

import { createProvider, cacheKeyFromLocale, fingerprintRepositoryConfig, buildRepositoryConfig } from '@aopslab/xf-dm-kits'
import type { XfLogger } from '@aopslab/xf-logger'

import type { AgentspaceKitProviderOptions, AgentspaceKitProvider, AgentspaceKitContext, AgentspaceKitStaticConfig, AgentspaceKitServiceProviderOptions, AgentspaceKitServices, AgentspaceKitRepositories, AgentspaceKitDomainServiceRegistryStats } from './types.js'

import { RepositoryFactoryProject, RepositoryFactoryProjectPath, RepositoryFactoryWorkspace, RepositoryFactoryWorkspaceMember, RepositoryFactoryProjectMember, RepositoryFactoryPrompt, RepositoryFactoryPromptVersion, RepositoryFactoryResource, RepositoryFactorySkill, RepositoryFactorySkillVersion, RepositoryFactorySkillSet, RepositoryFactorySkillSetItem, RepositoryFactoryKanbanBoard, RepositoryFactoryKanbanColumn, RepositoryFactorySprint, RepositoryFactorySprintItem, RepositoryFactoryTask, RepositoryFactoryTaskComment, RepositoryFactoryAgentSession, RepositoryFactoryAgentRun, RepositoryFactoryArtifact, RepositoryFactoryArtifactLink, RepositoryFactoryCodexChatThread, RepositoryFactoryCodexChatMessage, RepositoryFactoryCodexChatSetting, RepositoryFactoryProjectSummary, RepositoryFactoryMemoryItem, RepositoryFactoryTag } from '@aopslab/domain-dm-agentspace/factories'
import { ProjectService, ProjectPathService, WorkspaceService, WorkspaceMemberService, ProjectMemberService, PromptService, PromptVersionService, ResourceService, SkillService, SkillVersionService, SkillSetService, SkillSetItemService, KanbanBoardService, KanbanColumnService, SprintService, SprintItemService, TaskService, TaskCommentService, AgentSessionService, AgentRunService, ArtifactService, ArtifactLinkService, CodexChatThreadService, CodexChatMessageService, CodexChatSettingService, ProjectSummaryService, MemoryItemService, TagService } from '@aopslab/domain-dm-agentspace/services'

function computeConfigKey(name: string, cfg: AgentspaceKitServiceProviderOptions): string {
  const sigs = [fingerprintRepositoryConfig(cfg.projectRepositoryConfig), fingerprintRepositoryConfig(cfg.projectPathRepositoryConfig), fingerprintRepositoryConfig(cfg.workspaceRepositoryConfig), fingerprintRepositoryConfig(cfg.workspaceMemberRepositoryConfig), fingerprintRepositoryConfig(cfg.projectMemberRepositoryConfig), fingerprintRepositoryConfig(cfg.promptRepositoryConfig), fingerprintRepositoryConfig(cfg.promptVersionRepositoryConfig), fingerprintRepositoryConfig(cfg.resourceRepositoryConfig), fingerprintRepositoryConfig(cfg.skillRepositoryConfig), fingerprintRepositoryConfig(cfg.skillVersionRepositoryConfig), fingerprintRepositoryConfig(cfg.skillSetRepositoryConfig), fingerprintRepositoryConfig(cfg.skillSetItemRepositoryConfig), fingerprintRepositoryConfig(cfg.kanbanBoardRepositoryConfig), fingerprintRepositoryConfig(cfg.kanbanColumnRepositoryConfig), fingerprintRepositoryConfig(cfg.sprintRepositoryConfig), fingerprintRepositoryConfig(cfg.sprintItemRepositoryConfig), fingerprintRepositoryConfig(cfg.taskRepositoryConfig), fingerprintRepositoryConfig(cfg.taskCommentRepositoryConfig), fingerprintRepositoryConfig(cfg.agentSessionRepositoryConfig), fingerprintRepositoryConfig(cfg.agentRunRepositoryConfig), fingerprintRepositoryConfig(cfg.artifactRepositoryConfig), fingerprintRepositoryConfig(cfg.artifactLinkRepositoryConfig), fingerprintRepositoryConfig(cfg.codexChatThreadRepositoryConfig), fingerprintRepositoryConfig(cfg.codexChatMessageRepositoryConfig), fingerprintRepositoryConfig(cfg.codexChatSettingRepositoryConfig), fingerprintRepositoryConfig(cfg.projectSummaryRepositoryConfig), fingerprintRepositoryConfig(cfg.memoryItemRepositoryConfig), fingerprintRepositoryConfig(cfg.tagRepositoryConfig)].filter(Boolean)
  return [name, cfg.tenantId ?? '', ...sigs].join('|')
}

function buildResolvedConfig(staticCfg: AgentspaceKitStaticConfig, ctx: AgentspaceKitContext): AgentspaceKitServiceProviderOptions {
  const tenantId = ctx.tenantId

  return {
    tenantId,
    logLevel: staticCfg.logLevel,
    localeOptions: { locale: ctx.locale, fallbackLocale: ctx.fallbackLocale },
    projectRepositoryConfig: buildRepositoryConfig(staticCfg.projectRepository, tenantId),
    projectPathRepositoryConfig: buildRepositoryConfig(staticCfg.projectPathRepository, tenantId),
    workspaceRepositoryConfig: buildRepositoryConfig(staticCfg.workspaceRepository, tenantId),
    workspaceMemberRepositoryConfig: buildRepositoryConfig(staticCfg.workspaceMemberRepository, tenantId),
    projectMemberRepositoryConfig: buildRepositoryConfig(staticCfg.projectMemberRepository, tenantId),
    promptRepositoryConfig: buildRepositoryConfig(staticCfg.promptRepository, tenantId),
    promptVersionRepositoryConfig: buildRepositoryConfig(staticCfg.promptVersionRepository, tenantId),
    resourceRepositoryConfig: buildRepositoryConfig(staticCfg.resourceRepository, tenantId),
    skillRepositoryConfig: buildRepositoryConfig(staticCfg.skillRepository, tenantId),
    skillVersionRepositoryConfig: buildRepositoryConfig(staticCfg.skillVersionRepository, tenantId),
    skillSetRepositoryConfig: buildRepositoryConfig(staticCfg.skillSetRepository, tenantId),
    skillSetItemRepositoryConfig: buildRepositoryConfig(staticCfg.skillSetItemRepository, tenantId),
    kanbanBoardRepositoryConfig: buildRepositoryConfig(staticCfg.kanbanBoardRepository, tenantId),
    kanbanColumnRepositoryConfig: buildRepositoryConfig(staticCfg.kanbanColumnRepository, tenantId),
    sprintRepositoryConfig: buildRepositoryConfig(staticCfg.sprintRepository, tenantId),
    sprintItemRepositoryConfig: buildRepositoryConfig(staticCfg.sprintItemRepository, tenantId),
    taskRepositoryConfig: buildRepositoryConfig(staticCfg.taskRepository, tenantId),
    taskCommentRepositoryConfig: buildRepositoryConfig(staticCfg.taskCommentRepository, tenantId),
    agentSessionRepositoryConfig: buildRepositoryConfig(staticCfg.agentSessionRepository, tenantId),
    agentRunRepositoryConfig: buildRepositoryConfig(staticCfg.agentRunRepository, tenantId),
    artifactRepositoryConfig: buildRepositoryConfig(staticCfg.artifactRepository, tenantId),
    artifactLinkRepositoryConfig: buildRepositoryConfig(staticCfg.artifactLinkRepository, tenantId),
    codexChatThreadRepositoryConfig: buildRepositoryConfig(staticCfg.codexChatThreadRepository, tenantId),
    codexChatMessageRepositoryConfig: buildRepositoryConfig(staticCfg.codexChatMessageRepository, tenantId),
    codexChatSettingRepositoryConfig: buildRepositoryConfig(staticCfg.codexChatSettingRepository, tenantId),
    projectSummaryRepositoryConfig: buildRepositoryConfig(staticCfg.projectSummaryRepository, tenantId),
    memoryItemRepositoryConfig: buildRepositoryConfig(staticCfg.memoryItemRepository, tenantId),
    tagRepositoryConfig: buildRepositoryConfig(staticCfg.tagRepository, tenantId),
  }
}

export function createAgentspaceKitProvider(options: AgentspaceKitProviderOptions): AgentspaceKitProvider {
  const name = options.name ?? 'aops-kit'

  function defaultCacheKey(context: AgentspaceKitContext): string | null {
    if (typeof context.cacheKey === 'string' && context.cacheKey.length > 0) return context.cacheKey
    return cacheKeyFromLocale(context.locale, context.fallbackLocale)
  }

  const gp = createProvider<
    AgentspaceKitContext,
    AgentspaceKitServiceProviderOptions,
    XfLogger | undefined,
    AgentspaceKitServices,
    AgentspaceKitRepositories
  >({
    name: `aops-kit::provider::${name}`,
    getContext: options.getContext,
    getCacheKey: (ctx) => options.getCacheKey?.(ctx) ?? defaultCacheKey(ctx),
    resolveLogger: options.resolveLogger,
    resolveConfig: (ctx) => buildResolvedConfig(options.staticConfig, ctx),
    computeConfigKey: (cfg) => computeConfigKey(name, cfg),
    repositories: {
projectRepository: async (cfg, logger) => {
      const eff = RepositoryFactoryProject.create({
        repositoryConfig: cfg.projectRepositoryConfig,
        logger,
        logLevel: cfg.logLevel,
      })
      return await Effect.runPromise(eff)
    },
projectPathRepository: async (cfg, logger) => {
      const eff = RepositoryFactoryProjectPath.create({
        repositoryConfig: cfg.projectPathRepositoryConfig,
        logger,
        logLevel: cfg.logLevel,
      })
      return await Effect.runPromise(eff)
    },
workspaceRepository: async (cfg, logger) => {
      const eff = RepositoryFactoryWorkspace.create({
        repositoryConfig: cfg.workspaceRepositoryConfig,
        logger,
        logLevel: cfg.logLevel,
      })
      return await Effect.runPromise(eff)
    },
workspaceMemberRepository: async (cfg, logger) => {
      const eff = RepositoryFactoryWorkspaceMember.create({
        repositoryConfig: cfg.workspaceMemberRepositoryConfig,
        logger,
        logLevel: cfg.logLevel,
      })
      return await Effect.runPromise(eff)
    },
projectMemberRepository: async (cfg, logger) => {
      const eff = RepositoryFactoryProjectMember.create({
        repositoryConfig: cfg.projectMemberRepositoryConfig,
        logger,
        logLevel: cfg.logLevel,
      })
      return await Effect.runPromise(eff)
    },
promptRepository: async (cfg, logger) => {
      const eff = RepositoryFactoryPrompt.create({
        repositoryConfig: cfg.promptRepositoryConfig,
        logger,
        logLevel: cfg.logLevel,
      })
      return await Effect.runPromise(eff)
    },
promptVersionRepository: async (cfg, logger) => {
      const eff = RepositoryFactoryPromptVersion.create({
        repositoryConfig: cfg.promptVersionRepositoryConfig,
        logger,
        logLevel: cfg.logLevel,
      })
      return await Effect.runPromise(eff)
    },
resourceRepository: async (cfg, logger) => {
      const eff = RepositoryFactoryResource.create({
        repositoryConfig: cfg.resourceRepositoryConfig,
        logger,
        logLevel: cfg.logLevel,
      })
      return await Effect.runPromise(eff)
    },
skillRepository: async (cfg, logger) => {
      const eff = RepositoryFactorySkill.create({
        repositoryConfig: cfg.skillRepositoryConfig,
        logger,
        logLevel: cfg.logLevel,
      })
      return await Effect.runPromise(eff)
    },
skillVersionRepository: async (cfg, logger) => {
      const eff = RepositoryFactorySkillVersion.create({
        repositoryConfig: cfg.skillVersionRepositoryConfig,
        logger,
        logLevel: cfg.logLevel,
      })
      return await Effect.runPromise(eff)
    },
skillSetRepository: async (cfg, logger) => {
      const eff = RepositoryFactorySkillSet.create({
        repositoryConfig: cfg.skillSetRepositoryConfig,
        logger,
        logLevel: cfg.logLevel,
      })
      return await Effect.runPromise(eff)
    },
skillSetItemRepository: async (cfg, logger) => {
      const eff = RepositoryFactorySkillSetItem.create({
        repositoryConfig: cfg.skillSetItemRepositoryConfig,
        logger,
        logLevel: cfg.logLevel,
      })
      return await Effect.runPromise(eff)
    },
kanbanBoardRepository: async (cfg, logger) => {
      const eff = RepositoryFactoryKanbanBoard.create({
        repositoryConfig: cfg.kanbanBoardRepositoryConfig,
        logger,
        logLevel: cfg.logLevel,
      })
      return await Effect.runPromise(eff)
    },
kanbanColumnRepository: async (cfg, logger) => {
      const eff = RepositoryFactoryKanbanColumn.create({
        repositoryConfig: cfg.kanbanColumnRepositoryConfig,
        logger,
        logLevel: cfg.logLevel,
      })
      return await Effect.runPromise(eff)
    },
sprintRepository: async (cfg, logger) => {
      const eff = RepositoryFactorySprint.create({
        repositoryConfig: cfg.sprintRepositoryConfig,
        logger,
        logLevel: cfg.logLevel,
      })
      return await Effect.runPromise(eff)
    },
sprintItemRepository: async (cfg, logger) => {
      const eff = RepositoryFactorySprintItem.create({
        repositoryConfig: cfg.sprintItemRepositoryConfig,
        logger,
        logLevel: cfg.logLevel,
      })
      return await Effect.runPromise(eff)
    },
taskRepository: async (cfg, logger) => {
      const eff = RepositoryFactoryTask.create({
        repositoryConfig: cfg.taskRepositoryConfig,
        logger,
        logLevel: cfg.logLevel,
      })
      return await Effect.runPromise(eff)
    },
taskCommentRepository: async (cfg, logger) => {
      const eff = RepositoryFactoryTaskComment.create({
        repositoryConfig: cfg.taskCommentRepositoryConfig,
        logger,
        logLevel: cfg.logLevel,
      })
      return await Effect.runPromise(eff)
    },
agentSessionRepository: async (cfg, logger) => {
      const eff = RepositoryFactoryAgentSession.create({
        repositoryConfig: cfg.agentSessionRepositoryConfig,
        logger,
        logLevel: cfg.logLevel,
      })
      return await Effect.runPromise(eff)
    },
agentRunRepository: async (cfg, logger) => {
      const eff = RepositoryFactoryAgentRun.create({
        repositoryConfig: cfg.agentRunRepositoryConfig,
        logger,
        logLevel: cfg.logLevel,
      })
      return await Effect.runPromise(eff)
    },
artifactRepository: async (cfg, logger) => {
      const eff = RepositoryFactoryArtifact.create({
        repositoryConfig: cfg.artifactRepositoryConfig,
        logger,
        logLevel: cfg.logLevel,
      })
      return await Effect.runPromise(eff)
    },
artifactLinkRepository: async (cfg, logger) => {
      const eff = RepositoryFactoryArtifactLink.create({
        repositoryConfig: cfg.artifactLinkRepositoryConfig,
        logger,
        logLevel: cfg.logLevel,
      })
      return await Effect.runPromise(eff)
    },
codexChatThreadRepository: async (cfg, logger) => {
      const eff = RepositoryFactoryCodexChatThread.create({
        repositoryConfig: cfg.codexChatThreadRepositoryConfig,
        logger,
        logLevel: cfg.logLevel,
      })
      return await Effect.runPromise(eff)
    },
codexChatMessageRepository: async (cfg, logger) => {
      const eff = RepositoryFactoryCodexChatMessage.create({
        repositoryConfig: cfg.codexChatMessageRepositoryConfig,
        logger,
        logLevel: cfg.logLevel,
      })
      return await Effect.runPromise(eff)
    },
codexChatSettingRepository: async (cfg, logger) => {
      const eff = RepositoryFactoryCodexChatSetting.create({
        repositoryConfig: cfg.codexChatSettingRepositoryConfig,
        logger,
        logLevel: cfg.logLevel,
      })
      return await Effect.runPromise(eff)
    },
projectSummaryRepository: async (cfg, logger) => {
      const eff = RepositoryFactoryProjectSummary.create({
        repositoryConfig: cfg.projectSummaryRepositoryConfig,
        logger,
        logLevel: cfg.logLevel,
      })
      return await Effect.runPromise(eff)
    },
memoryItemRepository: async (cfg, logger) => {
      const eff = RepositoryFactoryMemoryItem.create({
        repositoryConfig: cfg.memoryItemRepositoryConfig,
        logger,
        logLevel: cfg.logLevel,
      })
      return await Effect.runPromise(eff)
    },
tagRepository: async (cfg, logger) => {
      const eff = RepositoryFactoryTag.create({
        repositoryConfig: cfg.tagRepositoryConfig,
        logger,
        logLevel: cfg.logLevel,
      })
      return await Effect.runPromise(eff)
    }
    },
    services: {
projectService: async (ctx, _deps, repos, logger) => {
      return new ProjectService({
        projectRepository: repos.projectRepository,
        logger,
        locale: ctx.locale,
      })
    },
projectPathService: async (ctx, _deps, repos, logger) => {
      return new ProjectPathService({
        projectPathRepository: repos.projectPathRepository,
        logger,
        locale: ctx.locale,
      })
    },
workspaceService: async (ctx, _deps, repos, logger) => {
      return new WorkspaceService({
        workspaceRepository: repos.workspaceRepository,
        logger,
        locale: ctx.locale,
      })
    },
workspaceMemberService: async (ctx, _deps, repos, logger) => {
      return new WorkspaceMemberService({
        workspaceMemberRepository: repos.workspaceMemberRepository,
        logger,
        locale: ctx.locale,
      })
    },
projectMemberService: async (ctx, _deps, repos, logger) => {
      return new ProjectMemberService({
        projectMemberRepository: repos.projectMemberRepository,
        logger,
        locale: ctx.locale,
      })
    },
promptService: async (ctx, _deps, repos, logger) => {
      return new PromptService({
        promptRepository: repos.promptRepository,
        logger,
        locale: ctx.locale,
      })
    },
promptVersionService: async (ctx, deps, repos, logger) => {
      const promptService = deps.promptService
      if (!promptService) {
        throw new Error('promptVersionService dependency is not resolved')
      }
      return new PromptVersionService({
        promptVersionRepository: repos.promptVersionRepository,
        promptService,
        logger,
        locale: ctx.locale,
      })
    },
resourceService: async (ctx, _deps, repos, logger) => {
      return new ResourceService({
        resourceRepository: repos.resourceRepository,
        logger,
        locale: ctx.locale,
      })
    },
skillService: async (ctx, _deps, repos, logger) => {
      return new SkillService({
        skillRepository: repos.skillRepository,
        logger,
        locale: ctx.locale,
      })
    },
skillVersionService: async (ctx, deps, repos, logger) => {
      const skillService = deps.skillService
      if (!skillService) {
        throw new Error('skillVersionService dependency is not resolved')
      }
      const resourceService = deps.resourceService
      return new SkillVersionService({
        skillVersionRepository: repos.skillVersionRepository,
        skillService,
        resourceService,
        logger,
        locale: ctx.locale,
      })
    },
skillSetService: async (ctx, deps, repos, logger) => {
      const skillSetItemService = deps.skillSetItemService
      if (!skillSetItemService) {
        throw new Error('skillSetService dependency is not resolved')
      }
      return new SkillSetService({
        skillSetRepository: repos.skillSetRepository,
        skillSetItemService,
        logger,
        locale: ctx.locale,
      })
    },
skillSetItemService: async (ctx, _deps, repos, logger) => {
      return new SkillSetItemService({
        skillSetItemRepository: repos.skillSetItemRepository,
        logger,
        locale: ctx.locale,
      })
    },
kanbanBoardService: async (ctx, deps, repos, logger) => {
      const kanbanColumnService = deps.kanbanColumnService
      const taskService = deps.taskService
      if (!kanbanColumnService || !taskService) {
        throw new Error('kanbanBoardService dependencies are not resolved')
      }
      return new KanbanBoardService({
        kanbanBoardRepository: repos.kanbanBoardRepository,
        kanbanColumnService,
        taskService,
        logger,
        locale: ctx.locale,
      })
    },
kanbanColumnService: async (ctx, _deps, repos, logger) => {
      return new KanbanColumnService({
        kanbanColumnRepository: repos.kanbanColumnRepository,
        logger,
        locale: ctx.locale,
      })
    },
sprintService: async (ctx, deps, repos, logger) => {
      const sprintItemService = deps.sprintItemService
      if (!sprintItemService) {
        throw new Error('sprintService dependency is not resolved')
      }
      return new SprintService({
        sprintRepository: repos.sprintRepository,
        sprintItemService,
        logger,
        locale: ctx.locale,
      })
    },
sprintItemService: async (ctx, _deps, repos, logger) => {
      return new SprintItemService({
        sprintItemRepository: repos.sprintItemRepository,
        logger,
        locale: ctx.locale,
      })
    },
taskService: async (ctx, deps, repos, logger) => {
      const taskCommentService = deps.taskCommentService
      if (!taskCommentService) {
        throw new Error('taskService dependency is not resolved')
      }
      return new TaskService({
        taskRepository: repos.taskRepository,
        taskCommentService,
        logger,
        locale: ctx.locale,
      })
    },
taskCommentService: async (ctx, _deps, repos, logger) => {
      return new TaskCommentService({
        taskCommentRepository: repos.taskCommentRepository,
        logger,
        locale: ctx.locale,
      })
    },
agentSessionService: async (ctx, _deps, repos, logger) => {
      return new AgentSessionService({
        agentSessionRepository: repos.agentSessionRepository,
        logger,
        locale: ctx.locale,
      })
    },
agentRunService: async (ctx, _deps, repos, logger) => {
      return new AgentRunService({
        agentRunRepository: repos.agentRunRepository,
        logger,
        locale: ctx.locale,
      })
    },
artifactService: async (ctx, _deps, repos, logger) => {
      return new ArtifactService({
        artifactRepository: repos.artifactRepository,
        artifactLinkRepository: repos.artifactLinkRepository,
        logger,
        locale: ctx.locale,
      })
    },
artifactLinkService: async (ctx, _deps, repos, logger) => {
      return new ArtifactLinkService({
        artifactLinkRepository: repos.artifactLinkRepository,
        logger,
        locale: ctx.locale,
      })
    },
codexChatThreadService: async (ctx, _deps, repos, logger) => {
      return new CodexChatThreadService({
        codexChatThreadRepository: repos.codexChatThreadRepository,
        logger,
        locale: ctx.locale,
      })
    },
codexChatMessageService: async (ctx, _deps, repos, logger) => {
      return new CodexChatMessageService({
        codexChatMessageRepository: repos.codexChatMessageRepository,
        logger,
        locale: ctx.locale,
      })
    },
codexChatSettingService: async (ctx, _deps, repos, logger) => {
      return new CodexChatSettingService({
        codexChatSettingRepository: repos.codexChatSettingRepository,
        logger,
        locale: ctx.locale,
      })
    },
projectSummaryService: async (ctx, _deps, repos, logger) => {
      return new ProjectSummaryService({
        projectSummaryRepository: repos.projectSummaryRepository,
        logger,
        locale: ctx.locale,
      })
    },
memoryItemService: async (ctx, _deps, repos, logger) => {
      return new MemoryItemService({
        memoryItemRepository: repos.memoryItemRepository,
        logger,
        locale: ctx.locale,
      })
    },
tagService: async (ctx, _deps, repos, logger) => {
      return new TagService({
        tagRepository: repos.tagRepository,
        logger,
        locale: ctx.locale,
      })
    }
    },
    dependencies: {
      kanbanBoardService: ['kanbanColumnService', 'taskService'],
      taskService: ['taskCommentService'],
      sprintService: ['sprintItemService'],
      promptVersionService: ['promptService'],
      skillVersionService: ['skillService', 'resourceService'],
      skillSetService: ['skillSetItemService'],
    },
    cache: options.cache,
    metrics: options.metrics,
    resilience: options.resilience,
    transformService: options.transformService,
  })

  function toStats(): AgentspaceKitDomainServiceRegistryStats {
    const stats = gp.getStats()
    return {
      name: stats.name,
      configKey: stats.configKey,
      services: {
        projectService: stats.services.projectService,
        projectPathService: stats.services.projectPathService,
        workspaceService: stats.services.workspaceService,
        workspaceMemberService: stats.services.workspaceMemberService,
        projectMemberService: stats.services.projectMemberService,
        promptService: stats.services.promptService,
        promptVersionService: stats.services.promptVersionService,
        resourceService: stats.services.resourceService,
        skillService: stats.services.skillService,
        skillVersionService: stats.services.skillVersionService,
        skillSetService: stats.services.skillSetService,
        skillSetItemService: stats.services.skillSetItemService,
        kanbanBoardService: stats.services.kanbanBoardService,
        kanbanColumnService: stats.services.kanbanColumnService,
        sprintService: stats.services.sprintService,
        sprintItemService: stats.services.sprintItemService,
        taskService: stats.services.taskService,
        taskCommentService: stats.services.taskCommentService,
        agentSessionService: stats.services.agentSessionService,
        agentRunService: stats.services.agentRunService,
        artifactService: stats.services.artifactService,
        artifactLinkService: stats.services.artifactLinkService,
        codexChatThreadService: stats.services.codexChatThreadService,
        codexChatMessageService: stats.services.codexChatMessageService,
        codexChatSettingService: stats.services.codexChatSettingService,
        projectSummaryService: stats.services.projectSummaryService,
        memoryItemService: stats.services.memoryItemService,
        tagService: stats.services.tagService,
      },
      repositories: {
        projectRepository: !!stats.repositories.projectRepository,
        projectPathRepository: !!stats.repositories.projectPathRepository,
        workspaceRepository: !!stats.repositories.workspaceRepository,
        workspaceMemberRepository: !!stats.repositories.workspaceMemberRepository,
        projectMemberRepository: !!stats.repositories.projectMemberRepository,
        promptRepository: !!stats.repositories.promptRepository,
        promptVersionRepository: !!stats.repositories.promptVersionRepository,
        resourceRepository: !!stats.repositories.resourceRepository,
        skillRepository: !!stats.repositories.skillRepository,
        skillVersionRepository: !!stats.repositories.skillVersionRepository,
        skillSetRepository: !!stats.repositories.skillSetRepository,
        skillSetItemRepository: !!stats.repositories.skillSetItemRepository,
        kanbanBoardRepository: !!stats.repositories.kanbanBoardRepository,
        kanbanColumnRepository: !!stats.repositories.kanbanColumnRepository,
        sprintRepository: !!stats.repositories.sprintRepository,
        sprintItemRepository: !!stats.repositories.sprintItemRepository,
        taskRepository: !!stats.repositories.taskRepository,
        taskCommentRepository: !!stats.repositories.taskCommentRepository,
        agentSessionRepository: !!stats.repositories.agentSessionRepository,
        agentRunRepository: !!stats.repositories.agentRunRepository,
        artifactRepository: !!stats.repositories.artifactRepository,
        artifactLinkRepository: !!stats.repositories.artifactLinkRepository,
        codexChatThreadRepository: !!stats.repositories.codexChatThreadRepository,
        codexChatMessageRepository: !!stats.repositories.codexChatMessageRepository,
        codexChatSettingRepository: !!stats.repositories.codexChatSettingRepository,
        projectSummaryRepository: !!stats.repositories.projectSummaryRepository,
        memoryItemRepository: !!stats.repositories.memoryItemRepository,
        tagRepository: !!stats.repositories.tagRepository,
      },
    }
  }

  return {
    async getProjectService(overrides) {
      return gp.getService('projectService', overrides)
    },
    async createProjectService(overrides) {
      return gp.createService('projectService', overrides)
    },
    async getProjectPathService(overrides) {
      return gp.getService('projectPathService', overrides)
    },
    async createProjectPathService(overrides) {
      return gp.createService('projectPathService', overrides)
    },
    async getWorkspaceService(overrides) {
      return gp.getService('workspaceService', overrides)
    },
    async createWorkspaceService(overrides) {
      return gp.createService('workspaceService', overrides)
    },
    async getWorkspaceMemberService(overrides) {
      return gp.getService('workspaceMemberService', overrides)
    },
    async createWorkspaceMemberService(overrides) {
      return gp.createService('workspaceMemberService', overrides)
    },
    async getProjectMemberService(overrides) {
      return gp.getService('projectMemberService', overrides)
    },
    async createProjectMemberService(overrides) {
      return gp.createService('projectMemberService', overrides)
    },
    async getPromptService(overrides) {
      return gp.getService('promptService', overrides)
    },
    async createPromptService(overrides) {
      return gp.createService('promptService', overrides)
    },
    async getPromptVersionService(overrides) {
      return gp.getService('promptVersionService', overrides)
    },
    async createPromptVersionService(overrides) {
      return gp.createService('promptVersionService', overrides)
    },
    async getResourceService(overrides) {
      return gp.getService('resourceService', overrides)
    },
    async createResourceService(overrides) {
      return gp.createService('resourceService', overrides)
    },
    async getSkillService(overrides) {
      return gp.getService('skillService', overrides)
    },
    async createSkillService(overrides) {
      return gp.createService('skillService', overrides)
    },
    async getSkillVersionService(overrides) {
      return gp.getService('skillVersionService', overrides)
    },
    async createSkillVersionService(overrides) {
      return gp.createService('skillVersionService', overrides)
    },
    async getSkillSetService(overrides) {
      return gp.getService('skillSetService', overrides)
    },
    async createSkillSetService(overrides) {
      return gp.createService('skillSetService', overrides)
    },
    async getSkillSetItemService(overrides) {
      return gp.getService('skillSetItemService', overrides)
    },
    async createSkillSetItemService(overrides) {
      return gp.createService('skillSetItemService', overrides)
    },
    async getKanbanBoardService(overrides) {
      return gp.getService('kanbanBoardService', overrides)
    },
    async createKanbanBoardService(overrides) {
      return gp.createService('kanbanBoardService', overrides)
    },
    async getKanbanColumnService(overrides) {
      return gp.getService('kanbanColumnService', overrides)
    },
    async createKanbanColumnService(overrides) {
      return gp.createService('kanbanColumnService', overrides)
    },
    async getSprintService(overrides) {
      return gp.getService('sprintService', overrides)
    },
    async createSprintService(overrides) {
      return gp.createService('sprintService', overrides)
    },
    async getSprintItemService(overrides) {
      return gp.getService('sprintItemService', overrides)
    },
    async createSprintItemService(overrides) {
      return gp.createService('sprintItemService', overrides)
    },
    async getTaskService(overrides) {
      return gp.getService('taskService', overrides)
    },
    async createTaskService(overrides) {
      return gp.createService('taskService', overrides)
    },
    async getTaskCommentService(overrides) {
      return gp.getService('taskCommentService', overrides)
    },
    async createTaskCommentService(overrides) {
      return gp.createService('taskCommentService', overrides)
    },
    async getAgentSessionService(overrides) {
      return gp.getService('agentSessionService', overrides)
    },
    async createAgentSessionService(overrides) {
      return gp.createService('agentSessionService', overrides)
    },
    async getAgentRunService(overrides) {
      return gp.getService('agentRunService', overrides)
    },
    async createAgentRunService(overrides) {
      return gp.createService('agentRunService', overrides)
    },
    async getArtifactService(overrides) {
      return gp.getService('artifactService', overrides)
    },
    async createArtifactService(overrides) {
      return gp.createService('artifactService', overrides)
    },
    async getArtifactLinkService(overrides) {
      return gp.getService('artifactLinkService', overrides)
    },
    async createArtifactLinkService(overrides) {
      return gp.createService('artifactLinkService', overrides)
    },
    async getCodexChatThreadService(overrides) {
      return gp.getService('codexChatThreadService', overrides)
    },
    async createCodexChatThreadService(overrides) {
      return gp.createService('codexChatThreadService', overrides)
    },
    async getCodexChatMessageService(overrides) {
      return gp.getService('codexChatMessageService', overrides)
    },
    async createCodexChatMessageService(overrides) {
      return gp.createService('codexChatMessageService', overrides)
    },
    async getCodexChatSettingService(overrides) {
      return gp.getService('codexChatSettingService', overrides)
    },
    async createCodexChatSettingService(overrides) {
      return gp.createService('codexChatSettingService', overrides)
    },
    async getProjectSummaryService(overrides) {
      return gp.getService('projectSummaryService', overrides)
    },
    async createProjectSummaryService(overrides) {
      return gp.createService('projectSummaryService', overrides)
    },
    async getMemoryItemService(overrides) {
      return gp.getService('memoryItemService', overrides)
    },
    async createMemoryItemService(overrides) {
      return gp.createService('memoryItemService', overrides)
    },
    async getTagService(overrides) {
      return gp.getService('tagService', overrides)
    },
    async createTagService(overrides) {
      return gp.createService('tagService', overrides)
    },
    async getProjectRepository(overrides) {
      return gp.getRepository('projectRepository', overrides)
    },
    async getProjectPathRepository(overrides) {
      return gp.getRepository('projectPathRepository', overrides)
    },
    async getWorkspaceRepository(overrides) {
      return gp.getRepository('workspaceRepository', overrides)
    },
    async getWorkspaceMemberRepository(overrides) {
      return gp.getRepository('workspaceMemberRepository', overrides)
    },
    async getProjectMemberRepository(overrides) {
      return gp.getRepository('projectMemberRepository', overrides)
    },
    async getPromptRepository(overrides) {
      return gp.getRepository('promptRepository', overrides)
    },
    async getPromptVersionRepository(overrides) {
      return gp.getRepository('promptVersionRepository', overrides)
    },
    async getResourceRepository(overrides) {
      return gp.getRepository('resourceRepository', overrides)
    },
    async getSkillRepository(overrides) {
      return gp.getRepository('skillRepository', overrides)
    },
    async getSkillVersionRepository(overrides) {
      return gp.getRepository('skillVersionRepository', overrides)
    },
    async getSkillSetRepository(overrides) {
      return gp.getRepository('skillSetRepository', overrides)
    },
    async getSkillSetItemRepository(overrides) {
      return gp.getRepository('skillSetItemRepository', overrides)
    },
    async getKanbanBoardRepository(overrides) {
      return gp.getRepository('kanbanBoardRepository', overrides)
    },
    async getKanbanColumnRepository(overrides) {
      return gp.getRepository('kanbanColumnRepository', overrides)
    },
    async getSprintRepository(overrides) {
      return gp.getRepository('sprintRepository', overrides)
    },
    async getSprintItemRepository(overrides) {
      return gp.getRepository('sprintItemRepository', overrides)
    },
    async getTaskRepository(overrides) {
      return gp.getRepository('taskRepository', overrides)
    },
    async getTaskCommentRepository(overrides) {
      return gp.getRepository('taskCommentRepository', overrides)
    },
    async getAgentSessionRepository(overrides) {
      return gp.getRepository('agentSessionRepository', overrides)
    },
    async getAgentRunRepository(overrides) {
      return gp.getRepository('agentRunRepository', overrides)
    },
    async getArtifactRepository(overrides) {
      return gp.getRepository('artifactRepository', overrides)
    },
    async getArtifactLinkRepository(overrides) {
      return gp.getRepository('artifactLinkRepository', overrides)
    },
    async getCodexChatThreadRepository(overrides) {
      return gp.getRepository('codexChatThreadRepository', overrides)
    },
    async getCodexChatMessageRepository(overrides) {
      return gp.getRepository('codexChatMessageRepository', overrides)
    },
    async getCodexChatSettingRepository(overrides) {
      return gp.getRepository('codexChatSettingRepository', overrides)
    },
    async getProjectSummaryRepository(overrides) {
      return gp.getRepository('projectSummaryRepository', overrides)
    },
    async getMemoryItemRepository(overrides) {
      return gp.getRepository('memoryItemRepository', overrides)
    },
    async getTagRepository(overrides) {
      return gp.getRepository('tagRepository', overrides)
    },
    async getAll(overrides) {
      return gp.getAll(overrides)
    },
    async createAll(overrides) {
      return gp.createAll(overrides)
    },
    clearServiceCache(cacheKey?: string) {
      gp.clearCache(cacheKey)
    },
    clearProjectServiceCache(cacheKey?: string) {
      gp.clearServiceCache('projectService', cacheKey)
    },
    clearProjectPathServiceCache(cacheKey?: string) {
      gp.clearServiceCache('projectPathService', cacheKey)
    },
    clearWorkspaceServiceCache(cacheKey?: string) {
      gp.clearServiceCache('workspaceService', cacheKey)
    },
    clearWorkspaceMemberServiceCache(cacheKey?: string) {
      gp.clearServiceCache('workspaceMemberService', cacheKey)
    },
    clearProjectMemberServiceCache(cacheKey?: string) {
      gp.clearServiceCache('projectMemberService', cacheKey)
    },
    clearPromptServiceCache(cacheKey?: string) {
      gp.clearServiceCache('promptService', cacheKey)
    },
    clearPromptVersionServiceCache(cacheKey?: string) {
      gp.clearServiceCache('promptVersionService', cacheKey)
    },
    clearResourceServiceCache(cacheKey?: string) {
      gp.clearServiceCache('resourceService', cacheKey)
    },
    clearSkillServiceCache(cacheKey?: string) {
      gp.clearServiceCache('skillService', cacheKey)
    },
    clearSkillVersionServiceCache(cacheKey?: string) {
      gp.clearServiceCache('skillVersionService', cacheKey)
    },
    clearSkillSetServiceCache(cacheKey?: string) {
      gp.clearServiceCache('skillSetService', cacheKey)
    },
    clearSkillSetItemServiceCache(cacheKey?: string) {
      gp.clearServiceCache('skillSetItemService', cacheKey)
    },
    clearKanbanBoardServiceCache(cacheKey?: string) {
      gp.clearServiceCache('kanbanBoardService', cacheKey)
    },
    clearKanbanColumnServiceCache(cacheKey?: string) {
      gp.clearServiceCache('kanbanColumnService', cacheKey)
    },
    clearSprintServiceCache(cacheKey?: string) {
      gp.clearServiceCache('sprintService', cacheKey)
    },
    clearSprintItemServiceCache(cacheKey?: string) {
      gp.clearServiceCache('sprintItemService', cacheKey)
    },
    clearTaskServiceCache(cacheKey?: string) {
      gp.clearServiceCache('taskService', cacheKey)
    },
    clearTaskCommentServiceCache(cacheKey?: string) {
      gp.clearServiceCache('taskCommentService', cacheKey)
    },
    clearAgentSessionServiceCache(cacheKey?: string) {
      gp.clearServiceCache('agentSessionService', cacheKey)
    },
    clearAgentRunServiceCache(cacheKey?: string) {
      gp.clearServiceCache('agentRunService', cacheKey)
    },
    clearArtifactServiceCache(cacheKey?: string) {
      gp.clearServiceCache('artifactService', cacheKey)
    },
    clearArtifactLinkServiceCache(cacheKey?: string) {
      gp.clearServiceCache('artifactLinkService', cacheKey)
    },
    clearCodexChatThreadServiceCache(cacheKey?: string) {
      gp.clearServiceCache('codexChatThreadService', cacheKey)
    },
    clearCodexChatMessageServiceCache(cacheKey?: string) {
      gp.clearServiceCache('codexChatMessageService', cacheKey)
    },
    clearCodexChatSettingServiceCache(cacheKey?: string) {
      gp.clearServiceCache('codexChatSettingService', cacheKey)
    },
    clearProjectSummaryServiceCache(cacheKey?: string) {
      gp.clearServiceCache('projectSummaryService', cacheKey)
    },
    clearMemoryItemServiceCache(cacheKey?: string) {
      gp.clearServiceCache('memoryItemService', cacheKey)
    },
    clearTagServiceCache(cacheKey?: string) {
      gp.clearServiceCache('tagService', cacheKey)
    },
    reset(options?: { services?: boolean; repositories?: boolean }) {
      gp.reset(options)
    },
    getRegistryStats() {
      return toStats()
    },
    async resolveLogger(overrides) {
      if (!options.resolveLogger) return undefined
      const base = await Promise.resolve(options.getContext(overrides))
      return options.resolveLogger({ ...base, ...(overrides ?? {}) })
    },
  }
}
