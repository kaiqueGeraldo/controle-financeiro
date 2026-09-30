# Matriz da revisão independente CF-023

Contrato: DEC-09/AC-FIN-005 e [CONTRATO original](../CF-023/CONTRATO.md).
Fixtures A/B usam UUIDs novos, conta1000/2300, ordem7 e SQL antes/depois.
`E` significa execução real desta revisão; `I`, inspeção estática; `H`, evidência
histórica já revisada. MockMvc tem filtro/serializador/controllers/serviços/ORM/PG
reais. HTTP controlado em componente não é classificado como PG/browser.

| Método/rota ou grupo | Referência/critério | Prova desta revisão | Alcance |
|---|---|---|---|
| Todas as rotas privadas registradas | Sem token, malformado, assinatura errada, expirado no limite exato24h | E: everyPrivateMappingRejectsMissingMalformedInvalidAndExpiredTokens; 320 requests, JSON401, snapshot SQL idêntico. Inventário gerado do HandlerMapping em endpoints-401.tsv. | Autenticação antes do payload; não equivale a sucesso nem ownership de80 comandos. |
| GET /auth/user; Bearer em /accounts | UUID assinado corresponde ao registro; reciclagem de email não autentica B | E: identityMustSurviveEmailRecycling/authorizationHeaderMustBeBearer; I: TokenService/SecurityFilter; mutação signed-principal | Email sozinho deixa de ser identidade; JWT não revogado por logout é limite contratado. |
| PUT/DELETE /accounts/{id}; PATCH /accounts/reorder | AlvoB/ausente, mixed reorder, controles próprios | E: casos parametrizados + mixedReorders/everyReorderSupportsOwnerAndRejectsDuplicateNullAndSameOwnerWrongParent; SQL integral conservado; mutação owner falha4/4 | Ordenação valida lote antes de alterar. |
| PUT/DELETE /categories/{id}; categoryId nos writers | CategoriaB/ausente em recursoA | E: casos50 e controles; I: predicados por owner | Não há gravação parcial; a matriz original detalha payload por writer. |
| GET /cards/{id}/invoice; PUT/DELETE /cards/{id}; POST/PATCH/DELETE /cards/transaction... | Cartão/transação/categoriaB | E: casos50, mesmos404 e campos, snapshot SQL | Controle de compra/fatura; não certifica todo ciclo bancário. |
| POST /cards/{id}/pay; GET /cards/{id}/payments/{operationId} | Conta/cartão/reciboB, inclusive reciboB em cartãoA | E: casos50 + transactionAndPaymentReceiptsAreOwnerBoundAfterRealCommit | Recibo só recuperado por owner e parent; sem débito recusado. |
| GET /goals/{id}/history,/allocations; POST /deposit,/items; PUT/DELETE /goals/{id}; DELETE /goals/history/{id},/goals/items/{id} | Meta/item/históricoB/ausente | E: casos50 e snapshots; GoalWriters pós-reload nos três defaults reais | DTO/Clock/contribuição sem segredo; meta monetária própria continua erro de regra. |
| PUT /goals/{id}/allocations; POST /goals/{id}/allocations/move | Fonte/meta/destinaçãoB/ausente | E: casos50 + independentAllocationMoveRejectsEveryForeignReferenceBeforeWriting (quatro referências; destino próprio nos casos de origem) | Fecha lacuna de probe novo de move; valida mensagem e SQL integral, sem inferir cobertura por contagem. |
| PATCH /goals/items/{id}/purchase; POST /refund; PATCH /goals/{id}/items/reorder | Fonte/itemB, parent errado, compra após excluir intenção | E: casos50 + investmentCorrectionsAndDeletedGoalItemRefundCannotCrossOwners + wrongGoalItemReorder + reorders de outro parent próprio | Fato/recibo permanece com owner após exclusão; compensação legítima de B não afeta A. |
| POST /investments com goalId; GET /{id}/history,/corrections; DELETE /{id}; POST /operation,/update-balance; POST /operation/{id}/corrections; DELETE /operation/{id} | Ativo/meta/conta/operaçãoB | E: casos50, corrections/refund e snapshots; I: InvestmentService/CorrectionService | Compensação mantém original e ownership; matriz não cobre todas as combinações de tipo/fonte. |
| POST/PUT/DELETE /habits; POST /{id}/toggle; PATCH /reorder | Hábito/metaB/ausente | E: casos50 + reorders + HabitIntegrityIntegrationTest no gate | Contribuição/SQL não ocorrem em recusa; contratos temporais permanecem. |
| POST/PUT/DELETE /planning; PATCH /{id}/status,/reorder | Item/categoriaB | E: casos50 + reorders | Validação precede mutação; snapshot do schema. |
| POST /planning/copy-previous | Corpo com userIdB não seleciona planoB | E: independentNoteAndCopyPreviousUsePrincipalInsteadOfInjectedOwner; SQL plano outubroA=1/B=0, saldoB2300 | Escopo vem do principal, não de um ID de plano no DTO. |
| POST/PUT/DELETE /transactions; POST /{id}/settlements,/reversals,/realizations; GET /commands/{id} | Transação/conta/categoria/reciboB | E: casos50 + receipts + independentRealizationForeignAndMissingAreUniformAndDoNotWrite | Novo probe de realizations comparaB/ausente e todas as tabelas, incluindo intenções; nenhuma intenção parcial. |
| GET /transactions/summary,/export, filtro accountId | FiltrarB/ausente404; XLSX legítimo só do owner | E: exportAndFilteredAggregatesCannotLeakAnotherOwner e leitura A/B/A | Sem arquivo de falso sucesso na recusa; conteúdo EXPORT-A10/EXPORT-B70. |
| GET listas,/accounts/position,/annual-summary,/dashboard... | Agregados A/B/A/B; saldo literal e ausência de outro owner/segredo | E: ownerControlsAndAlternateReadsKeepExactBalancesAndSecretsHidden | Cacheable financeiro não está ativo; I: request no-store/BFF e coordenação por userId. |
| POST /annual-summary/note | userIdB injetado não muda notaB | E: independentNoteAndCopyPreviousUsePrincipalInsteadOfInjectedOwner, releitura dos dois owners | NotaA e notaB permanecem distintas. |
| PUT /users/me/profile; PATCH /users/me/preferences | Perfil público não serializa password/authorities/recoveryToken | E: profileAndPreferenceResponsesCannotSerializeCredentials; I: UserResponseDTO | Não retorna entidade UserDetails ao cliente. |
| POST /auth/recover-password,/reset-password | Expiração10min/consumo/tentativas; códigoA não alteraB | E: recovery tests e CredentialExpiryClockTest no gate345; double de email; I: corpo/logs | Nenhuma comunicação real. Sem alegar concorrência/brute-force/timing completos. |
| Cookie/actions/BFF; logout e /contas | A→logout→B→reload→404→logout→A→reload, duas abas | E: UserIsolationBrowserIntegrationTest, capturas inspecionadas e SQL1000/2300; componentes157/157 | Navegador real/BFF/Spring/PG. 404 conserva a sessãoB. |
| Leituras/callbacks tardios, 401/403 e falhasHTTP | Não ressuscitarA nem exibir sucesso em falha | E: async-state, user-session-review, cf023-session-invalidation, BFF/auth tests no conjunto157; I: useRequestCoordinator/apiRequest | Componentes com HTTP controlado; abort ignorado ainda é protegido por revisão/scope. Intenções sessionStorage particionadas por owner. |

O [inventário/agrupamento anterior](../CF-023/MATRIZ.md) foi confrontado com os
controllers e serviços atuais. Move, realizations, copy-previous e annual-note
recebem probes novos nesta revisão, em vez de serem promovidos por inspeção.
Ramos como exclusão completa de usuário e toda permutação de investimento não
recebem selo de execução integral. Erro por regra própria400/409, ownership404 e
credencial401 continuam classes distintas. OPTIONS/CORS e quatro rotas públicas
de autenticação não integram os80 métodos privados.

BroadcastChannel foi executado no Chromium; ausência de fallback e JWT stateless
são limites declarados do contrato, sem requisito novo de revogação/fallback.
Não encobrem o defeito antigo de aba autenticada que conservavaA, agora coberto
pelo browser e pelas regressões de consumidores.
