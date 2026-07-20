# Agentspace

Agentspace is the AOPS domain for projects, agent memory, reusable prompts and
skills, discussions, chat coordination, missions, and related hosted runtime
operations.

This repository is the clean, public source for the Agentspace domain packages.
It does not depend on sibling source checkouts. Published dependencies resolve
from the public npm registry.

## Packages

- `@aopslab/domain-dm-agentspace`: domain models and repositories
- `@aopslab/domain-kit-agentspace`: canonical operations, DCM, and host routes
- `@aopslab/domain-host-plugin-agentspace`: host runtime bridge
- `@aopslab/domain-tooling-agentspace`: generated tooling projections
- `@aopslab/domain-cli-agentspace`: standalone Agentspace CLI
- `@aopslab/domain-ops-agentspace`: operational utilities
- `@aopslab/domain-core-agentspace`: shared domain resources

## Requirements

- Node.js 20 or newer
- pnpm 10

## Develop

```bash
pnpm install --frozen-lockfile
pnpm run build
pnpm run test
pnpm run manifest:sync
pnpm run smoke:packed-install -- --skip-build
```

PostgreSQL and SQLite schema helpers remain available through the root
`db:*` scripts. The standalone CLI defaults to a user-local SQLite database
when no repository URL is configured.

## Release

Packages are public under the `@aopslab` npm scope. A release must pass the
build, manifest, and packed-install gates before publication. Publishing is an
explicit maintainer action; this repository does not contain bespoke deployment
or registry workflow automation.

## License

Apache-2.0. See [LICENSE](./LICENSE) and [NOTICE](./NOTICE).
