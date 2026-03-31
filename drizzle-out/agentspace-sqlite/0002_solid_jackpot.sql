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
CREATE INDEX `scope_idx_parent` ON `scopes` (`tenantId`,`parentScopeId`);--> statement-breakpoint
ALTER TABLE `projects` ADD `scopeId` text NOT NULL REFERENCES scopes(id);--> statement-breakpoint
CREATE UNIQUE INDEX `project_scope_unique` ON `projects` (`scopeId`);--> statement-breakpoint
ALTER TABLE `workspaces` ADD `scopeId` text NOT NULL REFERENCES scopes(id);--> statement-breakpoint
CREATE UNIQUE INDEX `workspace_scope_unique` ON `workspaces` (`scopeId`);