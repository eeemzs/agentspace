UPDATE "memory-items"
SET
  "tags" = CASE
    WHEN "tags" IS NULL OR json_type("tags") IS NULL THEN json_array('phase:decision')
    WHEN EXISTS (SELECT 1 FROM json_each("tags") WHERE value = 'phase:decision') THEN "tags"
    ELSE json_insert("tags", '$[#]', 'phase:decision')
  END,
  "kind" = 'note'
WHERE "kind" = 'decision' AND "durability" = 'durable';

UPDATE "memory-items"
SET "durability" = 'short'
WHERE "kind" = 'decision';
