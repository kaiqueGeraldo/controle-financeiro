# Revisão independente CF-024 — 30/09 a 01/10/2026

**CF-024 aceita e concluída no recorte backend entregue de DEC-10 e invalidação após commit. CF-025 apta a iniciar localmente.** O aceite não certifica todos os writers, consumidores sem chave, exclusão completa de usuário ou cache de leitura em produção. Há dois defeitos confirmados e uma execução inconclusiva em [ACHADOS.md](ACHADOS.md), com responsáveis e encerramento próprios. CF-025 não foi iniciada.

## Base e método

Inspeção sobre HEAD `f22565720cfd49673d99199de8782d53bc545225`: `9fa4fae` é ancestral, `dbf828e` contém produto/testes e `f225657` evidências. Staging inicial vazio; única alteração inicial era README raiz, preservada byte a byte e fora do commit. O bloqueio anterior à revisão conjunta CF-022/023 é histórico, superado pela retomada em `9fa4fae`; não foi apagado.

Foram confrontados instruções, política de testes, CF-024/025, contrato e evidências do executor, SPEC-004, DEC-10/SPEC-003, ADRs em arquitetura.md, parecer conjunto CF-022/023 e pareceres de CF-021/018/020/019. A revisão não mudou produto, migrações, testes compartilhados, frontend ou contratos. Probes ficam nesta pasta e são copiados para `target` isolado. Expected foram registrados em [ORACLES.md](ORACLES.md), antes dos respectivos probes; nenhum expected financeiro vem de helper de produção.

PostgreSQL 16 descartável/Testcontainers, Spring/proxies reais, conexões/transações independentes, barreiras e consulta a `pg_blocking_pids`, sem sleeps para sincronização. Email e mercado externo usam doubles. Não houve banco real, email real, push ou deploy. [EXECUCOES.md](EXECUCOES.md) distingue checkout, cópia, falhas iniciais, subconjuntos e evidência histórica. [checkpoint.json](checkpoint.json) confirma 300 fontes, hashes históricos, README, restaurações e base. Não confundir o novo JAR com o histórico já substituído em target.

## A. Concorrência e integridade financeira

**Aprovadas nas fontes e pares exercitados.** Pagamento versus transferência/aporte, dois cartões na mesma conta, vendas excedendo posição, transferências excedendo capacidade, mesma intenção simultânea, rollback com waiter e fontes distintas preservaram dinheiro no PostgreSQL. Foram consultados saldo, dívida, posição, fatos, recibos e vínculos depois de ambas as transações. O probe adicional de reserva700 sobre conta1000 permite pagamento200, recusa aporte200, conserva saldo800/reserva700/posição10, dívida0, uma alocação200 e seu débito, sem recibo de aporte recusado.

Ordem inspecionada: intenção de criação antes de conta; transferência bloqueia contas ordenadas por ID; investimento conta antes de posição; pagamento intenção própria antes de cartão e conta; compensação conta antes de posição. Não se encontrou inversão nova entre estes caminhos. Não é prova de ausência de deadlocks para todos os writers. O teste de deadlock força ordem oposta por transações envolventes e observa um sucesso e um 409 com rollback do perdedor. Timeout real PostgreSQL (55P03), deadlock (40P01) e versão otimista são distinguidos de erro genérico de persistência. O handler não transforma toda exceção de banco em 409: falha induzida na gravação do recibo segue 500 e aborta os efeitos.

Retry ocorre em nova transação válida; a transação abortada não prossegue gravando. Uma versão obsoleta real, lida em duas transações, perde e deixa apenas25 contabilizados. Produção ainda precisa definir prazo de espera/observabilidade; os testes não estabelecem throughput ou SLA.

## B. Intenção, replay e recuperação

**Aprovado o protocolo opcional novo para criação/transferência e operações de investimento.** Chave UUID tem unicidade global dentro de `financial_intent_receipts`; user/kind/fingerprint são conferidos antes do replay. Outro proprietário reutilizando a chave recebe409 genérico na escrita e404 na leitura; outro tipo/recurso não recebe resultado indevido. Isso não constitui namespace global entre pagamentos, comandos antigos e correções: cada protocolo herdado possui armazenamento próprio.

Fingerprint usa campos tipados, comprimento explícito para evitar concatenação ambígua, marcador de null e SHA-256. BigDecimal é normalizado numericamente; datas são LocalDate. Criação normaliza isPaid null para true, fee null para zero e hora opcional. O probe altera dez campos de transação e oito de investimento, exigindo409 e ausência de efeito parcial. Duas chaves legítimas com conteúdo igual produzem dois efeitos. Não se afirmou equivalência universal de defaults de protocolos herdados; em pagamento, por exemplo, null/false de prepayment não recebeu certificação adicional de canonicalização.

`FinancialIntentService` exige transação existente: lock por intenção, escrita financeira, serialização Jackson e saveAndFlush do snapshot pertencem ao mesmo commit. Falha real de serialização de objeto sintético com getter que lança exceção aborta fato/recibo/cache; a mesma chave funciona em nova transação. Isso exercita o helper real, sem alegar que o DTO tipado atual naturalmente lança essa falha.

Snapshot novo permanece igual após estorno/alteração ou exclusão do recurso; replay não recria fato eliminado nem recalcula resgate com posição atual. BUY, SELL, DIVIDEND, INTEREST e resgate monetário têm invariantes explícitas. Recibos herdados não foram promovidos a snapshot: baixa/estorno/realização reconstroem DTO a partir do ledger atual (probe SETTLED→REVERSED), sem repetir dinheiro. Pagamento guarda campos próprios do pagamento; compensação usa registro histórico.

GET autenticado consulta persistência por owner; ausência e foreign owner não revelam conteúdo. Durante comando em andamento, nova conexão pode observar404 enquanto outra ainda aguarda o lock. Logo404 não autoriza nova intenção. Recuperação e replay foram exercitados em transações/conexões distintas na mesma aplicação, sem dependência de mapa em memória. Descarte lógico da resposta não é corte TCP. Restart, rede real e múltiplos dispositivos não foram testados.

V13 é aditiva: PK UUID, FK owner com cascade, kind limitado aos dois comandos, fingerprint hexadecimal64, JSON válido do tipo objeto, recorded_at e índice de owner. Banco vazio passou Flyway+Hibernate validate até V13. Upgrade V12→V13 com usuário/conta1000/fato12,34/comando antigo preservou os dados, manteve recibos novos vazios e validou índices/schema. Não há backfill inventando recibos para passado sem intenção.

Snapshots incluem dados financeiros e metadados da resposta original; exigem proteção por owner e compatibilidade futura do DTO/schema. Não contêm senha/JWT por construção dos DTOs inspecionados. Os logs de teste podem incluir autenticação sintética; cópias publicadas nesta revisão são sanitizadas com hashes antes/depois. Não foi feita auditoria global dos logs de produção.

## Matriz comando → garantia → evidência

Prefixo backend: `controle-financeiro-backend/src/main/java/com/controlefinanceiro/api/`. `C30` = classe Cf024ConcurrencyCacheIntegrationTest final, 30 casos; `R17` = Cf024IndependentReviewTest#review*, 17 casos; `I4` = MilestoneInvestmentCorrectionTest, quatro casos. Nomes/casos completos constam dos logs e `final/results.json`.

| Comando / origem | Fonte e owner | Chave / fingerprint | Recibo | Locks / transação | Cache / eventos | Teste e resultado |
|---|---|---|---|---|---|---|
| Criação comum, nova garantia opcional; TransactionService.create:86 | Conta/categoria do principal | UUID opcional; descrição, valor, data/hora, tipo, conta/categoria, pago, destino, taxa | V13 snapshot do DTO, mesmo commit | Intenção→conta; @Transactional | DataChangedEvent→AFTER_COMMIT | R17 defaults/equal intents/10 campos/estorno/exclusão/serializer: aprovado; sem chave, dois efeitos legítimos no servidor |
| Transferência, nova garantia opcional; TransactionService | Ambas contas do owner | Mesmo protocolo de criação; destino/taxa no fingerprint; UUID interno das pernas é outro identificador | Um snapshot, pernas e taxa atômicas | Intenção→contas ordenadas | Ano/owner após commit | C30 retry/parâmetro/rollback/overspend/opostas: aprovado |
| BUY, nova garantia opcional; InvestmentService.performOperation:124 | Conta→ativo do owner, capacidade desconta reservas | UUID; ativo,tipo,quantidade,preço,taxas,data,conta,amount | V13 snapshot | Intenção→conta→ativo | Ano/owner após commit; efeitos síncronos internos atômicos | C30 mesma intenção/pagamento; R17 waiter/8 campos/reserva: aprovado |
| SELL e resgate monetário, nova garantia opcional | Conta e posição do owner | Mesmo protocolo; amount e quantidade distintos no fingerprint | Snapshot preserva quantidade apurada original | Intenção→conta→ativo | Após commit | C30 oversell; R17 SELL e resgate200: aprovado; não recalcula no replay |
| DIVIDEND / INTEREST, nova garantia opcional | Conta e ativo do owner | Mesmo protocolo, tipo diferencia comandos | Snapshot; bruto/retenção vinculados | Intenção→conta→ativo | Após commit | R17 parametrizado:1090/posição10/custo1000; aprovado |
| Pagamento, herdado; CreditCardService.payInvoice:524 | Cartão e conta do principal | invoice-payment UUID; cartão,fonte,valor,data/hora,competência,modo,descrição | card_payments, GET próprio owner/cartão | Intenção própria→cartão→conta; alocações no mesmo commit | InvoicePaymentRequested/InvoiceChanged síncronos; cache AFTER_COMMIT | C30 dois cartões/transferência/aporte/owner; R17 crosscard/equal keys: aprovado backend; RVA-03 permanece |
| Adiantamento, herdado | Mesma fonte/owner de pagamento | Mesmo namespace de pagamento; prepayment distingue modo | card_payments e alocações | Mesma ordem/transação | Mesmos eventos | C30 pagamento/adiantamento; R17 alteração modo409: aprovado no recorte |
| Baixa/estorno/realização, herdado; TransactionService.beginIntent:447 | Fato e fontes do owner | financial-command UUID, kind/original/fingerprint | financial_commands; referência a resultado vivo | Intenção própria→fontes necessárias; transação de comando | Invalidação de anos afetados | MilestoneTransactionCommandTest + R17 status vivo: efeito único aprovado; snapshot imutável não oferecido |
| Correção/compensação investimento, herdado; InvestmentCorrectionService.correct:41 | Original/conta/ativo do owner | operationId próprio; original,data,motivo,taxa,reposição conferidos | investment_corrections histórico | Conta→ativo; gravação atômica | Evento do ano efetivo | I4 replay/concorrência/owner/reposição: aprovado; conflito de payload400 herdado, não novo409 global |
| Edição de nota; AnnualSummaryService.updateNote:116 | Nota do owner/ano | Sem novo protocolo de intenção | Sem recibo novo | Transação real | Cache owner/ano AFTER_COMMIT | C30 nota commit/rollback: aprovado para cache sintético |
| Edição de previsão entre fontes/anos; TransactionService.update | Fato/fontes do owner | Sem novo protocolo de intenção | Sem recibo novo | Fontes/transação existentes | Chaves de ano antigo e novo | R17 troca2026→2027 e rollback: aprovado |
| Exclusão de usuário; UserService.deleteAccount:62 | Principal | Sem novo protocolo de intenção | Sem recibo novo | Transação de exclusão | allEntries AFTER_COMMIT, alcance global herdado | C30 usuário sem vínculos: aprovado cache; R17 usuário com pagamento: rollback; contrato de exclusão vermelho RV24-02 |
| Outros writers (edição direta de saldo/cadastro de ativo etc.) | Contratos próprios | Não adotam automaticamente V13 | Não certificados pelo novo snapshot | Inspeção não equivale a cobertura exaustiva | Dependem de seus eventos | Fora da certificação transversal desta revisão |

## C. Consumidores atuais

**Aceite parcial, sem aprovação integral das jornadas.** newTransactionModal e operationModal não enviam a nova chave; os DTOs de criação/operação também não a incluem. operationId presente na resposta de transferência é vínculo interno, não prova de intenção enviada. O BFF repassa corpo/status, inclusive recuperação, com no-store; não cria chave. Receber JSON na operação de investimento continua compatível com apiRequest, mas não implementa reconciliação por si.

RV24-01 confirma que o formulário de transação libera nova submissão após ApiError com requiresReconciliation. A chamada construída nos testes backend com chave não representa esse cliente. O backend legado aceita duas chamadas sem chave e registra dois fatos; esse comportamento é documentado, mas o reenvio cego no cliente é inseguro. Fechamento pode adotar chave durável ou bloquear/reconciliar o resultado desconhecido: esta revisão não impõe a integração nova como única solução nem como requisito retroativo de DEC-10.

Pagamento preserva UUID e corpo em sessionStorage, consulta recibo e reenvia a mesma intenção após recuperação inconclusiva; perda desse armazenamento limita a garantia. Comandos de transação retêm identidade e consultam recibo; correção de investimento conserva retry da mesma chave em memória. Os 18 componentes pertinentes passaram. Isso não fecha RVA-03 nem substitui browser→BFF→backend→banco. R03/RV01 e seus testes não foram enfraquecidos.

## D. Cache e eventos no escopo implementado

**Aprovada invalidação normal após commit por proxy real**, com cache sintético: writers exercitados, nota, exclusão sem vínculos, antigo/novo ano e rollback. Listener usa AFTER_COMMIT e não possui fallbackExecution; evento fora de transação é ignorado, comportamento explicitamente testado. Eventos síncronos que aplicam efeitos financeiros/planejamento permanecem dentro da transação; não se afirmou que toda publicação de domínio ocorre depois do commit.

Falha injetada no callback após commit é registrada pelo Spring, não desfaz dinheiro/recibo e a resposta permanece200. Retry recupera o resultado sem efeito adicional. Não há outbox/retry durável da invalidação; uma entrada pode continuar presente se o callback falhar. Essa limitação é relevante antes de ativar leitores e não foi apagada para aceitar o checklist. Não existe @Cacheable de leitura: esta aprovação é de ordenação e chaves no caminho normal, não garantia universal de frescor. Repopulação por leitor antigo, múltiplas instâncias, Redis/cache distribuído, política de expiração e recuperação de falha não foram certificados.

Exclusão com pagamento falha por FK e conserva banco/cache por rollback (RV24-02). Isso não invalida a prova de AFTER_COMMIT em exclusão sem vínculos, mas impede anunciar exclusão completa. Email em UserService continua fora da certificação de efeitos externos; testes usam double e não demonstram envio após commit.

## E. Aceite próprio da CF-024 e custo

Aceite backend sustentado por contrato opcional explícito, invariantes no banco, recuperação, migração, proxy/cache, falhas induzidas e cinco mutações causais. Os dois defeitos de produto confirmados são herdados em consumidores/exclusão expressamente fora da entrega; permanecem abertos e impedem aprovação ampla desses fluxos, sem inventar que foram corrigidos. O timeout de scheduler é uma pendência de execução com causa não encerrada, preservada separadamente. O gate pertinente passou sem mudar produto ou afrouxar assertions.

Vantagem da solução: serialização por fonte e identidade, sem lock financeiro global; resultado durável permite recuperação sem reexecutar dinheiro. Custo: fingerprint e serialização O(L), armazenamento O(N×L), lookup/insert indexado O(log N), mais round trips e retenção de locks até commit. Ordenação de contas O(k log k), k≤2 na transferência. Colisão do hash64 do advisory lock pode aumentar espera, mas não altera a identidade persistida/fingerprint. Fontes muito concorridas continuam gargalos intencionais; recibos crescem e schema do snapshot precisa evolução compatível.

Correção herdada pode percorrer histórico; alocações/listas e chamadas SQL não foram declaradas O(1) sem medição. Evicção global na exclusão é mais abrangente/custosa que owner, mas preserva comportamento anterior. Não se introduziu fetch join, índice especulativo, cache de leitura ou benchmark. Sugestões de evolução: métricas de espera/409, política de retenção compatível com retry, migração versionada de snapshots e reconciliação dos consumidores; avaliar política durável de invalidação antes de habilitar leitores. São trabalhos delimitados, não alterações feitas nesta revisão.

## F. Prontidão local da CF-025

**CF-025 apta a iniciar localmente.** Dependências foram confrontadas por comportamento:

- CF-021: parecer atual aceita agregados/export consistente e posição atual; bases para medir extrato/agregados/listas estão integradas. O saneamento documenta duas queries em lote para checklist, dois agregados por escopo e export com páginas500/SXSSF100; isso é contexto, não benchmark novo ou aceite antecipado de CF-025.
- CF-022: permanece em_revisao por RJ-022-01 (interação semanal no navegador sem POST observado). DEC-08/calendário, ownership, locks e migrações backend já foram aceitos no parecer conjunto. O timeout H24-01 desta revisão merece investigação em fixtures isoladas; a repetição isolada passou e não demonstrou pré-condição financeira indefinida ou corrupção que impeça iniciar medição local.
- CF-024: invariantes/recibos/cache no recorte acima aprovados. CF-025 deve preservá-los ao modificar queries e medir contagem SQL/dataset/p95/EXPLAIN antes de otimizar. Nenhuma de suas medições/correções foi feita nesta sessão.

Não há bloqueante demonstrado para essa base local. RV24-01/02 não dependem de otimização para correção nem impedem medir consultas; não são transferidos a CF-025. Conservam-se RVA-03, RJ-022-01, H24-01, RV17-01/RV17-02, adoção real, zoom200% nativo e gates CF-027/030/032/release. Liberar início local não é liberar publicação, concluir CF-022 ou validar jornadas completas.
