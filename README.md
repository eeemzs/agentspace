# agentspace

Agentspace domain workspace for dm, kit, host-plugin, tooling, cli, and tests.

## User Guide

- Domain kullanim rehberi: `./USER_GUIDE.md`
- Hosted AOPS tarafindaki ortak domain/operator rehberi:
  `/Volumes/d/dev-js2/apps/aops/apps/aops-cli/AOPS_DOMAIN_OPERATING_MODEL.md`

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
pnpm run db:generate
pnpm run db:migrate
pnpm run db:push
```

## Canonical Skill Package

- Standard document: `./SKILL_PACKAGE_STANDARD.md`
- Standard ID: `aops-skill-package-v1`
- Canonical entry file: `SKILL.md`
- Import/export/materialize flows are package-first and intentionally avoid backward-compatibility shims.

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
- Repo URL precedence is `--repo-url -> AGENTSPACE_REPO_URL -> AGENTSPACE_SQLITE_URL -> AGENTSPACE_PG_URL -> AOPS_PG_URL -> DEV_PG_URL -> file:~/.aops/agentspace.aops.sqlite`.
- Hicbir repo source verilmezse CLI local sqlite fallback dosyasini bootstrap eder.
- Workspace-scoped operations should receive either explicit payload workspace fields or `--workspace-id` context.

## AOPS Hosted Refresh Recipe

If you changed Agentspace contracts, manifests, or tool projections and the
hosted runtime looks stale, use this sequence:

```bash
cd /Volumes/d/dev-js2/domains/agentspace
pnpm run manifest:sync

cd /Volumes/d/dev-js2/apps/aops
aops-cli host diagnostics --reset --warmup
aops-cli agent tools --domain agentspace --workspace-name Default
```

This is the deterministic recovery path for manifest drift, stale route
projection, or `tool_not_found` after a domain change.

## Drizzle Flow

- PostgreSQL varsayilani icin `AGENTSPACE_PG_URL` veya `AGENTSPACE_REPO_URL` kullan.
- SQLite icin `AGENTSPACE_DRIZZLE_DIALECT=sqlite` ve `AGENTSPACE_SQLITE_URL=file:/absolute/path/agentspace.sqlite` kullan.
- Root `db:*` scriptleri once `agentspace-dm` paketini build eder, sonra uygun Drizzle config ile calisir.
- SQLite config: `drizzle.agentspace.sqlite.config.ts`
- PostgreSQL config: `drizzle.agentspace.config.ts`
