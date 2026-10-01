# Evidência CF-025 — consultas e desempenho

Implementação local validada em 01/10/2026; encerramento em `em_revisao`, aguardando
execução independente. Base `846c64c8a144f35cb62a7fa30c3bcadbfefad5af`.
Produto/testes no commit `65ec14e`;303 fontes/POM finais conferidos contra esse
commit com normalização LF, conforme checkpoint e comando de comparação.
Codex desta sessão; recomendações de modelo/esforço da tarefa são metadados e
não provocaram troca de modelo ou delegação. Somente CF-025 foi executada.
README raiz preexistente preservado byte a byte, SHA-256
`6235da8e1d2247dad2c585fe7b2e7b0d2fd41f47414a4a2701b20f7fbf7d12ca`.

CF-021 e CF-024 integradas/aceitas no próprio escopo; CF-022 backend DEC-08
aprovado, com browser RJ-022-01 ainda em revisão, conforme [prontidão local](../revisao-CF-024/README.md).
Expected definido em [ORACLES.md](ORACLES.md), a partir de SPEC-004, DEC-08 e
critérios da tarefa, antes da alteração do produto. Não houve mudança de contrato.

## Medição causal

Windows, Temurin21.0.12.1+1, Spring Boot4.0.2/Hibernate do POM, Testcontainers2.0.3,
PostgreSQL16-alpine descartável, Docker Desktop29.6.2. Docker declarou15.853MB de
memória total. CLI usa `-Duser.timezone=UTC`; a aplicação define timezone global
America/Sao_Paulo no bootstrap, mantendo zona de produto São Paulo. Nenhum teste
temporal novo afirma que a JVM permanece UTC depois desse bootstrap.

Cada dataset contém N contas com abertura0/saldo10, N receitas realizadas de10,
N metas numéricas com dois itens, N hábitos com sete logs e três dias específicos.
N=3/30/120; fixtures acumuladas dentro do schema do benchmark totalizam153
recursos por domínio,306 itens,1.071 logs e459 dias. Um usuário por tamanho;
IDs/schema aleatórios, cardinalidades/valores/ordem de comandos determinísticos.
Teste de posse cria principal extra com dados na mesma tabela. Cartões,
investimentos e respectivas operações **não são populados pelo benchmark**;
os seus ramos de agregado foram capturados, mas não representam carga de volume.

Serviços/proxies, ORM, FlywayV1–V13 e JDBC reais. Email/mercado são os doubles
externos da fundação. Três aquecimentos e20 amostras por rota, sem persistence
context retido entre invocações; transações e isolamento dos serviços preservados.
Medição inclui commit/flush em reorder; comandos rotacionam a lista em toda
amostra para atualizar todos os itens. p95 é a19ª amostra ordenada, sem retries.
SQL capturado no thread da operação; EXPLAIN ANALYZE/BUFFERS usa bindings reais,
após ANALYZE, fora do cronômetro, em transação revertida inclusive para SELECTs
com lock. Planos deduplicados por SQL; consultas idênticas por ID aparecem uma
vez no plano, mas todas entram na contagem.

| Hábitos reordenados | SELECTs antes → depois | UPDATEs antes/depois | p95 antes → depois (ms) | Buscas secundárias de coleção antes → depois |
|---|---|---|---|---|
| 3 | 4 → 1 | 3 | 34,254 → 9,323 | 3 → 0 |
| 30 | 31 → 1 | 30 | 64,843 → 39,860 | 30 → 0 |
| 120 | 121 → 1 | 120 | 205,648 → 119,037 | 120 → 0 |

Na maior amostra, redução de42,1% no p95 local. Os [CSV antes](metrics-before.csv)
e [depois](metrics-after.csv) guardam todas as27 combinações, incluindo p50,
SELECT/UPDATE e entidades carregadas. Contagens antes/depois das demais rotas:
contas1, metas2, hábitos1, extrato4 (página2 + count + dois agregados em lote),
caixa3, dashboard8, anual18; reorder de contas1 SELECT + N UPDATEs. O grafo de
logs já impede N+1 na lista de hábitos, inclusive antes da correção: não se
atribuiu à alteração um benefício de listagem que a medição não mostrou.

O problema confirmado é o `EAGER` de `Habit.specificDays` na leitura genérica
com lock da reordenação: lote único de raízes seguido de N SELECTs em
habit_days. [Planos antes](plans-before.txt) e [depois](plans-after.txt) preservam
o SELECT de raízes ordenadas por UUID/`FOR NO KEY UPDATE`, e demonstram a remoção
das consultas de dias. A correção usa `LAZY`; o DTO de lista não consome dias.
Consulta explícita dentro de transação continua retornando os três dias antigos.
O teste anterior falha por4 SELECTs onde exige1, sem erro de ambiente.

## Contratos e verificações adversariais

| Critério | Teste / oracle independente | Resultado local |
|---|---|---|
| Crescimento sem N+1 na rota corrigida | benchmark + reorderDoesNotFetchCollectionsPerHabit,3/30/120 | 1 SELECT em todos os tamanhos; N UPDATEs preservados |
| Coleções completas sem duplicação | listDoesNotFetchCollectionsPerHabit | H IDs únicos, sete datas/status por resposta; no máximo2 SELECTs/zero buscas secundárias |
| Paginação/posse e conciliação | statementPaginationTotalsAndChecklistRemainOwnedAndReconciled | 20+10 IDs únicos, count30, receitas/caixa300, saídas0; dois itens por meta na ordem0/1 |
| Atomicidade/legado | reorderPreservesDaysAndRejectsInvalidCommandsAtomically | foreign/missing404 sem alteração; duplicate/null400/vazio sem SQL; dias/logs/progresso preservados |
| Locks/rollback | reorderStillBlocksOnRowLockAndRecoversAfterCommitOrRollback, dois casos | waiter real observado com pg_blocking_pids; commit/rollback libera segundo comando, ordem final integral, saldo30/dias9/logs21 |

O teste dirigido passou7/7, zero erros/skips, sem enfraquecimento dos expected.
A primeira falha válida demonstra a regressão real; nenhuma mutação adicional
foi necessária para substituir essa prova. Nenhum teste existente foi editado.
O gate ampliado e sua contagem final estão registrados em [EXECUCOES.md](EXECUCOES.md).
Não somar subconjuntos ou repetições como testes distintos.

Gate final:396 testes,0 falhas/erros/skips, verify e JAR. Primeira ampliação
396/9 erros de inicialização PostgreSQL por excesso de conexões foi conservada.
O contexto do benchmark passou a ser encerrado após a classe e o wrapper
preserva AutoCloseable do pool. Apenas lifecycle da infraestrutura nova mudou;
produto, medição e expected permaneceram iguais. A reexecução com esse ajuste
aprovou inclusive os nove casos temporais anteriormente não inicializados.
[CSV](metrics-gate-final.csv)/[planos](plans-gate-final.txt) desse segundo gate
são uma reexecução distinta, sem substituir a comparação antes/depois dirigida.

## Complexidade, planos e trade-offs

- **Reorder:** leitura1+N SELECTs passa a1 (round trips de leitura O(N)→O(1)).
  Escrita permanece N UPDATEs/commit, portanto round trips totais continuam
  O(N): antes2N+1, depoisN+1 neste driver sem batch. Validação/mapa de posições
  O(N), memória O(N), ordenação SQL por UUID O(N log N) inalterada. Remove-se
  materialização adicional O(N×D) dos dias, D≤7, mas entidades/dirty checking
  continuam O(N). Versões, locks por recurso e eventos AFTER_COMMIT não mudam.
- **Coleções:** hábitos1 SELECT, linhas O(H+L), DTOs/entidades O(H+L); com120
  hábitos e840 logs o ORM carrega960 entidades antes/depois. Ordenação SQL pode
  custar O((H+L) log(H+L)); não há join simultâneo de dias multiplicando logs.
  Metas têm2 SELECTs, O(G+I) de materialização/agrupamento, ordenações SQL
  O(G log G + I log I). Mantêm-se listas completas sem paginação por contrato.
- **Extrato:**4 SELECTs com página2 em todos os tamanhos, fetch apenas de
  relações to-one e dois agregados em lote. Plano tem LIMIT no PostgreSQL e
  top-N heapsort26kB na amostra120. COUNT e agregados continuam percorrendo
  o escopo; contagem constante não equivale a custo computacional constante.
- **Índices/datas:** inventário existente inclui user/date para transactions,
  user/deadline para goals, user/order para habits e unique habit/date para logs.
  Predicados do extrato/caixa/fluxo usam intervalo de datas, sem função sobre a
  data no filtro principal. Planos com153 raízes preferem scans sequenciais;
  isso, isoladamente, não prova índice ausente. Não houve spill no sort de
  reorder/listas medidos. Consultas anuais de assinaturas ainda usam EXTRACT
  no filtro, mas cartões/reembolsos vazios não comprovam benefício de alterá-lo.
  Nenhum índice, fetch join paginado ou cache foi adicionado sem evidência.

Vantagem: elimina leituras inúteis e memória dos dias durante reorder, com uma
mudança pequena no mapeamento. Custo/risco: um consumidor futuro de specificDays
precisa transação ou fetch explícito; lista/toggle/cron atuais não o consomem.
UPDATEs e locks até commit continuam gargalo em ordens grandes; listas retornam
histórico integral e podem crescer em memória. Não substituir por bulk UPDATE
sem validar versões/locks/atomicidade. Próximas investigações práticas: medir
volumes de histórico/cartões/ativos maiores, bytes/heap e planos seletivos;
avaliar paginação de logs ou projeções dentro de um contrato aprovado.

## Limites e revisão

p95 é local aquecido,20 amostras, sem concorrência no benchmark/HTTP/autenticação;
não estabelece SLA, capacidade ou comportamento de produção. Tempos de rotas
sem alteração oscilam, inclusive dashboard120 (14,131→36,076ms); não atribuir
essa diferença à correção nem afirmar aceleração geral. Consultas nativas de
reports são constantes mas não foram otimizadas, nem certificadas para grande
volume. Não houve teste de pico de heap, hardware fixado, tráfego de rede,
multi-instância, novo E2E/browser, Railway, banco real, email real, push ou deploy.

Implementação e autotestes aguardam revisão independente da CF-025. Nenhuma
tarefa subsequente ganhou estado novo: revisão CF-025 pode iniciar; CF-033
depende desse aceite e também de CF-027/032, ambas ainda propostas. Os residuais
RVA-03/RJ-022-01/H24-01/RV24-01/02/RV17-01/02, adoção real e zoom200% não foram
encerrados por este trabalho. Uma execução ampliada verde não apaga os pareceres
ou falhas históricas. Preservar esses gates e verificar volume maior antes de
concluir sobre capacidade operacional.
