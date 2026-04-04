---
name: agentspace-aops-agent
description: Use when the task is about operating Agentspace through hosted AOPS, including workspaces, projects, prompts, resources, skills, memory, and skill package flows via aops-cli or /api/agent surfaces. This skill explains how an agent should treat aops-cli as operator transport while keeping Agentspace as the semantic owner.
metadata:
  short-description: Agentspace AOPS agent guide
---

# Agentspace AOPS Agent

Note: for normal AOPS-hosted app work, AI agents should prefer
`/Volumes/d/dev-js2/apps/aops/AGENTS.md` as the canonical AOPS bootstrap path.
This file is the domain-owned source guide for Agentspace semantics.

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
4. Keep hosted AOPS context explicit with `--workspace-name` or
   `--workspace-uuid` when resolving project and scope bindings.
5. Prefer payload-level `scopeId` as the canonical owner for content and
   knowledge records. Keep `projectId` explicit only when an operation models
   project metadata or needs project-based scope resolution.
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
13. If `aops-cli prompt` sugar exists, prefer it for prompt shell + prompt-version
    lifecycle work instead of repeating raw hosted invoke envelopes.
14. If `aops-cli resource` sugar exists, prefer it for resource inventory and CRUD
    instead of repeating raw hosted invoke envelopes.
15. If `aops-cli skill` sugar exists, prefer it for skill shell + skill-version
    inventory, authoring, publish, inspect, and current resolution instead of
    repeating raw hosted invoke envelopes.
16. `aops-cli prompt version create` and `aops-cli skill version create`
    can resolve the next version automatically when `--version` is omitted.
17. Docman document versions currently stay explicit; do not assume the same
    auto-next ergonomics there.
18. If `aops-cli artifact` sugar exists, prefer it for artifact shell create/get/delete
    and artifact-link / ref lookup instead of hand-writing `agentspace.artifact.*`
    envelopes.
19. Before showing owner labels to humans, resolve project and workspace names
    with `agentspace.project.list-projects` and `agentspace.workspace.list-workspaces`.
20. When paired with `projectman`, durable memory writeback should usually cover
    kickoff/resume, decision/blocker, and closeout/lesson rather than every
    status move.
21. If a task is resumable but not yet modeled in `projectman`, write generic
    project-scoped memory with `aops-cli memory write` rather than forcing fake
    planning artifacts. Bu durumda generic project memory writeback zorunludur,
    disposable tek-seans isler istisnadir.
22. If the project needs durable bootstrap guidance that should surface on
    every curated resume, use sticky project memory instead of normal resume
    notes.
23. If the project needs a living synopsis of current status, decisions, and
    open items, use `aops-cli summary write` / `summary get`.
24. Legacy ordered-bundle entity kaldirildi; ordered capability ihtiyacini `skill`,
    `skill-version`, runner loader plan, prompt guidance ve docs ile coz.

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
aops-cli agent invoke --tool agentspace.prompt.create --workspace-name Default --apply --input '{"data":{"scopeId":"<project-scope-id>","name":"Template name","description":"Template record","tags":["template"],"status":"draft"}}'

aops-cli agent invoke --tool agentspace.prompt-version.create --workspace-name Default --apply --input '{"data":{"workspaceId":"<workspace-id>","promptId":"<prompt-id>","status":"published","content":"<template text>","refType":"project","refId":"<project-id>"}}'
```

Note:

1. `prompt.create` is scope-owned and should use `scopeId`.
2. `prompt-version.create` still carries `workspaceId` for prompt-version
   lineage; do not invent `scopeType` or duplicate owner ids there.
3. `prompt-version.publish-prompt-version` canonical publish op'udur; prompt
   `currentVersionId` ve prompt `status` sync'i domain tarafinda yapilir.

Prompt sugar examples:

```bash
aops-cli prompt create --name "Kickoff Template" --apply --json
aops-cli prompt version create --prompt-id <prompt-id> --content @./template.md --apply --json
aops-cli prompt version publish --id <prompt-version-id> --apply --json
aops-cli prompt inspect --id <prompt-id> --json
aops-cli prompt current --id <prompt-id> --json
```

Resource sugar examples:

```bash
aops-cli resource list --json
aops-cli resource create --name "Hexagen Guide" --resource-type document --uri https://example.test/hexagen --apply --json
aops-cli resource update --id <resource-id> --description "Yeni aciklama" --apply --json
aops-cli resource get --id <resource-id> --json
```

Skill sugar examples:

```bash
aops-cli skill list --json
aops-cli skill create --name "Projectman Delivery" --short-description "Hosted delivery skill" --apply --json
aops-cli skill version create --skill-id <skill-id> --content @./SKILL.md --meta @./meta.json --apply --json
aops-cli skill version publish --id <skill-version-id> --apply --json
aops-cli skill inspect --id <skill-id> --json
aops-cli skill current --id <skill-id> --json
```

Artifact sugar examples:

```bash
aops-cli artifact create --artifact-type file --storage-path s3://bucket/report.json --apply --json
aops-cli artifact link --artifact-id <artifact-id> --ref-type resource --ref-id <resource-id> --apply --json
aops-cli artifact ref list --ref-type resource --ref-id <resource-id> --json
aops-cli artifact get --id <artifact-id> --json
aops-cli artifact delete --id <artifact-id> --apply --confirm --json
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
  use hosted `agentspace.prompt.*` or `aops-cli prompt`.
- Need resource inventory:
  use hosted `agentspace.resource.*`.
- Need skill identity/version CRUD:
  use `aops-cli skill` or hosted `agentspace.skill.*`.
- Need artifact metadata shell or project-bound artifact relation:
  use `aops-cli artifact` or hosted `agentspace.artifact.*`.
- Need ordered capability selection:
  use selected skill versions, runner loader plan, prompt guidance, docs, or
  sticky memory instead of reintroducing a legacy bundle entity.
- Need durable contextual retrieval or writeback:
  use hosted `agentspace.memory-item.*`.
- Need a curated resume bundle instead of raw memory rows:
  use hosted `agentspace.memory-item.build-resume-pack`.
- Need a CLI-first project memory path without PM sugar:
  use `aops-cli memory write`, `aops-cli memory resume`, `aops-cli memory search`.
- Need durable project bootstrap guidance:
  use `aops-cli memory write --mode rule --subject project --sticky`.
- Need a living project synopsis:
  use `aops-cli summary write` and `aops-cli summary get`.
- Need Projectman resume or handoff:
  pair with `projectman-aops` and write subject-aware memory at kickoff,
  blocker/decision, and closeout.

## Memory sugar examples

Project-level resume note without PM coupling:

```bash
aops-cli memory write \
  --workspace-name Default \
  --project-id <project-id> \
  --mode resume \
  --subject project \
  --content "Yarin buradan devam et: once open API regression testlerini tekrar calistir." \
  --next-action "Smoke testten sonra sprint statusunu yeniden degerlendir." \
  --apply \
  --json
```

Project-level curated resume pack:

```bash
aops-cli memory resume \
  --workspace-name Default \
  --project-id <project-id> \
  --subject project \
  --json
```

Long-lived reusable project habits:

- prefer `agentspace.memory-item kind=rule`
- carry `meta.horizon=long`
- keep reusable hints concise and portable, not chain-of-thought dumps

Sticky bootstrap guidance:

```bash
aops-cli memory write \
  --workspace-name Default \
  --project-id <project-id> \
  --mode rule \
  --subject project \
  --sticky \
  --summary-role bootstrap \
  --content "Hexagen kullan; plan before generate. Gerektiginde owner dokumanlarini oku." \
  --apply \
  --json
```

Living project summary:

```bash
aops-cli summary write \
  --workspace-name Default \
  --project-id <project-id> \
  --summary "Hosted AOPS operator plane aktif; PM ve memory akislari kurulu." \
  --decision "Sticky bootstrap guidance kullaniliyor." \
  --open-item "Runner cleanup surface planlanacak." \
  --apply \
  --json
```

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
