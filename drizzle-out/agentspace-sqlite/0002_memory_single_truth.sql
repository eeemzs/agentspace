ALTER TABLE `memory-items` ADD COLUMN `durability` text NOT NULL DEFAULT 'durable';--> statement-breakpoint
UPDATE `memory-items` SET `kind` = 'kickoff', `durability` = 'short' WHERE `kind` = 'start';--> statement-breakpoint
UPDATE `memory-items`
SET `kind` = 'closeout', `durability` = 'short'
WHERE `kind` = 'lesson' AND instr(COALESCE(`tags`, '[]'), 'phase:closeout') > 0;--> statement-breakpoint
UPDATE `memory-items` SET `kind` = 'note', `durability` = 'durable' WHERE `kind` IN ('context', 'request');--> statement-breakpoint
UPDATE `memory-items`
SET `durability` = 'sticky'
WHERE lower(CAST(json_extract(COALESCE(`meta`, '{}'), '$.sticky') AS text)) IN ('1', 'true');--> statement-breakpoint
UPDATE `memory-items`
SET `durability` = 'short'
WHERE `durability` = 'durable' AND `kind` IN ('resume', 'kickoff', 'closeout', 'constraint');--> statement-breakpoint
UPDATE `memory-items`
SET `durability` = 'durable'
WHERE `durability` <> 'sticky' AND `kind` IN ('decision', 'rule', 'lesson', 'note');--> statement-breakpoint
UPDATE `memory-items`
SET `meta` = json_remove(COALESCE(`meta`, '{}'), '$.summaryRole', '$.sticky')
WHERE `meta` IS NOT NULL;--> statement-breakpoint
CREATE INDEX `memory_item_idx_durability` ON `memory-items` (`tenantId`,`durability`);--> statement-breakpoint
DROP TABLE IF EXISTS `project-summaries`;--> statement-breakpoint
