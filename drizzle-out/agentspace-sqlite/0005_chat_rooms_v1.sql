CREATE TABLE `chat-rooms` (
	`id` text PRIMARY KEY NOT NULL,
	`tenantId` text NOT NULL,
	`scopeId` text NOT NULL,
	`projectId` text,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`kind` text NOT NULL,
	`purpose` text,
	`guidanceMarkdown` text,
	`status` text NOT NULL,
	`dmKey` text,
	`lastSeq` integer DEFAULT 0 NOT NULL,
	`lastMessageAt` integer,
	`createdBy` text,
	`updatedBy` text,
	`createdAt` integer,
	`updatedAt` integer,
	FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `chat_room_tenant_scope_slug_unique` ON `chat-rooms` (`tenantId`,`scopeId`,`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `chat_room_tenant_scope_dm_key_unique` ON `chat-rooms` (`tenantId`,`scopeId`,`dmKey`);--> statement-breakpoint
CREATE INDEX `chat_room_idx_tenant` ON `chat-rooms` (`tenantId`);--> statement-breakpoint
CREATE INDEX `chat_room_idx_scope_updated` ON `chat-rooms` (`tenantId`,`scopeId`,`updatedAt`);--> statement-breakpoint
CREATE INDEX `chat_room_idx_project_updated` ON `chat-rooms` (`tenantId`,`projectId`,`updatedAt`);--> statement-breakpoint
CREATE INDEX `chat_room_idx_scope_last_message` ON `chat-rooms` (`tenantId`,`scopeId`,`lastMessageAt`);--> statement-breakpoint
CREATE TABLE `chat-room-members` (
	`id` text PRIMARY KEY NOT NULL,
	`tenantId` text NOT NULL,
	`scopeId` text NOT NULL,
	`roomId` text NOT NULL,
	`agentId` text NOT NULL,
	`roleKey` text NOT NULL,
	`brief` text,
	`status` text NOT NULL,
	`lastReadSeq` integer DEFAULT 0 NOT NULL,
	`joinedAt` integer NOT NULL,
	`leftAt` integer,
	`createdBy` text,
	`updatedBy` text,
	`createdAt` integer,
	`updatedAt` integer,
	FOREIGN KEY (`roomId`) REFERENCES `chat-rooms`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `chat_room_member_tenant_room_agent_unique` ON `chat-room-members` (`tenantId`,`roomId`,`agentId`);--> statement-breakpoint
CREATE INDEX `chat_room_member_idx_tenant` ON `chat-room-members` (`tenantId`);--> statement-breakpoint
CREATE INDEX `chat_room_member_idx_room_status` ON `chat-room-members` (`tenantId`,`roomId`,`status`);--> statement-breakpoint
CREATE INDEX `chat_room_member_idx_scope_agent` ON `chat-room-members` (`tenantId`,`scopeId`,`agentId`,`status`);--> statement-breakpoint
CREATE TABLE `chat-room-bindings` (
	`id` text PRIMARY KEY NOT NULL,
	`tenantId` text NOT NULL,
	`scopeId` text NOT NULL,
	`roomId` text NOT NULL,
	`bindingType` text NOT NULL,
	`refId` text,
	`uri` text,
	`title` text,
	`note` text,
	`createdBy` text,
	`updatedBy` text,
	`createdAt` integer,
	`updatedAt` integer,
	FOREIGN KEY (`roomId`) REFERENCES `chat-rooms`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `chat_room_binding_idx_tenant` ON `chat-room-bindings` (`tenantId`);--> statement-breakpoint
CREATE INDEX `chat_room_binding_idx_room_type` ON `chat-room-bindings` (`tenantId`,`roomId`,`bindingType`);--> statement-breakpoint
CREATE INDEX `chat_room_binding_idx_scope_type` ON `chat-room-bindings` (`tenantId`,`scopeId`,`bindingType`);--> statement-breakpoint
CREATE TABLE `chat-messages` (
	`id` text PRIMARY KEY NOT NULL,
	`tenantId` text NOT NULL,
	`scopeId` text NOT NULL,
	`roomId` text NOT NULL,
	`seq` integer NOT NULL,
	`authorAgentId` text NOT NULL,
	`kind` text NOT NULL,
	`text` text NOT NULL,
	`mentions` text,
	`replyToSeq` integer,
	`idempotencyKey` text,
	`createdBy` text,
	`createdAt` integer,
	`updatedAt` integer,
	FOREIGN KEY (`roomId`) REFERENCES `chat-rooms`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `chat_message_tenant_room_seq_unique` ON `chat-messages` (`tenantId`,`roomId`,`seq`);--> statement-breakpoint
CREATE UNIQUE INDEX `chat_message_tenant_room_idempotency_unique` ON `chat-messages` (`tenantId`,`roomId`,`idempotencyKey`);--> statement-breakpoint
CREATE INDEX `chat_message_idx_tenant` ON `chat-messages` (`tenantId`);--> statement-breakpoint
CREATE INDEX `chat_message_idx_room_seq` ON `chat-messages` (`tenantId`,`roomId`,`seq`);--> statement-breakpoint
CREATE INDEX `chat_message_idx_room_created` ON `chat-messages` (`tenantId`,`roomId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `chat_message_idx_scope_created` ON `chat-messages` (`tenantId`,`scopeId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `chat_message_idx_author_created` ON `chat-messages` (`tenantId`,`authorAgentId`,`createdAt`);
