# aops-kit

aops-kit kiti, domain servis ve repository'lerini hexagonal prensiplerle uygulamalara baglayan ince bir kopru saglar.
Bu scaffold, `inventory-kit` desenini takip eder ve domain'e ozel kodlari
`//==> custom ... <==//` bloklarinda izole eder.

## Hizli Kullanim (env ile)

```ts
import { createAopsKitWithEnv, getAopsKitEnvConfig } from '@aops/aops-kit'

const { kit } = createAopsKitWithEnv({
  envConfig: getAopsKitEnvConfig(),
  baseContext: {
    tenantId: 'tenant-1',
    locale: 'tr',
    fallbackLocale: 'en',
    logger,
  },
})

const service = await kit.getProjectService()
```

## Env Degiskenleri

- `TENANT_ID`
- `LOG_LEVEL`
- `AOPS_PG_URL` (tum repository'ler icin ortak URL)

## Sundugu Yuzey

Services:
- `projectService`
- `promptService`
- `promptVersionService`
- `resourceService`
- `skillService`
- `skillVersionService`
- `skillSetService`
- `skillSetItemService`
- `kanbanBoardService`
- `kanbanColumnService`
- `sprintService`
- `sprintItemService`
- `taskService`
- `taskCommentService`
- `agentSessionService`
- `agentRunService`
- `artifactService`
- `artifactLinkService`
- `projectSummaryService`
- `memoryItemService`

Repositories:
- `projectRepository`
- `promptRepository`
- `promptVersionRepository`
- `resourceRepository`
- `skillRepository`
- `skillVersionRepository`
- `skillSetRepository`
- `skillSetItemRepository`
- `kanbanBoardRepository`
- `kanbanColumnRepository`
- `sprintRepository`
- `sprintItemRepository`
- `taskRepository`
- `taskCommentRepository`
- `agentSessionRepository`
- `agentRunRepository`
- `artifactRepository`
- `artifactLinkRepository`
- `projectSummaryRepository`
- `memoryItemRepository`

## Notlar

- `tenantId` context icinde zorunludur.
- Cache key varsayilan olarak `locale|fallbackLocale` uzerinden hesaplanir.

