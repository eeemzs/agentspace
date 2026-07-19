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
    "projectId": "<project-id>",
    "scopeId": "<project-id>",
    "scopeType": "project",
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
- `projectId` is the hosted context and resolver input.
- `scopeId` is the canonical owner and bu projede her zaman `projectId` ile ayni degeri tasir.
- `scopeType=project` canonical moddur.
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
- `manifest` (`PackageManifestV1`-compatible immutable hosted metadata)

Client-transfer export rules:

- Only the skill's `currentVersionId` may be exported.
- The selected version must be `published` and published versions are immutable.
- `manifest.files[]` contains the publish-time SHA-256 and byte length for every
  transferred file.
- `manifest.packageSha256` is computed from NFC paths sorted by unsigned UTF-8
  bytes using records `<path> NUL <lowercase-file-sha256> LF`.
- Provenance is `verified-hosted-package` with expected digest source
  `immutable-hosted-metadata`.
- Export never returns `sourcePath`, `fullPath`, output directories, or another
  server-local filesystem pointer.

Export output is intended to round-trip back into `import-skill-package`
without compatibility transforms.

`materialize-skill-package` is a distinct trusted server-side operation and may
return its explicitly requested output path. It is not the client package
transfer contract.

## Metadata discovery contract

`skill.search` performs deterministic on-read ranking over raw `Skill`
metadata and the current published `SkillVersion` metadata. `skill.ask` is a
bounded projection of that same retrieval result.

The discovery surface does not inspect package bodies and does not add a
persisted index, embeddings, an LLM call, or inferred aliases. Aliases, CLI
families, domain terms, capabilities, keywords, tags, and triggers must already
exist in raw metadata. Persisted indexing and publisher/trust schema expansion
remain deferred until observed scale or a cross-authority publisher model
requires them.

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
aops-cli agent tools --domain agentspace --project-id <project-id>
```

This is the canonical operator recipe for stale catalog, route, or tool drift.
