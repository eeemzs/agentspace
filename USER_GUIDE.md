# Agentspace User Guide

Bu rehber, hosted AOPS icinde `agentspace` capability'lerinin ne ise yaradigini
ve `aops-cli` uzerinden nasil kullanilacagini anlatir.

## 1. Agentspace nedir

`agentspace`, context domain'idir.

Owner oldugu baslica capability aileleri:

1. project
2. prompt
3. resource
4. skill
5. artifact
6. memory-item
7. activity-item

Kisa kural:

1. planlama `projectman`
2. durable context `agentspace`

## 2. En onemli entity'ler

### Project

Repo veya calisma alaniyla iliskilenen owner baglami.

### Memory Item

Short handoff/resume/decision kaydi, durable note kaydi ve sticky guidance kaydi.

### Generated Synopsis

Projenin yasayan synopsis'i memory truth'tan generated read model olarak uretilir.

### Activity Item

Immutable operator ledger kaydidir.

Ne degildir:

1. `memory-item` gibi curated resume/decision notu degildir
2. `agent-run-event` gibi run-scoped timeline degildir

### Prompt / Resource

Prompt setleri, referanslar ve curated retrieve surface'i.

Prompt modeli:

1. `prompt`
   - reusable shell
   - `scopeId` owner'lidir
2. `prompt-version`
   - actual content + lineage
   - lineage kaydi dogrudan `projectId` ile tutulur

Skill modeli:

1. `skill`
   - reusable shell
   - `scopeId` owner'lidir
2. `skill-version`
   - actual content + lineage
   - lineage kaydi dogrudan `projectId` ile tutulur

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
   - relation kaydi dogrudan `projectId` ile tutulur

Activity modeli:

1. `activity-item`
   - immutable operator ledger
   - operator surface project-first'tur; `projectId` primary giristir
   - owner chain'de ayni deger `scopeId` olarak da tasinabilir
   - `sourceKind`, `sourceId`, `action`, `status`, `summary`, `refs`, `payload`

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

### Generated synopsis

Memory truth'tan uretilen proje ozeti.

Ornek:

1. mevcut durum
2. ana kararlar
3. open items

## 4. En faydali komutlar

```bash
aops-cli agent tools --domain agentspace
aops-cli project list --json
aops-cli mem list --subject project --json
aops-cli mem get --id <memory-id> --json
aops-cli mem write --mode resume --subject project --durability short --content "Yarin buradan devam et." --apply --json
aops-cli mem write --mode resume --subject sprint --durability short --content "Bu sprintten devam et." --next-read-ref @./next-read-ref.json --apply --json
aops-cli mem update --id <memory-id> --durability durable --content "Guncel ozet" --apply --json
aops-cli mem delete --id <memory-id> --apply --confirm --json
aops-cli mem resume --subject project --json
aops-cli mem synopsis --subject project --json
aops-cli mem search --subject sprint --id <sprint-id> --json
```

Project sugar:

```bash
aops-cli project list --json
aops-cli project get --id <project-id> --json
aops-cli project create --name "Demo Project" --slug demo-project --status active --visibility private --project-type software --apply --json
aops-cli project update --id <project-id> --description "Yeni aciklama" --apply --json
aops-cli project delete --id <project-id> --apply --confirm --json
```

Kural:

1. `project` sugar hosted `agentspace.project.*` surface'inin operator-friendly karsiligidir
2. `list` varsayilan olarak tablo basar; scriptable output icin `--json` kullan
3. `scopeId` varsayilan olarak `projectId` ile aynidir; project-first owner modeli varsayilir
4. destructive operasyonlar `--apply --confirm` ister

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
2. prompt-version create icinde lineage `projectId` ile tutulur
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
2. `skill-version` content ve lineage kaydidir; lineage `projectId` ile tutulur
3. `skill version publish` current version sync'ini domain tarafinda yapar
4. `skill version create` icin `--version` opsiyoneldir; verilmezse CLI mevcut skill version zincirinden bir sonraki sayiyi hesaplar
5. bu surface inventory/authoring/versioning icindir; execution engine degildir

Ortak hosted sugar contract:

1. write komutlari varsayilan olarak `--apply` ister
2. destructive komutlar `--apply --confirm` ister
3. `prompt`, `resource`, `skill` ve `artifact` aileleri ayni envelope contract'ini kullanir:
   `command`, `toolId`, `resolvedContext`, `input`, `result`, opsiyonel `artifacts`
4. durable activity yalniz mutating hosted write'larda append edilir
5. desktop'ta `Projects > Logs` ve `Projects > Activity` ayni truth'u farkli baglamda gosterir

Sticky guidance:

```bash
aops-cli mem write --kind resume --durability short --content "Bu session ozetini 1 haftalik tut." --apply --json
aops-cli mem write --kind note --durability durable --content "ADK sugar once manifest sync sonra electron bridge." --purpose howto --area adk-electron --next-read-ref '{"kind":"doc","documentVersionId":"<docver-id>","sectionId":"<section-id>"}' --apply --json
aops-cli mem update --id <memory-id> --durability durable --content "Guncel ozet" --status active --apply --json

aops-cli mem write \
  --mode rule \
  --subject project \
  --durability sticky \
  --content "Hexagen kullan; plan before generate." \
  --apply \
  --json

aops-cli mem write \
  --mode rule \
  --subject project \
  --purpose howto \
  --area adk-electron \
  --status active \
  --review-after-days 30 \
  --content "ADK sugar komutunu once manifest sync, sonra electron bridge ile bagla." \
  --apply \
  --json
```

Cleanup veya replacement ihtiyacinda:

1. `mem list` veya `mem search` ile eski kaydi bul
2. operator-facing patch icin `mem update` kullan
3. tamamen kaldirmak istiyorsan `mem delete --apply --confirm`
4. sticky replacement icin yeni kaydi `--supersede <oldId>` ile yaz
5. `--purpose`, `--area`, `--status` alanlari memory'yi tekrar bulunabilir tag/meta ile siniflandirir; doc gerekiyorsa `nextReadRefs/sourceRefs` kullan
6. `mem search` icinde ayni alanlar varsayilan olarak retrieval hint'tir; strict post-filter icin `--strict-classification` kullan

Docman read shortcut:

```bash
aops-cli mem doc refs --subject sprint --id <sprint-id> --json
aops-cli mem doc answer --subject sprint --id <sprint-id> --q "Ne degisti?" --ensure summary --json
aops-cli mem doc source --subject sprint --id <sprint-id> --json
aops-cli mem doc publish --subject sprint --id <sprint-id> --target markdown --json
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

## 5.1 Memory usage model

Secim mantigi:

1. `short` = kisa carry-forward / handoff / bir sonraki session'a devam notu
2. `long` = proje hakkinda tekrar kullanilacak genel bilgi
3. `critical` = yuksek onemli pattern, how-to, architecture veya karar izi
4. `resume` / `carry-forward` = devam notu
5. `project` = subject bagimsiz proje bilgisi
6. `pattern` / `howto` / `architecture` = tekrar bulunabilir bilgi; gerekirse Docman ref'i ile birlikte yaz
7. `decision` = session/sprint penceresi icindeki calisma karari
8. kalici karar veya reusable bilgi = `note`

Owner kural:

1. `memory` neyin okunacagini soyler
2. `docman` canonical icerigi verir
3. `projectman` execution state truth'unu verir

## 6. Resume pack nasil calisir

`agentspace.memory-item.build-resume-pack` curated bir toplu cikti uretir.

Oncelik sirasi:

1. sticky guidance (board-scoped: eger retrieval.tags icerisinde `board:<slug>`
   tag'i varsa, yalnizca o board'un `board-bootstrap` tag'li sticky kayitlari
   dahil edilir; genel project-level sticky rule'lar hala gecer)
2. generated synopsis
3. exact subject memory
4. lineage memory
5. project-level rule
6. generic project memory

Default amac:

1. her seyi okumadan devam edebilmek
2. doc/resource okumayi sadece gerekirse tetiklemek

## 7. Ne zaman Agentspace kullan

1. baska agent daha sonra devam edecekse
2. PM artifact disi resumable calisma varsa
3. proje seviyesinde synopsis lazimsa
4. kalici guidance lazimsa

## 7. Ne zaman Agentspace kullanma

1. board/sprint/utask state'i icin
2. kanban workflow icin
3. issue/feedback lifecycle icin

Bunlar `projectman` concern'udur.
