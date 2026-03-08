# agentspace

Agentspace domain workspace for dm, kit, host-plugin, tooling, cli, and tests.

## Packages

- `agentspace-dm`: workspace-scoped agent data domain model and repositories
- `agentspace-kit`: canonical operation contracts, executor, DCM, and host routes
- `agentspace-tooling`: tooling facade plus derived manifest generation (`dcm`, `routes`, `agent`, `cli`, `ops`)
- `agentspace-cli`: canonical `tool` / `op` invoke plus generated sugar commands and projection-driven help
- `agentspace-host-plugin`: host runtime bridge backed by kit projections
- `agentspace-tests`: bootstrap smoke plus CLI browse/help regression coverage

## Common Commands

```bash
pnpm run build
pnpm run test
pnpm run manifest:sync
```

## CLI Examples

```bash
pnpm --filter @aopslab/domain-cli-agentspace run start:tsx -- tools
pnpm --filter @aopslab/domain-cli-agentspace run start:tsx -- manifest cli
pnpm --filter @aopslab/domain-cli-agentspace run start:tsx -- manifest get dcm --path docs.operations.workspace.list-workspaces
pnpm --filter @aopslab/domain-cli-agentspace run start:tsx -- manifest show cli --path commandsById.workspace.list-workspaces
pnpm --filter @aopslab/domain-cli-agentspace run start:tsx -- workspace list-workspaces --workspace-id <id>
pnpm --filter @aopslab/domain-cli-agentspace run start:tsx -- op agentspace.project.create --data '{"workspaceId":"<id>","name":"Demo"}'
```

## Projection Rule

1. `agentspace-kit` DCM is the canonical capability source.
2. `agentspace-tooling` emits derived `agent` and `cli` projections from that source.
3. `agentspace-cli` reads the derived CLI projection for `--help`, `manifest cli`, `manifest get`, and `manifest show`.
4. HRM / `host-registration` is runtime registration metadata only; it is not a second capability source.

## Runtime Notes

- Standalone CLI runtime defaults to host-plugin execution and can fall back to tooling mode with `--execution-mode tooling`.
- Repo URL precedence is `--repo-url -> AGENTSPACE_REPO_URL -> AOPS_PG_URL -> DEV_PG_URL`.
- Workspace-scoped operations should receive either explicit payload workspace fields or `--workspace-id` context.
