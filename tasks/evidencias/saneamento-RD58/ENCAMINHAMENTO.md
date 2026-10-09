# Encaminhamento à revisão independente CF-005–008

Solicita-se revalidar **somente RD58-01/RD58-02** e decidir seus efeitos nas
obrigações pendentes de CF-005/006. Esta entrega não aprova o próprio saneamento.
CF-005/006 continuam em_revisao; CF-007/008 e CF-009/RV24-01 preservam seus aceites.

## Base, commits e intervalo

- Base da entrega: `18cd6df231b01f27abbab61f95c6b1f377adc468`.
- Provas independentes: commit `15746d0`, parecer `18cd6df`.
- RD58-01: `b685ef953f050ecb3124034b3ac909261e4c3173`.
- RD58-02: `ead4323df8dcc49e9dab522e2c920bb4f0e4ab72`.
- Intervalo de código/testes: `18cd6df..ead4323`.
- Intervalo **completo**: `18cd6df..HEAD` da entrega, incluindo o commit documental
  que contém este encaminhamento. O hash final é informado no chat após criá-lo,
  evitando autorreferência de hash no próprio commit. Nenhum commit reescrito.

Arquivos de código/teste alterados (16):

| Camada | Arquivos relativos à respectiva camada |
|---|---|
| frontend | src/hooks/useAnnualSummary.ts; tests/component/rd58-annual-year.test.tsx |
| frontend | src/components/screens/goals/goalDetails.tsx; src/services/temporal.ts; src/types/index.ts; tests/component/rd58-history.test.tsx |
| backend | src/main/java/com/controlefinanceiro/api/controller/GoalController.java |
| backend | src/main/java/com/controlefinanceiro/api/domain/goal/GoalHistory.java; domain/goal/dto/GoalHistoryResponseDTO.java (mesmo prefixo Java) |
| backend | src/main/java/com/controlefinanceiro/api/service/GoalService.java; service/HabitService.java (mesmo prefixo Java) |
| backend | src/main/resources/db/migration/V14__goal_history_recorded_instant.sql |
| backend | src/test/java/com/controlefinanceiro/api/GoalHistoryRecordedInstantIntegrationTest.java |
| backend | src/test/java/com/controlefinanceiro/api/migration/GoalHistoryUpgradeTest.java; migration/EmptyDatabaseMigrationIntegrationTest.java; migration/LegacyDatabaseMigrationIntegrationTest.java (mesmo prefixo Java) |

Documentação: notas em tasks/01-datas-integracao/CF-005-datas-frontend.md e
CF-006-datas-backend.md; esta pasta de evidências. Lista canônica exata e hashes
de código: `source-manifest.json`. README raiz permanece fora dos commits.

## Provas e resultados

Três provas originais, sem alteração:

1. RD58-01 em directed-temporal-review.test.tsx: UTC em2027-01-01T01:00Z,
   expected2027; antes2026, depois2027.
2. RD58-02 no mesmo arquivo: legado2026-09-07T23:30:00; antes sem rótulo,
   depois “Fuso desconhecido”. Hash de ambos os casos, por arquivo:
   `B9E85B026B60140F900A72E7AE22E0BB8E73433FA64BD5DA7BE00DF36D03371A`.
3. DirectedGoalHistoryTemporalTest.java: Clock2026-09-08T03:10Z emSP,
   POST/commit/GET/SQL; antes00:10 semoffset, depois03:10Z. SHA256:
   `F21E74ABFA5B3D6824543498D0E49140EA4603536A29A77FE2062D0C31C136D6`.

`verification.json`: 76 frontend,111 backend, zero falhas/erros/skips no fechamento;
lint/typecheck e build Next/JAR aprovados. Os logs anteriores com falhas permanecem
publicados e explicados em EXECUCOES.md; não se ocultam falhas de fixture/cache.

Adicionais: cinco fronteiras de ano, query efetiva, seleção/rascunho/refresh/
reabertura; UI emUTC/SP/Kiritimati, offset sem proveniência, null e fração legada;
cinco caminhos de gravação, SQL/GET/reload, precisão de microssegundos, três
defaultsJVM, falha deINSERT e rollback; V13→V14 com fixtureSQL independente,
preservação e reaplicação. Backend usa Postgres16 descartável e, na integração
nova, Flyway/Hibernatevalidate. Não houve novo E2E de navegador/BFF; apresentação
e HTTP/SQL são provas separadas, não declaradas como jornada completa.

## Critérios objetivos a decidir

RD58-01: encerrar somente se o revisor confirmar DEC-01 (ano navegador), origem
lazy correta, consulta no mesmo ano, preservação de escolha/rascunho/refresh e
reabertura, probes intactos e diferenças concretas de calendário nos dois sentidos.
A escolha segue o contrato vigente, após explicitar ao usuário a contradição no
item4 do pedido; nenhuma revisão normativa foi feita.

RD58-02: encerrar somente se confirmar que todos os writers usam captura de Clock
real, recorded_at persiste como timestamptz e sobrevive ao roundtrip; DTO emUTC Z
com metadados; UI emSP; legado bruto/null desconhecido sem backfill; upgrade preserva
dados; falhas preservam atomicidade. Ausência deoffset no alias não é o discriminante.
Examinar os limites de compatibilidade/rollout registrados, sem certificarRailway.

CF-005: decidir saneamento do trabalho original1/3 (consumidores conformes) e sua
relação com a seleção do critério2. Reusar os aceites civis/mensais/M01–M03 da
matriz dirigida; decidir o critério4 de evidências sem generalizar o fechamento.
CF-006: decidir trabalho original1/2 (Clock, registro de metas, serialização real)
contraCT-10/E11, preservando aceites anteriores civis/horário informado/bordas;
decidir critério4 e suficiência do recorte para a tarefa. Verde não é aceite.

CF-017/P01/P02 e RV17-01/02 mantêm adoção real/inventário/backup/restore e coordenação
de versões. Nenhum acesso real, migração remota, push ou deploy. CF-028 não iniciada.
O encaminhamento foi preparado em arquivo, sem mensagem enviada a outro chat.
