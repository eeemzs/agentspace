---
name: agentspace-aops-agent
description: Use when the task is about operating Agentspace through hosted AOPS, including workspaces, projects, prompts, resources, skills, skill sets, memory, and skill package flows via aops-cli or /api/agent surfaces. This skill explains how an agent should treat aops-cli as operator transport while keeping Agentspace as the semantic owner.
metadata:
  short-description: Agentspace AOPS agent guide
---

# Agentspace AOPS Agent

Note: for normal AOPS-hosted app work, AI agents should prefer
`/Volumes/d/dev-js2/apps/aops/.agents/skills/agentspace-aops-agent/SKILL.md`
as the canonical bootstrap path. This file is the domain-owned source guide.

Use this skill when the task is about operating `agentspace` through hosted
AOPS or explaining how an AI agent should use hosted `agentspace.*` surfaces
without confusing `aops-cli` transport with Agentspace domain ownership.

## First reads

Read only the docs you need:

1. Hosted/domain owner split:
   `/Volumes/d/dev-js2/docs/guides/skills/aops-agent-skill-usage-guide.md`
2. Canonical CLI and owner boundary:
   `/Volumes/d/dev-js2/docs/tooling-cli-host-plugin-system.md`
3. AOPS-first runtime runbook:
   `/Volumes/d/dev-js2/docs/aops-system.md`
4. Agentspace package and projection rules:
   `/Volumes/d/dev-js2/domains/agentspace/README.md`
5. Skill package contract when the task touches import/export/materialize:
   `/Volumes/d/dev-js2/domains/agentspace/SKILL_PACKAGE_STANDARD.md`

If you need a quick map of which file answers which question, read:

1. `references/agentspace-reference-map.md`

## Working rules

1. Treat `aops-cli` as the hosted operator plane, not as the semantic owner of
   prompts, skills, resources, workspaces, projects, or memory.
2. Treat `agentspace` as the semantic owner for those capability families.
3. Discover hosted tools first:
   - `aops-cli agent tools --domain agentspace --workspace-name Default`
4. Keep hosted workspace context explicit with `--workspace-name` or
   `--workspace-uuid`.
5. Keep payload-level `workspaceId` and `projectId` explicit when the operation
   models those scopes directly.
6. Prefer `aops-cli agent invoke` for CRUD-style hosted operations.
7. Use direct `aops-cli api call --domain agentspace ...` only when
   intentionally bypassing the gateway.
8. For large package import/materialize payloads, use `--input @file.json`
   instead of inline JSON.
9. Do not guess the exact hosted tool ids or envelopes for
   `skill-version.import-skill-package`,
   `skill-version.export-skill-package`, or
   `skill-version.materialize-skill-package`; inspect catalog/help first.
10. If hosted `agentspace` looks stale after a contract or manifest change, use
    the deterministic refresh recipe from the Agentspace README.
11. Hosted write tools such as `agentspace.prompt.create` require `--apply`.
12. Reusable prompt templates are usually a two-step flow:
    `agentspace.prompt.create` then `agentspace.prompt-version.create`.
13. Before showing prompt scope to humans, resolve project and workspace names
    with `agentspace.project.list-projects` and `agentspace.workspace.list-workspaces`.
14. When paired with `projectman`, durable memory writeback should usually cover
    kickoff/resume, decision/blocker, and closeout/lesson rather than every
    status move.

## Hosted discovery workflow

1. Verify runtime:

```bash
aops-cli host health
aops-cli host diagnostics --warmup
```

2. Discover hosted Agentspace tools:

```bash
aops-cli agent tools --domain agentspace --workspace-name Default
```

3. Invoke through hosted AOPS:

```bash
aops-cli agent invoke --tool agentspace.workspace.list-workspaces --workspace-name Default --input '{}'
aops-cli agent invoke --tool agentspace.project.list-projects --workspace-name Default --input '{}'
```

### Prompt template flow

Use this order when persisting a reusable prompt template:

```bash
aops-cli agent invoke --tool agentspace.prompt.create --workspace-name Default --apply --input '{"data":{"workspaceId":"<workspace-id>","projectId":"<project-id>","scopeType":"project","scopeId":"<project-id>","name":"Template name","description":"Template record","tags":["template"],"status":"draft"}}'

aops-cli agent invoke --tool agentspace.prompt-version.create --workspace-name Default --apply --input '{"data":{"workspaceId":"<workspace-id>","promptId":"<prompt-id>","status":"published","content":"<template text>","refType":"project","refId":"<project-id>"}}'
```

If the UI should show human-readable ownership, first fetch:

```bash
aops-cli agent invoke --tool agentspace.workspace.list-workspaces --workspace-name Default --input '{}'
aops-cli agent invoke --tool agentspace.project.list-projects --workspace-name Default --input '{}'
```

4. If the hosted catalog looks wrong after a domain change:

```bash
cd /Volumes/d/dev-js2/domains/agentspace
pnpm run manifest:sync

cd /Volumes/d/dev-js2/apps/aops
aops-cli host diagnostics --reset --warmup
aops-cli agent tools --domain agentspace --workspace-name Default
```

## Capability heuristics

- Need workspace selection or inventory:
  use hosted `agentspace.workspace.*`.
- Need project records:
  use hosted `agentspace.project.*`.
- Need prompt definitions:
  use hosted `agentspace.prompt.*`.
- Need resource inventory:
  use hosted `agentspace.resource.*`.
- Need skill identity/version CRUD:
  use hosted `agentspace.skill.*` and inspect `skill-version.*` docs.
- Need ordered skill bundles:
  use hosted `agentspace.skill-set.*`.
- Need durable contextual retrieval or writeback:
  use hosted `agentspace.memory-item.*`.
- Need Projectman resume or handoff:
  pair with `projectman-aops` and write subject-aware memory at kickoff,
  blocker/decision, and closeout.

## Cross-domain ownership rule

- Prompt/resource/skill/workspace/memory semantics:
  `agentspace`
- Document retrieval/publish semantics:
  `docman`
- Planning semantics:
  `projectman`
- Hosted transport, bootstrap, auth, diagnostics, discovery:
  `aops-cli`

Use `aops-cli` together with the relevant domain skill. Do not replace a domain
skill with `aops-cli`.

## Implementation guidance

When changing hosted Agentspace behavior:

1. start from `agentspace-kit` when the change is about operation ids, schemas,
   DCM, or route projection
2. start from `agentspace-dm` when the change is about model, repository, or
   service behavior
3. start from `agentspace-host-plugin` when the change is about host runtime
   bridging
4. start from `apps/aops/apps/aops-cli` only when the change is about hosted
   operator transport, not Agentspace business semantics
5. update the root docs above when the owner boundary or hosted contract changes

## Anti-patterns

1. treating `aops-cli` as the semantic owner of Agentspace capabilities
2. using `aops-cli api call` as the default path instead of `agent invoke`
3. omitting explicit workspace context on hosted calls
4. guessing tricky `skill-version.*` hosted tool ids instead of inspecting
   catalog/docs first
5. moving Docman or Projectman semantics into an Agentspace skill
