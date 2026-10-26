# Fontes de escrita e efeitos inventariados

Base 46b85ee; inspeção de controllers, serviços, @Scheduled, @Async,
@EventListener, @TransactionalEventListener e inicializadores. Nenhum consumidor
Kafka/Rabbit ou runner de negócio encontrado; não representa uma promessa sobre
código futuro ou executores externos.

| Entrada | Escrita/efeito relevante | Controle no candidato |
|---|---|---|
| AuthController /auth | register cria usuário/categorias/carteira/default identity e email; recover/reset alteram token/tentativas/senha; login é leitura/JWT; logout stateless | Todo ingresso fechado em manutenção; email também verifica writers |
| AccountController /accounts | criar/editar/arquivar/reordenar, abertura e saldos | Filtro antes dos serviços; domínio/transações/ownership preservados |
| CategoryController /categories | criar/editar/excluir/reordenar | Mesmo filtro |
| TransactionController /transactions | criação/edição/exclusão, liquidação, transferências, cancelamento e recibos/replay; export/lista/summary | Mesmo filtro inclusive export/GET; sem alterar semântica de comandos |
| CreditCardController /cards | cartão/compra/parcelas/fatura/pagamento/estorno/cancelamento | Mesmo filtro; **GET de invoice pode criar invoice e reconciliar plano** |
| InvestmentController /investments | criar/editar/operações/valoração/ajustes/correções e metas associadas | Mesmo filtro |
| GoalController /goals | criar/editar/excluir/alocar/comprar/reverter; histórico/allocations/purchases | Mesmo filtro inclusive GET |
| HabitController /habits | criação/edição/log/check-in/exclusão e efeitos em metas | Mesmo filtro |
| PlanningController /planning | itens/status/renda/cópia/exclusão; **GET cria MonthlyPlan ausente** | Fechar também leituras é necessário |
| OnboardingController /onboarding | rascunho/finalização/recuperação/recibos | Mesmo filtro; replay e fronteiras existentes preservados |
| UserController /users/me | configurações/exclusão de usuário e vínculos | Mesmo filtro |
| DashboardController, AnnualSummaryController, FinancialIntentController e demais rotas | Leituras/resumos/recibos; não se presume ausência de efeito indireto | Fechamento padrão também cobre rotas novas/desconhecidas |
| HabitCronService.processDailyHabits | pagina IDs, transações por hábito, logs/streaks | Nenhum scheduling registrado se jobs ou writers false |
| InvoiceCronService.processInvoiceClosing | fecha faturas com lock/transação; email após commit | Mesmo gate de registro, mais barreira de envio |
| MarketDataService.updateVariableIncomePrices | fixedRate com primeira execução imediata; Brapi em lotes, preço/avaliação por ativo | Mesmo gate; contraprova normal observa execução/ShedLock sem tickers externos |
| NotificationCronService (dois métodos agendados) | leitura de contas/transações e envio de notificações diário/semanal | Mesmo gate e barreira de email |
| InvoicePlanningListener / InvoiceBankOperationListener | eventos síncronos alteram plano/transações na operação de origem | Fontes HTTP/jobs fechadas; listeners não foram desativados no meio da transação |
| CacheInvalidationListener | AFTER_COMMIT invalida caches locais | Mantido para coerência de commits permitidos; sem nova fonte de ingestão |
| EmailService.sendTemplatedEmail | único @Async de negócio, executor com fila | Retorna antes de construir Resend se writers false; sem cancelamento retroativo |
| ControleFinanceiroApiApplication.init | PostConstruct ajusta TimeZone, sem SQL | Preservado |
| Flyway / Hibernate / SQL init | Inicialização de schema | Perfil adoption + guard antes do refresh; migration job separado |
| Scripts SQL, CLI, Maven, operadores e outras réplicas | Podem escrever fora do HTTP/scheduler deste processo | Não cobertos pela flag; exclusividade e freeze exigidos no runbook |

As cinco tarefas agendadas usam uma única habilitação condicional; a anotação
duplicada da classe principal foi retirada. A desabilitação não depende de
`spring.task.scheduling.enabled` (que não neutralizava o EnableScheduling manual).
Serviços permanecem presentes para consumidores internos/testes explícitos, sem
reescrever regras financeiras ou introduzir locks adicionais em cada operação.

Concorrência: flags imutáveis e leitura O(1), sem corrida de troca em runtime e sem
consulta extra no filtro. Processo antigo precisa drenar/parar antes do novo;
30s é orçamento de shutdown, não garantia universal de cancelamento de SQL/email.
ShedLock coordena jobs habilitados no contrato existente, não congela writers HTTP
ou scripts. Não introduzimos coordenação distribuída, índices, queries N+1 ou
mudanças no particionamento de domínios neste lote.
