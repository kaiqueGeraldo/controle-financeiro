# Matriz CF-023 — proprietário, referência alheia e ausência de sessão

Contrato: [CONTRATO](CONTRATO.md). A matriz de autenticação inventariou os 80
métodos/rotas privados registrados; 320 requests reais de MockMvc, com
serializador/filtro/controllers/Spring/PostgreSQL, cobrem as quatro credenciais
ausente, malformada, assinatura inválida e expirada exatamente em 24h. Todos
retornam JSON401 idêntico em message/status/fields, sem escrita SQL. OPTIONS/CORS
e as quatro rotas públicas de autenticação não são classificados como privados.
Isso não significa 320 jornadas de navegador nem sucesso legítimo de toda
mutação: a regra de autenticação é medida antes da validação de seu payload.

50 casos parametrizados usam payload válido e UUIDs reais de B, comparando
também com UUID inexistente. Cada caso compara snapshots SQL de todas as tabelas
do schema exclusivo antes/depois e status/error/message/fields entre alheio e
ausente; timestamp/path são variáveis por contrato. O snapshot é JSON bruto
ordenado por linha, resumido em MD5 apenas para não despejar valores/senhas no
diff da assertion. Nenhum cálculo da aplicação define o expected.

| Rotas e métodos / referência | Controle próprio | A com referência de B | Não autenticado / teste |
|---|---|---|---|
| GET contas/posição, categorias, cartões, metas/compras, investimentos, hábitos | Fixtures reais e leituras alternadas A/B; contas1000/2300 | Listagem nunca contém conta alheia; referências individuais abaixo são404 | 401 em todos; `ownerControlsAndAlternateReadsKeepExactBalancesAndSecretsHidden` |
| PUT/DELETE accounts/{id}; PATCH accounts/reorder | Criar conta e reorder válido204/ordem0 | 404; mistura próprio/alheio e próprio/ausente não muda ordem7 nem versões | 401; casos50 e reorders |
| PUT/DELETE categories/{id}; categoryId em compra/planejamento/transação | Criação e leitura própria | 404 para alvo/categoria alheios; nenhuma nova linha | 401; casos50 |
| GET cards/{id}/invoice; PUT/DELETE cards/{id}; PATCH/DELETE cards/transaction/{id}; POST cards/transaction | Compra e invoice próprias persistidas | 404 para cartão/transação/categoria alheios, igual a ausente | 401; casos50 |
| POST cards/{id}/pay; GET cards/{id}/payments/{operationId}; PATCH cards/reorder | Pagamento B10 e recibo B200 após commit; reorder204 | 404 para cartão, conta de origem ou recibo de B, inclusive recibo B em cartão A; conta A intacta | 401; `transactionAndPaymentReceiptsAreOwnerBoundAfterRealCommit` + casos50 |
| GET goals/{id}/history e /allocations; PUT/DELETE goals/{id}; POST /deposit e /items; DELETE goals/history/{id} e goals/items/{id} | Criação, histórico numérico e checklist persistidos | 404 de meta/item/histórico, igual a ausente; progresso preservado | 401; casos50 |
| PUT goals/{id}/allocations; PATCH goals/items/{id}/purchase; POST /refund; PATCH /items/reorder | Compra10, exclusão, reembolso legítimo204; reorder próprio204 | Fonte/meta/item alheios404, sem débito/destinação; reembolso após exclusão exige owner; item de outra meta do próprio owner é recusado | 401; casos50, `investmentCorrectionsAndDeletedGoalItemRefundCannotCrossOwners`, reorders |
| POST investments com goalId; GET /{id}/history e /corrections; DELETE /{id}; POST /operation e /update-balance; POST /operation/{id}/corrections; DELETE /operation/{id} | Criação e aporte B10 reais; história/posição lidas | 404 para meta/ativo/conta/operação de B, sem fato econômico parcial | 401; casos50 + correções/reembolso |
| POST/PUT/DELETE habits, POST /{id}/toggle, PATCH /reorder | Fixtures e comandos próprios; consumidores CF-022 no gate completo | Hábito/meta numérica de B404; monetária própria continua400; mixed reorder404 | 401; casos50 + reorders; `HabitIntegrityIntegrationTest` |
| POST/PUT/DELETE planning; PATCH /{id}/status e /reorder | Criação/leitura/reorder próprios | Item/categoria alheios404, sem persistência parcial | 401; casos50 + reorders |
| POST/PUT/DELETE transactions; POST /{id}/settlements e /reversals; GET /commands/{id} | Previsão40/baixa10 e reciboB200 | Transação/conta/categoria/recibo de B404, banco inalterado | 401; casos50 + recibos |
| GET transactions/summary e /export, filtros accountId | XLSX real A contém EXPORT-A10; B contém EXPORT-B70; leituras A/B/A e entries10/70/10 | Filtro B/ausente404, sem planilha de sucesso; export não converte404 em400 | 401; `exportAndFilteredAggregatesCannotLeakAnotherOwner` |
| GET planning, dashboard/flow, dashboard/chart, annual-summary, auth/user | A/B/A/B no mesmo contexto; propriedade de posição literal | Respostas/estado não carregam conta ou credencial do outro usuário | 401; owner controls; nenhum Cacheable financeiro ativo na base |
| PUT users/me/profile; PATCH users/me/preferences | DTO público com UUID do autenticado | Corpo nunca serializa senha/password/authorities/recoveryToken | 401; `profileAndPreferenceResponsesCannotSerializeCredentials` |
| POST auth/recover-password e /reset-password | Double de e-mail; sucesso consome código; três erros persistem contador e invalidam | Código A não altera B; conhecido/desconhecido tem mesmo corpo200 de recuperação | Público; tests de recovery; expiração exata10min400, senha/estado preservados |
| POST auth/logout, cookie/actions/BFF e navegação /contas | A/logout/B/reload/404/logout/A/reload; duas abas | Cookie apagado; aba antiga esvaziada; 404 mantém B; saldos1000/2300 após novas leituras e SQL | Logout Spring privado401 sem credencial; API pós-logout401; browser real + tests frontend |

Os comandos /transactions/{id}/realizations, goals/{id}/allocations/move,
planning/copy-previous e annual-summary/note estão no inventário privado401 e
têm consumidores/regras exercitados na suíte existente (345 testes). Nesta
auditoria não receberam uma nova matriz independente de todas as permutações
de referência/tipo/owner. O gate não deve ser descrito como pentest exaustivo.
Também não foi exercitada exclusão completa de usuário com todas as relações
financeiras; a propriedade do principal é separada da correção desse fluxo.

Recibos/correções/operações legítimas mudam somente B: baixa10+pagamento10
produzem2280; aporte10+compra10+reembolso10 produzem2290. Esses expected são
literais do cenário, e os ataques são medidos entre snapshots depois do setup.
Banco real, e-mail real, terceiro, carga e publicação não participam da matriz.
