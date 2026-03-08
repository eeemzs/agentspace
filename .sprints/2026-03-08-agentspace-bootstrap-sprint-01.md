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
- [x] Compat/bridge ve eski package alias plani netlestirildi; canonical runtime'dan legacy tool alias normalization kaldirildi.
- [x] `@aops/host-plugin-aops` -> `@aopslab/domain-host-plugin-agentspace` hosted cutover tamamlandi; outward hosted identity `agentspace` olarak freeze edildi.
- [x] App-local wrapper/path naming cleanup tamamlandi (`agentspace-request-input`, `agentspace-domain-*`, `getAgentspaceKit`).
- [x] Legacy internal domain agaci `apps/aops/archive/domains/aops` altina tasindi.
- [ ] Standalone `agentspace-cli` command surface'i ve publish/release policy'si tamamlanacak.

## 4. Ilk Teknik Notlar

1. `agentspace-dm`, `agentspace-kit`, `agentspace-host-plugin`, `agentspace-tooling` ve `agentspace-cli` package ownership'i artik `/Volumes/d/dev-js2/domains/agentspace` altindadir.
2. Hosted runtime cutover tamamlandi; `aops-server` local plugin kaydi `@aopslab/domain-host-plugin-agentspace#createAgentspacePlugin` kullanir ve outward hosted domain kimligi `agentspace`tir.
3. `apps/aops` tarafinda app-local wrapper katmanlari da `Agentspace*` vocabulary'sine cekildi; domain-owned helper path'lerinde `aops` adi kalmadi.
4. Eski internal source agaci aktif workspace/build graph'tan cikarilip `/Volumes/d/dev-js2/apps/aops/archive/domains/aops` altina tasindi.
5. Package naming'i bilerek `@aopslab/domain-*` pattern'ine cekildi; boylece external domain lineup ile ayni release/import dili korunur.
6. `aops-cli` operator/gateway CLI olarak `apps/aops` altinda kalirken, `agentspace` binary canonical domain invoke surface olarak ayrilir.
7. Verification durumunda `agentspace-dm`, `agentspace-kit`, `agentspace-host-plugin`, `agentspace-tooling`, `agentspace-cli`, `aops-server` ve `aops-desktop` build/typecheck zinciri temiz gecti.

### 4.1 Canonical Model Freeze

`agentspace` icin kesin karar:

1. Standalone kullanim modeli: standalone domain + standalone domain CLI
2. `aops-server` icindeki hosting modeli: `in-process integrated hosting`
3. Primary internal composition boundary: `agentspace-kit`
4. Primary external direct API boundary: `/api/agentspace/*`
5. Primary orchestrated/AI invoke boundary: `/api/agent/tools`

Negatif kararlar:

1. `agentspace`, AOPS icinde adapter-wrapped canonical domain olmayacaktir.
2. `agentspace` request-time execution boundary'si olarak CLI/subprocess kullanmayacaktir.
3. `agentspace` icine AOPS'e ozel cross-domain orchestration gomulmeyecektir.

## 5. Not

Bu sprint artık bootstrap'i asmıs durumdadir: extraction, hosted cutover, canonical naming cleanup ve legacy tree archive tasimasi tamamlandi. Kalan isler bootstrap degil, follow-up niteligindedir; ozellikle standalone `agentspace-cli` UX/command surface'i ve sonraki gunlerde archive tree'nin fiziksel silinmesi ayri bir slice olarak ele alinmalidir.
