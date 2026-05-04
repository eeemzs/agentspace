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
8. discussion-topic
9. collab-session
10. agent-profile

Kisa kural:

1. planlama `projectman`
2. durable context `agentspace`

## 1.1 Discuss ve collab owner modeli

`discuss` ve `collab`, Agentspace'in repo-first coordination yuzeyleridir.
`aops-cli discuss ...` ve `aops-cli collab ...` komutlari operator sugar'dir;
semantic truth bu domain modelindedir.

Canonical source:

1. `.aops/agentspace/discussions/topics/**`
2. `.aops/agentspace/collabs/sessions/**`
3. `.aops/agentspace/agent-profiles/**`

Skill routing:

| Ihtiyac | Hosted skill | CLI help |
|---------|--------------|----------|
| discuss/collab operator playbook | `aops-cli-collab` | `aops-cli discuss --help`, `aops-cli collab --help` |
| CLI guard/sync/hosted mirror | `aops-cli-core` | `aops-cli --help`, `aops-cli sync --help` |
| memory/project/prompt/resource/artifact | PR2 `aops-cli-agentspace` | `aops-cli mem --help`, `aops-cli project --help`, `aops-cli skill --help` |

Discuss modeli:

1. Topic transcript append-only repo-first dosyalarda tutulur.
2. Agent sirasi ve lifecycle state structured `status`/`wait` ciktilarindan
   okunur; serbest metinden stop state cikarilmaz.
3. `follow-up` devam topic'i, `fork` alternatif topic'i acmak icindir; parent
   topic mutate edilmez.
4. `conclude`, consensus/disagreement/open-questions output scaffold'larini
   olusturur; PM veya Docman hidden mutation yapmaz.

Session-bound discuss:

1. `discuss start --session <collab-session-id>`, aktif collab session altinda
   topic yaratir ve topic frontmatter'ina `sessionLocalId/sessionPath` yazar.
2. Session-bound `turn`, `wait`, ve `conclude` komutlari `--session` guard'i
   ister; standalone topic'ler `--session` reddeder.
3. `discuss conclude --session`, aktif collab ledger'a idempotent
   `kind=decision` event yazar; collab session'i kapatmaz.
4. `collab close`, aktif bound discussion topic varken default-block eder.
5. `discuss follow-up --session` ve `collab start --from-discuss
   --bind-discuss-back` opt-in baglama/devam yuzeyleridir; yeni PM/Docman hidden
   mutation yazmaz.

Collab modeli:

1. Collab session append-only coordination ledger'idir; ikinci task sistemi
   degildir.
2. Planning truth `projectman` tarafindadir; objection once PM issue, sonra
   collab event olarak yazilir.
3. Timeline, channel, state ve projection-state dosyalari derived/read-only
   projection'dir; canonical kaynak `events/*.md`, `chat/messages/*.md` ve
   `chat/acks/**` dosyalaridir.
4. Presence degerleri `live`, `deferred`, `reviewing`, `released`tir.
   `released` agent-local loop cikisidir; session terminal state degildir.
5. `collab report --target docman --apply`, explicit Docman write istisnasidir;
   bunun disinda collab loop'lari otomatik server sync veya Docman mutation
   yapmaz.

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

## 8. Coordination semantics

`discuss` ve `collab` icin operasyonel disiplin. Skiller bu bolumlere referans verir; deep mechanics burada.

### 8.1 Channels and listeners

`collab event`, `collab chat`, ve `discuss turn` kardes write yuzeyleri. `collab wait`, `collab chat listen`, ve `discuss wait` kardes read yuzeyleri. Bir read yuzeyinde wakeup almak, digerinde wakeup almayi garanti etmez. Misaligned writer/listener pair'leri sessiz collab traffic'in en yaygin sebebi.

| Write surface | Wakes `collab wait` | Wakes `chat listen` | Wakes `discuss wait` |
|---------------|---------------------|---------------------|----------------------|
| `collab event` | yes | no | no |
| `collab chat send/reply` | partial (mirror) | yes | no |
| `operator-directive` | yes (until ACK) | yes (auto-mirror) | no |
| `discuss turn` | no | no | yes |

Routing kurallari:

1. Her structured deliverable'i (`review-result`, `handoff`, `decision`, `feedback`, `reconcile-snapshot`) bir `collab chat send/reply` ile esle. Event canonical kayit; chat wakeup signal.
2. Recipient listener mode'u bilinmiyorsa **iki yuzeyi de yaz** (event + chat). Ucuz sigortadir.
3. `collab listen` aktif collab session'lar icin tercih edilen tek listener; event/chat/directive wakeup'larini birlestirir. `collab wait` ve `chat listen` legacy/specialized fallback'tir; sadece aggregated listen yoksa veya tek-kanal audit gerekiyorsa parallel kullan.
4. `targetAgent` (event) ve `to` array (chat) routing primitive. `operator-directive` event'leri otomatik chat-mirror yapar; diger event kindleri yapmaz.

### 8.2 Choosing event vs chat

Durable ledger kaydi olan her sey **structured event**: `review-result`, `handoff`, `decision`, `status`, `feedback`, `reconcile-snapshot`, `directive-ack`, `agent-context-prep`, summary, ve substantive review pushback. Her event'i kisa bir chat ping ile esle.

Sadece chat: transient noise (kisa ack/nudge/clarification). Session truth'unu degistiren konusmalar bir periyodik `status` veya `handoff` event'inde ozetlenmeli ki timeline substance'i koruyor olsun.

Kararsizsan: event yaz. §11 anti-pattern 6 inverse'i (event without chat) kapsar; symmetrik anti-pattern (chat-only substantive coordination) §11 anti-pattern 17.

### 8.3 Loop discipline ve exit codes

Long wait'lar host shell foreground'unu operator-facing session'da kilitlemesin. Background log kullan loop'lar agent turn'u disinda persist etmesi gerekiyorsa.

Exit code matrisi:

| Exit code | Anlami | Aksiyon |
|-----------|--------|---------|
| `0` | actionable work available | structured `lifecycleState`/digest oku, **tek** response/aksiyon yaz |
| `20` | operator question or blocker | dur ve raporla |
| `21` | terminal/conclude/abandon boundary | dur ve raporla |
| `22` | timeout | raporla, operator stop demediyse devam et |
| `23` | agent released from collab presence | agent-local loop'u durdur |

Self-wakeup notu: `outcome=work-ready` ile `wakeSource=chat` ama listener'in `lastSeenSeq`'inden yuksek yeni mesaj yoksa, wakeup buyuk olasilikla **kendi yazdigin mesajdan** geldi (listener herhangi bir chat append'te tetiklenir, kendi yazimin dahil). `collab chat ack` ile unread mesaja, ya da `collab chat status` ile `lastSeenSeq`'i ilerlet, sonra listener'i re-arm et. Counterpart traffic'i olarak yorumlama.

### 8.4 Mid-session mutual-idle escape

Iki agent ardisik bounded listener cycle'inda sadece stale presence change, self-echo, already-handled message, veya counterpart work olmadan timeout uretiyorsa: stale listener cycle'i bitir ve content'i `still-waiting-on:<agent>` ile baslayan bir `status` event yaz. Counterpart chat'i izliyor olabilirse kisa bir chat ping ile esle. Bu mutual idle'i kirar; agent'i release etmez, session'i durdurmaz, gelecekteki listening'i bitirmez.

Kurallar:

1. Iki stale cycle'dan sonra her iki agent'i da listener'da tutma.
2. `still-waiting-on:` event beklenen agent'i, beklenen artifact'i, ve primary agent'in operator-approved timeout ile devam edip etmeyecegini named.
3. `still-waiting-on:` yazdiktan sonra `collab listen` re-arm et veya `collab status`/`digest` ile peer'in idle olduguna karar ver.

### 8.5 Directive ACK obligation

Agent'a target edilen her `operator-directive` event `aops-cli collab ack-directive --directive <event-id>` ile acknowledge edilmeli. ACK yazilmadan `collab wait --for <agent>` her loop'ta `outcome=work-ready, exitCode=0` doner — wakeup "yeni content geldi" degil, "ACK edilecek directive var" sinyalidir.

Directive wake-up icin response sequence:

1. Directive `content` field'ini oku.
2. Istenen aksiyonu yap, ya da explicit refuse karari ver.
3. Aksiyon sonucunu yaz (event veya chat) eger uygulanabilirse.
4. `aops-cli collab ack-directive --session <id> --agent <agent> --directive <event-id> --text "<short ack>" --apply --json` ile pending state'i temizle.

ACK'i sadece directive zaten final close hand-off ise (ornegin `release` directive) atla; o durumda close action ACK'i kapsar.

### 8.6 Review-request reply pairing

`review-request` icin structured deliverable: `review-result` event. `--reply-to <review-request-event-id>` ve `--review-scope <scope>` ile yazilmali. Bu event canonical kayit ve `collab report --target docman` tarafindan picked up.

Event tek basina chat listener'i wake etmez. Her zaman event'i kisa bir chat reply ile esle: event id, bir satir gist, ve varsa ask-back.

```bash
aops-cli collab event --session <id> --agent <reviewer> \
  --kind review-result --reply-to <review-request-id> \
  --review-scope <scope> --from-file ./review.md --apply --json

aops-cli collab chat reply --session <id> --agent <reviewer> \
  --reply-to <directive-or-review-chat-id> \
  --text "Review filed at event seq <N> (id <event-id>). TL;DR: ..." \
  --apply --json
```

Operator review-request'i sadece chat uzerinden yonlendirdiyse chat answer tek basina kabul edilir; operator sonradan structured event'e promote edebilir. Recipient listener mode'u bilinmiyorsa default iki yuzeyi de yaz.

### 8.7 Rapid multi-slice listening

Hizli hareket eden review session'lar icin her listener wakeup'i tek-kullanimlik signal olarak ele al. Her handled review-request, review-result, status, veya chat message'dan sonra hemen aggregated listener'i re-arm et veya `collab status`/`collab digest` calistir session'in idle olduguna karar vermeden once. Structured review event'leri chat ping ile esle ki cross-slice traffic her iki listener mode'una gorunur olsun.

Kurallar:

1. Stale single-shot background listener'a baska bir slice icin wakeup veya timeout urettikten sonra guvenme.
2. Birden fazla slice hizli ilerliyorsa: kisa bounded `collab listen` loop'lari ve her handled item'dan sonra re-arm.

## 9. Closeout

### 9.1 Closeout peer handoff

`collab close`'dan once primary agent baska bir participant hala live veya sonradan review yapacaksa explicit peer handoff yazar.

```bash
aops-cli collab event --session <session-id> --agent <primary> \
  --kind handoff --text "<commits; verification; open issues/feedback; next listener or release state>" \
  --apply --json
```

Kurallar:

1. Handoff: commit veya canonical hosted version, validation run, open issue/feedback, ve peer'in keep listening / specific event review / released state'inden hangisinde olacagini named.
2. Handoff event'i bir chat ping ile esle ki hem event hem chat listener closeout state'i gorsun.

### 9.2 Work-end closeout sequence

Bu sequence sadece tracked work window genuinely sona eriyorsa kullan. Mid-session checkpoint, active review slice, veya carry-forward icin calistirma.

Required checkpoint'lar:

1. Implementation artifact'i finalize et: local source change'leri commit et veya canonical hosted version'i publish et, sonra agreed validation'i calistir.
2. Peer handoff event'ini ve paired chat ping'i yaz (yukaridaki §9.1).
3. Active PM subject icin durable planning memory yaz veya refresh et eger sonraki agent task veya sprint'ten devam edecekse. Sonraki checkpoint `pm board closeout` kullaniyorsa, onun closeout memory'si board-level closeout memory gereksinimini karsilar.
4. Collab close'dan once Projectman state'i transition et. Active sprint completed isaretlenecekse `aops-cli pm sprint set-status --id <sprint-id> --status completed --apply --json` calistir veya sprint status change'in neden atlandigini kaydet. Sonra board closeout:

   ```bash
   aops-cli pm board closeout --board <board-slug> \
     --content "<work-end summary; validation; next action>" \
     --apply --json
   ```

   Bu komut atomic board-window close: closeout memory yazar, active kanban task'i Done'a (progress=100) tasir, active board ref'leri temizler.
5. Projectman state transition edildikten sonra collab session'i kapat: `aops-cli collab close --session <session-id> --enforce-reconcile --text "<closeout>" --apply --json`.
6. §9.3 post-collab memory closeout'u yaz: session uid, material PM record'lari, ve residual carry-forward'i link.

Kurallar:

1. Collab komutlari Projectman state'i mutate etmez; task, sprint, board, issue, feedback lifecycle change'leri icin explicit `aops-cli pm` komutlari kullan.
2. Board kickoff veya active board window kullanildiysa true work-end'de `pm board closeout`'u atlamayin.

### 9.3 Post-collab memory closeout

`collab close`'dan sonra durable takeaway'i ve closed session/resolved issue'lara link'i yakalayan bir memory record yaz. Session ledger close oldugunda archaeology'e doner; memory bridge'dir gelecek agent'lar durable decision'dan resume etmesi icin (timeline'i full okumak yerine).

```bash
aops-cli mem write \
  --mode closeout \
  --subject project \
  --durability durable \
  --kind decision \
  --content "<one-paragraph durable summary>" \
  --issue-id <id1> --issue-id <id2> \
  --source-ref '{"type":"agentspace.collab-session","id":"<session-uid>","title":"<title>"}' \
  --purpose carry-forward \
  --apply --json
```

Kurallar:

1. Collab session uid'sini `--source-ref` ile referansla; gelecek agent'lar timeline yerine durable decision'dan resume edebilsin.
2. Material issue id'lerini `--issue-id` ile link'le; memory finished collab'dan residual PM work'e kopru olur.
3. Canonical post-collab summary icin `--mode closeout` + `--durability durable` kullan. `--durability sticky` sadece tum gelecek session'lara uygulanmasi gereken kurallar icin; session-specific takeaway'ler degil.
4. Closeout memory'i `collab close --text "<closeout>"` ile esle. Closeout text memory id'sini named, memory session uid'sini named. Iki yonlu link kasitli.

## 10. PM integration

### 10.1 Promoting review items to Projectman issues

`collab event --kind review-result` review'in canonical kaydidir; review icindeki actionable item'lar collab ledger disinda track etmek daha kolay. `review-result` dosyalandiktan sonra her material item'i bir `projectman.issue`'a promote et ki progress session lifecycle'i disinda survive etsin ve collab timeline'dan bagimsiz calisilabilsin.

```bash
aops-cli pm issue create \
  --title "<review-scope> §<n>: <one-line summary>" \
  --description "<detail referencing collab event seq #<n>>" \
  --status open --severity <info|low|medium|high> --source review \
  --tag review-<scope> --tag <area> \
  --apply --json
```

Kurallar:

1. Her issue body source `collab event seq #<n>` ve review scope'u referansla; canonical context'e link sonradan da survive etsin.
2. Ayni review'den gelen her issue'yu `review-<scope>` shared tag ile tag'le; sonradan listing filterable olsun.
3. Issue'lar dosyalandiktan sonra yeni issue id'lerini ve review scope'unu named tek bir kisa chat ping at. Implementing agent ve operator full review event'i tekrar okumadan issue listesini alir.
4. Issue resolution `pm issue update --status` veya referenced PR work olarak land eder; collab ledger her issue progress'ini mirror etmek zorunda degil. Shared `review-<scope>` tag'i + `pm issue list` canonical progress view.
5. Bazi CLI versiyonlarinda `pm issue create --preview` record persist edebilir; preview'i dry-run olarak kullanmak yerine final komutu construct edip dogrudan `--apply` ile calistir.

Implementing ve reviewing agent review-derived issue set'inin closed olduguna karar verirse, collab session `collab close --enforce-reconcile` ile kapatilabilir. Close session icin tagli PM issue'lar hala open ve explicit carry-forward edilmediyse block eder.

## 11. Anti-patterns appendix

Aileler halinde grupland:

### Messaging anti-patterns

1. Recipient listener mode'u bilinmedigi durumda paired chat ping'i olmayan structured event yazmak.
2. Substantive coordination'u (review pushback, decision summary, handoff signal, status update) sadece chat'te yapmak, paired structured event olmadan. Chat wakeup signal; event canonical record. Bunlar §8 anti-pattern 6 ve §11 messaging-2 olarak ayri ayri ele alinmis.

### Boundary anti-patterns

3. Chat/discuss text'inden Projectman veya Docman'i implicit mutate etmek.
4. Active bound discussion topic varken collab session kapatmak.
5. `timeline.md`, `channel.md`, ya da `state.md`'yi writable truth olarak ele almak.
6. Stop condition'i serbest metinden cikarmak (structured `lifecycleState`/`exitCode` yerine).

### Listener discipline anti-patterns

7. Wait/listen exit'i 0 dondurdukten sonra **stale** single-shot background listener'a yeni traffic icin guvenmek.
8. `collab listen` mevcutken default olarak legacy split listener'lari (`wait + chat listen`) kullanmak.
9. `still-waiting-on:` yazdiktan sonra permanent stop olarak yorumlamak yerine listener'i re-arm etmek.

### Directive ve review anti-patterns

10. Content'i handle ettikten sonra `operator-directive`'i un-ACK birakmak — pending state her `collab wait`'i no-new-traffic noisy `work-ready` wakeup'a cevirir.
11. Counterpart'i sadece primary agent'in finished plan'ini review etmeye cagirmak, operator deliberation istediginde. Once independent research, sonra plan compare ve converge.
12. Bounded wait timeout etmeden ve operator'a "plan o response olmadan ilerliyor" denmeden counterpart'in structured event'ini okumadan architectural plan'i finalize etmek.

### Lifecycle anti-patterns

13. Session uid ve material decision/issue'lara reference yapan memory record olmadan collab session'i kapatmak. Timeline tek basina archaeology durable summary olmadan.
14. Review item'lari sadece collab event olarak track etmek; actionable item'lar `pm issue`'da da olmali ki progress session ledger disinda survive etsin.
15. Board kickoff veya active board window kullanildiktan sonra true work-end'de `pm board closeout`'u atlamak.
16. Discuss/collab plan veya slice artifact'ini default olarak repo `docs/**`, `.codex-tmp/**`, ya da non-AOPS folder'a tasimak. Discuss output, collab event/resource, ya da explicit Agentspace artifact/resource ref olarak tut, operator dis-doc istemediyse.

### Raporlama anti-patterns

17. Raw chat transcript'i Docman raporlarina yazmak (summary/ref section'lari yerine).
18. Live participant varken peer handoff event ve paired chat ping olmadan session kapatmak.

## 12. Troubleshooting

### Listener her loop'ta `work-ready` donuyor ama yeni mesaj yok

Probable cause: pending un-ACK'd `operator-directive`. `collab wait`/`listen` ACK edilmemis directive varken sessizce her loop'ta wake olur.

Cozum: directive'i bul ve ACK et — §8.5.

### `wakeSource=chat` ama yeni mesaj gormiyorum

Probable cause: kendi yaziman self-wakeup. Listener kendi append'inde de tetiklenir.

Cozum: `collab chat status --for <agent>` ile `lastSeenSeq`'i kontrol et; gerekirse `chat ack` ile unread mesaja ack at, sonra listener re-arm — §8.3.

### Iki agent da listener'da, hicbir traffic gelmiyor

Probable cause: mutual idle. Her ikisi de oburunu bekliyor.

Cozum: 2 stale cycle sonra `still-waiting-on:<agent>` status event yaz, listener re-arm et — §8.4.

### `collab close` block ediyor

Probable cause: aktif bound discussion topic var, ya da open in-session PM issue var (carry-forward edilmedi), ya da peer handoff yazilmadi (live participant var).

Cozum:
1. `discuss list --scope session-bound --session <id>` ile bound topic'leri kontrol et — varsa conclude et.
2. `pm issue list` ile session'a tagli open issue'lari kontrol et — close veya carry-forward et.
3. §9.1 peer handoff event'i yaz.

### Skill veya user guide'da arama

Tum dosyayi linear okumak yerine docman tools'unu kullan:

```bash
aops-cli docman index --slug agentspace --json
aops-cli docman outline --slug agentspace --json
aops-cli docman search --slug agentspace --q "<keyword>" --json
```

Pointer: deep semantic gerektiginde docman search direct section'i bulur; full guide okumadan answer'a goturur.

### Daha fazla detay

Her komut icin authoritative source `aops-cli <subcommand> --help`'tir. Skill text'i pattern ve workflow guide'idir; flag/exit-code/argument detayi her zaman `--help`'den dogrulan.
