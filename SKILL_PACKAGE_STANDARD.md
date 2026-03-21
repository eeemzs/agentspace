# AOPS Skill Package Standard

Standard ID: `aops-skill-package-v1`

This document defines the canonical filesystem package exchanged by Agentspace
skill import, export, and materialize flows.

## Goals

- Make `SKILL.md` the primary interchange boundary.
- Keep database records as indexing, ownership, and versioning state.
- Avoid product-specific sidecar formats.
- Prefer one canonical flow over backward-compatibility shims.

## Package Shape

Required:

- `SKILL.md`

Optional:

- Any additional relative files under the package root, for example:
  - `references/*.md`
  - `assets/*`
  - `templates/*`

Forbidden:

- Absolute paths
- `.` or `..` path traversal segments
- Alternative entry files

## Entry File

`SKILL.md` is the canonical entry file.

Expected frontmatter:

```md
---
name: my-skill
description: Short description
---
```

The first non-empty body line may be used as a short description fallback.

## Import Contract

Canonical custom operation input:

```json
{
  "data": {
    "workspaceId": "<workspace-id>",
    "scopeType": "global",
    "createdBy": "cli",
    "updatedBy": "cli",
    "bundle": {
      "sourcePath": "/tmp/my-skill",
      "metadata": {
        "source": "local-filesystem"
      },
      "files": [
        {
          "path": "SKILL.md",
          "kind": "instruction",
          "content": "---\nname: my-skill\ndescription: Example\n---\n\n# My Skill\n"
        },
        {
          "path": "references/checklist.md",
          "kind": "reference",
          "content": "# Checklist\n"
        }
      ]
    }
  }
}
```

Rules:

- `data.bundle.files` must contain `SKILL.md`.
- File paths are stored relative to the package root.
- `scopeType=project` requires consistent `projectId` or `scopeId`.
- The canonical tag is `skill-package`.

## Export Contract

Canonical custom operation input:

```json
{
  "id": "<skill-version-id>"
}
```

Expected output:

- `entryFile`
- `skillStandard`
- `files[]`

Export output is intended to round-trip back into `import-skill-package`
without compatibility transforms.

## Materialize Contract

Canonical custom operation input:

```json
{
  "id": "<skill-version-id>",
  "data": {
    "outputDir": "/tmp/materialized-skill",
    "overwrite": true
  }
}
```

Rules:

- `outputDir` is required.
- Files are written exactly by their relative package paths.
- `overwrite=true` allows replacing an existing materialized package.

## Ownership Model

- Filesystem package is the interchange owner.
- `Skill` owns durable identity and scope.
- `SkillVersion` owns versioned package content and metadata.
- `Resource` mirrors the published/imported package for discovery and runtime
  linkage.

## Runtime Refresh Recipe

If a package contract, manifest, route, or projection changes and an AOPS-hosted
runtime looks stale, use this recovery sequence:

```bash
cd /Volumes/d/dev-js2/domains/agentspace
pnpm run manifest:sync

cd /Volumes/d/dev-js2/apps/aops
aops-cli host diagnostics --reset --warmup
aops-cli agent tools --domain agentspace --workspace-name Default
```

This is the canonical operator recipe for stale catalog, route, or tool drift.
