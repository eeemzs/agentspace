import { Effect } from 'effect'

import { createProvider, cacheKeyFromLocale, fingerprintRepositoryConfig, buildRepositoryConfig } from '@aopslab/xf-dm-kits'
import type { XfLogger } from '@aopslab/xf-logger'

import type { AgentspaceKitProviderOptions, AgentspaceKitProvider, AgentspaceKitContext, AgentspaceKitStaticConfig, AgentspaceKitServiceProviderOptions, AgentspaceKitServices, AgentspaceKitRepositories, AgentspaceKitDomainServiceRegistryStats } from './types.js'

import { RepositoryFactoryProject, RepositoryFactoryProjectPath, RepositoryFactoryScope, RepositoryFactoryProjectMember, RepositoryFactoryPrompt, RepositoryFactoryPromptVersion, RepositoryFactoryResource, RepositoryFactorySkill, RepositoryFactorySkillVersion, RepositoryFactoryKanbanBoard, RepositoryFactoryKanbanColumn, RepositoryFactorySprint, RepositoryFactorySprintItem, RepositoryFactoryTask, RepositoryFactoryTaskComment, RepositoryFactoryAgentSession, RepositoryFactoryAgentRun, RepositoryFactoryAgentRunEvent, RepositoryFactoryActivityItem, RepositoryFactoryArtifact, RepositoryFactoryArtifactLink, RepositoryFactoryCodexChatThread, RepositoryFactoryCodexChatMessage, RepositoryFactoryCodexChatSetting, RepositoryFactoryProjectSummary, RepositoryFactoryMemoryItem, RepositoryFactoryTag, RepositoryFactoryWorkflowDefinition, RepositoryFactoryWorkflowInstance, RepositoryFactoryWorkflowStepRun } from '@aopslab/domain-dm-agentspace/factories'
import { createAgentspaceDrizzleUnitOfWork } from '@aopslab/domain-dm-agentspace/factories'
import { ProjectService, ProjectPathService, ProjectMemberService, PromptService, PromptVersionService, ResourceService, SkillService, SkillVersionService, KanbanBoardService, KanbanColumnService, SprintService, SprintItemService, TaskService, TaskCommentService, AgentSessionService, AgentRunService, AgentRunEventService, ActivityItemService, ArtifactService, ArtifactLinkService, CodexChatThreadService, CodexChatMessageService, CodexChatSettingService, ProjectSummaryService, MemoryItemService, TagService, WorkflowDefinitionService, WorkflowInstanceService, WorkflowStepRunService } from '@aopslab/domain-dm-agentspace/services'

function computeConfigKey(name: string, cfg: AgentspaceKitServiceProviderOptions): string {
  const sigs = [fingerprintRepositoryConfig(cfg.projectRepositoryConfig), fingerprintRepositoryConfig(cfg.projectPathRepositoryConfig), fingerprintRepositoryConfig(cfg.scopeRepositoryConfig), fingerprintRepositoryConfig(cfg.projectMemberRepositoryConfig), fingerprintRepositoryConfig(cfg.promptRepositoryConfig), fingerprintRepositoryConfig(cfg.promptVersionRepositoryConfig), fingerprintRepositoryConfig(cfg.resourceRepositoryConfig), fingerprintRepositoryConfig(cfg.skillRepositoryConfig), fingerprintRepositoryConfig(cfg.skillVersionRepositoryConfig), fingerprintRepositoryConfig(cfg.kanbanBoardRepositoryConfig), fingerprintRepositoryConfig(cfg.kanbanColumnRepositoryConfig), fingerprintRepositoryConfig(cfg.sprintRepositoryConfig), fingerprintRepositoryConfig(cfg.sprintItemRepositoryConfig), fingerprintRepositoryConfig(cfg.taskRepositoryConfig), fingerprintRepositoryConfig(cfg.taskCommentRepositoryConfig), fingerprintRepositoryConfig(cfg.agentSessionRepositoryConfig), fingerprintRepositoryConfig(cfg.agentRunRepositoryConfig), fingerprintRepositoryConfig(cfg.agentRunEventRepositoryConfig), fingerprintRepositoryConfig(cfg.activityItemRepositoryConfig), fingerprintRepositoryConfig(cfg.artifactRepositoryConfig), fingerprintRepositoryConfig(cfg.artifactLinkRepositoryConfig), fingerprintRepositoryConfig(cfg.codexChatThreadRepositoryConfig), fingerprintRepositoryConfig(cfg.codexChatMessageRepositoryConfig), fingerprintRepositoryConfig(cfg.codexChatSettingRepositoryConfig), fingerprintRepositoryConfig(cfg.projectSummaryRepositoryConfig), fingerprintRepositoryConfig(cfg.memoryItemRepositoryConfig), fingerprintRepositoryConfig(cfg.tagRepositoryConfig), fingerprintRepositoryConfig(cfg.workflowDefinitionRepositoryConfig), fingerprintRepositoryConfig(cfg.workflowInstanceRepositoryConfig), fingerprintRepositoryConfig(cfg.workflowStepRunRepositoryConfig)].filter(Boolean)
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
    scopeRepositoryConfig: buildRepositoryConfig(staticCfg.scopeRepository, tenantId),
    projectMemberRepositoryConfig: buildRepositoryConfig(staticCfg.projectMemberRepository, tenantId),
    promptRepositoryConfig: buildRepositoryConfig(staticCfg.promptRepository, tenantId),
    promptVersionRepositoryConfig: buildRepositoryConfig(staticCfg.promptVersionRepository, tenantId),
    resourceRepositoryConfig: buildRepositoryConfig(staticCfg.resourceRepository, tenantId),
    skillRepositoryConfig: buildRepositoryConfig(staticCfg.skillRepository, tenantId),
    skillVersionRepositoryConfig: buildRepositoryConfig(staticCfg.skillVersionRepository, tenantId),
    kanbanBoardRepositoryConfig: buildRepositoryConfig(staticCfg.kanbanBoardRepository, tenantId),
    kanbanColumnRepositoryConfig: buildRepositoryConfig(staticCfg.kanbanColumnRepository, tenantId),
    sprintRepositoryConfig: buildRepositoryConfig(staticCfg.sprintRepository, tenantId),
    sprintItemRepositoryConfig: buildRepositoryConfig(staticCfg.sprintItemRepository, tenantId),
    taskRepositoryConfig: buildRepositoryConfig(staticCfg.taskRepository, tenantId),
    taskCommentRepositoryConfig: buildRepositoryConfig(staticCfg.taskCommentRepository, tenantId),
    agentSessionRepositoryConfig: buildRepositoryConfig(staticCfg.agentSessionRepository, tenantId),
    agentRunRepositoryConfig: buildRepositoryConfig(staticCfg.agentRunRepository, tenantId),
    agentRunEventRepositoryConfig: buildRepositoryConfig(staticCfg.agentRunEventRepository, tenantId),
    activityItemRepositoryConfig: buildRepositoryConfig(staticCfg.activityItemRepository, tenantId),
    artifactRepositoryConfig: buildRepositoryConfig(staticCfg.artifactRepository, tenantId),
    artifactLinkRepositoryConfig: buildRepositoryConfig(staticCfg.artifactLinkRepository, tenantId),
    codexChatThreadRepositoryConfig: buildRepositoryConfig(staticCfg.codexChatThreadRepository, tenantId),
    codexChatMessageRepositoryConfig: buildRepositoryConfig(staticCfg.codexChatMessageRepository, tenantId),
    codexChatSettingRepositoryConfig: buildRepositoryConfig(staticCfg.codexChatSettingRepository, tenantId),
    projectSummaryRepositoryConfig: buildRepositoryConfig(staticCfg.projectSummaryRepository, tenantId),
    memoryItemRepositoryConfig: buildRepositoryConfig(staticCfg.memoryItemRepository, tenantId),
    tagRepositoryConfig: buildRepositoryConfig(staticCfg.tagRepository, tenantId),
    workflowDefinitionRepositoryConfig: buildRepositoryConfig(staticCfg.workflowDefinitionRepository, tenantId),
    workflowInstanceRepositoryConfig: buildRepositoryConfig(staticCfg.workflowInstanceRepository, tenantId),
    workflowStepRunRepositoryConfig: buildRepositoryConfig(staticCfg.workflowStepRunRepository, tenantId),
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
scopeRepository: async (cfg, logger) => {
      const eff = RepositoryFactoryScope.create({
        repositoryConfig: cfg.scopeRepositoryConfig,
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
agentRunEventRepository: async (cfg, logger) => {
      const eff = RepositoryFactoryAgentRunEvent.create({
        repositoryConfig: cfg.agentRunEventRepositoryConfig,
        logger,
        logLevel: cfg.logLevel,
      })
      return await Effect.runPromise(eff)
    },
activityItemRepository: async (cfg, logger) => {
      const eff = RepositoryFactoryActivityItem.create({
        repositoryConfig: cfg.activityItemRepositoryConfig,
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
    },
workflowDefinitionRepository: async (cfg, logger) => {
      const eff = RepositoryFactoryWorkflowDefinition.create({
        repositoryConfig: cfg.workflowDefinitionRepositoryConfig,
        logger,
        logLevel: cfg.logLevel,
      })
      return await Effect.runPromise(eff)
    },
workflowInstanceRepository: async (cfg, logger) => {
      const eff = RepositoryFactoryWorkflowInstance.create({
        repositoryConfig: cfg.workflowInstanceRepositoryConfig,
        logger,
        logLevel: cfg.logLevel,
      })
      return await Effect.runPromise(eff)
    },
workflowStepRunRepository: async (cfg, logger) => {
      const eff = RepositoryFactoryWorkflowStepRun.create({
        repositoryConfig: cfg.workflowStepRunRepositoryConfig,
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
        scopeRepository: repos.scopeRepository,
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
        scopeRepository: repos.scopeRepository,
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
        promptRepository: repos.promptRepository,
        unitOfWork: createAgentspaceDrizzleUnitOfWork(
          buildRepositoryConfig(options.staticConfig.promptVersionRepository, ctx.tenantId)
        ),
        logger,
        locale: ctx.locale,
      })
    },
resourceService: async (ctx, _deps, repos, logger) => {
      return new ResourceService({
        resourceRepository: repos.resourceRepository,
        scopeRepository: repos.scopeRepository,
        logger,
        locale: ctx.locale,
      })
    },
skillService: async (ctx, _deps, repos, logger) => {
      return new SkillService({
        skillRepository: repos.skillRepository,
        scopeRepository: repos.scopeRepository,
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
        scopeRepository: repos.scopeRepository,
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
agentRunEventService: async (ctx, _deps, repos, logger) => {
      return new AgentRunEventService({
        agentRunEventRepository: repos.agentRunEventRepository,
        scopeRepository: repos.scopeRepository,
        logger,
        locale: ctx.locale,
      })
    },
activityItemService: async (ctx, _deps, repos, logger) => {
      return new ActivityItemService({
        activityItemRepository: repos.activityItemRepository,
        scopeRepository: repos.scopeRepository,
        logger,
        locale: ctx.locale,
      })
    },
artifactService: async (ctx, _deps, repos, logger) => {
      return new ArtifactService({
        artifactRepository: repos.artifactRepository,
        artifactLinkRepository: repos.artifactLinkRepository,
        scopeRepository: repos.scopeRepository,
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
        scopeRepository: repos.scopeRepository,
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
        projectSummaryRepository: repos.projectSummaryRepository,
        scopeRepository: repos.scopeRepository,
        logger,
        locale: ctx.locale,
      })
    },
tagService: async (ctx, _deps, repos, logger) => {
      return new TagService({
        tagRepository: repos.tagRepository,
        scopeRepository: repos.scopeRepository,
        logger,
        locale: ctx.locale,
      })
    },
workflowDefinitionService: async (ctx, _deps, repos, logger) => {
      return new WorkflowDefinitionService({
        workflowDefinitionRepository: repos.workflowDefinitionRepository,
        scopeRepository: repos.scopeRepository,
        logger,
        locale: ctx.locale,
      })
    },
workflowInstanceService: async (ctx, _deps, repos, logger) => {
      return new WorkflowInstanceService({
        workflowInstanceRepository: repos.workflowInstanceRepository,
        scopeRepository: repos.scopeRepository,
        logger,
        locale: ctx.locale,
      })
    },
workflowStepRunService: async (ctx, _deps, repos, logger) => {
      return new WorkflowStepRunService({
        workflowStepRunRepository: repos.workflowStepRunRepository,
        scopeRepository: repos.scopeRepository,
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
        projectMemberService: stats.services.projectMemberService,
        promptService: stats.services.promptService,
        promptVersionService: stats.services.promptVersionService,
        resourceService: stats.services.resourceService,
        skillService: stats.services.skillService,
        skillVersionService: stats.services.skillVersionService,
        kanbanBoardService: stats.services.kanbanBoardService,
        kanbanColumnService: stats.services.kanbanColumnService,
        sprintService: stats.services.sprintService,
        sprintItemService: stats.services.sprintItemService,
        taskService: stats.services.taskService,
        taskCommentService: stats.services.taskCommentService,
        agentSessionService: stats.services.agentSessionService,
        agentRunService: stats.services.agentRunService,
        agentRunEventService: stats.services.agentRunEventService,
        activityItemService: stats.services.activityItemService,
        artifactService: stats.services.artifactService,
        artifactLinkService: stats.services.artifactLinkService,
        codexChatThreadService: stats.services.codexChatThreadService,
        codexChatMessageService: stats.services.codexChatMessageService,
        codexChatSettingService: stats.services.codexChatSettingService,
        projectSummaryService: stats.services.projectSummaryService,
        memoryItemService: stats.services.memoryItemService,
        tagService: stats.services.tagService,
        workflowDefinitionService: stats.services.workflowDefinitionService,
        workflowInstanceService: stats.services.workflowInstanceService,
        workflowStepRunService: stats.services.workflowStepRunService,
      },
      repositories: {
        projectRepository: !!stats.repositories.projectRepository,
        projectPathRepository: !!stats.repositories.projectPathRepository,
        scopeRepository: !!stats.repositories.scopeRepository,
        projectMemberRepository: !!stats.repositories.projectMemberRepository,
        promptRepository: !!stats.repositories.promptRepository,
        promptVersionRepository: !!stats.repositories.promptVersionRepository,
        resourceRepository: !!stats.repositories.resourceRepository,
        skillRepository: !!stats.repositories.skillRepository,
        skillVersionRepository: !!stats.repositories.skillVersionRepository,
        kanbanBoardRepository: !!stats.repositories.kanbanBoardRepository,
        kanbanColumnRepository: !!stats.repositories.kanbanColumnRepository,
        sprintRepository: !!stats.repositories.sprintRepository,
        sprintItemRepository: !!stats.repositories.sprintItemRepository,
        taskRepository: !!stats.repositories.taskRepository,
        taskCommentRepository: !!stats.repositories.taskCommentRepository,
        agentSessionRepository: !!stats.repositories.agentSessionRepository,
        agentRunRepository: !!stats.repositories.agentRunRepository,
        agentRunEventRepository: !!stats.repositories.agentRunEventRepository,
        activityItemRepository: !!stats.repositories.activityItemRepository,
        artifactRepository: !!stats.repositories.artifactRepository,
        artifactLinkRepository: !!stats.repositories.artifactLinkRepository,
        codexChatThreadRepository: !!stats.repositories.codexChatThreadRepository,
        codexChatMessageRepository: !!stats.repositories.codexChatMessageRepository,
        codexChatSettingRepository: !!stats.repositories.codexChatSettingRepository,
        projectSummaryRepository: !!stats.repositories.projectSummaryRepository,
        memoryItemRepository: !!stats.repositories.memoryItemRepository,
        tagRepository: !!stats.repositories.tagRepository,
        workflowDefinitionRepository: !!stats.repositories.workflowDefinitionRepository,
        workflowInstanceRepository: !!stats.repositories.workflowInstanceRepository,
        workflowStepRunRepository: !!stats.repositories.workflowStepRunRepository,
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
    async getAgentRunEventService(overrides) {
      return gp.getService('agentRunEventService', overrides)
    },
    async createAgentRunEventService(overrides) {
      return gp.createService('agentRunEventService', overrides)
    },
    async getActivityItemService(overrides) {
      return gp.getService('activityItemService', overrides)
    },
    async createActivityItemService(overrides) {
      return gp.createService('activityItemService', overrides)
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
    async getWorkflowDefinitionService(overrides) {
      return gp.getService('workflowDefinitionService', overrides)
    },
    async createWorkflowDefinitionService(overrides) {
      return gp.createService('workflowDefinitionService', overrides)
    },
    async getWorkflowInstanceService(overrides) {
      return gp.getService('workflowInstanceService', overrides)
    },
    async createWorkflowInstanceService(overrides) {
      return gp.createService('workflowInstanceService', overrides)
    },
    async getWorkflowStepRunService(overrides) {
      return gp.getService('workflowStepRunService', overrides)
    },
    async createWorkflowStepRunService(overrides) {
      return gp.createService('workflowStepRunService', overrides)
    },
    async getProjectRepository(overrides) {
      return gp.getRepository('projectRepository', overrides)
    },
    async getProjectPathRepository(overrides) {
      return gp.getRepository('projectPathRepository', overrides)
    },
    async getScopeRepository(overrides) {
      return gp.getRepository('scopeRepository', overrides)
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
    async getAgentRunEventRepository(overrides) {
      return gp.getRepository('agentRunEventRepository', overrides)
    },
    async getActivityItemRepository(overrides) {
      return gp.getRepository('activityItemRepository', overrides)
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
    async getWorkflowDefinitionRepository(overrides) {
      return gp.getRepository('workflowDefinitionRepository', overrides)
    },
    async getWorkflowInstanceRepository(overrides) {
      return gp.getRepository('workflowInstanceRepository', overrides)
    },
    async getWorkflowStepRunRepository(overrides) {
      return gp.getRepository('workflowStepRunRepository', overrides)
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
    clearAgentRunEventServiceCache(cacheKey?: string) {
      gp.clearServiceCache('agentRunEventService', cacheKey)
    },
    clearActivityItemServiceCache(cacheKey?: string) {
      gp.clearServiceCache('activityItemService', cacheKey)
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
    clearWorkflowDefinitionServiceCache(cacheKey?: string) {
      gp.clearServiceCache('workflowDefinitionService', cacheKey)
    },
    clearWorkflowInstanceServiceCache(cacheKey?: string) {
      gp.clearServiceCache('workflowInstanceService', cacheKey)
    },
    clearWorkflowStepRunServiceCache(cacheKey?: string) {
      gp.clearServiceCache('workflowStepRunService', cacheKey)
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
