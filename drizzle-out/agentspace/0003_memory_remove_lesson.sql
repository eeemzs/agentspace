UPDATE "memory-items"
SET "kind" = 'rule', "durability" = 'sticky'
WHERE "kind" = 'lesson' AND "durability" = 'sticky';--> statement-breakpoint
UPDATE "memory-items"
SET "kind" = 'decision', "durability" = 'durable'
WHERE "kind" = 'lesson'
  AND (
    COALESCE("tags", '[]'::jsonb) ? 'phase:decision'
    OR COALESCE("tags", '[]'::jsonb) ? 'purpose:architecture'
    OR COALESCE("tags", '[]'::jsonb) ? 'purpose:carry-forward'
  );--> statement-breakpoint
UPDATE "memory-items"
SET "kind" = 'note', "durability" = 'durable'
WHERE "kind" = 'lesson';--> statement-breakpoint
