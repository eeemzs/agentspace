# Agentspace Bootstrap Sprint (S01)

Date: 2026-03-08  
Sprint ID: `agentspace-bootstrap-s01`  
Scope Root: `/Volumes/d/dev-js2/domains/agentspace`

## 1. Sprint Amaci

`agentspace` adini canonical domain adi olarak freeze edip extraction icin kirilmayan baslangic root'unu olusturmak.

## 2. Bu Fazda Yapilanlar

- [x] `agentspace` naming freeze karari dokumante edildi.
- [x] `/Volumes/d/dev-js2/domains/agentspace` root scaffold edildi.
- [x] Root `README.md`, `package.json`, `tsconfig.base.json`, `tsconfig.json` eklendi.
- [x] Migration ana plani ile cross-reference kuruldu.
- [x] Workspace package naming'i `@aopslab/domain-*` konvansiyonuna hizalandi.
- [x] `cli/tooling/tests/dm/kit/core/ops/host-plugin` matrix'i acildi.
- [x] CLI ve tooling icin minimal manifest emit/check iskeleti eklendi.
- [x] `agentspace-dm` icine gercek `aops-dm` source agaci tasindi ve package source owner haline geldi.
- [x] `agentspace-kit` icine gercek `aops-kit` source agaci tasindi; `agentspace` wrapper yuzeyi korunarak `@aopslab/domain-dm-agentspace` importlarina cevrildi.
- [x] `agentspace-host-plugin` icine gercek `aops-host-plugin` source agaci tasindi ve outward manifest/error/domain kimligi `agentspace` olarak uyarlandi.
- [x] `agentspace-tooling` gercek AOPS operation catalog'unu okuyup `agentspace-*` tool id projection'u uretecek sekilde guncellendi.

## 3. Sonraki Dilim

- [x] `apps/aops/domains/aops` altindaki gercek kaynaklar `agentspace-*` paketlerine tasindi.
- [x] `aops-server` ve `aops-desktop` consumer import'lari yeni package setine gore rewiring aldi.
- [x] Placeholder manifest/tool catalog stub'lari gercek operation/tool projection'lariyla dolduruldu.
- [ ] Compat/bridge ve eski package alias plani netlestirilecek.
- [ ] `@aops/host-plugin-aops` -> `@aopslab/domain-host-plugin-agentspace` gecis stratejisi, outward `aops` hosted identity korunup korunmayacagi netlestirilerek ayrica planlanacak.

## 4. Ilk Teknik Notlar

1. `dm + kit` tarafinda canonical package sahibi artik `/Volumes/d/dev-js2/domains/agentspace` altindadir; hosted outward `aops` kimligini koruyan legacy plugin hatti ise su an icin `/Volumes/d/dev-js2/apps/aops/domains/aops/aops-host-plugin` altinda kalir ve iceride extracted `agentspace-kit` paketini kullanir.
2. `agentspace` root bu sprintte `fileman` / `projectman` / `docman` ile hizali workspace matrix olarak acildi.
3. `agentspace-dm`, `agentspace-kit` ve `agentspace-host-plugin` artik gercek source owner durumundadir; `apps/aops` tarafinda `dm + kit` consumer rewiring'i tamamlandi ancak host-plugin compat katmani henuz korunmaktadir.
4. Package naming'i bilerek `@aopslab/domain-*` pattern'ine cekildi; boylece external domain lineup ile ayni release/import dili korunur.
5. `aops-cli` operator/gateway CLI olarak `apps/aops` altinda kalirken, `agentspace` binary canonical domain invoke surface olarak ayrilir.
6. `apps/aops` workspace'i `../../domains/agentspace/*` paketlerini aktif workspace olarak gorur hale geldi; `pnpm install --ignore-scripts` sonrasi `agentspace-dm`, `agentspace-kit`, `aops-server` ve `aops-desktop` build/typecheck dogrulamalari temiz gecti.

## 5. Not

Bu sprintte eski `apps/aops/domains/aops` yapisi korunurken yeni `agentspace` root'u acildi, ardindan `dm/kit/host-plugin` source agaclari yeni canonical package ailesine tasindi. Sonraki slice ile `apps/aops` tarafindaki `dm/kit` consumer'lari yeni package ailesine rewiring aldi; yalniz `@aops/host-plugin-aops` hosted `aops` kimligini korumak icin bilerek legacy hatta tutuldu.
