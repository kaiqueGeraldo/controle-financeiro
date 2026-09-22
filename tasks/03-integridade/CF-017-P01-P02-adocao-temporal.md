# CF-017/P01/P02 — Adoção coordenada dos metadados temporais

- Estado: em_revisao local; continua bloqueando publicação do candidato P01/P02 sobre banco existente
- Derivada de: [CF-017](CF-017-migracoes.md), [SPEC-002](../../docs/sdd/specs/002-datas.md)
- Origem: P01/P02 da [revisão independente](../evidencias/revisao-CF-001-CF-009/README.md)
- Preparação local: [saneamento de 13/09/2026](../evidencias/saneamento-P01-P05-2026-09-09/README.md)

## Campos e transição preparada

| Tabela | Colunas aditivas | Semântica |
|---|---|---|
| transactions / card_transactions | operation_time, time_origin | Hora opcional; USER_INPUT ou NOT_PROVIDED; null de origem é UNKNOWN |
| transactions / card_transactions | recorded_at | Instante UTC real de nova gravação, precisão de microssegundos, imutável no ORM; histórico null |
| transactions / card_transactions | legacy_created_at_raw | Original misto, preservado antes de reescrever o alias created_at |
| invest_transactions | operation_date, date_origin | Civil com origem USER_INPUT/PRODUCT_CALENDAR, preenchida pelo writer; desconhecido null |

Não remover nem reinterpretar `date`/`created_at` antigos. O alias createdAt continua
misto e pode ser reescrito pela edição compatível; consumidores novos usam time e
recordedAt. Na edição de legado, guardar o original bruto primeiro. Não preencher
auditoria antiga com agora, meia-noite, data da operação ou created_at renomeado.
Investimentos sem origem mostram data indisponível e bruto com fuso desconhecido.
Hora omitida em criação é NOT_PROVIDED; na edição, omissão preserva e null remove.

O código candidato espera as novas colunas. **Não publicar antes da migração.**
Writers antigos ainda ativos não podem editar linhas canônicas: alterariam o alias
sem atualizar os metadados. Coordenar parada de escrita/virada de versão; leitura
legada é transitória, não uma garantia de escrita simultânea entre versões.

## Trabalho restante e critérios

- [ ] Identificar schema real em leitura: tipos, precisão, constraints, índices,
  versões, volumes, zonas históricas e trilhas de origem por linha/lote. Não inferir
  origem por tipo, nome, descrição, 00:00, timezone atual ou isSystemManaged.
- [x] Definir baseline/migrador versionado em CF-017. O SQL candidato foi
  substituído pela V2 versionada e o teste passou a executá-la. Tipos/precisão
  foram confrontados localmente e Hibernate validate aprovou banco vazio e fixture
  legada descartável; o schema efetivo remoto continua desconhecido.
- [ ] Produzir backup restaurável e ensaiar restore, contagens e reconciliação de
  valores originais, saldos e metadados. Testar schema vazio, legado representativo,
  reaplicação, falha no meio e versionamento; nenhum default/backfill indiscriminado.
- [ ] Proveniência comprovada deve ter evidência rastreável e transformação por lote.
  Hora/instante ambíguo por mudança de offset exige decisão explícita. Sem prova,
  manter UNKNOWN/null e bruto. Nunca inventar recordedAt histórico.
- [ ] Verificar todos os writers (conta, transação, cartão/pagamento, metas,
  investimento/ajuste), BFF, DTOs, listagem/detalhe, ordenação global e exportação.
- [x] Planejar rollout e reversão. Antes de escrita nova, DDL transacional pode ser
  revertido; após escrita nova, não apagar colunas e perder metadados. Preservar
  dados, suspender escrita e escolher versão compatível ou correção progressiva.
- [ ] Medir EXPLAIN/índices para ordem por usuário, dia, hora conhecida e ID. Sort
  pode custar O(N log N); exportação ainda pagina por offset. Não prometer ganho de
  desempenho nem estabilidade sob escrita concorrente sem CF-024.
- [ ] Revisão independente do upgrade e consumidores; anunciar remoção futura do
  alias apenas após inventário de clientes. Não certificar Railway por teste sintético.

## Evidência disponível e limite

TemporalCompatibilityIntegrationTest verifica tabelas legadas sintéticas em schema
privado do PostgreSQL descartável, preservação de bruto/null e rollback por savepoint.
Também testa novos writes via HTTP/serviço/ORM, reload, hora ausente versus 00:00,
edição, auditoria protegida, investimento manual/automático, cartão, paginação e Excel.
Isso agora exercita a V2 versionada, mas não cobre schema remoto, backup real,
rollout coordenado de versões nem backfill com proveniência real.
CF-017 está em revisão com [evidência local](../evidencias/CF-017/README.md).
P01/P02 permanecem abertos nos critérios de schema/backup/proveniência reais,
coordenação de writers, consumidores completos e revisão independente.
