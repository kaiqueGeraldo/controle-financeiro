# Revisão independente dirigida CF-005–008 — 08/10/2026

**CF-007 e CF-008 concluídas no escopo local original. CF-005 e CF-006 permanecem em_revisao por RD58-01/RD58-02, reproduzidos nesta revisão.** Não se exige repetir a auditoria geral nem reabrir P03/P04/P05, RV24-01 ou CF-009. CF-028 conserva sua liberação somente para especificação.

[Matriz por critério](MATRIZ.md), [achados e encerramento](ACHADOS.md), [execuções e limites](EXECUCOES.md), [baseline](baseline.json). Os textos originais dos critérios foram extraídos antes dos testes; o julgamento distingue os quatro checkboxes dos itens de trabalho originais que também compõem a entrega. Não foram acrescentados requisitos de produto.

Commit local de testes/probes: `15746d0`. O commit seguinte reúne este parecer,
evidências e estados; seu hash/HEAD é informado na entrega, sem circularidade
de gravar um hash de commit dentro do próprio conteúdo commitado.

## Base e seleção de evidências

Branch main, HEAD inicial `1b0d9bcefaba0bcc37a21955caa94db65a3bf383`, igual ao commit de referência; portanto ancestralidade satisfeita e nenhum commit posterior ao referencial. Staging inicial vazio. Único delta preexistente: README raiz, SHA256 `6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA`, preservado e excluído dos commits. AGENTS fornecido na conversa; busca na árvore e ancestrais não encontrou arquivo adicional.

Foram lidos tarefas, EXECUCAO, POLITICA-DE-TESTES, SPEC-002, CT-10/E11 e inventário temporal, HTTP-CONTRACT, CF-017/derivada, reconciliação e pareceres abaixo. Históricos datados não foram reescritos; não se tomou ancestralidade, checkbox ou relato do executor como aceite.

| Código | Aceite independente e base examinada | Garantia reutilizada |
|---|---|---|
| F | [CF-001–009](../revisao-CF-001-CF-009/README.md), working tree sobre `169d7be`, integrado até `8dad1c1`; [resultados](../revisao-CF-001-CF-009/resultados.json) | Componentes, binding, HTTP, round trip, M01/M02/M03 e M10; não atribuir teste a cada commit intermediário |
| V | [CF-015](../revisao-CF-015/README.md), `1ced2f0` + candidato local; [revalidação](../revalidacao-CF-015/README.md), `eb40303..681102b` | P03/P04/P05 e writers P01/P02 sintéticos; R06 de planejamento posteriormente encerrado |
| P | [R03/RV01](../revalidacao-CF-015-RV01/README.md), `f550b9e..e4079a9` | Reconciliação substituída rejeita, recuperação não repete pagamento |
| M | [CF-017](../revisao-CF-017/README.md), `2269b22..d3fcb35` | Migração local V1/V2, metadados sem backfill, D16-T01/Transaction.time e dueDate inventariados; gates reais preservados |
| R | [Marco financeiro](../revalidacao-CF-016-CF-021/README.md), `3d64e7a`; [execuções](../revalidacao-CF-016-CF-021/EXECUCOES.md) | 18 jornadas temporais SP/UTC+14, SQL/XLSX, edição corretiva preservando original; [log durável](../revalidacao-CF-016-CF-021/browser/temporal/playwright.log) |
| J | [CF-022/023](../revisao-CF-022-CF-023/README.md), `9ff1aec`, integrado `9fa4fae` | Sessão/ownership, Clock real em três defaults JVM e writers de GoalHistory; este último aceite prova hora local do produto, não o offset HTTP exigido por E11 |
| L | [CF-025/026/027 e RV24](../revisao-CF-025-CF-027-RV24/README.md), `06c1a51` | Lint/efeitos/cleanup e fronteira de intenção/recibo aceitos individualmente |
| U | [RVR24-01/P2](../revalidacao-RVR24-01-propriedades/README.md), candidato `b5e8550`, integrado no HEAD | CF-009/RV24-01 concluídas; recuperação POST/retry/GET, parser, lifecycle e efeito financeiro SQL/reload nos consumidores cobertos |

Saneamento [P01–P05](../saneamento-P01-P05-2026-09-09/README.md) foi confrontado com V/M, sem promover autoteste a aceite. A [reconciliação](../consolidacao-CF-001-CF-026/RECONCILIACAO-CF-001-CF-027.md) é snapshot histórico: suas referências a RV24-01/CF-025–027 pendentes foram superadas por L/U.

## Alterações posteriores e validade das provas

Os [paths desde V](changes-since-temporal-review.txt) delimitam alterações; não representam aprovação automática. `date.ts`, `format.ts` e `browserTodayContext.tsx` não mudaram desde V: parsing civil UTC, hoje local por formulário, diaProduto para hábitos e timer/focus/visibility continuam separados. Os defaults são capturados na abertura, não reescritos por refetch. M01/M02 continuam observáveis nas mesmas assertions de formulário e label; as fixtures novas de resposta/owner em temporal-forms suportam o protocolo atual sem remover os expected temporais. Navigation conserva janeiro/31→fevereiro/01 e voltar/repetir sem overflow. Novas execuções cobrem os consumidores alterados.

`4d2095a` alterou o ano inicial de useAnnualSummary de navegador para produto, sem mudança correspondente de DEC-01: RD58-01. Isto não reabre cálculo de agregados CF-021 nem o lifecycle aceito. Histórico de metas usa Clock, mas continua LocalDateTime/JSON sem offset e render local sem origem: RD58-02; não confundir com as correções aceitas de Transaction.time/InvestTransaction.date.

Backend: writers de transação/cartão usam metadados separados; omissão/null/00:00, legado UNKNOWN, imutabilidade de auditoria, DTO/paginação/exportação e planejamento têm testes PostgreSQL atuais. FIN-02/07 passaram a conservar fato original e criar correção: R já revalidou essa mudança, inclusive os dois fatos no SQL/XLSX. O [delta do harness temporal desde R](integrated-test-delta.diff) é vazio. J cobre mudanças de hábitos/GoalHistory e L a fronteira de recibos. [Posteriores a L](changes-since-latest-consumer-review.txt) restringem-se ao snapshot/parser/recibo, aceitos em U e revalidações referenciadas por U; não alteram data civil nos corpos/labels. Não repetimos a revisão decimal ou de propriedades herdadas.

## Parecer CF-005

Critérios de payload/hoje/label civil, prazo de meta, competência mensal e mutações M01/M02/M03 **aceitos nos caminhos comprovados**, com 64 testes dirigidos atuais incluindo as regressões pertinentes (não 64 testes exclusivos desta tarefa). Metas usam hojeNavegador; hábitos usam hojeProduto; não uniformizar os dois.

**Permanece em_revisao:** o trabalho original 1 manda localizar todos os consumidores temporais, e o trabalho 3 manda ajustar os restantes a CF-004. RD58-01 viola a regra explícita do seletor anual; RD58-02 viola a apresentação de histórico legado CT-10/E11. Estes consumidores estão dentro de hooks/screens enumerados na tarefa. Os checkboxes literais de data civil/mês não foram artificialmente reescritos como se cobrissem todos os instantes. Acrescentamos à matriz as obrigações originais de trabalho, transcritas literalmente. Não é falta genérica de parecer nem gate automático da CF-017.

## Parecer CF-006

Clock/fuso, round trip civil/hora explícita e bordas de dia/mês/bissexto/expiração **aceitos nos cenários existentes**. Nova seleção backend: 76 verdes e um vermelho novo; os 76 não ocultam a falha. TemporalConfigTest altera/verifica o default JVM UTC/SP/UTC+14; `-Duser.timezone=UTC` sozinho não prova isso porque o bootstrap normaliza o default. Persistência atual cobre conta/transação/cartão/investimento/planejamento, erro de campo e ausência/proveniência desconhecida sem inventar auditoria.

**Permanece em_revisao por RD58-02:** trabalho original 1/2 e CT-10/E11 exigem separar horário informado do registro no histórico de metas. POST/commit/GET/SQL descartável confirma perda de offset em gravação nova. O aceite J sobre o Clock local permanece válido; não prova o contrato de instante. O saneamento deve ser aditivo e preservar legado sem origem; não basta acrescentar Z ao valor local. Banco real continua fora desta revisão.

## Parecer CF-007

**Concluída localmente**, com seus quatro critérios atendidos. R/V/F comprovam browser→BFF→Spring→PostgreSQL→reload: transação criada em30/01 às23:30, editada/corrigida para29/01 às08:15, comparação de payload/resposta, SQL e reabertura; compra e investimento conservam30/01, meta conserva prazo, hábito conserva dia, planejamento conserva dueDate e competência. O runner tem SQL para o registro recusado ausente e para originais/correções; o XLSX baixado é lido por POI. O400 é produzido pelo backend real mediante request de data impossível, não por sucesso mockado; o campo informado fica recuperável. Datas impossíveis/bissexto/mês curto/meia-noite/ano são complementados pelos testes de unidade/componente/integração com Clock fixo, não pelo relógio real.

M10 de F demonstrou que alterar o dia na API quebra a assertion literal de30/01 na UI; a assertion e o caminho de data civil permanecem no spec atual. R reexecutou as jornadas após a semântica de correção financeira. U valida as mudanças subsequentes de criação/recuperação nos dois modais. Não houve nova execução Playwright nesta revisão: esses são aceites históricos reutilizados, identificados por base, diff e cenário. Os64 componentes e76 testes backend verdes são provas novas complementares, não novas jornadas browser.

RD58-01 não altera a data escolhida de registro nem a seleção mensal dessas jornadas; RD58-02 é registro automático de auditoria, não o prazo/data escolhido no fluxo de meta. Assim não demonstram violação dos três critérios funcionais próprios de CF-007. A tarefa conclui a validação delimitada que exige, sem alegar certificação de toda apresentação temporal. CF-005/006 seguem com obrigações locais explícitas; as capacidades anteriormente liberadas e consumidas por estas jornadas foram reconferidas, sem mudar arestas de dependência. Nenhuma aprovação integral de CF-015 ou de produção.

## Parecer CF-008

**Concluída localmente**, com os quatro critérios próprios atendidos:401 privado exige login,403 mantém sessão e proibição,400 identifica campo,409 permite reconciliação;204 não faz parse; erro JSON/HTML não vira XLSX; AbortError e499 preservam cancelamento;503/504/rede/escrita de resultado desconhecido não viram sucesso nem limpam formulário.

Prova atual: cliente/BFF/providers/formulários, HttpContractControllerTest, TemporalBoundaryReviewTest, PlanningEditIntegrationTest e TemporalCompatibilityIntegrationTest. DTOs e nomes `content/page.size/number/totalElements/totalPages`, dueDate e omissão/null foram confrontados. Histórico F/V/M/P/J fornece segurança HTTP, recuperação e contraprovas; U fornece confirmação financeira/UUID/corpo/storage/SQL após reload nos consumidores de criação modificados. Transportar erro correto não foi confundido com confirmar efeito financeiro. Não exigimos validação runtime de todos os DTOs. RD58-02 não muda status, parsing, paginação ou os comportamentos de erro deste aceite; sua semântica temporal tem saneamento em CF-006/005.

## Pendências, limites e próxima ação

P01/P02 continuam abertos **na adoção real** da CF-017/derivada: inventário, proveniência, backup/restore, compatibilidade do schema existente e coordenação de writers/clientes. RV17-01/02 permanecem pendências locais da CF-017. Os quatro arquivos originais não exigem operar o banco real para validar suas garantias locais; não se transferiu RD58-02 para a adoção para limpar estados. Nenhum banco real foi acessado.

Sem revisão geral CF-010–015, zoom, pagamento120/RVA-03 ou scheduler/hábitos além do calendário pertinente. Investigações anteriores conservam donos/limites. Nenhuma implementação CF-028, produto, migração, push ou deploy. Próximo passo: corrigir RD58-01 no seletor e RD58-02 nos writers/DTO/adaptador/label de GoalHistory, com preservação aditiva do legado; executar os três probes vermelhos e os consumidores diretamente afetados. Isso **não revoga** a liberação existente para especificar CF-028.

Trade-offs: a correção de ano é O(1), mas precisa preservar seleção/draft. Histórico requer diferenciar novos instantes de legado desconhecido, com custo de schema/DTO compatível; converter todas as linhas assumindo fuso é incorreto. Parsing civil é O(1), listas O(n), ordenação O(n log n); provider compartilha timer, sem timer por linha. Não há consulta nova nem alegação de desempenho/N+1 nesta revisão. CF-025 continua sendo a evidência própria de consultas. Idempotência/concorrência financeira seguem no backend; locks de UI não substituem transação/recibo.
