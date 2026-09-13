# Contrato HTTP consumido pelo frontend

Contrato consolidado pela CF-008 a partir dos DTOs e controllers, com exemplos
sintéticos. Este documento define a fronteira do cliente; regras financeiras e a
política de isolamento por proprietário continuam nas tarefas de domínio.

## Envelope e semântica de falha

Erros produzidos pela aplicação Spring usam JSON:

```json
{
  "timestamp": "2026-09-08T12:00:00Z",
  "status": 400,
  "error": "Requisição inválida",
  "message": "A requisição possui campos inválidos.",
  "path": "/transactions",
  "fields": {
    "date": ["Valor malformado ou incompatível com o campo."]
  }
}
```

`fields` sempre é um objeto e pode estar vazio. Um campo pode ter mais de uma
violação, por isso os valores são listas. O frontend preserva esse mapa em
`ApiError.fields`.

| Status/situação | Semântica no cliente |
|---|---|
| 400/422 | `validation`; conservar formulário e associar `fields` às entradas. |
| 401 | `authentication`; em API privada emitir `sessionExpired`. Falha de login não emite expiração. |
| 403 | `authorization`; manter sessão e mostrar proibição. |
| 404 | recurso não encontrado; não implica logout. A política uniforme para ID alheio será validada na CF-023. |
| 409 | `conflict`, recuperável e exige releitura/reconciliação antes de repetir mutação. |
| 500/501 | falha inesperada do servidor; mutação exige reconciliação, sem presumir rollback. |
| 502/503/504 | `unavailable`, recuperável; mutação tem resultado desconhecido e exige reconciliação. |
| falha de rede | status local `0`, não falso 500; mutação tem resultado desconhecido. |
| AbortError | cancelamento local preservado, sem conversão para `ApiError`. |

O BFF limita a espera pelo backend a `BFF_TIMEOUT_MS` (10 segundos por padrão),
retorna 504 no limite, 503 para conexão indisponível e 499 quando o próprio
cliente cancela. O 499 é interno entre navegador e BFF e não representa falha
Spring. Corpos e cabeçalhos `Content-Type`, `Content-Disposition` e
`Cache-Control` são preservados. Resposta 204 não ganha corpo nem content type.

## Contratos consumidos

`J` significa JSON, `Ø` significa corpo vazio e `XLSX` significa bytes com
`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`.

| Serviço | Operação HTTP | Request | Sucesso |
|---|---|---|---|
| auth | `GET /auth/user` | — | 200 `UserResponseDTO` |
| auth | `POST /auth/login` | `LoginRequestDTO` | 200 `{token:string}` |
| auth | `POST /auth/register` | `RegisterRequestDTO` | 200 Ø |
| auth | `POST /auth/recover-password` | `{email}` | 200 Ø |
| auth | `POST /auth/reset-password` | `ResetPasswordDTO` | 200 Ø |
| auth | `POST /auth/logout` | — | 200 Ø |
| accounts | `GET /accounts` | — | 200 `AccountResponseDTO[]` |
| accounts | `POST /accounts` | `CreateAccountDTO` | 200 `AccountResponseDTO` |
| accounts | `PUT /accounts/{id}` | `UpdateAccountDTO` | 200 `AccountResponseDTO` |
| accounts | `DELETE /accounts/{id}` | — | 204 Ø |
| accounts | `PATCH /accounts/reorder` | `UUID[]` | 204 Ø |
| categories | `GET /categories?type=` | enum opcional | 200 `Category[]` |
| categories | `POST /categories` | `CreateCategoryDTO` | 200 `Category` |
| categories | `PUT /categories/{id}` | `CreateCategoryDTO` | 200 `Category` |
| categories | `DELETE /categories/{id}` | — | 204 Ø |
| transactions | `GET /transactions` | `page,size,accountId,type,month,year` | 200 página estável abaixo |
| transactions | `POST /transactions` | `CreateTransactionDTO` | 200 `TransactionResponseDTO` |
| transactions | `PUT /transactions/{id}` | `UpdateTransactionDTO` | 200 `TransactionResponseDTO` |
| transactions | `DELETE /transactions/{id}` | — | 204 Ø |
| transactions | `GET /transactions/export` | `Accept: XLSX` | 200 XLSX |
| cards | `GET /cards` | — | 200 `CardSummaryDTO[]` |
| cards | `POST /cards` | `CreateCardDTO` | 200 `CreditCardResponseDTO` |
| cards | `PUT /cards/{id}` | `UpdateCardDTO` | 200 `CreditCardResponseDTO` |
| cards | `DELETE /cards/{id}` | — | 204 Ø |
| cards | `POST /cards/transaction` | `CreateCardTransactionDTO` | 200 Ø |
| cards | `PATCH /cards/transaction/{id}` | `UpdateCardTransactionDTO` | 200 `CardTransaction` |
| cards | `DELETE /cards/transaction/{id}` | — | 204 Ø |
| cards | `GET /cards/{id}/invoice?month=&year=` | inteiros obrigatórios | 200 `InvoiceDetailsDTO` |
| cards | `POST /cards/{id}/pay` | `PayInvoiceDTO` | 200 Ø |
| cards | `PATCH /cards/reorder` | `UUID[]` | 204 Ø |
| planning | `GET /planning?month=&year=` | inteiros obrigatórios | 200 `MonthlyPlanDTO` |
| planning | `POST /planning` | `CreatePlanItemDTO` | 200 `PlanItemDTO` |
| planning | `PUT /planning/{id}` | `UpdatePlanItemDTO`, parcial explícito abaixo | 200 `PlanItemDTO` |
| planning | `POST /planning/copy-previous` | `CopyPreviousPlanDTO` | 200 Ø |
| planning | `PATCH /planning/{id}/status` | `UpdatePlanStatusDTO` (enum obrigatório) | 204 Ø |
| planning | `PATCH /planning/income` | `UpdateIncomeDTO` | 204 Ø |
| planning | `DELETE /planning/{id}` | — | 204 Ø |
| planning | `PATCH /planning/reorder` | `UUID[]` | 204 Ø |
| goals | `GET /goals` | — | 200 `GoalResponseDTO[]` |
| goals | `POST /goals` | `CreateGoalDTO` | 200 `GoalResponseDTO` |
| goals | `PUT /goals/{id}` | `UpdateGoalDTO` | 200 `GoalResponseDTO` |
| goals | `POST /goals/{id}/deposit` | `GoalDepositDTO` | 200 Ø |
| goals | `GET /goals/{id}/history` | — | 200 `GoalHistory[]` |
| goals | `DELETE /goals/{id}` | `targetAccountId?` | 204 Ø |
| goals | `DELETE /goals/history/{id}` | `targetAccountId?` | 204 Ø |
| goals | operações `/items` | DTO correspondente | 200 J ou 204 Ø conforme controller |
| investments | `GET /investments` | — | 200 `InvestmentResponseDTO[]` |
| investments | `POST /investments` | `CreateInvestmentDTO` | 200 `InvestmentResponseDTO` |
| investments | `GET /investments/{id}/history` | — | 200 `InvestTransactionResponseDTO[]` |
| investments | `POST /investments/operation` | `InvestmentOperationDTO` | 200 Ø |
| investments | `POST /investments/update-balance` | `UpdateBalanceDTO` | 200 Ø |
| investments | deletes de ativo/operação | — | 204 Ø |
| habits | `GET /habits` | — | 200 `HabitResponseDTO[]` |
| habits | `POST /habits` | `CreateHabitDTO` | 200 `HabitResponseDTO` |
| habits | `POST /habits/{id}/toggle` | `{date:YYYY-MM-DD}` | 200 Ø |
| habits | `PUT /habits/{id}` | `UpdateHabitDTO` | 200 `HabitResponseDTO` |
| habits | delete/reorder | — ou `UUID[]` | 204 Ø |
| dashboard | `GET /dashboard/flow?month=&year=` | inteiros obrigatórios | 200 `{income,expense,balance,percentage}` |
| dashboard | `GET /dashboard/chart?period=` | `30D\|6M\|1Y` | 200 `{label,valor}[]` |
| annual summary | `GET /annual-summary?year=` | inteiro opcional; ausente usa ano do produto | 200 `AnnualSummaryDTO` |
| annual summary | `POST /annual-summary/note` | `{year,content}` | 200 Ø |
| users | `PUT /users/me/profile` | `{nome,email}` | 200 usuário |
| users | `PUT /users/me/password` | `{senhaAtual,novaSenha}` | 200 Ø |
| users | `PATCH /users/me/preferences` | preferências parciais | 200 usuário |
| users | `DELETE /users/me` | — | 204 Ø |

Paginação de transações é deliberadamente envolvida por `PagedModel`, evitando
depender da serialização instável de `PageImpl`:

```json
{
  "content": [{ "id": "tx-1", "date": "2026-09-07" }],
  "page": { "size": 30, "number": 0, "totalElements": 1, "totalPages": 1 }
}
```

Datas civis dos DTOs usam `YYYY-MM-DD`; hora informada, quando presente, usa
`HH:mm` ou `HH:mm:ss`. Valores como `2026-02-31`, timestamp no campo civil ou
hora `24:00` retornam 400 com o campo identificado. Campos de auditoria não
fazem parte dos requests de criação.

## Limites deliberados

### Candidato P01/P02 — 13/09/2026, adoção depende da CF-017

`TransactionResponseDTO` preserva `createdAt` como alias **misto legado** e acrescenta
`time` (HH:mm:ss ou null), `timeOrigin` (USER_INPUT/NOT_PROVIDED/UNKNOWN),
`recordedAt` (instante com offset, UTC na API, ou null) e `legacyCreatedAtRaw`.
Hora omitida/null em POST significa não informada. Em PUT, omissão preserva; null
remove somente a hora informada. Date omitida preserva; null explícito é 400.
Meia-noite explícita é conhecida. Edição não altera recordedAt e conserva o bruto
original mesmo quando precisa atualizar o alias createdAt por compatibilidade.
O instante é capturado do Clock do servidor uma vez por operação, armazenado em
microssegundos; não é reconstruído para linhas históricas.

Requests financeiros rejeitam campos temporais exclusivos da resposta, inclusive
null, com erro de campo 400: recordedAt, createdAt, legacyCreatedAtRaw, timeOrigin,
dateOrigin, operationDate e legacyDateRaw. Nenhum desses campos concede proveniência.

Histórico de investimento: `date` civil somente quando há origem persistida
USER_INPUT ou PRODUCT_CALENDAR. Linhas antigas retornam `date:null`,
`dateOrigin:UNKNOWN` e `legacyDateRaw` intacto. Tipo/prefixo/meia-noite não são prova.
Histórico de metas possui outro contrato e não usa esse adaptador.

Detalhe de fatura e PATCH `/cards/transaction/{id}` retornam CardTransactionDTO
com os mesmos metadados de hora/auditoria. PATCH mantém apenas descrição/categoria
como campos editáveis e preserva os metadados; a entidade JPA não é serializada.
Campos de relacionamentos internos não integram esse DTO. A compra POST mantém 200
sem corpo, conforme consumidor existente. O formulário de compra, pagamento e
transação permite limpar a hora, enviando null; default visível intocado continua
sendo enviado como mostrado, conforme SPEC-002 DEC-01.

Os adaptadores tratam perfis antigos/novos: ausência de origem não recebe hora do
alias nem uma data operacional inferida. Compacto usa — com nome acessível;
detalhe conserva bruto com Fuso desconhecido. Auditoria sem offset não é aceita
como instante. Excel usa hora canônica ou —. Ordem de extrato/fatura: dia civil
decrescente, horas conhecidas decrescentes, desconhecidos depois, ID decrescente.
GET de extrato ignora sort recebido para conservar essa ordem global paginada.
Histórico de investimento usa dias comprovados e ID, desconhecidos depois;
jamais ordena bruto desconhecido como instante.

[Adoção, colunas, rollout e limitações](../../../tasks/03-integridade/CF-017-P01-P02-adocao-temporal.md).
Não publicar backend candidato antes das colunas nem misturar writers de versões
antigas/novas. Sem inventário remoto, backup, migrador e proveniência, P01/P02 não
estão concluídos e CF-017 permanece proposta.

### Demais limites

- Competências usam mês 1–12/ano 1–9999. Transações permitem omitir ambos
  para usar o mês do produto; par parcial, vazio ou inválido é 400. Ano vazio
  do resumo também é 400. Corpos JSON de competência rejeitam frações/strings.
- Exportação só aceita o MIME XLSX esperado; JSON ou HTML com status 200 não
  viram download válido. JSON malformado após escrita exige reconciliação.
- Resposta de uma leitura já cancelada não emite expiração de sessão.
- P03: `PUT /planning/{id}` edita descrição não vazia (máx. 255), valor positivo,
  vencimento civil válido na mesma competência e categoria própria opcional.
  Omissão preserva cada campo; corpo vazio relê sem alterar. `categoryId: null`
  remove categoria; null nos outros três campos e categoria vazia/malformada são 400.
  Status, ordem, plano/proprietário e vínculo com cartão não são editáveis por este
  endpoint (inclusive null); campos desconhecidos são 400 com campo identificado.
  Item inexistente/alheio e categoria inexistente/alheia são 404 indistinguíveis,
  sem escrita parcial. Item vinculado ao cartão é gerenciado pela fatura e recebe 400.
  O modelo atual não tem outro flag de gestão automática em PlanItem; não inferir
  gestão por descrição/categoria. A edição não realiza pagamento, não move entre
  competências e preserva status, ordem e plano. Restrição de competência explícita
  na UI; eventual movimentação é outra operação a definir na CF-013.

- O cliente tipa os responses consumidos, mas ainda não executa validação de
  schema em runtime para cada resposta 200; incompatibilidades futuras exigem
  testes de contrato adicionais ou um validador dedicado.
- CF-023 deve substituir os `BusinessRuleException("Acesso negado")` legados
  por uma política uniforme que não revele se um ID pertence a outro usuário.
  Não foi feita classificação por texto de mensagem, pois isso acoplaria status
  HTTP a idioma e seria frágil.
- Timeout após mutação não prova rollback nem commit. `requiresReconciliation`
  impede retry ingênuo, mas idempotência e concorrência pertencem às CF-009/024.
