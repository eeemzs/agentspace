CREATE TABLE "agent-runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenantId" text NOT NULL,
	"workspaceId" uuid NOT NULL,
	"projectId" uuid,
	"agentSessionId" uuid NOT NULL,
	"taskId" uuid,
	"runId" text NOT NULL,
	"sessionId" text NOT NULL,
	"agent" text NOT NULL,
	"profile" text,
	"model" text,
	"outputFormat" text,
	"tokensUsed" integer,
	"costUsd" double precision,
	"exitCode" integer,
	"stdout" text,
	"stderr" text,
	"resultText" text,
	"startedAt" timestamp with time zone,
	"endedAt" timestamp with time zone,
	"durationMs" integer,
	"meta" jsonb,
	"createdAt" timestamp with time zone DEFAULT now(),
	"updatedAt" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "agent-run-events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenantId" text NOT NULL,
	"workspaceId" uuid NOT NULL,
	"projectId" uuid,
	"agentRunId" uuid NOT NULL,
	"runId" text NOT NULL,
	"eventId" text NOT NULL,
	"sequence" integer NOT NULL,
	"eventType" text NOT NULL,
	"status" text,
	"payload" jsonb,
	"meta" jsonb,
	"emittedAt" timestamp with time zone NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now(),
	"updatedAt" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "agent-sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenantId" text NOT NULL,
	"workspaceId" uuid NOT NULL,
	"projectId" uuid,
	"sessionId" text NOT NULL,
	"agent" text NOT NULL,
	"profile" text,
	"model" text,
	"status" text NOT NULL,
	"startedAt" timestamp with time zone,
	"endedAt" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now(),
	"updatedAt" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "artifacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenantId" text NOT NULL,
	"workspaceId" uuid NOT NULL,
	"projectId" uuid NOT NULL,
	"artifactType" text NOT NULL,
	"label" text,
	"storagePath" text NOT NULL,
	"mimeType" text,
	"sizeBytes" integer,
	"hash" text,
	"meta" jsonb,
	"createdAt" timestamp with time zone DEFAULT now(),
	"updatedAt" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "artifact-links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenantId" text NOT NULL,
	"workspaceId" uuid NOT NULL,
	"projectId" uuid NOT NULL,
	"artifactId" uuid NOT NULL,
	"refType" text NOT NULL,
	"refId" text NOT NULL,
	"createdBy" text,
	"createdAt" timestamp with time zone DEFAULT now(),
	"updatedAt" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "codex-chat-messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenantId" text NOT NULL,
	"workspaceId" uuid NOT NULL,
	"projectId" uuid,
	"threadId" uuid NOT NULL,
	"externalThreadId" text,
	"role" text NOT NULL,
	"text" text NOT NULL,
	"turnId" text,
	"itemId" text,
	"messageAt" timestamp with time zone NOT NULL,
	"seq" integer NOT NULL,
	"createdBy" text,
	"updatedBy" text,
	"createdAt" timestamp with time zone DEFAULT now(),
	"updatedAt" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "codex-chat-settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenantId" text NOT NULL,
	"workspaceId" uuid NOT NULL,
	"userId" text NOT NULL,
	"binaryPath" text,
	"model" text,
	"reasoningEffort" text,
	"profile" text,
	"executionMode" text NOT NULL,
	"sandboxMode" text NOT NULL,
	"manualCwd" text,
	"autoStart" boolean,
	"createdBy" text,
	"updatedBy" text,
	"createdAt" timestamp with time zone DEFAULT now(),
	"updatedAt" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "codex-chat-threads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenantId" text NOT NULL,
	"workspaceId" uuid NOT NULL,
	"projectId" uuid,
	"externalThreadId" text NOT NULL,
	"scopeLabel" text,
	"cwd" text,
	"title" text,
	"tags" jsonb,
	"lastPrompt" text,
	"lastAssistant" text,
	"tokenInput" integer,
	"tokenOutput" integer,
	"tokenTotal" integer,
	"lastMessageAt" timestamp with time zone,
	"createdBy" text,
	"updatedBy" text,
	"createdAt" timestamp with time zone DEFAULT now(),
	"updatedAt" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "kanban-boards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenantId" text NOT NULL,
	"workspaceId" uuid NOT NULL,
	"projectId" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"createdAt" timestamp with time zone DEFAULT now(),
	"updatedAt" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "aops-kanban-columns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenantId" text NOT NULL,
	"workspaceId" uuid NOT NULL,
	"projectId" uuid NOT NULL,
	"boardId" uuid NOT NULL,
	"name" text NOT NULL,
	"statusKey" text NOT NULL,
	"position" integer NOT NULL,
	"wipLimit" integer,
	"createdAt" timestamp with time zone DEFAULT now(),
	"updatedAt" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "memory-items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenantId" text NOT NULL,
	"workspaceId" uuid NOT NULL,
	"projectId" uuid,
	"scopeType" text DEFAULT 'project' NOT NULL,
	"scopeId" text,
	"kind" text NOT NULL,
	"content" text NOT NULL,
	"tags" jsonb,
	"importance" integer,
	"sourceType" text,
	"sourceId" text,
	"meta" jsonb,
	"createdAt" timestamp with time zone DEFAULT now(),
	"updatedAt" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenantId" text NOT NULL,
	"workspaceId" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"tags" jsonb,
	"slug" text,
	"status" text,
	"visibility" text,
	"projectType" text,
	"ownerId" text,
	"createdBy" text,
	"updatedBy" text,
	"createdAt" timestamp with time zone DEFAULT now(),
	"updatedAt" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "project-paths" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenantId" text NOT NULL,
	"workspaceId" uuid NOT NULL,
	"projectId" uuid NOT NULL,
	"pathKey" text NOT NULL,
	"path" text NOT NULL,
	"description" text,
	"createdBy" text,
	"updatedBy" text,
	"createdAt" timestamp with time zone DEFAULT now(),
	"updatedAt" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "project-members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenantId" text NOT NULL,
	"workspaceId" uuid NOT NULL,
	"projectId" uuid NOT NULL,
	"userId" uuid NOT NULL,
	"role" text NOT NULL,
	"createdBy" text,
	"updatedBy" text,
	"createdAt" timestamp with time zone DEFAULT now(),
	"updatedAt" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "project-summaries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenantId" text NOT NULL,
	"workspaceId" uuid NOT NULL,
	"projectId" uuid NOT NULL,
	"summary" text,
	"decisions" jsonb,
	"openItems" jsonb,
	"lastRunId" text,
	"lastSessionId" text,
	"createdAt" timestamp with time zone DEFAULT now(),
	"updatedAt" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "prompts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenantId" text NOT NULL,
	"workspaceId" uuid NOT NULL,
	"projectId" uuid,
	"scopeType" text NOT NULL,
	"scopeId" text,
	"name" text NOT NULL,
	"description" text,
	"tags" jsonb,
	"status" text DEFAULT 'draft' NOT NULL,
	"currentVersionId" uuid,
	"createdBy" text,
	"updatedBy" text,
	"createdAt" timestamp with time zone DEFAULT now(),
	"updatedAt" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "prompt-versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenantId" text NOT NULL,
	"workspaceId" uuid NOT NULL,
	"promptId" uuid NOT NULL,
	"version" integer NOT NULL,
	"status" text NOT NULL,
	"content" text NOT NULL,
	"variables" jsonb,
	"meta" jsonb,
	"refType" text,
	"refId" text,
	"createdBy" text,
	"updatedBy" text,
	"publishedAt" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now(),
	"updatedAt" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "resources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenantId" text NOT NULL,
	"workspaceId" uuid NOT NULL,
	"projectId" uuid,
	"scopeType" text NOT NULL,
	"scopeId" text,
	"name" text NOT NULL,
	"description" text,
	"resourceType" text NOT NULL,
	"uri" text,
	"tags" jsonb,
	"refType" text,
	"refId" text,
	"meta" jsonb,
	"createdBy" text,
	"updatedBy" text,
	"createdAt" timestamp with time zone DEFAULT now(),
	"updatedAt" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "skills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenantId" text NOT NULL,
	"workspaceId" uuid NOT NULL,
	"projectId" uuid,
	"scopeType" text NOT NULL,
	"scopeId" text,
	"name" text NOT NULL,
	"description" text,
	"shortDescription" text,
	"tags" jsonb,
	"currentVersionId" uuid,
	"createdBy" text,
	"updatedBy" text,
	"createdAt" timestamp with time zone DEFAULT now(),
	"updatedAt" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "skill-sets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenantId" text NOT NULL,
	"workspaceId" uuid NOT NULL,
	"projectId" uuid,
	"scopeType" text NOT NULL,
	"scopeId" text,
	"name" text NOT NULL,
	"description" text,
	"tags" jsonb,
	"createdBy" text,
	"updatedBy" text,
	"createdAt" timestamp with time zone DEFAULT now(),
	"updatedAt" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "skill-set-items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenantId" text NOT NULL,
	"workspaceId" uuid NOT NULL,
	"skillSetId" uuid NOT NULL,
	"skillVersionId" uuid NOT NULL,
	"position" integer NOT NULL,
	"meta" jsonb,
	"createdBy" text,
	"updatedBy" text,
	"createdAt" timestamp with time zone DEFAULT now(),
	"updatedAt" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "skill-versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenantId" text NOT NULL,
	"workspaceId" uuid NOT NULL,
	"projectId" uuid,
	"skillId" uuid NOT NULL,
	"version" integer NOT NULL,
	"status" text NOT NULL,
	"content" text NOT NULL,
	"entryFile" text,
	"skillStandard" text DEFAULT 'aops-skill-v1' NOT NULL,
	"files" jsonb,
	"meta" jsonb,
	"refType" text,
	"refId" text,
	"createdBy" text,
	"updatedBy" text,
	"publishedAt" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now(),
	"updatedAt" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sprints" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenantId" text NOT NULL,
	"workspaceId" uuid NOT NULL,
	"projectId" uuid,
	"scopeType" text NOT NULL,
	"scopeId" text,
	"name" text NOT NULL,
	"goal" text,
	"status" text NOT NULL,
	"tags" jsonb,
	"createdBy" text,
	"updatedBy" text,
	"startAt" timestamp with time zone,
	"endAt" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now(),
	"updatedAt" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sprint-items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenantId" text NOT NULL,
	"workspaceId" uuid NOT NULL,
	"sprintId" uuid NOT NULL,
	"title" text NOT NULL,
	"status" text NOT NULL,
	"position" integer NOT NULL,
	"openedAt" timestamp with time zone,
	"closedAt" timestamp with time zone,
	"refType" text,
	"refId" text,
	"notes" text,
	"meta" jsonb,
	"createdBy" text,
	"updatedBy" text,
	"createdAt" timestamp with time zone DEFAULT now(),
	"updatedAt" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenantId" text NOT NULL,
	"workspaceId" uuid NOT NULL,
	"scopeType" text NOT NULL,
	"name" text NOT NULL,
	"createdBy" text,
	"updatedBy" text,
	"createdAt" timestamp with time zone DEFAULT now(),
	"updatedAt" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenantId" text NOT NULL,
	"workspaceId" uuid NOT NULL,
	"projectId" uuid NOT NULL,
	"columnId" uuid NOT NULL,
	"sprintId" uuid,
	"promptVersionId" uuid,
	"parentTaskId" uuid,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"input" jsonb,
	"meta" jsonb,
	"assignee" text,
	"position" integer NOT NULL,
	"priority" integer,
	"dueAt" timestamp with time zone,
	"createdBy" text,
	"updatedBy" text,
	"createdAt" timestamp with time zone DEFAULT now(),
	"updatedAt" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "task-comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenantId" text NOT NULL,
	"workspaceId" uuid NOT NULL,
	"projectId" uuid NOT NULL,
	"taskId" uuid NOT NULL,
	"author" text NOT NULL,
	"body" text NOT NULL,
	"meta" jsonb,
	"createdAt" timestamp with time zone DEFAULT now(),
	"updatedAt" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "workflow-instances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenantId" text NOT NULL,
	"workspaceId" uuid NOT NULL,
	"projectId" uuid,
	"workflowInstanceId" text NOT NULL,
	"definitionId" text,
	"mode" text NOT NULL,
	"status" text NOT NULL,
	"subjectType" text NOT NULL,
	"subjectId" text NOT NULL,
	"subjectLabel" text,
	"subjectMeta" jsonb,
	"input" jsonb,
	"currentStepId" text,
	"activeApprovalId" text,
	"runtimeProfile" text,
	"runRecordIds" jsonb NOT NULL,
	"steps" jsonb NOT NULL,
	"definitionSnapshot" jsonb,
	"meta" jsonb,
	"openedAt" timestamp with time zone NOT NULL,
	"closedAt" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now(),
	"updatedAt" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "workflow-step-runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenantId" text NOT NULL,
	"workspaceId" uuid NOT NULL,
	"projectId" uuid,
	"workflowId" uuid NOT NULL,
	"workflowInstanceId" text NOT NULL,
	"stepId" text NOT NULL,
	"sequence" integer NOT NULL,
	"kind" text NOT NULL,
	"title" text,
	"status" text NOT NULL,
	"agentRunId" uuid,
	"approvalId" text,
	"childWorkflowId" uuid,
	"childWorkflowInstanceId" text,
	"input" jsonb,
	"approval" jsonb,
	"error" jsonb,
	"meta" jsonb,
	"openedAt" timestamp with time zone NOT NULL,
	"closedAt" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now(),
	"updatedAt" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "workspaces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenantId" text NOT NULL,
	"ownerId" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"sharingEnabled" boolean DEFAULT true NOT NULL,
	"createdBy" text,
	"updatedBy" text,
	"createdAt" timestamp with time zone DEFAULT now(),
	"updatedAt" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "workspace-members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenantId" text NOT NULL,
	"workspaceId" uuid NOT NULL,
	"userId" uuid NOT NULL,
	"role" text NOT NULL,
	"createdBy" text,
	"updatedBy" text,
	"createdAt" timestamp with time zone DEFAULT now(),
	"updatedAt" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "agent-runs" ADD CONSTRAINT "agent-runs_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent-runs" ADD CONSTRAINT "agent-runs_projectId_projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent-runs" ADD CONSTRAINT "agent-runs_agentSessionId_agent-sessions_id_fk" FOREIGN KEY ("agentSessionId") REFERENCES "public"."agent-sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent-runs" ADD CONSTRAINT "agent-runs_taskId_tasks_id_fk" FOREIGN KEY ("taskId") REFERENCES "public"."tasks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent-run-events" ADD CONSTRAINT "agent-run-events_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent-run-events" ADD CONSTRAINT "agent-run-events_projectId_projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent-run-events" ADD CONSTRAINT "agent-run-events_agentRunId_agent-runs_id_fk" FOREIGN KEY ("agentRunId") REFERENCES "public"."agent-runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent-sessions" ADD CONSTRAINT "agent-sessions_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent-sessions" ADD CONSTRAINT "agent-sessions_projectId_projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artifacts" ADD CONSTRAINT "artifacts_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artifacts" ADD CONSTRAINT "artifacts_projectId_projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artifact-links" ADD CONSTRAINT "artifact-links_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artifact-links" ADD CONSTRAINT "artifact-links_projectId_projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artifact-links" ADD CONSTRAINT "artifact-links_artifactId_artifacts_id_fk" FOREIGN KEY ("artifactId") REFERENCES "public"."artifacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "codex-chat-messages" ADD CONSTRAINT "codex-chat-messages_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "codex-chat-messages" ADD CONSTRAINT "codex-chat-messages_projectId_projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "codex-chat-messages" ADD CONSTRAINT "codex-chat-messages_threadId_codex-chat-threads_id_fk" FOREIGN KEY ("threadId") REFERENCES "public"."codex-chat-threads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "codex-chat-settings" ADD CONSTRAINT "codex-chat-settings_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "codex-chat-threads" ADD CONSTRAINT "codex-chat-threads_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "codex-chat-threads" ADD CONSTRAINT "codex-chat-threads_projectId_projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "aops-kanban-columns" ADD CONSTRAINT "aops-kanban-columns_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "aops-kanban-columns" ADD CONSTRAINT "aops-kanban-columns_projectId_projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "aops-kanban-columns" ADD CONSTRAINT "aops-kanban-columns_boardId_kanban-boards_id_fk" FOREIGN KEY ("boardId") REFERENCES "public"."kanban-boards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memory-items" ADD CONSTRAINT "memory-items_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memory-items" ADD CONSTRAINT "memory-items_projectId_projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project-paths" ADD CONSTRAINT "project-paths_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project-paths" ADD CONSTRAINT "project-paths_projectId_projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project-members" ADD CONSTRAINT "project-members_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project-members" ADD CONSTRAINT "project-members_projectId_projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project-summaries" ADD CONSTRAINT "project-summaries_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project-summaries" ADD CONSTRAINT "project-summaries_projectId_projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompts" ADD CONSTRAINT "prompts_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompts" ADD CONSTRAINT "prompts_projectId_projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompt-versions" ADD CONSTRAINT "prompt-versions_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompt-versions" ADD CONSTRAINT "prompt-versions_promptId_prompts_id_fk" FOREIGN KEY ("promptId") REFERENCES "public"."prompts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resources" ADD CONSTRAINT "resources_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resources" ADD CONSTRAINT "resources_projectId_projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skills" ADD CONSTRAINT "skills_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skills" ADD CONSTRAINT "skills_projectId_projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill-sets" ADD CONSTRAINT "skill-sets_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill-sets" ADD CONSTRAINT "skill-sets_projectId_projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill-set-items" ADD CONSTRAINT "skill-set-items_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill-set-items" ADD CONSTRAINT "skill-set-items_skillSetId_skill-sets_id_fk" FOREIGN KEY ("skillSetId") REFERENCES "public"."skill-sets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill-set-items" ADD CONSTRAINT "skill-set-items_skillVersionId_skill-versions_id_fk" FOREIGN KEY ("skillVersionId") REFERENCES "public"."skill-versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill-versions" ADD CONSTRAINT "skill-versions_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill-versions" ADD CONSTRAINT "skill-versions_projectId_projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill-versions" ADD CONSTRAINT "skill-versions_skillId_skills_id_fk" FOREIGN KEY ("skillId") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_projectId_projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_promptVersionId_prompt-versions_id_fk" FOREIGN KEY ("promptVersionId") REFERENCES "public"."prompt-versions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "task_parent_task_fk" FOREIGN KEY ("parentTaskId") REFERENCES "public"."tasks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task-comments" ADD CONSTRAINT "task-comments_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task-comments" ADD CONSTRAINT "task-comments_projectId_projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task-comments" ADD CONSTRAINT "task-comments_taskId_tasks_id_fk" FOREIGN KEY ("taskId") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow-instances" ADD CONSTRAINT "workflow-instances_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow-instances" ADD CONSTRAINT "workflow-instances_projectId_projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow-step-runs" ADD CONSTRAINT "workflow-step-runs_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow-step-runs" ADD CONSTRAINT "workflow-step-runs_projectId_projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow-step-runs" ADD CONSTRAINT "workflow-step-runs_workflowId_workflow-instances_id_fk" FOREIGN KEY ("workflowId") REFERENCES "public"."workflow-instances"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow-step-runs" ADD CONSTRAINT "workflow-step-runs_agentRunId_agent-runs_id_fk" FOREIGN KEY ("agentRunId") REFERENCES "public"."agent-runs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow-step-runs" ADD CONSTRAINT "workflow-step-runs_childWorkflowId_workflow-instances_id_fk" FOREIGN KEY ("childWorkflowId") REFERENCES "public"."workflow-instances"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace-members" ADD CONSTRAINT "workspace-members_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "agent_run_idx_tenant" ON "agent-runs" USING btree ("tenantId");--> statement-breakpoint
CREATE INDEX "agent_run_idx_workspace" ON "agent-runs" USING btree ("tenantId","workspaceId");--> statement-breakpoint
CREATE INDEX "agent_run_idx_session_started" ON "agent-runs" USING btree ("tenantId","agentSessionId","startedAt");--> statement-breakpoint
CREATE INDEX "agent_run_idx_task_started" ON "agent-runs" USING btree ("tenantId","taskId","startedAt");--> statement-breakpoint
CREATE INDEX "agent_run_idx_project" ON "agent-runs" USING btree ("tenantId","projectId");--> statement-breakpoint
CREATE UNIQUE INDEX "agent_run_event_unique_run_sequence" ON "agent-run-events" USING btree ("tenantId","agentRunId","sequence");--> statement-breakpoint
CREATE INDEX "agent_run_event_idx_workspace_emitted" ON "agent-run-events" USING btree ("tenantId","workspaceId","emittedAt");--> statement-breakpoint
CREATE INDEX "agent_run_event_idx_project_emitted" ON "agent-run-events" USING btree ("tenantId","projectId","emittedAt");--> statement-breakpoint
CREATE INDEX "agent_run_event_idx_run_id" ON "agent-run-events" USING btree ("tenantId","runId");--> statement-breakpoint
CREATE INDEX "agent_run_event_idx_type" ON "agent-run-events" USING btree ("tenantId","eventType");--> statement-breakpoint
CREATE INDEX "agent_session_idx_tenant" ON "agent-sessions" USING btree ("tenantId");--> statement-breakpoint
CREATE INDEX "agent_session_idx_workspace" ON "agent-sessions" USING btree ("tenantId","workspaceId");--> statement-breakpoint
CREATE INDEX "agent_session_idx_project_started" ON "agent-sessions" USING btree ("tenantId","projectId","startedAt");--> statement-breakpoint
CREATE INDEX "artifact_idx_tenant" ON "artifacts" USING btree ("tenantId");--> statement-breakpoint
CREATE INDEX "artifact_idx_workspace" ON "artifacts" USING btree ("tenantId","workspaceId");--> statement-breakpoint
CREATE INDEX "artifact_idx_project_created" ON "artifacts" USING btree ("tenantId","projectId","createdAt");--> statement-breakpoint
CREATE INDEX "artifact_link_idx_tenant" ON "artifact-links" USING btree ("tenantId");--> statement-breakpoint
CREATE INDEX "artifact_link_idx_workspace" ON "artifact-links" USING btree ("tenantId","workspaceId");--> statement-breakpoint
CREATE INDEX "artifact_link_idx_artifact" ON "artifact-links" USING btree ("tenantId","artifactId");--> statement-breakpoint
CREATE INDEX "artifact_link_idx_project_ref_created" ON "artifact-links" USING btree ("tenantId","projectId","refType","refId","createdAt");--> statement-breakpoint
CREATE UNIQUE INDEX "codex_chat_message_tenant_thread_seq_unique" ON "codex-chat-messages" USING btree ("tenantId","threadId","seq");--> statement-breakpoint
CREATE INDEX "codex_chat_message_idx_tenant" ON "codex-chat-messages" USING btree ("tenantId");--> statement-breakpoint
CREATE INDEX "codex_chat_message_idx_thread_messageat" ON "codex-chat-messages" USING btree ("tenantId","threadId","messageAt");--> statement-breakpoint
CREATE INDEX "codex_chat_message_idx_workspace_messageat" ON "codex-chat-messages" USING btree ("tenantId","workspaceId","messageAt");--> statement-breakpoint
CREATE UNIQUE INDEX "codex_chat_setting_tenant_workspace_user_unique" ON "codex-chat-settings" USING btree ("tenantId","workspaceId","userId");--> statement-breakpoint
CREATE INDEX "codex_chat_setting_idx_tenant" ON "codex-chat-settings" USING btree ("tenantId");--> statement-breakpoint
CREATE INDEX "codex_chat_setting_idx_workspace_user" ON "codex-chat-settings" USING btree ("tenantId","workspaceId","userId");--> statement-breakpoint
CREATE UNIQUE INDEX "codex_chat_thread_tenant_workspace_external_unique" ON "codex-chat-threads" USING btree ("tenantId","workspaceId","externalThreadId");--> statement-breakpoint
CREATE INDEX "codex_chat_thread_idx_tenant" ON "codex-chat-threads" USING btree ("tenantId");--> statement-breakpoint
CREATE INDEX "codex_chat_thread_idx_workspace_updated" ON "codex-chat-threads" USING btree ("tenantId","workspaceId","updatedAt");--> statement-breakpoint
CREATE INDEX "codex_chat_thread_idx_project_updated" ON "codex-chat-threads" USING btree ("tenantId","projectId","updatedAt");--> statement-breakpoint
CREATE INDEX "kanban_board_idx_tenant" ON "kanban-boards" USING btree ("tenantId");--> statement-breakpoint
CREATE INDEX "kanban_board_idx_workspace" ON "kanban-boards" USING btree ("tenantId","workspaceId");--> statement-breakpoint
CREATE INDEX "kanban_board_idx_project" ON "kanban-boards" USING btree ("tenantId","projectId");--> statement-breakpoint
CREATE UNIQUE INDEX "kanban_column_position_unique" ON "aops-kanban-columns" USING btree ("tenantId","boardId","position");--> statement-breakpoint
CREATE INDEX "aops_kanban_column_idx_tenant" ON "aops-kanban-columns" USING btree ("tenantId");--> statement-breakpoint
CREATE INDEX "aops_kanban_column_idx_workspace" ON "aops-kanban-columns" USING btree ("tenantId","workspaceId");--> statement-breakpoint
CREATE INDEX "kanban_column_idx_board" ON "aops-kanban-columns" USING btree ("tenantId","boardId");--> statement-breakpoint
CREATE INDEX "kanban_column_idx_project" ON "aops-kanban-columns" USING btree ("tenantId","projectId");--> statement-breakpoint
CREATE INDEX "memory_item_idx_tenant" ON "memory-items" USING btree ("tenantId");--> statement-breakpoint
CREATE INDEX "memory_item_idx_workspace" ON "memory-items" USING btree ("tenantId","workspaceId");--> statement-breakpoint
CREATE INDEX "memory_item_idx_project" ON "memory-items" USING btree ("tenantId","projectId");--> statement-breakpoint
CREATE INDEX "memory_item_idx_scope" ON "memory-items" USING btree ("tenantId","scopeType","scopeId");--> statement-breakpoint
CREATE INDEX "memory_item_idx_kind" ON "memory-items" USING btree ("tenantId","kind");--> statement-breakpoint
CREATE UNIQUE INDEX "project_slug_tenant_unique" ON "projects" USING btree ("tenantId","workspaceId","slug");--> statement-breakpoint
CREATE INDEX "project_idx_tenant" ON "projects" USING btree ("tenantId");--> statement-breakpoint
CREATE INDEX "project_idx_workspace" ON "projects" USING btree ("tenantId","workspaceId");--> statement-breakpoint
CREATE UNIQUE INDEX "project_path_unique_key" ON "project-paths" USING btree ("tenantId","projectId","pathKey");--> statement-breakpoint
CREATE INDEX "project_path_idx_tenant" ON "project-paths" USING btree ("tenantId");--> statement-breakpoint
CREATE INDEX "project_path_idx_workspace" ON "project-paths" USING btree ("tenantId","workspaceId");--> statement-breakpoint
CREATE INDEX "project_path_idx_project" ON "project-paths" USING btree ("tenantId","projectId");--> statement-breakpoint
CREATE UNIQUE INDEX "project_member_unique_user" ON "project-members" USING btree ("tenantId","projectId","userId");--> statement-breakpoint
CREATE INDEX "project_member_idx_tenant" ON "project-members" USING btree ("tenantId");--> statement-breakpoint
CREATE INDEX "project_member_idx_workspace" ON "project-members" USING btree ("tenantId","workspaceId");--> statement-breakpoint
CREATE INDEX "project_member_idx_project" ON "project-members" USING btree ("tenantId","projectId");--> statement-breakpoint
CREATE INDEX "project_member_idx_user" ON "project-members" USING btree ("tenantId","userId");--> statement-breakpoint
CREATE UNIQUE INDEX "project_summary_project_unique" ON "project-summaries" USING btree ("tenantId","projectId");--> statement-breakpoint
CREATE INDEX "project_summary_idx_tenant" ON "project-summaries" USING btree ("tenantId");--> statement-breakpoint
CREATE INDEX "project_summary_idx_workspace" ON "project-summaries" USING btree ("tenantId","workspaceId");--> statement-breakpoint
CREATE UNIQUE INDEX "prompt_scope_name_tenant_unique" ON "prompts" USING btree ("tenantId","workspaceId","scopeType","scopeId","name");--> statement-breakpoint
CREATE INDEX "prompt_idx_tenant" ON "prompts" USING btree ("tenantId");--> statement-breakpoint
CREATE INDEX "prompt_idx_workspace" ON "prompts" USING btree ("tenantId","workspaceId");--> statement-breakpoint
CREATE INDEX "prompt_idx_project" ON "prompts" USING btree ("tenantId","projectId");--> statement-breakpoint
CREATE UNIQUE INDEX "prompt_version_unique" ON "prompt-versions" USING btree ("tenantId","promptId","version");--> statement-breakpoint
CREATE INDEX "prompt_version_idx_tenant" ON "prompt-versions" USING btree ("tenantId");--> statement-breakpoint
CREATE INDEX "prompt_version_idx_workspace" ON "prompt-versions" USING btree ("tenantId","workspaceId");--> statement-breakpoint
CREATE INDEX "prompt_version_idx_prompt" ON "prompt-versions" USING btree ("tenantId","promptId");--> statement-breakpoint
CREATE UNIQUE INDEX "resource_workspace_ref_unique" ON "resources" USING btree ("tenantId","workspaceId","refType","refId");--> statement-breakpoint
CREATE INDEX "resource_idx_tenant" ON "resources" USING btree ("tenantId");--> statement-breakpoint
CREATE INDEX "resource_idx_workspace" ON "resources" USING btree ("tenantId","workspaceId");--> statement-breakpoint
CREATE INDEX "resource_idx_project" ON "resources" USING btree ("tenantId","projectId");--> statement-breakpoint
CREATE INDEX "resource_idx_scope" ON "resources" USING btree ("tenantId","scopeType","scopeId");--> statement-breakpoint
CREATE UNIQUE INDEX "skill_scope_name_tenant_unique" ON "skills" USING btree ("tenantId","workspaceId","scopeType","scopeId","name");--> statement-breakpoint
CREATE INDEX "skill_idx_tenant" ON "skills" USING btree ("tenantId");--> statement-breakpoint
CREATE INDEX "skill_idx_workspace" ON "skills" USING btree ("tenantId","workspaceId");--> statement-breakpoint
CREATE INDEX "skill_idx_project" ON "skills" USING btree ("tenantId","projectId");--> statement-breakpoint
CREATE UNIQUE INDEX "skill_set_scope_name_tenant_unique" ON "skill-sets" USING btree ("tenantId","workspaceId","scopeType","scopeId","name");--> statement-breakpoint
CREATE INDEX "skill_set_idx_tenant" ON "skill-sets" USING btree ("tenantId");--> statement-breakpoint
CREATE INDEX "skill_set_idx_workspace" ON "skill-sets" USING btree ("tenantId","workspaceId");--> statement-breakpoint
CREATE INDEX "skill_set_idx_project" ON "skill-sets" USING btree ("tenantId","projectId");--> statement-breakpoint
CREATE UNIQUE INDEX "skill_set_item_position_unique" ON "skill-set-items" USING btree ("tenantId","skillSetId","position");--> statement-breakpoint
CREATE INDEX "skill_set_item_idx_workspace" ON "skill-set-items" USING btree ("tenantId","workspaceId");--> statement-breakpoint
CREATE INDEX "skill_set_item_idx_skill_set" ON "skill-set-items" USING btree ("tenantId","skillSetId");--> statement-breakpoint
CREATE INDEX "skill_set_item_idx_skill_version" ON "skill-set-items" USING btree ("tenantId","skillVersionId");--> statement-breakpoint
CREATE UNIQUE INDEX "skill_version_unique" ON "skill-versions" USING btree ("tenantId","skillId","version");--> statement-breakpoint
CREATE INDEX "skill_version_idx_tenant" ON "skill-versions" USING btree ("tenantId");--> statement-breakpoint
CREATE INDEX "skill_version_idx_workspace" ON "skill-versions" USING btree ("tenantId","workspaceId");--> statement-breakpoint
CREATE INDEX "skill_version_idx_skill" ON "skill-versions" USING btree ("tenantId","skillId");--> statement-breakpoint
CREATE INDEX "sprint_idx_tenant" ON "sprints" USING btree ("tenantId");--> statement-breakpoint
CREATE INDEX "sprint_idx_workspace" ON "sprints" USING btree ("tenantId","workspaceId");--> statement-breakpoint
CREATE INDEX "sprint_idx_project" ON "sprints" USING btree ("tenantId","projectId");--> statement-breakpoint
CREATE INDEX "sprint_idx_project_status_start" ON "sprints" USING btree ("tenantId","projectId","status","startAt");--> statement-breakpoint
CREATE UNIQUE INDEX "sprint_item_position_unique" ON "sprint-items" USING btree ("tenantId","sprintId","position");--> statement-breakpoint
CREATE INDEX "sprint_item_idx_tenant" ON "sprint-items" USING btree ("tenantId");--> statement-breakpoint
CREATE INDEX "sprint_item_idx_workspace" ON "sprint-items" USING btree ("tenantId","workspaceId");--> statement-breakpoint
CREATE INDEX "sprint_item_idx_sprint" ON "sprint-items" USING btree ("tenantId","sprintId");--> statement-breakpoint
CREATE UNIQUE INDEX "tag_scope_name_tenant_unique" ON "tags" USING btree ("tenantId","workspaceId","scopeType","name");--> statement-breakpoint
CREATE INDEX "tag_idx_tenant" ON "tags" USING btree ("tenantId");--> statement-breakpoint
CREATE INDEX "tag_idx_workspace" ON "tags" USING btree ("tenantId","workspaceId");--> statement-breakpoint
CREATE INDEX "tag_idx_scope" ON "tags" USING btree ("tenantId","scopeType");--> statement-breakpoint
CREATE UNIQUE INDEX "task_column_position_unique" ON "tasks" USING btree ("tenantId","columnId","position");--> statement-breakpoint
CREATE INDEX "task_idx_tenant" ON "tasks" USING btree ("tenantId");--> statement-breakpoint
CREATE INDEX "task_idx_workspace" ON "tasks" USING btree ("tenantId","workspaceId");--> statement-breakpoint
CREATE INDEX "task_idx_project" ON "tasks" USING btree ("tenantId","projectId");--> statement-breakpoint
CREATE INDEX "task_idx_column" ON "tasks" USING btree ("tenantId","columnId");--> statement-breakpoint
CREATE INDEX "task_idx_sprint" ON "tasks" USING btree ("tenantId","sprintId");--> statement-breakpoint
CREATE INDEX "task_idx_prompt_version" ON "tasks" USING btree ("tenantId","promptVersionId");--> statement-breakpoint
CREATE INDEX "task_idx_parent" ON "tasks" USING btree ("tenantId","parentTaskId");--> statement-breakpoint
CREATE INDEX "task_comment_idx_tenant" ON "task-comments" USING btree ("tenantId");--> statement-breakpoint
CREATE INDEX "task_comment_idx_workspace" ON "task-comments" USING btree ("tenantId","workspaceId");--> statement-breakpoint
CREATE INDEX "task_comment_idx_project" ON "task-comments" USING btree ("tenantId","projectId");--> statement-breakpoint
CREATE INDEX "task_comment_idx_task" ON "task-comments" USING btree ("tenantId","taskId");--> statement-breakpoint
CREATE UNIQUE INDEX "workflow_instance_unique_instance_id" ON "workflow-instances" USING btree ("tenantId","workspaceId","workflowInstanceId");--> statement-breakpoint
CREATE INDEX "workflow_instance_idx_workspace_status" ON "workflow-instances" USING btree ("tenantId","workspaceId","status");--> statement-breakpoint
CREATE INDEX "workflow_instance_idx_project_status" ON "workflow-instances" USING btree ("tenantId","projectId","status");--> statement-breakpoint
CREATE INDEX "workflow_instance_idx_subject" ON "workflow-instances" USING btree ("tenantId","subjectType","subjectId");--> statement-breakpoint
CREATE UNIQUE INDEX "workflow_step_run_unique_sequence" ON "workflow-step-runs" USING btree ("tenantId","workflowId","sequence");--> statement-breakpoint
CREATE INDEX "workflow_step_run_idx_workflow_step" ON "workflow-step-runs" USING btree ("tenantId","workflowId","stepId");--> statement-breakpoint
CREATE INDEX "workflow_step_run_idx_instance" ON "workflow-step-runs" USING btree ("tenantId","workflowInstanceId");--> statement-breakpoint
CREATE INDEX "workflow_step_run_idx_agent_run" ON "workflow-step-runs" USING btree ("tenantId","agentRunId");--> statement-breakpoint
CREATE INDEX "workflow_step_run_idx_child_workflow" ON "workflow-step-runs" USING btree ("tenantId","childWorkflowId");--> statement-breakpoint
CREATE INDEX "workspace_idx_tenant" ON "workspaces" USING btree ("tenantId");--> statement-breakpoint
CREATE INDEX "workspace_idx_owner" ON "workspaces" USING btree ("tenantId","ownerId");--> statement-breakpoint
CREATE UNIQUE INDEX "workspace_owner_name_tenant_unique" ON "workspaces" USING btree ("tenantId","ownerId",lower("name"));--> statement-breakpoint
CREATE UNIQUE INDEX "workspace_member_unique_user" ON "workspace-members" USING btree ("tenantId","workspaceId","userId");--> statement-breakpoint
CREATE INDEX "workspace_member_idx_tenant" ON "workspace-members" USING btree ("tenantId");--> statement-breakpoint
CREATE INDEX "workspace_member_idx_workspace" ON "workspace-members" USING btree ("tenantId","workspaceId");--> statement-breakpoint
CREATE INDEX "workspace_member_idx_user" ON "workspace-members" USING btree ("tenantId","userId");