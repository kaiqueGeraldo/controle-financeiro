# Inventário de schema local CF-017

Atualização de15/10/2026: este inventário narrativo é histórico. A fonte normativa
para baseline1 agora é a **V1 congelada**, confrontada com o inventário semântico
versionado e fixture independente no [saneamento local](../saneamento-CF-017/MATRIZ.md).
Entidades atuais não são oracle do legado. Cadeia integrada atual: V1–V14.
Política de adicionais e limites de equivalência estão na matriz; adoção real segue
sem autorização/comprovação e candidato aguarda revisão independente.

Fonte: entidades da revisão `2269b22`, schema `create-drop` descartável usado só
para confrontar tipos/nulabilidade e fixture SQL independente. O resultado real
de Railway **não foi consultado**.

## Tabelas e relações V1

| Grupo | Tabelas | Chaves/relações principais |
|---|---|---|
| Identidade | `users` | UUID PK; email unique; auditorias locais legadas nullable |
| Caixa | `accounts`, `categories`, `transactions` | FKs para user; transaction → account/category; `numeric(38,2)` |
| Cartão | `credit_cards`, `invoices`, `card_transactions` | invoice unique `(card_id,month,year)`; compra → invoice/category |
| Metas | `goals`, `goal_history`, `goal_items` | histórico/item → goal; protocolo `jsonb`; versões otimistas em goal |
| Hábitos | `habits`, `habit_days`, `habit_logs` | log unique `(habit_id,log_date)`; dias element collection |
| Investimentos | `investments`, `invest_transactions` | operação → investment; bank transaction unique/nullable; versão otimista |
| Planejamento | `monthly_plans`, `plan_items` | plano unique `(user_id,month,year)`; item → plan/category/card |
| Anual | `yearly_notes` | unique `(user_id,note_year)` |
| Coordenação | `shedlock` | `name varchar(64)` PK; três timestamps com precisão 3 |

São 19 tabelas de aplicação/coordenação. UUID é gerado pela aplicação. Dinheiro e
quantidades existentes usam `numeric(38,2)`; esta migração não altera precisão nem
tenta implementar FIN-01–08. Enums permanecem `varchar`; V2 adiciona checks apenas
para os novos campos de origem. Datas civis são `date`; `LocalDateTime` legado é
`timestamp(6) without time zone`; `Instant recorded_at` é
`timestamp(6) with time zone`; hora de parede é `time(0) without time zone`.

## Delta V2

| Tabela | Colunas | Nulabilidade e preservação |
|---|---|---|
| `transactions` | `operation_time`, `time_origin`, `recorded_at`, `legacy_created_at_raw` | Todas nullable; nenhum default/backfill; `created_at` intacto |
| `card_transactions` | mesmas quatro | Todas nullable; nenhum default/backfill; `created_at` intacto |
| `invest_transactions` | `operation_date`, `date_origin` | Ambas nullable; `date` intacto |

Checks admitem somente `USER_INPUT`/`NOT_PROVIDED` e
`USER_INPUT`/`PRODUCT_CALENDAR`, além de null para origem desconhecida. Não existe
valor persistido `UNKNOWN`; essa é a projeção de leitura de null.

## Índices

V1 cobre FK/filtros atuais: usuário+ordem em contas/cartões/hábitos, usuário+nome
em categorias, usuário+prazo em metas, goal+data, investment+data, plan, transação
por user+date e compra por invoice+date. Unique constraints criam os índices de
email, competência de fatura/plano, log diário, nota anual e bank transaction.

V2 acrescenta:

- `idx_transactions_user_temporal_order` em user, data descendente, expressão
  `operation_time IS NULL`, hora descendente e UUID descendente;
- `idx_card_transactions_invoice_temporal_order` com a mesma ordem por invoice.

Assim a ordenação canônica não exige ordenar toda a página em memória; busca é
tipicamente O(log N + K) com índice, contra sort O(N log N) quando o plano não o
usa. O teste de 20 mil linhas observou Index Only Scan, mas seletividade e custo
real dependem de estatísticas/volumes do ambiente alvo.

## Comparação obrigatória antes da baseline real

Extrair e comparar, no mínimo: lista de schemas/tabelas/colunas, `data_type`,
`udt_name`, `is_nullable`, precisão/escala/datetime precision, defaults, PK/UK/FK,
checks, índices/definições, sequences/extensions, versão do PostgreSQL, contagens,
tamanho total/índices, transações longas e existência/conteúdo de
`flyway_schema_history`. Qualquer coluna/tabela inesperada ou item ausente impede
marcar o banco como V1 até revisão e migração de reconciliação específica.
