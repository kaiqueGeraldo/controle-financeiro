# Writers, transações e janela revalidação→commit

Candidato `89760e6`, inspecionado em 20/10/2026. Caminhos abaixo relativos a
`controle-financeiro-backend/src/main/java/com/controlefinanceiro/api/`.
Não se infere segurança apenas da presença de um annotation ou de um teste verde.

## Protocolo encontrado

`FinancialInventoryGuard` usa advisory lock transacional PostgreSQL: shared para
writers, exclusivo para snapshot/aplicação/cancelamento/exclusão. Chave inclui
owner; intenção tem namespace distinto. Orçamento de espera é o menor entre o
vigente e 5s. Não limita duração da transação. Guard exige MANDATORY.

| Caminho efetivo | Recursos/invariantes | Locks e ordem / fronteira | Proteção adicional e avaliação |
|---|---|---|---|
| OnboardingApplicationService.prepare/complete/cancel | Inventário completo, sessão, posições, reservas e recibo | Intenção → guard exclusivo → users; complete mantém todos até commit; Openings/Intents MANDATORY | Sessão por owner, PK intenção, índices parciais PREPARED/COMPLETED e PK mapping; replay antes de versão consumida |
| OnboardingDraftService.save/PAUSE/RESUME/DISCARD | Conteúdo, versão, status, issues persistidas | users FOR UPDATE → sessão; transação única; não precisa do guard financeiro | Não adquire fontes/intenção; não forma ciclo inverso com guard. PREPARED impede escrita; GET RR recupera issues salvas |
| AccountService.create/update/delete(archive)/reorder | Universo, saldo de abertura, tipo, estado e versão | shared antes da leitura/escrita; archive trava fonte | @Version; abertura é stock. Reorder também muda token da linha inteira, conservador |
| TransactionService.create/transfer | Contas, uso de default, reservas em transferências | FinancialIntents primeiro quando há chave → shared → contas ordenadas | Transação engloba pernas/taxa/recibo; versões e origem financeira |
| TransactionService.update/settle/delete/reverse/realizeTransfer | Saldo, uso de conta, realização de previsões | Comando/idempotência quando aplicável → shared → contas ordenadas → ledger | Revalidação de fonte depois do lock; FK/versão e recibos próprios |
| InvestmentService.create/performOperation/updateBalance/deleteInvestment/deleteTransaction | Universo, quantidade, avaliação/custo, conta e vínculo com meta | Intenção antes do shared em operação; shared → conta → investimento nos comandos econômicos | @Version, validação de disponibilidade/quantidade; MONETARY rejeita comando cotidiano por unidades explicitamente |
| InvestmentCorrectionService.correct | Conta, replay econômico, posição e custo | shared → conta → investimento | Mesma transação de correção/história/efeito; não usa REQUIRES_NEW |
| MarketDataService → MarketPriceWriter.update | Avaliação que compõe valor/capacidade | Rede termina antes; bean separado @Transactional → shared → investimento owned com lock | Releitura protegida antes de avaliar; somente UNIT. Nenhuma cotação de rede nos testes |
| GoalService.addValue/setAllocation/moveAllocation | Reservas, capacidade por fonte e progresso | shared → fontes (A antes I, IDs ordenados no move), depois gravações | Uniques dos pares, versões de fonte/meta/alocação. Não depender só de @Version da meta para capacidade |
| GoalService.create/update/delete/history/item/purchase/refund | Universo/metas, reserva, conta, dívida e progresso | shared no início; source locks nos caminhos financeiros; compra cartão delega a serviço guardado na transação existente | Fonte é owner-scoped; purchase/history mantêm fatos. Variações internas de lock não são prova universal de ausência de deadlock |
| CreditCardService.create/update/delete/reorder/createTransaction/updateTransaction/recordOpeningPosition/refund | Universo, dívida, crédito, configurações, linhas | shared antes de recursos; card lock nos caminhos financeiros; pagamento tem intenção própria antes do shared | FKs e card lock; novo componente principal/encargos precisa ser consumido corretamente: achado RC030-01 |
| CreditCardService.payInvoice → InvoiceBankOperationListener | Dívida/crédito e conta pagadora | intenção pagamento → shared → cartão → conta no listener síncrono | Listener herda transação/guard. Não é writer solto; sua ordem card→account pode competir com caminhos account→card, gerando abort recuperável |
| CreditCardService.getInvoiceDetails | Cria fatura, apesar de nome de consulta | shared → cartão → getOrCreateInvoice, @Transactional | Unique cartão/competência; participa porque altera inventário |
| InvoiceCronService.processInvoiceClosing | Status das faturas | Lista candidatas fora; TransactionTemplate por fatura → shared → cartão → fatura; relê status | Email apenas após retorno/commit. ShedLock não substitui proteção por owner |
| CategoryService.create/update/delete | Tipo/identidade das categorias de previsão | shared antes de consulta/escrita, @Transactional | Token guarda id/type das categorias referenciadas; FK protege desaparecimento |
| HabitService.create/toggle/update/delete | Pode alterar progresso de meta numérica | shared antes de hábito/log/meta; transação única | Versões/locks de hábito/meta. Reorder visual não altera inventário; ausência de guard justificada |
| UserService.deleteAccount | Grafo inteiro, novas tabelas e recibos | exclusivo → users → exclusões em ordem FK; transação única | Limpa default/history/records; sessão cascade limpa preparation/mapping; recibos explícitos; verifica vínculos legados alheios |
| AuthService.register → DefaultAccountIdentity.record | Novo owner/default | Transação de criação ainda invisível; record MANDATORY após saveAndFlush | FK composta owner/account e unique; não há owner previamente visível concorrente |

PlanningService escreve planos/itens, não liquida transações nem altera saldo/reserva
ou fontes consumidas na confirmação. HabitCron altera status/streak de hábito sem
contribuição monetária/numérica à meta. AnnualSummary.updateNote, preferências e
notificação não alteram invariantes financeiros do snapshot. A ausência de guard
nesses caminhos não foi classificada automaticamente como defeito. Alterações no
modo NEW/COMPLEMENT são informativas e não dão autorização para sobrescrever.

## Evidência dinâmica independente

`OnboardingReviewConcurrencyTest` pausa **dentro da transação real**, na entrada do
adaptador de escritas, depois dos dois testes de frescor. O spy delega ao código
real; não calcula saldo nem substitui regra. Espera por pg_blocking_pids ou término
do concorrente, sem sleeps. Serviços chamados pelo proxy abrem transações em threads
distintas; consultas de observação/recovery usam outra conexão.

- Fonte1000, onboarding reserva600, GoalService concorrente reserva600 a outra
  meta: writer espera e depois é recusado; reserva persistida600.
- Replay da mesma preparação espera o commit e retorna recibo idêntico; apenas
  um recibo. Durante a espera, outro owner conclui.
- Antes do commit, leitura independente ainda vê contas0, nenhum investimento
  ou mapping, e PREPARED. Falha depois de todos os itens reverte; retry com a
  **mesma** identidade funciona e E01 permanece1451/reservas550.
- Cancel/discard que perdem para complete não anunciam cancelamento/edição.
- Exclusão concorrente espera a aplicação e apaga integralmente o grafo comitado.

Contraprova na cópia isolada remove **somente** o shared guard de
GoalService.setAllocation. O writer real passa entre revalidação e gravação:
reserva total1200 de fonte1000; assertion esperava600. Falha causal, não timeout,
erro de compilação ou simples presença de lock. Arquivo restaurado por SHA256;
controle positivo separado registrado em EXECUCOES.

## Conclusão e limites

Não foi encontrada corrida de aplicação no protocolo dos writers enumerados.
A janela crítica foi exercitada com um writer financeiro independente; outros
caminhos foram inspecionados, não se declara teste simultâneo de cada combinação.
Uniqueness não protegeria sozinha a capacidade; a contraprova demonstra necessidade
concreta do guard. SQL administrativo e novos writers não participantes permanecem
fora da garantia, sem certificação de adoção real.

Owners distintos têm chaves distintas, com risco teórico de colisão do hash
advisory causando contenção, não acesso cruzado. Shared preserva concorrência entre
writers cotidianos, mas exclusivo serializa todo o owner e pode causar409 em
operações longas. Locks internos card→account versus account→card e carga de
produção não estão provados livres de deadlock; PostgreSQL aborta, e handlers
transformam falhas de lock em conflito recuperável. Não há retry cego no onboarding.
