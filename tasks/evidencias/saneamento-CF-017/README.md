# CF-017 — saneamento local de preflight e restore

Candidato do executor iniciado em14/10 e finalizado em15/10/2026. **Em revisão,
sem autoaprovação de RV17-01/02 ou liberação da CF-029.** Somente PostgreSQL
descartável; nenhuma adoção real, implementação de onboarding, push ou deploy.

## Base e preservação

Entrada: `codex/cf014-historico-invisivel`, HEAD
`4206d881cc06bec1e8d80807dfb673d35f52937c`, exatamente o aceite informado.
Staging vazio; um worktree, o checkout atual; única alteração preexistente:
`README.md` da raiz. Branch específica criada a partir desse HEAD:
`codex/cf017-preflight-restore`. Não houve reset/rebase/merge, checkout forçado,
remoção de branches, clean ou uso de main desatualizada.

SHA-256 do README inicial e reconferido:
`6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA`.
Ele permanece fora dos commits. [Hashes originais](original-hashes.txt) preservam
os pareceres independentes, helpers, fixture manuscrita e V1–V14. Migrações,
pom/configuração Flyway/Hibernate e fixture original não foram alterados.

Commits locais de código: `eb67701` (preflight/inventário V1 e suporte descartável)
e `36cf9b4` (oracle/CLI e adversariais integrados). A documentação/evidência segue
em commit próprio. Intervalo completo de revisão:
`4206d88..codex/cf017-preflight-restore`; árvore de código testada corresponde a
`36cf9b4`. O commit de documentação não muda a implementação testada.

## Causas e correções

| Achado | Antes, reproduzido nesta base | Candidato |
|---|---|---|
| RV17-01 | Helper verificava tabelas e poucas colunas; remoção de accounts_user_id_fkey não lançava erro | Inventário semântico congelado da V1, CLI read-only, adicionais classificados, exits0/2/3; initializer usa o mesmo gate antes da baseline |
| RV17-02 | Fingerprint de contagens/somas não mudava ao alterar created_at em1µs | Snapshot de todas as linhas/campos, PK/multiconjunto, catálogo, sequences e history; dump custom e restauração em database novo |

[Matriz completa, política de adicionais e representação canônica](MATRIZ.md).
O inventário vem da V1 versionada; entidades atuais representam V14 e não são oracle
de adoção. O trabalho não precisa de nova migration. SQL/JDBC operacional está em
`src/main/java/.../infra/migration` e recursos `db/verification`, fora de `src/test`;
essa extensão de escopo fornece o artefato operacional exigido pelo achado, sem
bootstrap Spring nem mudanças em serviços financeiros/endpoints.

As primeiras reproduções tiveram **3 testes: 1 passou e 2 falharam pelo defeito**,
sem erros de ambiente. Os mesmos critérios passaram depois. A reprodução independente
original de2026-09-22 foi temporária e removida naquela revisão; seus documentos,
hashes e critérios foram preservados, sem alegar posse da fonte original.

## Evidências e validação

* [Execuções e comandos](EXECUCOES.md): vermelho original, falha intermediária de
  catálogo, correção justificada e seleção final dirigida.
* [Log original](original-red.log): fixture compatível, FK ausente aceita e oracle
  cego à alteração bruta, com 2 assertions falhando como esperado antes da correção.
* [Primeiro restore reprovado](restore-first.log) e [diagnóstico](restore-diagnostic.log):
  casts de array de enums foram decompilados de outra forma após pg_dump/reparse.
  [Catálogo anterior](restore-catalog-before.txt) e [restaurado](restore-catalog-after.txt)
  foram mantidos; normalização limitada documentada na matriz, sem mudar dados.
* [Validação integrada anterior](final-verify.log): 70 testes passaram, incluindo
  V1–V14, Hibernate validate, checksum, falha/recuperação e compatibilidade temporal.
* [Validação final completa](final-complete-verify.log): inclui também a prova de
  erro de restore com rollback de DDL parcial, checksums/tamanho dos dumps e
  preservação de snapshots da contraprova de troca de valores. **71 testes, zero
  falhas/erros/skips; verify e repackage aprovados.**
* [Hashes da comparação final](restore-proof-hashes.json): 34 arquivos de cada
  snapshot, todos idênticos (31 tabelas, catálogo, sequences e marcador COMPLETE).
  Diretórios `snapshot-before/` e `snapshot-final/` preservam o resultado integral
  sintético após a contraprova, com hashes por chave/campo em vez de valores.
* [Build operacional](cli-build.log) e [comparação pelo CLI](cli-compare.log):
  comando do runbook executado; exit0, `RESTORE=EQUIVALENT`, sem acesso a banco.
* [Preservação](preservation-check.json): 18 arquivos originais (14 migrations,
  fixture V1 e3 documentos da revisão independente) com hashes inalterados.

O ensaio cobre restore V1 e V14; troca de valores mantém soma30,03 mas é detectada
por linha; detecta bruto/proveniência/null, relacionamento, saldo, microssegundo de
instante conhecido, CHECK ausente/alterado/NOT VALID, índice, history e sequence.
Cada contraprova restaura novamente em outro destino novo e exige comparação final
íntegra. Falha no restore tem exit não zero e transação reverte a criação parcial.

Snapshots exportados mantêm captura/dump na mesma visão MVCC, inclusive perante
commit posterior controlado. Sequences requerem freeze próprio: não são MVCC.
Captura faz streaming; custo de ordenação e disco é explícito. Não há estimativa
de latência/volume de produção nem certificação de ACL/roles/cluster. Fixture
representa campos financeiros/temporais e relações, não população de produção
nem todos os estados de negócio nas tabelas que permanecem vazias.

## Estados e revisão

A. Preflight local e B. restore local: candidato implementado, testes do executor;
aceite independente pendente. C. adoção real: não autorizada/não comprovada.
CF-017 e P01/P02 mantidas em_revisao; CF-029 permanece proposta.

[Encaminhamento, critérios de encerramento, custos e CF-017→CF-029](ENCAMINHAMENTO.md).
[Runbook vigente](../CF-017/ROLLOUT-LEGADO.md), agora até V14. CF-023 e CF-028
conservam aceites próprios; CF-014 concluída e CF-015/zoom/RVA-03 não foram reabertos.

Referências técnicas de consistência: [pg_dump16 e snapshot compartilhado](https://www.postgresql.org/docs/16/app-pgdump.html),
[exportação/importação de snapshots](https://www.postgresql.org/docs/16/functions-admin.html).
Essas referências explicam o mecanismo; os logs locais comprovam o ensaio executado.
