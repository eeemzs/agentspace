import type { DefaultServiceProviderOptions, RegistryStats, ServiceCacheOptions, MetricsCollector, RetryOptions, CircuitBreaker, RepositoryEndpoint } from '@aopslab/xf-dm-kits'
import type { RepositoryConfig } from '@aopslab/xf-db'
import type { XfLogger } from '@aopslab/xf-logger'
import type { IProjectServicePort, IProjectPathServicePort, IPromptServicePort, IPromptVersionServicePort, IResourceServicePort, ISkillServicePort, ISkillVersionServicePort, ISkillSetServicePort, ISkillSetItemServicePort, IKanbanBoardServicePort, IKanbanColumnServicePort, ISprintServicePort, ISprintItemServicePort, ITaskServicePort, ITaskCommentServicePort, IAgentSessionServicePort, IAgentRunServicePort, IArtifactServicePort, IArtifactLinkServicePort, ICodexChatMessageServicePort, ICodexChatSettingServicePort, ICodexChatThreadServicePort, IProjectSummaryServicePort, IMemoryItemServicePort, ITagServicePort, IWorkspaceServicePort, IWorkspaceMemberServicePort, IProjectMemberServicePort } from '@aopslab/domain-dm-agentspace/ports'
import type { IRepositoryPortProject, IRepositoryPortProjectPath, IRepositoryPortPrompt, IRepositoryPortPromptVersion, IRepositoryPortResource, IRepositoryPortSkill, IRepositoryPortSkillVersion, IRepositoryPortSkillSet, IRepositoryPortSkillSetItem, IRepositoryPortKanbanBoard, IRepositoryPortKanbanColumn, IRepositoryPortSprint, IRepositoryPortSprintItem, IRepositoryPortTask, IRepositoryPortTaskComment, IRepositoryPortAgentSession, IRepositoryPortAgentRun, IRepositoryPortArtifact, IRepositoryPortArtifactLink, IRepositoryPortCodexChatMessage, IRepositoryPortCodexChatSetting, IRepositoryPortCodexChatThread, IRepositoryPortProjectSummary, IRepositoryPortMemoryItem, IRepositoryPortTag, IRepositoryPortWorkspace, IRepositoryPortWorkspaceMember, IRepositoryPortProjectMember } from '@aopslab/domain-dm-agentspace/repository-ports'

export interface AopsKitContext {
  tenantId: string
  locale?: string
  fallbackLocale?: string
  cacheKey?: string
  logger?: XfLogger
}

export interface AopsKitStaticConfig {
  logLevel?: DefaultServiceProviderOptions['logLevel']
  projectRepository: RepositoryEndpoint
  projectPathRepository: RepositoryEndpoint
  workspaceRepository: RepositoryEndpoint
  workspaceMemberRepository: RepositoryEndpoint
  projectMemberRepository: RepositoryEndpoint
  promptRepository: RepositoryEndpoint
  promptVersionRepository: RepositoryEndpoint
  resourceRepository: RepositoryEndpoint
  skillRepository: RepositoryEndpoint
  skillVersionRepository: RepositoryEndpoint
  skillSetRepository: RepositoryEndpoint
  skillSetItemRepository: RepositoryEndpoint
  kanbanBoardRepository: RepositoryEndpoint
  kanbanColumnRepository: RepositoryEndpoint
  sprintRepository: RepositoryEndpoint
  sprintItemRepository: RepositoryEndpoint
  taskRepository: RepositoryEndpoint
  taskCommentRepository: RepositoryEndpoint
  agentSessionRepository: RepositoryEndpoint
  agentRunRepository: RepositoryEndpoint
  artifactRepository: RepositoryEndpoint
  artifactLinkRepository: RepositoryEndpoint
  codexChatThreadRepository: RepositoryEndpoint
  codexChatMessageRepository: RepositoryEndpoint
  codexChatSettingRepository: RepositoryEndpoint
  projectSummaryRepository: RepositoryEndpoint
  memoryItemRepository: RepositoryEndpoint
  tagRepository: RepositoryEndpoint
}

export interface AopsKitServiceProviderOptions extends DefaultServiceProviderOptions {
  tenantId: string
  localeOptions?: { locale?: string; fallbackLocale?: string }
  logLevel?: DefaultServiceProviderOptions['logLevel']
  projectRepositoryConfig: RepositoryConfig
  projectPathRepositoryConfig: RepositoryConfig
  workspaceRepositoryConfig: RepositoryConfig
  workspaceMemberRepositoryConfig: RepositoryConfig
  projectMemberRepositoryConfig: RepositoryConfig
  promptRepositoryConfig: RepositoryConfig
  promptVersionRepositoryConfig: RepositoryConfig
  resourceRepositoryConfig: RepositoryConfig
  skillRepositoryConfig: RepositoryConfig
  skillVersionRepositoryConfig: RepositoryConfig
  skillSetRepositoryConfig: RepositoryConfig
  skillSetItemRepositoryConfig: RepositoryConfig
  kanbanBoardRepositoryConfig: RepositoryConfig
  kanbanColumnRepositoryConfig: RepositoryConfig
  sprintRepositoryConfig: RepositoryConfig
  sprintItemRepositoryConfig: RepositoryConfig
  taskRepositoryConfig: RepositoryConfig
  taskCommentRepositoryConfig: RepositoryConfig
  agentSessionRepositoryConfig: RepositoryConfig
  agentRunRepositoryConfig: RepositoryConfig
  artifactRepositoryConfig: RepositoryConfig
  artifactLinkRepositoryConfig: RepositoryConfig
  codexChatThreadRepositoryConfig: RepositoryConfig
  codexChatMessageRepositoryConfig: RepositoryConfig
  codexChatSettingRepositoryConfig: RepositoryConfig
  projectSummaryRepositoryConfig: RepositoryConfig
  memoryItemRepositoryConfig: RepositoryConfig
  tagRepositoryConfig: RepositoryConfig
}

export interface AopsKitServices {
  projectService: IProjectServicePort
  projectPathService: IProjectPathServicePort
  workspaceService: IWorkspaceServicePort
  workspaceMemberService: IWorkspaceMemberServicePort
  projectMemberService: IProjectMemberServicePort
  promptService: IPromptServicePort
  promptVersionService: IPromptVersionServicePort
  resourceService: IResourceServicePort
  skillService: ISkillServicePort
  skillVersionService: ISkillVersionServicePort
  skillSetService: ISkillSetServicePort
  skillSetItemService: ISkillSetItemServicePort
  kanbanBoardService: IKanbanBoardServicePort
  kanbanColumnService: IKanbanColumnServicePort
  sprintService: ISprintServicePort
  sprintItemService: ISprintItemServicePort
  taskService: ITaskServicePort
  taskCommentService: ITaskCommentServicePort
  agentSessionService: IAgentSessionServicePort
  agentRunService: IAgentRunServicePort
  artifactService: IArtifactServicePort
  artifactLinkService: IArtifactLinkServicePort
  codexChatThreadService: ICodexChatThreadServicePort
  codexChatMessageService: ICodexChatMessageServicePort
  codexChatSettingService: ICodexChatSettingServicePort
  projectSummaryService: IProjectSummaryServicePort
  memoryItemService: IMemoryItemServicePort
  tagService: ITagServicePort
}

export interface AopsKitRepositories {
  projectRepository: IRepositoryPortProject
  projectPathRepository: IRepositoryPortProjectPath
  workspaceRepository: IRepositoryPortWorkspace
  workspaceMemberRepository: IRepositoryPortWorkspaceMember
  projectMemberRepository: IRepositoryPortProjectMember
  promptRepository: IRepositoryPortPrompt
  promptVersionRepository: IRepositoryPortPromptVersion
  resourceRepository: IRepositoryPortResource
  skillRepository: IRepositoryPortSkill
  skillVersionRepository: IRepositoryPortSkillVersion
  skillSetRepository: IRepositoryPortSkillSet
  skillSetItemRepository: IRepositoryPortSkillSetItem
  kanbanBoardRepository: IRepositoryPortKanbanBoard
  kanbanColumnRepository: IRepositoryPortKanbanColumn
  sprintRepository: IRepositoryPortSprint
  sprintItemRepository: IRepositoryPortSprintItem
  taskRepository: IRepositoryPortTask
  taskCommentRepository: IRepositoryPortTaskComment
  agentSessionRepository: IRepositoryPortAgentSession
  agentRunRepository: IRepositoryPortAgentRun
  artifactRepository: IRepositoryPortArtifact
  artifactLinkRepository: IRepositoryPortArtifactLink
  codexChatThreadRepository: IRepositoryPortCodexChatThread
  codexChatMessageRepository: IRepositoryPortCodexChatMessage
  codexChatSettingRepository: IRepositoryPortCodexChatSetting
  projectSummaryRepository: IRepositoryPortProjectSummary
  memoryItemRepository: IRepositoryPortMemoryItem
  tagRepository: IRepositoryPortTag
}

export type AopsKitServiceKeys = Extract<keyof AopsKitServices, string>

export type AopsKitDomainServiceRegistryStats = RegistryStats<AopsKitServiceKeys>

export interface AopsKitProvider {
  getProjectService(overrides?: Partial<AopsKitContext>): Promise<AopsKitServices['projectService']>
  createProjectService(overrides?: Partial<AopsKitContext>): Promise<AopsKitServices['projectService']>
  getProjectPathService(overrides?: Partial<AopsKitContext>): Promise<AopsKitServices['projectPathService']>
  createProjectPathService(overrides?: Partial<AopsKitContext>): Promise<AopsKitServices['projectPathService']>
  getWorkspaceService(overrides?: Partial<AopsKitContext>): Promise<AopsKitServices['workspaceService']>
  createWorkspaceService(overrides?: Partial<AopsKitContext>): Promise<AopsKitServices['workspaceService']>
  getWorkspaceMemberService(overrides?: Partial<AopsKitContext>): Promise<AopsKitServices['workspaceMemberService']>
  createWorkspaceMemberService(overrides?: Partial<AopsKitContext>): Promise<AopsKitServices['workspaceMemberService']>
  getProjectMemberService(overrides?: Partial<AopsKitContext>): Promise<AopsKitServices['projectMemberService']>
  createProjectMemberService(overrides?: Partial<AopsKitContext>): Promise<AopsKitServices['projectMemberService']>
  getPromptService(overrides?: Partial<AopsKitContext>): Promise<AopsKitServices['promptService']>
  createPromptService(overrides?: Partial<AopsKitContext>): Promise<AopsKitServices['promptService']>
  getPromptVersionService(overrides?: Partial<AopsKitContext>): Promise<AopsKitServices['promptVersionService']>
  createPromptVersionService(overrides?: Partial<AopsKitContext>): Promise<AopsKitServices['promptVersionService']>
  getResourceService(overrides?: Partial<AopsKitContext>): Promise<AopsKitServices['resourceService']>
  createResourceService(overrides?: Partial<AopsKitContext>): Promise<AopsKitServices['resourceService']>
  getSkillService(overrides?: Partial<AopsKitContext>): Promise<AopsKitServices['skillService']>
  createSkillService(overrides?: Partial<AopsKitContext>): Promise<AopsKitServices['skillService']>
  getSkillVersionService(overrides?: Partial<AopsKitContext>): Promise<AopsKitServices['skillVersionService']>
  createSkillVersionService(overrides?: Partial<AopsKitContext>): Promise<AopsKitServices['skillVersionService']>
  getSkillSetService(overrides?: Partial<AopsKitContext>): Promise<AopsKitServices['skillSetService']>
  createSkillSetService(overrides?: Partial<AopsKitContext>): Promise<AopsKitServices['skillSetService']>
  getSkillSetItemService(overrides?: Partial<AopsKitContext>): Promise<AopsKitServices['skillSetItemService']>
  createSkillSetItemService(overrides?: Partial<AopsKitContext>): Promise<AopsKitServices['skillSetItemService']>
  getKanbanBoardService(overrides?: Partial<AopsKitContext>): Promise<AopsKitServices['kanbanBoardService']>
  createKanbanBoardService(overrides?: Partial<AopsKitContext>): Promise<AopsKitServices['kanbanBoardService']>
  getKanbanColumnService(overrides?: Partial<AopsKitContext>): Promise<AopsKitServices['kanbanColumnService']>
  createKanbanColumnService(overrides?: Partial<AopsKitContext>): Promise<AopsKitServices['kanbanColumnService']>
  getSprintService(overrides?: Partial<AopsKitContext>): Promise<AopsKitServices['sprintService']>
  createSprintService(overrides?: Partial<AopsKitContext>): Promise<AopsKitServices['sprintService']>
  getSprintItemService(overrides?: Partial<AopsKitContext>): Promise<AopsKitServices['sprintItemService']>
  createSprintItemService(overrides?: Partial<AopsKitContext>): Promise<AopsKitServices['sprintItemService']>
  getTaskService(overrides?: Partial<AopsKitContext>): Promise<AopsKitServices['taskService']>
  createTaskService(overrides?: Partial<AopsKitContext>): Promise<AopsKitServices['taskService']>
  getTaskCommentService(overrides?: Partial<AopsKitContext>): Promise<AopsKitServices['taskCommentService']>
  createTaskCommentService(overrides?: Partial<AopsKitContext>): Promise<AopsKitServices['taskCommentService']>
  getAgentSessionService(overrides?: Partial<AopsKitContext>): Promise<AopsKitServices['agentSessionService']>
  createAgentSessionService(overrides?: Partial<AopsKitContext>): Promise<AopsKitServices['agentSessionService']>
  getAgentRunService(overrides?: Partial<AopsKitContext>): Promise<AopsKitServices['agentRunService']>
  createAgentRunService(overrides?: Partial<AopsKitContext>): Promise<AopsKitServices['agentRunService']>
  getArtifactService(overrides?: Partial<AopsKitContext>): Promise<AopsKitServices['artifactService']>
  createArtifactService(overrides?: Partial<AopsKitContext>): Promise<AopsKitServices['artifactService']>
  getArtifactLinkService(overrides?: Partial<AopsKitContext>): Promise<AopsKitServices['artifactLinkService']>
  createArtifactLinkService(overrides?: Partial<AopsKitContext>): Promise<AopsKitServices['artifactLinkService']>
  getCodexChatThreadService(overrides?: Partial<AopsKitContext>): Promise<AopsKitServices['codexChatThreadService']>
  createCodexChatThreadService(overrides?: Partial<AopsKitContext>): Promise<AopsKitServices['codexChatThreadService']>
  getCodexChatMessageService(overrides?: Partial<AopsKitContext>): Promise<AopsKitServices['codexChatMessageService']>
  createCodexChatMessageService(overrides?: Partial<AopsKitContext>): Promise<AopsKitServices['codexChatMessageService']>
  getCodexChatSettingService(overrides?: Partial<AopsKitContext>): Promise<AopsKitServices['codexChatSettingService']>
  createCodexChatSettingService(overrides?: Partial<AopsKitContext>): Promise<AopsKitServices['codexChatSettingService']>
  getProjectSummaryService(overrides?: Partial<AopsKitContext>): Promise<AopsKitServices['projectSummaryService']>
  createProjectSummaryService(overrides?: Partial<AopsKitContext>): Promise<AopsKitServices['projectSummaryService']>
  getMemoryItemService(overrides?: Partial<AopsKitContext>): Promise<AopsKitServices['memoryItemService']>
  createMemoryItemService(overrides?: Partial<AopsKitContext>): Promise<AopsKitServices['memoryItemService']>
  getTagService(overrides?: Partial<AopsKitContext>): Promise<AopsKitServices['tagService']>
  createTagService(overrides?: Partial<AopsKitContext>): Promise<AopsKitServices['tagService']>
  getProjectRepository(overrides?: Partial<AopsKitContext>): Promise<AopsKitRepositories['projectRepository']>
  getProjectPathRepository(overrides?: Partial<AopsKitContext>): Promise<AopsKitRepositories['projectPathRepository']>
  getWorkspaceRepository(overrides?: Partial<AopsKitContext>): Promise<AopsKitRepositories['workspaceRepository']>
  getWorkspaceMemberRepository(overrides?: Partial<AopsKitContext>): Promise<AopsKitRepositories['workspaceMemberRepository']>
  getProjectMemberRepository(overrides?: Partial<AopsKitContext>): Promise<AopsKitRepositories['projectMemberRepository']>
  getPromptRepository(overrides?: Partial<AopsKitContext>): Promise<AopsKitRepositories['promptRepository']>
  getPromptVersionRepository(overrides?: Partial<AopsKitContext>): Promise<AopsKitRepositories['promptVersionRepository']>
  getResourceRepository(overrides?: Partial<AopsKitContext>): Promise<AopsKitRepositories['resourceRepository']>
  getSkillRepository(overrides?: Partial<AopsKitContext>): Promise<AopsKitRepositories['skillRepository']>
  getSkillVersionRepository(overrides?: Partial<AopsKitContext>): Promise<AopsKitRepositories['skillVersionRepository']>
  getSkillSetRepository(overrides?: Partial<AopsKitContext>): Promise<AopsKitRepositories['skillSetRepository']>
  getSkillSetItemRepository(overrides?: Partial<AopsKitContext>): Promise<AopsKitRepositories['skillSetItemRepository']>
  getKanbanBoardRepository(overrides?: Partial<AopsKitContext>): Promise<AopsKitRepositories['kanbanBoardRepository']>
  getKanbanColumnRepository(overrides?: Partial<AopsKitContext>): Promise<AopsKitRepositories['kanbanColumnRepository']>
  getSprintRepository(overrides?: Partial<AopsKitContext>): Promise<AopsKitRepositories['sprintRepository']>
  getSprintItemRepository(overrides?: Partial<AopsKitContext>): Promise<AopsKitRepositories['sprintItemRepository']>
  getTaskRepository(overrides?: Partial<AopsKitContext>): Promise<AopsKitRepositories['taskRepository']>
  getTaskCommentRepository(overrides?: Partial<AopsKitContext>): Promise<AopsKitRepositories['taskCommentRepository']>
  getAgentSessionRepository(overrides?: Partial<AopsKitContext>): Promise<AopsKitRepositories['agentSessionRepository']>
  getAgentRunRepository(overrides?: Partial<AopsKitContext>): Promise<AopsKitRepositories['agentRunRepository']>
  getArtifactRepository(overrides?: Partial<AopsKitContext>): Promise<AopsKitRepositories['artifactRepository']>
  getArtifactLinkRepository(overrides?: Partial<AopsKitContext>): Promise<AopsKitRepositories['artifactLinkRepository']>
  getCodexChatThreadRepository(overrides?: Partial<AopsKitContext>): Promise<AopsKitRepositories['codexChatThreadRepository']>
  getCodexChatMessageRepository(overrides?: Partial<AopsKitContext>): Promise<AopsKitRepositories['codexChatMessageRepository']>
  getCodexChatSettingRepository(overrides?: Partial<AopsKitContext>): Promise<AopsKitRepositories['codexChatSettingRepository']>
  getProjectSummaryRepository(overrides?: Partial<AopsKitContext>): Promise<AopsKitRepositories['projectSummaryRepository']>
  getMemoryItemRepository(overrides?: Partial<AopsKitContext>): Promise<AopsKitRepositories['memoryItemRepository']>
  getTagRepository(overrides?: Partial<AopsKitContext>): Promise<AopsKitRepositories['tagRepository']>
  getAll(overrides?: Partial<AopsKitContext>): Promise<AopsKitServices>
  createAll(overrides?: Partial<AopsKitContext>): Promise<AopsKitServices>
  clearServiceCache(cacheKey?: string): void
  clearProjectServiceCache(cacheKey?: string): void
  clearProjectPathServiceCache(cacheKey?: string): void
  clearWorkspaceServiceCache(cacheKey?: string): void
  clearWorkspaceMemberServiceCache(cacheKey?: string): void
  clearProjectMemberServiceCache(cacheKey?: string): void
  clearPromptServiceCache(cacheKey?: string): void
  clearPromptVersionServiceCache(cacheKey?: string): void
  clearResourceServiceCache(cacheKey?: string): void
  clearSkillServiceCache(cacheKey?: string): void
  clearSkillVersionServiceCache(cacheKey?: string): void
  clearSkillSetServiceCache(cacheKey?: string): void
  clearSkillSetItemServiceCache(cacheKey?: string): void
  clearKanbanBoardServiceCache(cacheKey?: string): void
  clearKanbanColumnServiceCache(cacheKey?: string): void
  clearSprintServiceCache(cacheKey?: string): void
  clearSprintItemServiceCache(cacheKey?: string): void
  clearTaskServiceCache(cacheKey?: string): void
  clearTaskCommentServiceCache(cacheKey?: string): void
  clearAgentSessionServiceCache(cacheKey?: string): void
  clearAgentRunServiceCache(cacheKey?: string): void
  clearArtifactServiceCache(cacheKey?: string): void
  clearArtifactLinkServiceCache(cacheKey?: string): void
  clearCodexChatThreadServiceCache(cacheKey?: string): void
  clearCodexChatMessageServiceCache(cacheKey?: string): void
  clearCodexChatSettingServiceCache(cacheKey?: string): void
  clearProjectSummaryServiceCache(cacheKey?: string): void
  clearMemoryItemServiceCache(cacheKey?: string): void
  clearTagServiceCache(cacheKey?: string): void
  reset(options?: { services?: boolean; repositories?: boolean }): void
  getRegistryStats(): AopsKitDomainServiceRegistryStats
  resolveLogger(overrides?: Partial<AopsKitContext>): Promise<XfLogger | undefined>
}

export interface AopsKitProviderOptions {
  name?: string
  getContext: (overrides?: Partial<AopsKitContext>) => Promise<AopsKitContext> | AopsKitContext
  staticConfig: AopsKitStaticConfig
  resolveLogger?: (context: AopsKitContext) => XfLogger | undefined
  getCacheKey?: (context: AopsKitContext) => string | null
  cache?: Partial<Record<keyof AopsKitServices, ServiceCacheOptions>> & ServiceCacheOptions
  metrics?: MetricsCollector
  resilience?: {
    services?: { retry?: RetryOptions; timeoutMs?: number; breaker?: CircuitBreaker }
    repositories?: { retry?: RetryOptions; timeoutMs?: number; breaker?: CircuitBreaker }
  }
  transformService?: (
    name: keyof AopsKitServices,
    instance: AopsKitServices[keyof AopsKitServices]
  ) => AopsKitServices[keyof AopsKitServices]
  hooks?: Record<string, unknown>
}
