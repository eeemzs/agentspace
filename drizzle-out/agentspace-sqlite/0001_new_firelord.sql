DROP INDEX `kanban_board_idx_tenant`;--> statement-breakpoint
DROP INDEX `kanban_board_idx_project`;--> statement-breakpoint
CREATE INDEX `agentspace_kanban_board_idx_tenant` ON `kanban-boards` (`tenantId`);--> statement-breakpoint
CREATE INDEX `agentspace_kanban_board_idx_project` ON `kanban-boards` (`tenantId`,`projectId`);--> statement-breakpoint
DROP INDEX `kanban_column_position_unique`;--> statement-breakpoint
DROP INDEX `aops_kanban_column_idx_tenant`;--> statement-breakpoint
DROP INDEX `kanban_column_idx_board`;--> statement-breakpoint
DROP INDEX `kanban_column_idx_project`;--> statement-breakpoint
CREATE UNIQUE INDEX `agentspace_kanban_column_position_unique` ON `aops-kanban-columns` (`tenantId`,`boardId`,`position`);--> statement-breakpoint
CREATE INDEX `agentspace_kanban_column_idx_tenant` ON `aops-kanban-columns` (`tenantId`);--> statement-breakpoint
CREATE INDEX `agentspace_kanban_column_idx_board` ON `aops-kanban-columns` (`tenantId`,`boardId`);--> statement-breakpoint
CREATE INDEX `agentspace_kanban_column_idx_project` ON `aops-kanban-columns` (`tenantId`,`projectId`);