# agentspace-kit

Agentspace Kit is a thin bridge that connects domain services and repositories
to applications using hexagonal architecture. Domain-specific extensions remain
isolated in `//==> custom ... <==//` blocks.

## Quick Start

```ts
import { createAgentspaceKitWithEnv, getAgentspaceKitEnvConfig } from '@aops/aops-kit'

const { kit } = createAgentspaceKitWithEnv({
  envConfig: getAgentspaceKitEnvConfig(),
  baseContext: {
    tenantId: 'tenant-1',
    locale: 'en',
    fallbackLocale: 'en',
    logger,
  },
})

const service = await kit.getProjectService()
```

## Environment Variables

- `TENANT_ID`
- `LOG_LEVEL`
- `AGENTSPACE_REPO_URL` (shared PostgreSQL or SQLite repository URL)
- `AGENTSPACE_SQLITE_URL` (SQLite repository URL)
- `AGENTSPACE_PG_URL` (PostgreSQL repository URL)
- `AOPS_PG_URL` (legacy shared fallback)

## Notes

- `tenantId` is required in the context.
- The cache key is derived from `locale|fallbackLocale` by default.
- Service and repository accessors are exported by the kit's typed surface.
