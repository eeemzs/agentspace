# Agentspace AOPS Reference Map

Use this file when you need a quick answer to "which hosted/operator document
should I read first?"

## Questions to source map

- What is the canonical `aops-cli` vs `agentspace` boundary?
  - `/Volumes/d/dev-js2/docs/tooling-cli-host-plugin-system.md`
  - `/Volumes/d/dev-js2/docs/guides/skills/aops-agent-skill-usage-guide.md`

- What is the AOPS-first hosted runbook?
  - `/Volumes/d/dev-js2/docs/aops-system.md`

- Which package owns Agentspace capability definitions?
  - `/Volumes/d/dev-js2/domains/agentspace/README.md`

- Which document owns skill-package import/export/materialize rules?
  - `/Volumes/d/dev-js2/domains/agentspace/SKILL_PACKAGE_STANDARD.md`

- How do I discover hosted tools?
  - `aops-cli agent tools --domain agentspace --workspace-name Default`

- How do I refresh hosted drift after an Agentspace contract change?
  - `/Volumes/d/dev-js2/domains/agentspace/README.md`

## High-signal command set

```bash
aops-cli host health
aops-cli host diagnostics --warmup
aops-cli agent tools --domain agentspace --workspace-name Default
aops-cli agent invoke --tool agentspace.workspace.list-workspaces --workspace-name Default --input '{}'
```
