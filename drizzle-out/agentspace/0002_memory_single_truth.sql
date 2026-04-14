ALTER TABLE "memory-items" ADD COLUMN "durability" text NOT NULL DEFAULT 'durable';--> statement-breakpoint
UPDATE "memory-items" SET "kind" = 'kickoff', "durability" = 'short' WHERE "kind" = 'start';--> statement-breakpoint
UPDATE "memory-items"
SET "kind" = 'closeout', "durability" = 'short'
WHERE "kind" = 'lesson' AND COALESCE("tags", '[]'::jsonb) ? 'phase:closeout';--> statement-breakpoint
UPDATE "memory-items" SET "kind" = 'note', "durability" = 'durable' WHERE "kind" IN ('context', 'request');--> statement-breakpoint
UPDATE "memory-items"
SET "durability" = 'sticky'
WHERE COALESCE("meta", '{}'::jsonb)->>'sticky' = 'true';--> statement-breakpoint
UPDATE "memory-items"
SET "durability" = 'short'
WHERE "durability" = 'durable' AND "kind" IN ('resume', 'kickoff', 'closeout', 'constraint');--> statement-breakpoint
UPDATE "memory-items"
SET "durability" = 'durable'
WHERE "durability" <> 'sticky' AND "kind" IN ('decision', 'rule', 'lesson', 'note');--> statement-breakpoint
UPDATE "memory-items"
SET "meta" = CASE
  WHEN "meta" IS NULL THEN NULL
  ELSE ("meta" - 'summaryRole' - 'sticky')
END
WHERE "meta" ? 'summaryRole' OR "meta" ? 'sticky';--> statement-breakpoint
ALTER TABLE "memory-items" ALTER COLUMN "durability" DROP DEFAULT;--> statement-breakpoint
CREATE INDEX "memory_item_idx_durability" ON "memory-items" USING btree ("tenantId","durability");--> statement-breakpoint
DROP TABLE IF EXISTS "project-summaries";--> statement-breakpoint
