UPDATE "memory-items"
SET
  "tags" = CASE
    WHEN COALESCE("tags", '[]'::jsonb) @> '["phase:decision"]'::jsonb THEN COALESCE("tags", '[]'::jsonb)
    ELSE COALESCE("tags", '[]'::jsonb) || '["phase:decision"]'::jsonb
  END,
  "kind" = 'note'
WHERE "kind" = 'decision' AND "durability" = 'durable';

UPDATE "memory-items"
SET "durability" = 'short'
WHERE "kind" = 'decision';
