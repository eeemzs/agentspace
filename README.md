# Agentspace Domain

`agentspace`, AOPS runtime icinden cikarilacak olan AOPS-native workspace domaininin hedef adidir.

Rol ayrimi:
1. `AOPS` = runtime / host / gateway urunu
2. `agentspace` = prompt, skill, resource, memory, project-summary ve benzeri agent workspace capability'lerini tasiyan domain

Planlanan paketler:
1. `@aopslab/domain-dm-agentspace`
2. `@aopslab/domain-kit-agentspace`
3. `@aopslab/domain-host-plugin-agentspace`
4. `@aopslab/domain-tooling-agentspace`
5. `@aopslab/domain-cli-agentspace`
6. `@aopslab/domain-core-agentspace`
7. `@aopslab/domain-ops-agentspace`
8. `@aopslab/domain-tests-agentspace`

Bu klasor ilk bootstrap fazinda, `fileman` / `projectman` / `docman` pattern'iyle hizali workspace matrix olarak scaffold edilmektedir.

Ana binary ve tool prefix:
1. binary: `agentspace`
2. alternate binary alias: `agentspace-cli`
3. tool prefix: `agentspace.*`

Canonical migration/planning kayitlari:
1. `/Volumes/d/dev-js2/apps/aops/.sprints/2026-03-08-aops-domain-extraction-cli-split-sprint-15.md`
2. `/Volumes/d/dev-js2/domains/agentspace/.sprints/2026-03-08-agentspace-bootstrap-sprint-01.md`

Canonical runtime model:
1. `agentspace`, kendi basina standalone domain + standalone domain CLI modeline sahiptir.
2. `aops-server` icinde host edildiginde dogru model `in-process integrated hosting`tir.
3. Bu, request'in dogrudan canonical `agentspace` host-plugin/kit zincirine gitmesi demektir.
4. `aops-server` app wrapper katmaninda env/bootstrap baglayabilir; fakat `agentspace` ustune AOPS-specific policy/writeback/filter koymak canonical model degildir.
5. `agentspace` icindeki canonical business logic domain package owner'inda kalir; AOPS-specific orchestration gerekiyorsa bu davranis app katmaninda ayri owner olur.
