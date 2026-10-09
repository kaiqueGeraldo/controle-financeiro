# Saneamento restrito RD58-01 / RD58-02 — 08–09/10/2026

Candidato para **revalidação independente**, sem autoaprovação. CF-005 e CF-006
permanecem `em_revisao`. CF-007/008, CF-009/RV24-01 e os aceites financeiros
existentes permanecem preservados no escopo de seus pareceres. CF-028 não iniciada.

## Base e preservação

Branch `main`, base `18cd6df231b01f27abbab61f95c6b1f377adc468`, staging vazio.
`15746d0` e `18cd6df` são ancestrais; nenhum commit posterior ao parecer na entrada.
Único delta inicial: README raiz, SHA256
`6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA`.
[Baseline durável](baseline.json). README excluído dos commits. Instruções AGENTS
fornecidas na conversa; busca na árvore e ancestrais não encontrou outro arquivo.
Nenhum clean/reset, push, deploy, banco real, inventário remoto ou alteração dos
pareceres/provas independentes. Evidências nesta pasta, fora de target.

Lidos tarefas/README, EXECUCAO, POLITICA-DE-TESTES, CF-004/005/006, SPEC-002,
CT-10/E11, parecer completo/matriz/execuções/achados CF-005–008 (incluindo aceites
locais CF-007/008), CF-017 e derivada P01/P02. Não foi assumido aceite por ancestralidade.

## RD58-01 — causa e correção

`useAnnualSummary` inicializava `year` com `productDateString`: relógio do cliente,
mas calendário de São Paulo. SPEC-002 DEC-01 exige o **ano do navegador** para esse
seletor; o default backend sem query usa anoProduto. O item 4 do pedido mencionava
produto, em conflito com contrato/parecer/prova. A divergência foi apresentada ao
usuário, que orientou seguir a opção mais correta; foi anunciada a escolha do
contrato vigente, sem alterar regra nem expected independente.

Inicializador lazy agora usa `new Date().getFullYear()`. Não há offset manual,
efeito que sobrescreva escolha, novo timer ou consulta. O mesmo `year` continua
alimentando consulta, cache e chave do rascunho. Refresh consulta a seleção atual;
desmontar/reabrir captura novamente o ano. Não há ação de reset no hook/tela.
Botões anterior/seguinte continuam escolhas explícitas. A tela começa em loading,
sem renderizar ano durante SSR/primeira hidratação; a consulta parte do efeito no
cliente. Não foi introduzida renderização alternativa.

`rd58-annual-year.test.tsx`: UTC em `2027-01-01T01:00Z` e Kiritimati em
`2026-12-31T12:00Z` esperam 2027 (produto 2026); Los Angeles em
`2027-01-01T04:00Z` espera 2026 (produto 2027); São Paulo nesse instante espera
2027; UTC em `2026-06-15T12:00Z` espera 2026. Verifica ano efetivamente consultado,
escolha 2024, rascunho, refresh após virada e reabertura em 2028. Relógio fixo,
sem dependência da data real. Complexidade O(1), lifecycle/cache existentes mantidos.

## RD58-02 — causa, writers e contrato de saída

`GoalHistory.date` é **registro de auditoria**, não `GoalDepositDTO.time` nem dia
clicado no hábito. Antes: Clock de produto → LocalDateTime → PostgreSQL timestamp
without time zone → entidade exposta pelo controller → new Date/toLocale no browser.
O descarte da zona impedia identificar o instante; o consumidor omitia incerteza.

Writers reais examinados/corrigidos:

| Evento | Writer | Captura/efeitos |
|---|---|---|
| Progresso numérico / aporte monetário | GoalService.addValue | ZonedDateTime capturado uma vez; histórico e evento usam a mesma captura |
| Ajustar destinação | GoalService.setAllocation → recordAllocationChange | Uma captura por operação, reutilizada no histórico e ano do evento |
| Mover destinação | GoalService.moveAllocation → recordAllocationChange | Mesma captura, sem novo lock/transação |
| Marcar hábito vinculado | HabitService.toggleHabit → addContribution | ZonedDateTime preserva instante; dia explícito do hábito continua civil |

Desmarcar hábito/excluir histórico removem a contribuição existente; não são
writers de um novo timestamp. Compra/estorno usa histórico próprio de compra;
não foi alterado. Clock/ZoneId de TemporalConfig permanece America/Sao_Paulo.

V14 adiciona somente `goal_history.recorded_at timestamp(6) with time zone`, nullable,
sem default/backfill. Era indispensável porque `date` não prova origem e deve ser
preservada. Migrações anteriores intactas. `recordAt(ZonedDateTime)` registra
Instant real e mantém o alias local, truncando a captura interna para microssegundos
antes do INSERT. Isso não normaliza entrada de usuário; não se recebe auditoria
no request. `recorded_at` é imutável no update ORM.

`GoalHistoryResponseDTO` substitui a exposição direta da entidade neste GET:

- Novo: `date` e `recordedAt` em UTC Z; `dateOrigin=SERVER_CLOCK`.
- Legado: `recordedAt=null`, `dateOrigin=UNKNOWN`, `date` local/null e
  `legacyDateRaw` preservam o valor original. Nenhum fuso é inferido.
- `legacyDateRaw` também acompanha novos registros como alias de compatibilidade.
  O discriminante deriva da coluna de auditoria explícita, não da aparência de date.
- POST deposit mantém resposta vazia existente; a primeira representação é o GET.
  Os GETs posteriores devolvem o mesmo instante persistido.

Cadeia cliente: BFF genérico → goalService.getHistory → useGoals → GoalDetails.
A lista de metas usa GoalResponseDTO, sem histórico embutido; a lista de eventos
fica no detalhe. `goalHistoryTimeLabel` na fronteira de serviços exige metadado
SERVER_CLOCK e recordedAt válido, apresenta conhecido em America/Sao_Paulo e
legado literal com “Fuso desconhecido”. Offset no alias sozinho não prova origem.
Null vira “Data indisponível — Fuso desconhecido”. O bruto permanece no DTO; segundos
e fração legados são conservados quando presentes. Reload/reabertura usa a mesma regra.

Trade-offs: uma coluna nullable e DTO/adaptador de compatibilidade exigem rollout
coordenado; eliminam conversão especulativa. Mapeamento e render são O(n), sem acesso
às relações lazy por item e sem N+1 adicional. Consultas, ordenação local legada,
locks, isolamento e transações financeiras permanecem existentes. A ordenação por
date não passa a alegar cronologia global de instantes desconhecidos. Nenhum índice
novo ou benchmark de desempenho foi necessário para este acréscimo escalar.

## Provas independentes preservadas

Três provas em **dois arquivos**; hashes por arquivo cobrem integralmente cada caso:

| Prova | Entrada e esperado | Antes | Depois |
|---|---|---|---|
| RD58-01, directed-temporal-review.test.tsx | UTC, 2027-01-01T01:00Z; ano 2027 | Recebido 2026 | 2027 |
| RD58-02 frontend, mesmo arquivo | Legado 2026-09-07T23:30:00; Fuso desconhecido | Rótulo ausente | Rótulo presente |
| DirectedGoalHistoryTemporalTest.java | Clock SP 2026-09-08T03:10Z; time informado 08:15; POST/commit/GET/SQL | date HTTP 00:10 sem offset | date HTTP 03:10Z |

SHA256 frontend: `B9E85B026B60140F900A72E7AE22E0BB8E73433FA64BD5DA7BE00DF36D03371A`.
SHA256 backend: `F21E74ABFA5B3D6824543498D0E49140EA4603536A29A77FE2062D0C31C136D6`.
Assertions, entradas e expected originais intactos. O controle original de seleção
explícita passou antes e depois. Não houve mutação na árvore principal. A reprodução
causal no candidato original já detecta os três retornos ao defeito; não foi
necessário fabricar contraprova isolada adicional para essas mesmas regressões.

## Integração e limites

GoalHistoryRecordedInstantIntegrationTest usa Flyway + Hibernate validate em
PostgreSQL 16 descartável. Cobre cinco gravações (os dois tipos de aporte, ajuste,
movimentação e hábito), SQL, GET via MockMvc real, novo GET, microssegundos e
legado/null inseridos por SQL independente. Usa defaults JVM UTC/SP/Kiritimati
dentro do teste, restaurados ao final, com Clock fixo de produto. Falha de INSERT
de histórico por trigger verifica rollback do progresso/destinação; os testes
existentes de hábitos também verificam rollback e concorrência.

GoalHistoryUpgradeTest aplica até V13, insere fixture SQL independente, aplica V14,
confronta PK/relação/amount/note/date bruto e null, tipo/precisão/default ausente e
reaplicação sem alterações. Suítes existentes de banco vazio/legado/checksum/
falha-recuperação foram mantidas; suas contagens explícitas aumentaram pela V14,
sem remover assertions. Nenhuma evidência sintética certifica Railway.

UI comprovada por componentes reais em UTC/SP/Kiritimati, incluindo desmontagem e
reabertura com payload serializado; não é jornada de navegador/BFF integrada nova.
O fluxo HTTP/SQL e a apresentação estão comprovados em camadas distintas. Não houve
mudança no transporte ou lifecycle que exigisse repetir o E2E geral CF-007. Limites
de browser real, visual responsivo e adoção permanecem explícitos.

Antes de adoção real: inventário do schema/proveniência, backup/restore, compatibilidade
e coordenação de writers/clientes sob CF-017. Aplicar V14 antes de ativar writer novo;
não executar binário que espera a coluna antes da migração. Writers antigos não
produzem recordedAt e suas linhas continuam desconhecidas. Não apagar a coluna após
escritas novas como rollback; suspender escrita e usar versão compatível/correção
progressiva. Nenhuma migração remota autorizada ou executada.

Comandos, resultados e ocorrências: [EXECUCOES.md](EXECUCOES.md).
Entrega ao revisor: [ENCAMINHAMENTO.md](ENCAMINHAMENTO.md).
