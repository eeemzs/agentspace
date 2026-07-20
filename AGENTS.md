# Agentspace Repository Rules

This repository is the canonical public source for the Agentspace domain.

- Keep the repository independently installable. Do not add dependencies on
  sibling source checkouts or machine-local paths.
- External `@aopslab/*` dependencies must resolve from the public npm
  registry. Internal Agentspace workspace dependencies must become ordinary
  semver dependencies in packed artifacts.
- Run build, typecheck, tests, manifest checks, and packed-install smoke before
  publishing.
- Keep deployment orchestration, registry credentials, signing, and bespoke
  distribution workflows outside this source repository.
- Never commit tokens, local database files, generated build output, or
  machine-specific configuration.
- GitHub push and npm publication are explicit maintainer actions.
