CREATE TABLE `agent-runs` (
	`id` text PRIMARY KEY NOT NULL,
	`tenantId` text NOT NULL,
	`scopeId` text NOT NULL,
	`projectId` text,
	`agentSessionId` text NOT NULL,
	`taskId` text,
	`runId` text NOT NULL,
	`sessionId` text NOT NULL,
	`agent` text NOT NULL,
	`profile` text,
	`model` text,
	`outputFormat` text,
	`tokensUsed` integer,
	`costUsd` real,
	`exitCode` integer,
	`stdout` text,
	`stderr` text,
	`resultText` text,
	`startedAt` integer,
	`endedAt` integer,
	`durationMs` integer,
	`meta` text,
	`createdAt` integer,
	`updatedAt` integer,
	FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`agentSessionId`) REFERENCES `agent-sessions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`taskId`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `agent_run_idx_tenant` ON `agent-runs` (`tenantId`);--> statement-breakpoint
CREATE INDEX `agent_run_idx_scope` ON `agent-runs` (`tenantId`,`scopeId`);--> statement-breakpoint
CREATE INDEX `agent_run_idx_session_started` ON `agent-runs` (`tenantId`,`agentSessionId`,`startedAt`);--> statement-breakpoint
CREATE INDEX `agent_run_idx_task_started` ON `agent-runs` (`tenantId`,`taskId`,`startedAt`);--> statement-breakpoint
CREATE INDEX `agent_run_idx_project` ON `agent-runs` (`tenantId`,`projectId`);--> statement-breakpoint
CREATE TABLE `agent-run-events` (
	`id` text PRIMARY KEY NOT NULL,
	`tenantId` text NOT NULL,
	`scopeId` text NOT NULL,
	`agentRunId` text NOT NULL,
	`runId` text NOT NULL,
	`eventId` text NOT NULL,
	`sequence` integer NOT NULL,
	`eventType` text NOT NULL,
	`status` text,
	`payload` text,
	`meta` text,
	`emittedAt` integer NOT NULL,
	`createdAt` integer,
	`updatedAt` integer,
	FOREIGN KEY (`agentRunId`) REFERENCES `agent-runs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `agent_run_event_unique_run_sequence` ON `agent-run-events` (`tenantId`,`agentRunId`,`sequence`);--> statement-breakpoint
CREATE INDEX `agent_run_event_idx_scope_emitted` ON `agent-run-events` (`tenantId`,`scopeId`,`emittedAt`);--> statement-breakpoint
CREATE INDEX `agent_run_event_idx_run_id` ON `agent-run-events` (`tenantId`,`runId`);--> statement-breakpoint
CREATE INDEX `agent_run_event_idx_type` ON `agent-run-events` (`tenantId`,`eventType`);--> statement-breakpoint
CREATE TABLE `agent-sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`tenantId` text NOT NULL,
	`scopeId` text NOT NULL,
	`sessionId` text NOT NULL,
	`agent` text NOT NULL,
	`profile` text,
	`model` text,
	`status` text NOT NULL,
	`startedAt` integer,
	`endedAt` integer,
	`createdAt` integer,
	`updatedAt` integer
);
--> statement-breakpoint
CREATE INDEX `agent_session_idx_tenant` ON `agent-sessions` (`tenantId`);--> statement-breakpoint
CREATE INDEX `agent_session_idx_scope` ON `agent-sessions` (`tenantId`,`scopeId`);--> statement-breakpoint
CREATE INDEX `agent_session_idx_scope_started` ON `agent-sessions` (`tenantId`,`scopeId`,`startedAt`);--> statement-breakpoint
CREATE TABLE `artifacts` (
	`id` text PRIMARY KEY NOT NULL,
	`tenantId` text NOT NULL,
	`scopeId` text NOT NULL,
	`artifactType` text NOT NULL,
	`label` text,
	`storagePath` text NOT NULL,
	`mimeType` text,
	`sizeBytes` integer,
	`hash` text,
	`meta` text,
	`createdAt` integer,
	`updatedAt` integer
);
--> statement-breakpoint
CREATE INDEX `artifact_idx_tenant` ON `artifacts` (`tenantId`);--> statement-breakpoint
CREATE INDEX `artifact_idx_scope_created` ON `artifacts` (`tenantId`,`scopeId`,`createdAt`);--> statement-breakpoint
CREATE TABLE `artifact-links` (
	`id` text PRIMARY KEY NOT NULL,
	`tenantId` text NOT NULL,
	`scopeId` text NOT NULL,
	`projectId` text NOT NULL,
	`artifactId` text NOT NULL,
	`refType` text NOT NULL,
	`refId` text NOT NULL,
	`createdBy` text,
	`createdAt` integer,
	`updatedAt` integer,
	FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`artifactId`) REFERENCES `artifacts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `artifact_link_idx_tenant` ON `artifact-links` (`tenantId`);--> statement-breakpoint
CREATE INDEX `artifact_link_idx_scope` ON `artifact-links` (`tenantId`,`scopeId`);--> statement-breakpoint
CREATE INDEX `artifact_link_idx_artifact` ON `artifact-links` (`tenantId`,`artifactId`);--> statement-breakpoint
CREATE INDEX `artifact_link_idx_project_ref_created` ON `artifact-links` (`tenantId`,`projectId`,`refType`,`refId`,`createdAt`);--> statement-breakpoint
CREATE TABLE `codex-chat-messages` (
	`id` text PRIMARY KEY NOT NULL,
	`tenantId` text NOT NULL,
	`scopeId` text NOT NULL,
	`projectId` text,
	`threadId` text NOT NULL,
	`externalThreadId` text,
	`role` text NOT NULL,
	`text` text NOT NULL,
	`turnId` text,
	`itemId` text,
	`messageAt` integer NOT NULL,
	`seq` integer NOT NULL,
	`createdBy` text,
	`updatedBy` text,
	`createdAt` integer,
	`updatedAt` integer,
	FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`threadId`) REFERENCES `codex-chat-threads`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `codex_chat_message_tenant_thread_seq_unique` ON `codex-chat-messages` (`tenantId`,`threadId`,`seq`);--> statement-breakpoint
CREATE INDEX `codex_chat_message_idx_tenant` ON `codex-chat-messages` (`tenantId`);--> statement-breakpoint
CREATE INDEX `codex_chat_message_idx_thread_messageat` ON `codex-chat-messages` (`tenantId`,`threadId`,`messageAt`);--> statement-breakpoint
CREATE INDEX `codex_chat_message_idx_scope_messageat` ON `codex-chat-messages` (`tenantId`,`scopeId`,`messageAt`);--> statement-breakpoint
CREATE TABLE `codex-chat-settings` (
	`id` text PRIMARY KEY NOT NULL,
	`tenantId` text NOT NULL,
	`scopeId` text NOT NULL,
	`userId` text NOT NULL,
	`binaryPath` text,
	`model` text,
	`reasoningEffort` text,
	`profile` text,
	`executionMode` text NOT NULL,
	`sandboxMode` text NOT NULL,
	`manualCwd` text,
	`autoStart` integer,
	`createdBy` text,
	`updatedBy` text,
	`createdAt` integer,
	`updatedAt` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `codex_chat_setting_tenant_scope_user_unique` ON `codex-chat-settings` (`tenantId`,`scopeId`,`userId`);--> statement-breakpoint
CREATE INDEX `codex_chat_setting_idx_tenant` ON `codex-chat-settings` (`tenantId`);--> statement-breakpoint
CREATE INDEX `codex_chat_setting_idx_scope_user` ON `codex-chat-settings` (`tenantId`,`scopeId`,`userId`);--> statement-breakpoint
CREATE TABLE `codex-chat-threads` (
	`id` text PRIMARY KEY NOT NULL,
	`tenantId` text NOT NULL,
	`scopeId` text NOT NULL,
	`externalThreadId` text NOT NULL,
	`scopeLabel` text,
	`cwd` text,
	`title` text,
	`tags` text,
	`lastPrompt` text,
	`lastAssistant` text,
	`tokenInput` integer,
	`tokenOutput` integer,
	`tokenTotal` integer,
	`lastMessageAt` integer,
	`createdBy` text,
	`updatedBy` text,
	`createdAt` integer,
	`updatedAt` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `codex_chat_thread_tenant_scope_external_unique` ON `codex-chat-threads` (`tenantId`,`scopeId`,`externalThreadId`);--> statement-breakpoint
CREATE INDEX `codex_chat_thread_idx_tenant` ON `codex-chat-threads` (`tenantId`);--> statement-breakpoint
CREATE INDEX `codex_chat_thread_idx_scope_updated` ON `codex-chat-threads` (`tenantId`,`scopeId`,`updatedAt`);--> statement-breakpoint
CREATE TABLE `kanban-boards` (
	`id` text PRIMARY KEY NOT NULL,
	`tenantId` text NOT NULL,
	`scopeId` text NOT NULL,
	`projectId` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`createdAt` integer,
	`updatedAt` integer
);
--> statement-breakpoint
CREATE INDEX `kanban_board_idx_tenant` ON `kanban-boards` (`tenantId`);--> statement-breakpoint
CREATE INDEX `kanban_board_idx_scope` ON `kanban-boards` (`tenantId`,`scopeId`);--> statement-breakpoint
CREATE INDEX `kanban_board_idx_project` ON `kanban-boards` (`tenantId`,`projectId`);--> statement-breakpoint
CREATE TABLE `aops-kanban-columns` (
	`id` text PRIMARY KEY NOT NULL,
	`tenantId` text NOT NULL,
	`scopeId` text NOT NULL,
	`projectId` text NOT NULL,
	`boardId` text NOT NULL,
	`name` text NOT NULL,
	`statusKey` text NOT NULL,
	`position` integer NOT NULL,
	`wipLimit` integer,
	`createdAt` integer,
	`updatedAt` integer,
	FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`boardId`) REFERENCES `kanban-boards`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `kanban_column_position_unique` ON `aops-kanban-columns` (`tenantId`,`boardId`,`position`);--> statement-breakpoint
CREATE INDEX `aops_kanban_column_idx_tenant` ON `aops-kanban-columns` (`tenantId`);--> statement-breakpoint
CREATE INDEX `aops_kanban_column_idx_scope` ON `aops-kanban-columns` (`tenantId`,`scopeId`);--> statement-breakpoint
CREATE INDEX `kanban_column_idx_board` ON `aops-kanban-columns` (`tenantId`,`boardId`);--> statement-breakpoint
CREATE INDEX `kanban_column_idx_project` ON `aops-kanban-columns` (`tenantId`,`projectId`);--> statement-breakpoint
CREATE TABLE `memory-items` (
	`id` text PRIMARY KEY NOT NULL,
	`tenantId` text NOT NULL,
	`scopeId` text NOT NULL,
	`kind` text NOT NULL,
	`durability` text NOT NULL,
	`content` text NOT NULL,
	`tags` text,
	`importance` integer,
	`sourceType` text,
	`sourceId` text,
	`meta` text,
	`createdAt` integer,
	`updatedAt` integer
);
--> statement-breakpoint
CREATE INDEX `memory_item_idx_tenant` ON `memory-items` (`tenantId`);--> statement-breakpoint
CREATE INDEX `memory_item_idx_scope` ON `memory-items` (`tenantId`,`scopeId`);--> statement-breakpoint
CREATE INDEX `memory_item_idx_kind` ON `memory-items` (`tenantId`,`kind`);--> statement-breakpoint
CREATE INDEX `memory_item_idx_durability` ON `memory-items` (`tenantId`,`durability`);--> statement-breakpoint
CREATE TABLE `experience-items` (
	`id` text PRIMARY KEY NOT NULL,
	`tenantId` text NOT NULL,
	`scopeId` text NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`problem` text,
	`solution` text,
	`content` text NOT NULL,
	`areas` text,
	`stack` text,
	`commands` text,
	`files` text,
	`sourceRefs` text,
	`tags` text,
	`confidence` text,
	`reusability` text,
	`meta` text,
	`createdAt` integer,
	`updatedAt` integer
);
--> statement-breakpoint
CREATE INDEX `experience_item_idx_tenant` ON `experience-items` (`tenantId`);--> statement-breakpoint
CREATE INDEX `experience_item_idx_scope` ON `experience-items` (`tenantId`,`scopeId`);--> statement-breakpoint
CREATE INDEX `experience_item_idx_type` ON `experience-items` (`tenantId`,`type`);--> statement-breakpoint
CREATE TABLE `activity-items` (
	`id` text PRIMARY KEY NOT NULL,
	`tenantId` text NOT NULL,
	`scopeId` text NOT NULL,
	`projectId` text,
	`sourceKind` text NOT NULL,
	`sourceId` text NOT NULL,
	`action` text NOT NULL,
	`status` text NOT NULL,
	`summary` text NOT NULL,
	`refs` text NOT NULL,
	`payload` text,
	`meta` text,
	`createdAt` integer,
	`updatedAt` integer
);
--> statement-breakpoint
CREATE INDEX `activity_item_idx_scope_created` ON `activity-items` (`tenantId`,`scopeId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `activity_item_idx_project_created` ON `activity-items` (`tenantId`,`projectId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `activity_item_idx_source_kind_created` ON `activity-items` (`tenantId`,`sourceKind`,`createdAt`);--> statement-breakpoint
CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`tenantId` text NOT NULL,
	`scopeId` text NOT NULL REFERENCES `scopes`(`id`) ON UPDATE no action ON DELETE restrict,
	`name` text NOT NULL,
	`description` text,
	`tags` text,
	`slug` text,
	`status` text,
	`visibility` text,
	`projectType` text,
	`ownerId` text,
	`createdBy` text,
	`updatedBy` text,
	`createdAt` integer,
	`updatedAt` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `project_scope_unique` ON `projects` (`scopeId`);--> statement-breakpoint
CREATE UNIQUE INDEX `project_slug_tenant_unique` ON `projects` (`tenantId`,`slug`);--> statement-breakpoint
CREATE INDEX `project_idx_tenant` ON `projects` (`tenantId`);--> statement-breakpoint
CREATE INDEX `project_idx_scope` ON `projects` (`tenantId`,`scopeId`);--> statement-breakpoint
CREATE TABLE `project-paths` (
	`id` text PRIMARY KEY NOT NULL,
	`tenantId` text NOT NULL,
	`scopeId` text NOT NULL,
	`projectId` text NOT NULL,
	`pathKey` text NOT NULL,
	`path` text NOT NULL,
	`description` text,
	`createdBy` text,
	`updatedBy` text,
	`createdAt` integer,
	`updatedAt` integer,
	FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `project_path_unique_key` ON `project-paths` (`tenantId`,`projectId`,`pathKey`);--> statement-breakpoint
CREATE INDEX `project_path_idx_tenant` ON `project-paths` (`tenantId`);--> statement-breakpoint
CREATE INDEX `project_path_idx_scope` ON `project-paths` (`tenantId`,`scopeId`);--> statement-breakpoint
CREATE INDEX `project_path_idx_project` ON `project-paths` (`tenantId`,`projectId`);--> statement-breakpoint
CREATE TABLE `project-members` (
	`id` text PRIMARY KEY NOT NULL,
	`tenantId` text NOT NULL,
	`scopeId` text NOT NULL,
	`projectId` text NOT NULL,
	`userId` text NOT NULL,
	`role` text NOT NULL,
	`createdBy` text,
	`updatedBy` text,
	`createdAt` integer,
	`updatedAt` integer,
	FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `project_member_unique_user` ON `project-members` (`tenantId`,`projectId`,`userId`);--> statement-breakpoint
CREATE INDEX `project_member_idx_tenant` ON `project-members` (`tenantId`);--> statement-breakpoint
CREATE INDEX `project_member_idx_scope` ON `project-members` (`tenantId`,`scopeId`);--> statement-breakpoint
CREATE INDEX `project_member_idx_project` ON `project-members` (`tenantId`,`projectId`);--> statement-breakpoint
CREATE INDEX `project_member_idx_user` ON `project-members` (`tenantId`,`userId`);--> statement-breakpoint
CREATE TABLE `prompts` (
	`id` text PRIMARY KEY NOT NULL,
	`tenantId` text NOT NULL,
	`scopeId` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`tags` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`currentVersionId` text,
	`createdBy` text,
	`updatedBy` text,
	`createdAt` integer,
	`updatedAt` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `prompt_scope_name_tenant_unique` ON `prompts` (`tenantId`,`scopeId`,`name`);--> statement-breakpoint
CREATE INDEX `prompt_idx_tenant` ON `prompts` (`tenantId`);--> statement-breakpoint
CREATE INDEX `prompt_idx_scope` ON `prompts` (`tenantId`,`scopeId`);--> statement-breakpoint
CREATE TABLE `prompt-versions` (
	`id` text PRIMARY KEY NOT NULL,
	`tenantId` text NOT NULL,
	`scopeId` text NOT NULL,
	`promptId` text NOT NULL,
	`version` integer NOT NULL,
	`status` text NOT NULL,
	`content` text NOT NULL,
	`variables` text,
	`meta` text,
	`refType` text,
	`refId` text,
	`createdBy` text,
	`updatedBy` text,
	`publishedAt` integer,
	`createdAt` integer,
	`updatedAt` integer,
	FOREIGN KEY (`promptId`) REFERENCES `prompts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `prompt_version_unique` ON `prompt-versions` (`tenantId`,`promptId`,`version`);--> statement-breakpoint
CREATE INDEX `prompt_version_idx_tenant` ON `prompt-versions` (`tenantId`);--> statement-breakpoint
CREATE INDEX `prompt_version_idx_scope` ON `prompt-versions` (`tenantId`,`scopeId`);--> statement-breakpoint
CREATE INDEX `prompt_version_idx_prompt` ON `prompt-versions` (`tenantId`,`promptId`);--> statement-breakpoint
CREATE TABLE `resources` (
	`id` text PRIMARY KEY NOT NULL,
	`tenantId` text NOT NULL,
	`scopeId` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`resourceType` text NOT NULL,
	`uri` text,
	`tags` text,
	`refType` text,
	`refId` text,
	`meta` text,
	`createdBy` text,
	`updatedBy` text,
	`createdAt` integer,
	`updatedAt` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `resource_scope_ref_unique` ON `resources` (`tenantId`,`scopeId`,`refType`,`refId`);--> statement-breakpoint
CREATE INDEX `resource_idx_tenant` ON `resources` (`tenantId`);--> statement-breakpoint
CREATE INDEX `resource_idx_scope` ON `resources` (`tenantId`,`scopeId`);--> statement-breakpoint
CREATE TABLE `skills` (
	`id` text PRIMARY KEY NOT NULL,
	`tenantId` text NOT NULL,
	`scopeId` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`shortDescription` text,
	`tags` text,
	`currentVersionId` text,
	`createdBy` text,
	`updatedBy` text,
	`createdAt` integer,
	`updatedAt` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `skill_scope_name_tenant_unique` ON `skills` (`tenantId`,`scopeId`,`name`);--> statement-breakpoint
CREATE INDEX `skill_idx_tenant` ON `skills` (`tenantId`);--> statement-breakpoint
CREATE INDEX `skill_idx_scope` ON `skills` (`tenantId`,`scopeId`);--> statement-breakpoint
CREATE TABLE `skill-versions` (
	`id` text PRIMARY KEY NOT NULL,
	`tenantId` text NOT NULL,
	`scopeId` text NOT NULL,
	`projectId` text,
	`skillId` text NOT NULL,
	`version` integer NOT NULL,
	`status` text NOT NULL,
	`content` text NOT NULL,
	`entryFile` text,
	`skillStandard` text DEFAULT 'aops-skill-v1' NOT NULL,
	`files` text,
	`meta` text,
	`refType` text,
	`refId` text,
	`createdBy` text,
	`updatedBy` text,
	`publishedAt` integer,
	`createdAt` integer,
	`updatedAt` integer,
	FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`skillId`) REFERENCES `skills`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `skill_version_unique` ON `skill-versions` (`tenantId`,`skillId`,`version`);--> statement-breakpoint
CREATE INDEX `skill_version_idx_tenant` ON `skill-versions` (`tenantId`);--> statement-breakpoint
CREATE INDEX `skill_version_idx_scope` ON `skill-versions` (`tenantId`,`scopeId`);--> statement-breakpoint
CREATE INDEX `skill_version_idx_skill` ON `skill-versions` (`tenantId`,`skillId`);--> statement-breakpoint
CREATE TABLE `sprints` (
	`id` text PRIMARY KEY NOT NULL,
	`tenantId` text NOT NULL,
	`scopeId` text NOT NULL,
	`name` text NOT NULL,
	`goal` text,
	`status` text NOT NULL,
	`tags` text,
	`createdBy` text,
	`updatedBy` text,
	`startAt` integer,
	`endAt` integer,
	`createdAt` integer,
	`updatedAt` integer
);
--> statement-breakpoint
CREATE INDEX `sprint_idx_tenant` ON `sprints` (`tenantId`);--> statement-breakpoint
CREATE INDEX `sprint_idx_scope` ON `sprints` (`tenantId`,`scopeId`);--> statement-breakpoint
CREATE INDEX `sprint_idx_scope_status_start` ON `sprints` (`tenantId`,`scopeId`,`status`,`startAt`);--> statement-breakpoint
CREATE TABLE `sprint-items` (
	`id` text PRIMARY KEY NOT NULL,
	`tenantId` text NOT NULL,
	`scopeId` text NOT NULL,
	`sprintId` text NOT NULL,
	`title` text NOT NULL,
	`status` text NOT NULL,
	`position` integer NOT NULL,
	`openedAt` integer,
	`closedAt` integer,
	`refType` text,
	`refId` text,
	`notes` text,
	`meta` text,
	`createdBy` text,
	`updatedBy` text,
	`createdAt` integer,
	`updatedAt` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sprint_item_position_unique` ON `sprint-items` (`tenantId`,`sprintId`,`position`);--> statement-breakpoint
CREATE INDEX `sprint_item_idx_tenant` ON `sprint-items` (`tenantId`);--> statement-breakpoint
CREATE INDEX `sprint_item_idx_scope` ON `sprint-items` (`tenantId`,`scopeId`);--> statement-breakpoint
CREATE INDEX `sprint_item_idx_sprint` ON `sprint-items` (`tenantId`,`sprintId`);--> statement-breakpoint
CREATE TABLE `tags` (
	`id` text PRIMARY KEY NOT NULL,
	`tenantId` text NOT NULL,
	`scopeId` text NOT NULL,
	`scopeType` text NOT NULL,
	`name` text NOT NULL,
	`createdBy` text,
	`updatedBy` text,
	`createdAt` integer,
	`updatedAt` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tag_scope_name_tenant_unique` ON `tags` (`tenantId`,`scopeId`,`scopeType`,`name`);--> statement-breakpoint
CREATE INDEX `tag_idx_tenant` ON `tags` (`tenantId`);--> statement-breakpoint
CREATE INDEX `tag_idx_scope_id` ON `tags` (`tenantId`,`scopeId`);--> statement-breakpoint
CREATE INDEX `tag_idx_scope` ON `tags` (`tenantId`,`scopeType`);--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`tenantId` text NOT NULL,
	`scopeId` text NOT NULL,
	`columnId` text NOT NULL,
	`sprintId` text,
	`promptVersionId` text,
	`parentTaskId` text,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`input` text,
	`meta` text,
	`assignee` text,
	`position` integer NOT NULL,
	`priority` integer,
	`dueAt` integer,
	`createdBy` text,
	`updatedBy` text,
	`createdAt` integer,
	`updatedAt` integer,
	FOREIGN KEY (`promptVersionId`) REFERENCES `prompt-versions`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`parentTaskId`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `task_column_position_unique` ON `tasks` (`tenantId`,`columnId`,`position`);--> statement-breakpoint
CREATE INDEX `task_idx_tenant` ON `tasks` (`tenantId`);--> statement-breakpoint
CREATE INDEX `task_idx_scope` ON `tasks` (`tenantId`,`scopeId`);--> statement-breakpoint
CREATE INDEX `task_idx_column` ON `tasks` (`tenantId`,`columnId`);--> statement-breakpoint
CREATE INDEX `task_idx_sprint` ON `tasks` (`tenantId`,`sprintId`);--> statement-breakpoint
CREATE INDEX `task_idx_prompt_version` ON `tasks` (`tenantId`,`promptVersionId`);--> statement-breakpoint
CREATE INDEX `task_idx_parent` ON `tasks` (`tenantId`,`parentTaskId`);--> statement-breakpoint
CREATE TABLE `task-labels` (
	`id` text PRIMARY KEY NOT NULL,
	`tenantId` text NOT NULL,
	`scopeId` text NOT NULL,
	`name` text NOT NULL,
	`color` text NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`meta` text,
	`createdBy` text,
	`updatedBy` text,
	`createdAt` integer,
	`updatedAt` integer,
	FOREIGN KEY (`scopeId`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `task_label_scope_name_tenant_unique` ON `task-labels` (`tenantId`,`scopeId`,`name`);--> statement-breakpoint
CREATE INDEX `task_label_idx_tenant` ON `task-labels` (`tenantId`);--> statement-breakpoint
CREATE INDEX `task_label_idx_scope` ON `task-labels` (`tenantId`,`scopeId`);--> statement-breakpoint
CREATE TABLE `task-label-links` (
	`id` text PRIMARY KEY NOT NULL,
	`tenantId` text NOT NULL,
	`scopeId` text NOT NULL,
	`taskId` text NOT NULL,
	`labelId` text NOT NULL,
	`createdBy` text,
	`updatedBy` text,
	`createdAt` integer,
	`updatedAt` integer,
	FOREIGN KEY (`scopeId`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`taskId`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`labelId`) REFERENCES `task-labels`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `task_label_link_unique` ON `task-label-links` (`tenantId`,`taskId`,`labelId`);--> statement-breakpoint
CREATE INDEX `task_label_link_idx_tenant` ON `task-label-links` (`tenantId`);--> statement-breakpoint
CREATE INDEX `task_label_link_idx_scope` ON `task-label-links` (`tenantId`,`scopeId`);--> statement-breakpoint
CREATE INDEX `task_label_link_idx_task` ON `task-label-links` (`tenantId`,`taskId`);--> statement-breakpoint
CREATE INDEX `task_label_link_idx_label` ON `task-label-links` (`tenantId`,`labelId`);--> statement-breakpoint
CREATE TABLE `task-checklist-items` (
	`id` text PRIMARY KEY NOT NULL,
	`tenantId` text NOT NULL,
	`scopeId` text NOT NULL,
	`taskId` text NOT NULL,
	`content` text NOT NULL,
	`isDone` integer DEFAULT false NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`createdBy` text,
	`updatedBy` text,
	`createdAt` integer,
	`updatedAt` integer,
	FOREIGN KEY (`scopeId`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`taskId`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `task_checklist_item_idx_tenant` ON `task-checklist-items` (`tenantId`);--> statement-breakpoint
CREATE INDEX `task_checklist_item_idx_scope` ON `task-checklist-items` (`tenantId`,`scopeId`);--> statement-breakpoint
CREATE INDEX `task_checklist_item_idx_task` ON `task-checklist-items` (`tenantId`,`taskId`);--> statement-breakpoint
CREATE TABLE `task-comments` (
	`id` text PRIMARY KEY NOT NULL,
	`tenantId` text NOT NULL,
	`scopeId` text NOT NULL,
	`projectId` text NOT NULL,
	`taskId` text NOT NULL,
	`author` text NOT NULL,
	`body` text NOT NULL,
	`meta` text,
	`createdAt` integer,
	`updatedAt` integer,
	FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`taskId`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `task_comment_idx_tenant` ON `task-comments` (`tenantId`);--> statement-breakpoint
CREATE INDEX `task_comment_idx_scope` ON `task-comments` (`tenantId`,`scopeId`);--> statement-breakpoint
CREATE INDEX `task_comment_idx_project` ON `task-comments` (`tenantId`,`projectId`);--> statement-breakpoint
CREATE INDEX `task_comment_idx_task` ON `task-comments` (`tenantId`,`taskId`);--> statement-breakpoint
CREATE TABLE `task-relations` (
	`id` text PRIMARY KEY NOT NULL,
	`tenantId` text NOT NULL,
	`scopeId` text NOT NULL,
	`fromTaskId` text NOT NULL,
	`toTaskId` text NOT NULL,
	`kind` text NOT NULL,
	`createdBy` text,
	`updatedBy` text,
	`createdAt` integer,
	`updatedAt` integer,
	FOREIGN KEY (`scopeId`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`fromTaskId`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`toTaskId`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `task_relation_unique` ON `task-relations` (`tenantId`,`fromTaskId`,`toTaskId`,`kind`);--> statement-breakpoint
CREATE INDEX `task_relation_idx_tenant` ON `task-relations` (`tenantId`);--> statement-breakpoint
CREATE INDEX `task_relation_idx_scope` ON `task-relations` (`tenantId`,`scopeId`);--> statement-breakpoint
CREATE INDEX `task_relation_idx_from` ON `task-relations` (`tenantId`,`fromTaskId`);--> statement-breakpoint
CREATE INDEX `task_relation_idx_to` ON `task-relations` (`tenantId`,`toTaskId`);--> statement-breakpoint
CREATE TABLE `workflow-definitions` (
	`id` text PRIMARY KEY NOT NULL,
	`tenantId` text NOT NULL,
	`scopeId` text NOT NULL,
	`definitionId` text NOT NULL,
	`name` text NOT NULL,
	`mode` text NOT NULL,
	`subjectType` text,
	`runtimeProfile` text,
	`steps` text NOT NULL,
	`policies` text,
	`meta` text,
	`createdAt` integer,
	`updatedAt` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `workflow_definition_unique_definition_id` ON `workflow-definitions` (`tenantId`,`scopeId`,`definitionId`);--> statement-breakpoint
CREATE INDEX `workflow_definition_idx_scope_mode` ON `workflow-definitions` (`tenantId`,`scopeId`,`mode`);--> statement-breakpoint
CREATE INDEX `workflow_definition_idx_scope_subject` ON `workflow-definitions` (`tenantId`,`scopeId`,`subjectType`);--> statement-breakpoint
CREATE TABLE `workflow-instances` (
	`id` text PRIMARY KEY NOT NULL,
	`tenantId` text NOT NULL,
	`scopeId` text NOT NULL,
	`workflowInstanceId` text NOT NULL,
	`definitionId` text,
	`mode` text NOT NULL,
	`status` text NOT NULL,
	`subjectType` text NOT NULL,
	`subjectId` text NOT NULL,
	`subjectLabel` text,
	`subjectMeta` text,
	`input` text,
	`currentStepId` text,
	`activeApprovalId` text,
	`runtimeProfile` text,
	`runRecordIds` text NOT NULL,
	`steps` text NOT NULL,
	`definitionSnapshot` text,
	`meta` text,
	`openedAt` integer NOT NULL,
	`closedAt` integer,
	`createdAt` integer,
	`updatedAt` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `workflow_instance_unique_instance_id` ON `workflow-instances` (`tenantId`,`scopeId`,`workflowInstanceId`);--> statement-breakpoint
CREATE INDEX `workflow_instance_idx_scope_status` ON `workflow-instances` (`tenantId`,`scopeId`,`status`);--> statement-breakpoint
CREATE INDEX `workflow_instance_idx_subject` ON `workflow-instances` (`tenantId`,`subjectType`,`subjectId`);--> statement-breakpoint
CREATE TABLE `workflow-step-runs` (
	`id` text PRIMARY KEY NOT NULL,
	`tenantId` text NOT NULL,
	`scopeId` text NOT NULL,
	`workflowId` text NOT NULL,
	`workflowInstanceId` text NOT NULL,
	`stepId` text NOT NULL,
	`sequence` integer NOT NULL,
	`kind` text NOT NULL,
	`title` text,
	`status` text NOT NULL,
	`agentRunId` text,
	`approvalId` text,
	`childWorkflowId` text,
	`childWorkflowInstanceId` text,
	`input` text,
	`approval` text,
	`error` text,
	`meta` text,
	`openedAt` integer NOT NULL,
	`closedAt` integer,
	`createdAt` integer,
	`updatedAt` integer,
	FOREIGN KEY (`workflowId`) REFERENCES `workflow-instances`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`agentRunId`) REFERENCES `agent-runs`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`childWorkflowId`) REFERENCES `workflow-instances`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `workflow_step_run_unique_sequence` ON `workflow-step-runs` (`tenantId`,`workflowId`,`sequence`);--> statement-breakpoint
CREATE INDEX `workflow_step_run_idx_scope` ON `workflow-step-runs` (`tenantId`,`scopeId`);--> statement-breakpoint
CREATE INDEX `workflow_step_run_idx_workflow_step` ON `workflow-step-runs` (`tenantId`,`workflowId`,`stepId`);--> statement-breakpoint
CREATE INDEX `workflow_step_run_idx_instance` ON `workflow-step-runs` (`tenantId`,`workflowInstanceId`);--> statement-breakpoint
CREATE INDEX `workflow_step_run_idx_agent_run` ON `workflow-step-runs` (`tenantId`,`agentRunId`);--> statement-breakpoint
CREATE INDEX `workflow_step_run_idx_child_workflow` ON `workflow-step-runs` (`tenantId`,`childWorkflowId`);--> statement-breakpoint
CREATE TABLE `scopes` (
	`id` text PRIMARY KEY NOT NULL,
	`tenantId` text NOT NULL,
	`type` text NOT NULL,
	`parentScopeId` text,
	`createdBy` text,
	`updatedBy` text,
	`createdAt` integer,
	`updatedAt` integer
);
--> statement-breakpoint
CREATE INDEX `scope_idx_tenant` ON `scopes` (`tenantId`);--> statement-breakpoint
CREATE INDEX `scope_idx_parent` ON `scopes` (`tenantId`,`parentScopeId`);
