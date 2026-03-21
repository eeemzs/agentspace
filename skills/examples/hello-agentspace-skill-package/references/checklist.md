# Smoke Checklist

1. Use a non-production Agentspace repo first.
2. Keep `workspaceId` explicit in import payloads.
3. Use `manifest get dcm` or `manifest show cli` before guessing command
   shapes.
4. Materialize into a temp directory, not into an existing skill folder.
