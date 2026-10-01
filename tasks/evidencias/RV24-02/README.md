# RV24-02 — saneamento transacional para revisão independente

01/10/2026, America/Sao_Paulo; base `30211b8`. **em_revisao**, sem autoaprovação.
Nenhum usuário/banco real foi excluído ou limpo. Sem email real, push ou deploy.
README raiz preservado pelo mesmo SHA informado em [RV24-01](../RV24-01/README.md).
CF-027 não executada; nenhum serviço foi movido/reorganizado.

## Contrato e causalidade

O contrato vigente é a limpeza completa autorizada dos dados do principal,
atômica, preservando todos os dados de outro proprietário. Não é estorno de cada
fato: na exclusão integral os dados do owner são removidos em conjunto. O contrato
da CF-024 conserva invalidação global herdada de cache **após commit**, sem certificar
cache de leitura em produção. ADR-004 exige efeitos externos após commit.

[Contrato original vermelho](original-contract-red.log), [XML](original-contract-red.xml):
pagamento50 alocado ao fato herdado de abertura200; DELETE de CardTransaction
antes da alocação viola `card_payment_allocations_card_transaction_id_fkey`.
Expected de exclusão continua doesNotThrowAnyException. Foi executado antes de
alterar UserService. A FK/rollback são reais, não erro de infraestrutura.

A contraprova adicional [paid-purchase-red/](paid-purchase-red/result.json)
recoloca **somente UserService de30211b8** numa cópia isolada, mantendo o teste
atual: compra comum25 criada/paga pelos serviços, originPURCHASE, paid_amount25
e alocação25. A exclusão falha pela mesma FK; zero errors/skips. O script confere
que o UserService atual do checkout permaneceu byte a byte igual. Assim, a prova
não depende apenas de um lote de abertura. [Reprodução](reproduce-paid-purchase.ps1).

## Grafo inventariado e estratégia

[FKs reais do PostgreSQL](fk-inventory.txt) e migrações V1–V13 foram confrontados
com entidades e campos UUID herdados. Nenhuma constraint/cascade/migração antiga
foi alterada. Não houve necessidade de nova migração.

| Filhos/associações | Pais / política de limpeza |
|---|---|
| habit_logs e habit_days | hábitos; logs atuais ligados a goal_history e logs legados sem identidade são removidos antes de metas |
| goal_items/history/allocations | metas; alocações referem conta ou investimento; UUIDs de allocation/purchase não são inferidos |
| goal_purchases | owner e fato bancário/compra cartão; preserva histórico independente da existência da meta até a exclusão integral |
| plan_items | monthly_plan, categoria/cartão; removidos antes dos pais |
| investment_cost_revisions | compensation e operação original/dependente; removidos antes de ambas |
| investment_corrections, valuations, invest_transactions | investimento; operações também apontam conta, fato bancário e retenção |
| investment.goal_id legado | meta, FK SET NULL existente; investimento do owner é removido antes da meta |
| card_payment_allocations | pagamento e compra; removidas antes dos dois |
| card_payments | fatura, conta, débito bancário; inclui recibo herdado com fingerprint nulo |
| card_refunds | cartão/categoria; purchase_id UUID preservado até a limpeza do owner |
| card_transactions | fatura, categoria, opening_batch; compras atuais e lotes herdados |
| opening_batches/invoices | cartão; removidos depois de compras/pagamentos |
| financial_commands | owner, original e resultado vivo do ledger; removidos antes de fatos |
| financial_intent_receipts | owner, snapshot V13 sem FK para recurso; remoção explícita dentro da transação |
| transactions e suas referências internas | account/counterparty/category, settlement/reversal/correction/realization; todos os fatos do owner num único DELETE |
| contas, categorias, notas e user | raízes do principal, por último; locks/FKs continuam ativos |

Não há tabela de compras recorrentes ou um vínculo extra inventado neste schema.
Recibos antigos continuam vivos segundo seu contrato, e V13 continua snapshot;
exclusão não migra ou backfilla protocolo algum.

UserService agora usa statements bulk em ordem explícita, sempre selecionando
raízes por owner. Flush antes da limpeza, lock do user, limpeza de dependentes,
clear do persistence context e flush da exclusão final impedem escrita posterior
de coleções gerenciadas obsoletas. Todos os statements pertencem à mesma transação.

As FKs normais bloqueiam uma exclusão que deixaria dependente alheio. Os casos
SET NULL e referências apenas UUID precisam guarda explícita: investimentos e
hábitos alheios ligados à meta, logs alheios ligados ao histórico, item/histórico
alheio ligado a fato/alocação e refund alheio ligado à compra do owner. Nessas
inconsistências herdadas, **rejeitar e reconciliar** é a decisão contratual; nunca
apagar, desvincular ou fabricar dados do outro owner. A mensagem não revela dados
alheios. Nenhuma limpeza real para reconciliar esses vínculos está autorizada.

## Cache e efeito externo

UserFinancialDataDeletedEvent continua usando o listener AFTER_COMMIT da CF-024,
com o alcance global anterior. Dentro de transação envolvente, o cache anterior
permanece; rollback também o conserva. Após commit, a entrada sintética de outro
owner pode ser invalidada conforme esse alcance herdado; **suas linhas/dinheiro
permanecem integralmente iguais**.

Agendamento de email agora só ocorre em afterCommit, usando snapshot do destinatário
e corpo já existentes. Nenhuma invocação externa no rollback. Falha ao submeter
o trabalho assíncrono é registrada, sem transformar commit em alegado rollback.
O EmailService existente continua cuidando de execução/envio e logs. Não há outbox,
retry durável ou garantia de entrega; falha externa pós-commit não recria dados.
Todos os testes usam double do email e de cotação.

## Testes e evidências

- Original red1/1, erro FK esperado, antes da correção; prova adicional compra
  comum paga1/1 vermelha em cópia com serviço histórico.
- [Direcionados iniciais](directed-first.log):4 verdes/1 falha de medição do seed.
  Invoices/opening_batches já eram criados por fixture antes de graph; agora há
  assertions explícitas de existência por cartão. Nenhuma assertion de remoção,
  rollback, dinheiro ou owner foi retirada para obter aprovação.
- [Gate dirigido5](directed-final.xml) e [verify afetado135](affected-verify.log):
  zero failures/errors/skips. O gate135 inclui hábitos27/CF-02430, migrações
  vazio/legado, contratos HTTP, transações/investimentos/metas e R03 real4/4.
  O verde de hábitos não encerra H24-01 nem RJ-022-01.
- [Grafo representativo](representative-counts.txt):29 tabelas de aplicação;
  ambos owners com vínculos atuais/herdados. Snapshot JSON de **todas as linhas
  sobreviventes** coincide exatamente com o baseline sem o owner alvo, inclusive
  outro owner com grafo completo. FKs continuam validadas; não há órfãos criados.
- Falha intermediária real em DELETE de investments, após remoção de dependentes
  de hábitos/metas/planejamento/revisões: snapshot completo antes/depois igual,
  cache anterior igual, nenhuma notificação.
- Vínculo SET NULL alheio e UUID de item alheio: rejeição íntegra, ambos owners
  preservados. Falha de agendamento externo pós-commit: exclusão continua concluída,
  cache invalidado, sem resposta falsa de rollback.
- Sexto teste de compra comum paga foi acrescentado depois do verify135; seu gate
  final próprio [deletion-final-six.log](deletion-final-six.log) reexecuta os seis
  critérios. Não converter135 em136 nem somar subconjuntos sobrepostos.

PostgreSQL16 descartável/Testcontainers, schema separado `cf024_<uuid>`, Flyway
V1–V13 e Hibernate validate; proxies Spring/EntityManager reais. Expected derivados
de exclusão completa, owner intocado, atomicidade e cache/notificação após commit.
Snapshots antes/depois vêm de SQL independente da implementação de delete.

## Custos, riscos e revisão

Bulk elimina materialização por entidade e N+1 da limpeza. Número de statements
é fixo para o grafo atual (28 deletes, seis guardas, locks/flush/remoção final);
custo de linhas/joins/checagens de FK depende de dataset e índices. Pode ser
O(N) nas tabelas sem índices úteis, não O(1) por exclusão. Memória do produto não
carrega todo o histórico; snapshots globais O(N) existem somente no teste.

Lock do owner serializa exclusões e impede novos filhos com FK do user durante
a limpeza; aumenta contenção. Writers que adquirem fonte antes de inserir filho
podem disputar ordem com a exclusão. PostgreSQL/handler preservam rollback/409;
não se certifica ausência de deadlocks de todos os writers, SLA, carga ou banco
distribuído. Ordem explícita/nativa se acopla ao schema: migração futura precisa
atualizar inventário e regressões. Isso é correção local necessária, sem extração
de módulos/casos de uso da CF-027.

Revisor deve confirmar grafo, fronteiras de owner, ausência de órfãos, recibos,
rollback por falha real, callbacks pós-commit e limitação de entrega externa.
Aceite de RV24-02 não conclui CF-023 inteira ou aprova cache de produção.
O [encaminhamento CF-027](../RV24-01/ENCAMINHAMENTO-CF-027.md) conserva seus gates.
