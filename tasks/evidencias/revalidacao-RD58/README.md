# Revalidação independente RD58 — 09/10/2026

**RD58-01 aprovado. RD58-02 aprovado nas quatro parcelas: novas gravações,
legado, apresentação e migração local. CF-005 e CF-006 concluídas no seu escopo.**
Não foram encontrados impedimentos remanescentes nesses critérios. A aprovação
não certifica adoção no Railway nem encerra CF-017/P01/P02.

## Base examinada e preservação

Branch `main`; entrada e candidato efetivamente examinado
`0c068d9bd750e648ba839742991108deace31f9f`. Base independente
`18cd6df231b01f27abbab61f95c6b1f377adc468`, ancestral do candidato. Intervalo completo
`18cd6df..0c068d9`: `b685ef9` (ano), `ead4323` (histórico), `0c068d9` (evidências).
Nenhum commit posterior na entrada. Staging vazio; único delta preexistente:
README raiz. SHA256 antes e depois:
`6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA`.

Lidos AGENTS fornecido na conversa (nenhum arquivo adicional encontrado),
tasks/README, EXECUCAO, POLITICA-DE-TESTES, CF-004/005/006, SPEC-002 DEC-01/02,
inventário CT-10/E11, parecer/matriz/achados/provas da revisão dirigida,
encaminhamento/README/execuções do saneamento, CF-017 e derivada temporal.
O baseline JSON foi salvo depois de acrescentar os probes desta revisão, por isso
também lista esses deltas; não é apresentado como fotografia anterior às edições.
`verify.cjs` confirma hashes, ancestralidade, critérios e produto preservado.
Não houve mutação na árvore principal, correção de produto, clean/reset, push,
deploy, banco real ou execução CF-028. Os únicos complementos de código são testes.

## A — RD58-01 e decisão normativa

DEC-01 nomeia explicitamente o seletor do resumo anual: **ano do navegador na
abertura**, preservando escolha enquanto aberto. O consumidor envia `year` na query;
portanto não se aplica o fallback backend de anoProduto quando o parâmetro falta.
Hábitos/highlight e scheduler usam diaProduto; auditoria usa instante do Clock.
Essas regras não autorizam converter todo “hoje” para um calendário único.
Não foi necessário alterar contrato ou expected para aprovar o candidato.

`useAnnualSummary` captura `new Date().getFullYear()` apenas no inicializador.
Query, cache e chave de rascunho continuam usando a seleção; não foi adicionado
efeito de reset. Botões mudam o ano explicitamente. Refresh conserva escolha e
rascunho; desmontagem/reabertura captura o relógio novamente. O limite de navegação
MAX_YEAR da tela é preexistente e não determina nem substitui a seleção inicial.

| Relógio fixo | Navegador | Ano esperado consultado | Comparação com São Paulo |
|---|---|---|---|
| 2027-01-01T01:00Z | UTC | 2027 | navegador adiante, produto 2026 |
| 2026-12-31T12:00Z | Kiritimati | 2027 | navegador adiante, produto 2026 |
| 2027-01-01T04:00Z | Los Angeles | 2026 | navegador atrás, produto 2027 |
| 2027-01-01T04:00Z | São Paulo | 2027 | coincidentes |
| 2026-06-15T12:00Z | UTC | 2026 | coincidentes |

Cada caso verifica seleção manual 2024, query, rascunho e refresh após avançar o
relógio a 2028; reabrir consulta 2028. O controle original também preserva seleção.
Os expected são literais, não o helper produtivo nem a data real da execução.
SSR: `AnnualSummaryScreen` retorna somente loader enquanto isLoading e sem summary,
estado inicial do hook. O ano calculado no servidor não aparece no HTML inicial;
o estado cliente é inicializado no navegador e a consulta só parte de useEffect.
Build Next confirma prerender da rota. Inspeção desse caminho não encontrou
dependência de um ano serializado do servidor nem divergência visual de hidratação.

## B — RD58-02: matriz de writers e consumidores

| Evento / fronteira | Caminho examinado | Prova e decisão |
|---|---|---|
| Aporte numérico | GoalService.addValue → recordAt(now) | Clock fixo → SQL e HTTP UTC; aprovado |
| Destinação monetária por aporte | Mesmo writer, ramo MONETARY | Instante igual, destinação sem débito indevido; aprovado |
| Ajuste de destinação | setAllocation → recordAllocationChange | Uma captura reutilizada no evento e histórico; aprovado |
| Mover destinação | moveAllocation → recordAllocationChange | Instante preservado e fontes reconciliadas; aprovado |
| Marcar hábito com meta | toggleHabit → addContribution | Dia civil clicado 07/09 distinto da auditoria 08/09; aprovado |
| Desmarcar / excluir histórico | Remoção da contribuição existente | Não cria novo GoalHistory; não requer timestamp novo |
| Entidade / coluna | Instant recordedAt → timestamp(6) with time zone | Hibernate validate + commit/releitura PostgreSQL; aprovado |
| HTTP | GET GoalController.listHistory → GoalHistoryResponseDTO | Jackson/MockMvc real, Z em date/recordedAt, SERVER_CLOCK; aprovado |
| Transporte / estado | BFF genérico → apiRequest → goalService.getHistory → useGoals | JSON sem conversão de datas; hook atribui res.data; aprovado |
| Consumidor | GoalDetails → goalHistoryTimeLabel | Componente real e cliente HTTP real, fusos/reabertura; aprovado |

Busca de `new GoalHistory`, `recordAt` e repositório confirmou os três locais de
construção e os cinco eventos acima. Compras usam entidade própria, não esse histórico.
Lista de metas usa GoalResponseDTO sem histórico embutido; consumidor pertinente
da lista de eventos é GoalDetails. Não há endpoint de edição de GoalHistory.

**Novas gravações:** o valor persistido deriva de `ZonedDateTime.now(clock).toInstant()`,
não de anexar Z ao horário local. Clock `2026-09-08T03:10:00.123456789Z`, zona SP,
é truncado a microssegundos antes do INSERT: SQL e HTTP após commit mostram
`2026-09-08T03:10:00.123456Z`, enquanto alias local guarda `00:10:00.123456`.
Os três defaults reais JVM UTC/SP/Kiritimati produzem o mesmo instante. A prova
original usa `03:10:00Z` e hora informada `08:15`; auditoria não deriva do request.
POST deposit tem corpo vazio; a primeira representação é GET. Segundo GET é igual.
Não se inventou igualdade com um DTO de criação inexistente.

Teste independente adicional altera note e tenta substituir recordedAt por 2030
via saveAndFlush; nova leitura confirma note alterada e auditoria original intacta.
`updatable=false` protege update ORM; não é alegada constraint de imutabilidade SQL.
Os writers reais sempre atribuem o instante; UNKNOWN não mascara omissão nesses caminhos.

**Legado:** fixture SQL criada ainda em V13 conserva ID, relação, amount, note,
timestamp com fração e null depois da V14. Coluna nova permanece null, sem default,
backfill ou origem inventada. DTO devolve raw/null, `recordedAt=null`, `UNKNOWN`.
A origem decorre da coluna dedicada; não da aparência do alias ou de um offset.

**Apresentação:** conhecido usa São Paulo com zona explícita; desconhecido mantém
dia/hora/fração e “Fuso desconhecido”. Null mostra “Data indisponível — Fuso desconhecido”.
Offset no alias sem proveniência não o torna conhecido; campo canônico incompleto
não é convertido como instante. Componente e parser reais confirmam UTC/Kiritimati,
e os testes existentes incluem SP, offset equivalente +14 e reabertura. Não há
normalização de legado pelo timezone do navegador nem Invalid Date nos casos cobertos.

**Migração local:** única alteração no diretório desde a base é ADD V14; V1–V13
intactas. Cadeia vazia e upgrade V13→V14 aprovados; tipo timestamptz, precisão6,
nullable YES, default ausente, reaplicação zero e Hibernate validate verificados.
Nenhuma constraint antiga foi removida nem reescrita. Nullable é necessário para
histórico sem proveniência; a obrigação do novo writer é testada, não delegada ao DB.

Trigger sintético rejeita INSERT de histórico após mudança de destinação e comprova
rollback conjunto do negócio (current_value/destinação/histórico). Os testes de
hábitos e alocações preservam concorrência/atomicidade. Isso **não é rollback da V14**.
A suíte de migrações cobre falha/recuperação da cadeia; não foi executada uma down
migration V14. Aprovação de migração aditiva local não autoriza removê-la após dados
novos: adoção/reversão coordenada continua no escopo original CF-017.

Diff não introduz transação, lock ou consulta por item. Mapeamento DTO/label é O(n),
captura do relógio O(1), DTO só acessa escalares (sem N+1 novo). Preservar alias e
adicionar coluna exige rollout coordenado e mantém temporariamente dois campos,
mas evita falsificar legado. Ordenação existente por date não passa a ser uma
garantia de cronologia global entre instantes e horários desconhecidos.

## Suficiência das provas e causalidade

Três provas originais, em dois arquivos, permanecem idênticas à base (diff vazio):

| Arquivo | SHA256 |
|---|---|
| directed-temporal-review.test.tsx | B9E85B026B60140F900A72E7AE22E0BB8E73433FA64BD5DA7BE00DF36D03371A |
| DirectedGoalHistoryTemporalTest.java | F21E74ABFA5B3D6824543498D0E49140EA4603536A29A77FE2062D0C31C136D6 |

Logs originais `probes-final.log` (2 falhas + controle aprovado) e
`backend-probe-final.log` (1 falha causal, sem erro) foram confrontados com inputs,
assertions e expected preservados. Calendário incorreto recebeu2026 em vez2027;
label desconhecido ausente; novo HTTP recebeu00:10 semoffset em vez03:10Z.
São falhas **históricas**, não novas execuções vermelhas desta revisão. As mesmas
provas passaram agora. Essa sensibilidade já demonstrada torna dispensável repetir
mutação isolada equivalente. Não houve árvore mutante nem restauração pendente.

Não foi executado novo E2E/browser. A escolha é proporcional: backend exercita
writers/ORM/SQL/serialização HTTP reais; complemento frontend atravessa fetch
simulado somente na fronteira HTTP, apiRequest, JSON.parse, goalService e componente
real com o contrato literal confirmado no backend. `useGoals` e BFF não mudaram e
não transformam campos temporais; suas regressões atuais passaram. Isso fecha a
ligação entre camadas para o delta, sem tratar dois mocks de serviço como integração.
As jornadas reais CF-007 anteriores continuam aplicáveis a data civil/escrita/reload;
não são apresentadas como execução do novo DTO. Ausência de novo browser limita
certificação visual/responsiva, mas não deixa garantia essencial do recorte sem prova.

## C/D — Confronto por tarefa

Aceites acumulados e suas bases permanecem discriminados na
[matriz anterior](../revisao-dirigida-CF-005-CF-008/MATRIZ.md), não substituídos por ancestralidade.

| Tarefa / critério original | Aceite acumulado e confronto deste delta | Decisão |
|---|---|---|
| CF-005/1 payload, hoje, label civil | F/V e regressões atuais temporal-forms/presentation/compatibility; sem mudança financeira | Atendido |
| CF-005/2 prazo hoje/concluída, janeiro31/navegação | F/V, componentes atuais navigation/presentation; RD58-01 agora prova ano/query/manual/reabertura | Atendido |
| CF-005/3 mutações toISOString e parsing civil detectadas | M01/M02 históricos preservados; novas provas RD58 originalmente vermelhas, hashes iguais | Atendido |
| CF-005/4 evidências/limitações e testes íntegros | Logs novos, hashes, failed harness explicado, nenhum expected temporal alterado | Atendido |
| CF-005 trabalho1/3 ainda aberto | Auditoria dirigida dos dois consumidores; RD58-01 e label RD58-02 agora conformes | Encerrado |
| CF-006/1 calendário produto independente da JVM | F/V/J mais TemporalConfig e novos cinco writers sob três defaults | Atendido |
| CF-006/2 civil round trip e hora informada | V/M/R e TemporalCompatibility/PostgreSqlTemporalRoundTrip atuais; auditoria de meta separada | Atendido |
| CF-006/3 meia-noite, bissexto, mês curto, expiração | F/V/P04/J e TemporalJson/Boundary atuais; sem delta em crons/tokens | Atendido |
| CF-006/4 evidência/limitações e testes íntegros | HTTP/PG/upgrade atuais, originais intactos e limites explícitos | Atendido |
| CF-006 trabalho1/2 ainda aberto | RD58-02 Clock/persistência/DTO comprova instante após commit e releitura | Encerrado |
| CF-006 trabalho3 mapear schema e condicionar migração | V14 mapeada/provada localmente; gate real CF-017 preservado desde o escopo original | Atendido no escopo próprio |

**CF-005: concluida. CF-006: concluida.** Nenhum critério removido e nenhuma
obrigação nova transferida a CF-017 para produzir o fechamento. O gate histórico
de schema local não é mais justificado só por DTO: V14 foi aplicada em PostgreSQL
descartável com legacy fixture. Compatibilidade/backup/proveniência/rollout reais,
RV17-01/02 e P01/P02 permanecem onde o escopo original já os define.

CF-007/008 local, CF-009/RV24-01, precisão decimal e contratos financeiros preservados.
Sem regressão concreta que justifique reabertura. Zoom, pagamento120 e hábitos/scheduler
não viram bloqueios genéricos. CF-028 continua liberada **somente para especificação**,
conforme decisão existente; não iniciada nesta revisão. Não há recomendação de nova
auditoria global. Comandos, resultados e ocorrências em [EXECUCOES.md](EXECUCOES.md).
