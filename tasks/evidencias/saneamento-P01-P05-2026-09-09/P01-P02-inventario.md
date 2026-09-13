# P01/P02 — inventário e decisão de compatibilidade, 13/09/2026

Inspeção anterior à implementação: SPEC-002 DEC-02/05, inventário CT-01/02/03/04/10/11/12,
entidades, DTOs, TransactionService/AccountService/GoalService/InvestmentService/
CreditCardService/InvoiceBankOperationListener, extrato/detalhes/histórico/Excel.
Schema observado é somente o modelo e PostgreSQL descartável, não Railway.

| Campo legado | Evidência disponível | Informação irrecuperável sem trilha externa |
|---|---|---|
| transactions.date, card_transactions.date | Coluna civil LocalDate independente | Não exige inferir offset; conservar dia |
| transactions.created_at | LocalDateTime obrigatório; input ou fallback atual; edição reescreve | Hora informada versus fallback; instante de registro original |
| card_transactions.created_at | Compra, adiantamento e saldo rolado; obrigatório | Hora informada versus fallback; registro original |
| invest_transactions.date | LocalDateTime obrigatório: operação manual atStartOfDay e ajuste now | Civil manual versus instante automático; zona histórica |

Meia-noite, tipo BUY/INTEREST, prefixo da descrição, isSystemManaged e fuso atual
não são prova. Nenhum backfill sem evidência de origem por linha/lote será feito.
GoalHistory.date tem outro significado e não receberá o conversor de investimento.

Sem schema: é possível rejeitar auditoria no request e construir adaptadores de
leitura explícitos. Não é possível preservar, após reload/restart, a distinção de
hora omitida versus 00:00 nem a origem de novas operações de investimento usando
somente os campos antigos. Marcar todas as datas novas como desconhecidas evitaria
inferência, mas perderia o aceite já exigido de data civil explícita após reload.

Decisão: preparar adoção aditiva com armazenamento explícito e verificar somente
em PostgreSQL descartável. Linhas antigas recebem metadados null, sem auditoria
inventada; original bruto permanece preservado. Novos writers registram origem,
hora informada opcional e instante real capturado do Clock uma vez por operação.
O alias createdAt legado permanece documentado como misto, nunca como auditoria.
Quando sua compatibilidade exigir reescrita na edição, preservar antes seu valor
original em coluna separada; recordedAt não muda.

Destino coordenado: investimento ganha operation_date/date_origin; transação e
compra ganham operation_time/time_origin/recorded_at/legacy_created_at_raw.
Campo com origem null é desconhecido, mesmo que o bruto pareça uma data válida.
Somente o writer com input civil ou calendário de produto comprovado preenche
operation_date/date_origin. Somente hora explícita preenche operation_time.

**Dependência concreta:** inventariar schema real, baseline/migrador, backup/restore,
upgrade/reversão e rollout DTO/consumidores via tarefa derivada da CF-017. O candidato
SQL e os autotestes sintéticos não executam nem concluem a CF-017. O código que
espera colunas novas não pode ser publicado antes desse rollout. P01/P02 permanecem
abertos quanto à migração do banco existente e proveniência histórica.
