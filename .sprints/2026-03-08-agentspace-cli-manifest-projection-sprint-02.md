# Agentspace CLI Manifest Projection Sprint (S02)

Date: 2026-03-08  
Sprint ID: `agentspace-cli-manifest-projection-s02`  
Scope Root: `/Volumes/d/dev-js2/domains/agentspace`

## 1. Sprint Amaci

`agentspace` bootstrap workspace'ini `docman` reference pattern'i ile hizalamak:

1. DCM canonical source-of-truth olarak kalsin.
2. CLI/help metadata `agentspace-tooling` icinde derived `cli projection` olarak uretilebilsin.
3. `agentspace manifest cli|get|show` browse surface'i insan ve agent icin acilsin.
4. Standalone CLI runtime help/manifest browse icin repo-url gerektirmesin.

## 2. Workstream

- [x] `agentspace-tooling/src/tools.ts` owner'i acildi; tool descriptor'lari notes/examples/route metadata'si ile zenginlestirildi.
- [x] `agentspace-tooling` icinde `AgentspaceCliProjection` / `AgentspaceCliCommandDescriptor` owner yuzeyi eklendi.
- [x] Tooling manifest emitter'i `cli-manifest.json` artifact'ini emit/check edecek sekilde standardize edildi.
- [x] CLI host-registration manifest emitter'i host-registration-only standardina cekildi.
- [x] `agentspace-cli` projection-driven `--help`, `manifest cli|get|show`, `--version`, `tool/op/generated sugar` surface'ine tasindi.
- [x] `agentspace-tests` icine CLI browse/help regression suite eklendi ve root `test` zincirine baglandi.
- [x] README bootstrap note'tan implemented-state anlatimina cekildi.

## 3. Verification

- [x] `pnpm --filter @aopslab/domain-tooling-agentspace run build`
- [x] `pnpm --filter @aopslab/domain-cli-agentspace run build`
- [x] `pnpm --filter @aopslab/domain-tests-agentspace run build`
- [x] `pnpm --filter @aopslab/domain-tests-agentspace exec vitest run --config vite.config.ts src/tests/operations/operations.agentspace-cli.integration.test.ts`

## 4. Sonuc

- [x] `agentspace` artik inspectable `cli projection` yayinlar.
- [x] CLI help, manifest browse ve agent-oriented metadata ayni derived owner yuzeyinden beslenir.
- [x] HRM runtime registration metadata olarak ayrik tutulur; capability truth DCM'dir.
