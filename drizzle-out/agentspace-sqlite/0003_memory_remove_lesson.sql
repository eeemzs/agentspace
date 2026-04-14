UPDATE `memory-items`
SET `kind` = 'rule', `durability` = 'sticky'
WHERE `kind` = 'lesson' AND `durability` = 'sticky';--> statement-breakpoint
UPDATE `memory-items`
SET `kind` = 'decision', `durability` = 'durable'
WHERE `kind` = 'lesson'
  AND (
    instr(COALESCE(`tags`, '[]'), 'phase:decision') > 0
    OR instr(COALESCE(`tags`, '[]'), 'purpose:architecture') > 0
    OR instr(COALESCE(`tags`, '[]'), 'purpose:carry-forward') > 0
  );--> statement-breakpoint
UPDATE `memory-items`
SET `kind` = 'note', `durability` = 'durable'
WHERE `kind` = 'lesson';--> statement-breakpoint
