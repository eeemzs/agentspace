# Agentspace User Guide

Bu rehber, hosted AOPS icinde `agentspace` capability'lerinin ne ise yaradigini
ve `aops-cli` uzerinden nasil kullanilacagini anlatir.

## 1. Agentspace nedir

`agentspace`, context domain'idir.

Owner oldugu baslica capability aileleri:

1. workspace
2. project
3. prompt
4. resource
5. skill
6. artifact
7. memory-item
8. project-summary

Kisa kural:

1. planlama `projectman`
2. durable context `agentspace`

## 2. En onemli entity'ler

### Workspace

Tenant ici top-level sahiplik alani.

### Project

Repo veya calisma alaniyla iliskilenen owner baglami.

### Memory Item

Durable handoff, resume, decision, lesson, rule ve sticky guidance kaydi.

### Project Summary

Projenin yasayan synopsis'i.

### Prompt / Resource

Prompt setleri, referanslar ve curated retrieve surface'i.

Prompt modeli:

1. `prompt`
   - reusable shell
   - `scopeId` owner'lidir
2. `prompt-version`
   - actual content + lineage
   - `workspaceId + promptId + version`

Skill modeli:

1. `skill`
   - reusable shell
   - `scopeId` owner'lidir
2. `skill-version`
   - actual content + lineage
   - `workspaceId + skillId + version`

Not:

1. ordered capability secimi ayri bundle entity'si ile degil
2. selected skill versions, prompt guidance ve docs ile cozulur

Artifact modeli:

1. `artifact`
   - scope-owned metadata shell
   - `scopeId` owner'lidir
   - `artifactType`, `storagePath`, `label`, `mimeType`, `sizeBytes`, `hash`, `meta`
2. `artifact-link`
   - project-scoped relation kaydidir
   - `workspaceId + projectId + artifactId + refType + refId`

## 3. Memory modelleri

### Normal memory

Ornek:

1. kickoff
2. resume
3. decision
4. blocker
5. closeout

### Sticky memory

Kalici rehber notlari icindir.

Ornek:

1. "Hexagen kullan"
2. "su dokumanlardan basla"
3. "bu projede migration boyle yapilir"

### Project summary

Yasayan proje ozeti.

Ornek:

1. mevcut durum
2. ana kararlar
3. open items

## 4. En faydali komutlar

```bash
aops-cli agent tools --domain agentspace
aops-cli memory list --subject project --json
aops-cli memory get --id <memory-id> --json
aops-cli memory write --mode resume --subject project --content "Yarin buradan devam et." --apply --json
aops-cli memory write --mode resume --subject sprint --content "Bu sprintten devam et." --next-read-ref @./next-read-ref.json --apply --json
aops-cli memory update --id <memory-id> --content "Guncel ozet" --apply --json
aops-cli memory delete --id <memory-id> --apply --confirm --json
aops-cli memory resume --subject project --json
aops-cli memory search --subject sprint --id <sprint-id> --json
aops-cli summary write --summary "Current status" --apply --json
aops-cli summary get --json
```

Prompt sugar:

```bash
aops-cli prompt list --json
aops-cli prompt create --name "Kickoff Template" --apply --json
aops-cli prompt update --id <prompt-id> --description "Yeni aciklama" --apply --json
aops-cli prompt version list --prompt-id <prompt-id> --json
aops-cli prompt version create --prompt-id <prompt-id> --content @./template.md --variables @./vars.json --meta @./meta.json --apply --json
aops-cli prompt version publish --id <prompt-version-id> --apply --json
aops-cli prompt inspect --id <prompt-id> --json
aops-cli prompt current --id <prompt-id> --json
```

Kural:

1. prompt create `scopeId` owner field kullanir
2. prompt-version create `workspaceId` lineage field kullanir
3. publish current version'i domain tarafinda sync eder
4. bu surface reusable prompt template authoring icindir; execution engine degildir

Resource sugar:

```bash
aops-cli resource list --json
aops-cli resource create --name "Hexagen Guide" --resource-type document --uri https://example.test/hexagen --apply --json
aops-cli resource update --id <resource-id> --description "Yeni aciklama" --apply --json
aops-cli resource get --id <resource-id> --json
aops-cli resource delete --id <resource-id> --apply --confirm --json
```

Kural:

1. resource `scopeId` owner field kullanir
2. resource versioned degildir; prompt-version benzeri lineage yoktur
3. `refType/refId` raw ve explicit kalir
4. bu surface reusable metadata / knowledge pointer inventory'si icindir

Artifact sugar:

```bash
aops-cli artifact create --artifact-type file --storage-path s3://bucket/report.json --apply --json
aops-cli artifact link --artifact-id <artifact-id> --ref-type resource --ref-id <resource-id> --apply --json
aops-cli artifact ref list --ref-type resource --ref-id <resource-id> --json
aops-cli artifact get --id <artifact-id> --json
aops-cli artifact delete --id <artifact-id> --apply --confirm --json
```

Kural:

1. `artifact` versioned degildir; metadata shell olarak calisir
2. actual binary/content owner'i degildir; `storagePath` pointer tasir
3. project execution relation'i `artifact link` ile kurulur
4. `artifact ref list` generic inventory degil, ref-based lookup surface'idir

Skill sugar:

```bash
aops-cli skill list --json
aops-cli skill create --name "Projectman Delivery" --short-description "Hosted delivery skill" --apply --json
aops-cli skill update --id <skill-id> --description "Yeni aciklama" --apply --json
aops-cli skill version list --skill-id <skill-id> --json
aops-cli skill version create --skill-id <skill-id> --content @./SKILL.md --meta @./meta.json --apply --json
aops-cli skill version publish --id <skill-version-id> --apply --json
aops-cli skill inspect --id <skill-id> --json
aops-cli skill current --id <skill-id> --json
```

Kural:

1. `skill` reusable capability shell kaydidir ve `scopeId` owner'lidir
2. `skill-version` content ve lineage kaydidir; `workspaceId + skillId + version` ile ilerler
3. `skill version publish` current version sync'ini domain tarafinda yapar
4. `skill version create` icin `--version` opsiyoneldir; verilmezse CLI mevcut skill version zincirinden bir sonraki sayiyi hesaplar
5. bu surface inventory/authoring/versioning icindir; execution engine degildir

Ortak hosted sugar contract:

1. write komutlari varsayilan olarak `--apply` ister
2. destructive komutlar `--apply --confirm` ister
3. `prompt`, `resource`, `skill` ve `artifact` aileleri ayni envelope contract'ini kullanir:
   `command`, `toolId`, `resolvedContext`, `input`, `result`, opsiyonel `artifacts`

Sticky guidance:

```bash
aops-cli memory write \
  --mode rule \
  --subject project \
  --sticky \
  --summary-role bootstrap \
  --content "Hexagen kullan; plan before generate." \
  --apply \
  --json
```

Cleanup veya replacement ihtiyacinda:

1. `memory list` veya `memory search` ile eski kaydi bul
2. gerekiyorsa `memory update` ile yerinde guncelle
3. tamamen kaldirmak istiyorsan `memory delete --apply --confirm`
4. sticky replacement icin yeni kaydi `--supersede <oldId>` ile yaz

Docman read shortcut:

```bash
aops-cli memory doc refs --subject sprint --id <sprint-id> --json
aops-cli memory doc answer --subject sprint --id <sprint-id> --q "Ne degisti?" --ensure summary --json
aops-cli memory doc source --subject sprint --id <sprint-id> --json
aops-cli memory doc publish --subject sprint --id <sprint-id> --target markdown --json
```

Not:

1. bu zincir `recommendedRefs` uzerinden calisir
2. tam shortcut icin ref icinde en az `documentVersionId` olmalidir
3. `--next-read-ref` ve `--source-ref` string, inline JSON, JSON array veya `@file.json` kabul eder
4. richer ref alanlari:
   - `sectionId`
   - `pageVersionId`
   - `pageNumber`
   - `target`

## 5. Resume pack nasil calisir

`agentspace.memory-item.build-resume-pack` curated bir toplu cikti uretir.

Oncelik sirasi:

1. sticky guidance
2. project summary
3. exact subject memory
4. lineage memory
5. project-level rule
6. generic project memory

Default amac:

1. her seyi okumadan devam edebilmek
2. doc/resource okumayi sadece gerekirse tetiklemek

## 6. Ne zaman Agentspace kullan

1. baska agent daha sonra devam edecekse
2. PM artifact disi resumable calisma varsa
3. proje seviyesinde synopsis lazimsa
4. kalici guidance lazimsa

## 7. Ne zaman Agentspace kullanma

1. board/sprint/utask state'i icin
2. kanban workflow icin
3. issue/feedback lifecycle icin

Bunlar `projectman` concern'udur.
