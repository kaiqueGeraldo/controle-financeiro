# CF-017/P01/P02 — Adoção coordenada dos metadados temporais

- Estado: em_revisao; base local V1/V2 apta para CF-018, adoção/publicação em banco existente bloqueada
- Derivada de: [CF-017](CF-017-migracoes.md), [SPEC-002](../../docs/sdd/specs/002-datas.md)
- Origem: P01/P02 da [revisão independente](../evidencias/revisao-CF-001-CF-009/README.md)
- Preparação local: [saneamento de 13/09/2026](../evidencias/saneamento-P01-P05-2026-09-09/README.md)

## Atualização CPA-01 — 28/10/2026

[Revalidação independente](../evidencias/revalidacao-CPA-01/README.md): cobertura
e seleção Windows/Linux aceitas; R1 de agregação required mantém parecer C.
P01/P02 continuam em_revisao pelos mesmos critérios reais, sem novo checkbox,
proveniência temporal inventada, baseline/migration ou adoção autorizados.

## Consolidação pré-adoção — 28/10/2026

[Parecer integrado e matriz](../evidencias/consolidacao-pre-adocao/README.md),
entrada56eb80b5/mainfb986456: aceites locais de produto, startup40s, TCP e RVPLA/
audit preservados. CPA-01/P2 é incompatibilidade de seleção Windows/job Linux,
com saneamento local separado antes de publicação/CI. Não reabre os aceites por
associação nem resolve P01/P02. Estado em_revisao e critérios reais de A–D,
brutos/null/UNKNOWN, backup/restore, freeze, proveniência e coordenação mantidos.
Sem adoção, migration, banco real ou novo checkbox concluído.

## Revisão independente de startup HQL — 28/10/2026

[Parecer do candidato ed42309f](../evidencias/revisao-startup-HQL/README.md):
aceite local de startup, histórico E inconclusivo não bloqueante para preparar
próximo candidato;40s e testes obrigatórios mantidos, sem apagar falhas antigas.
Demais modos apoiados nas provas anteriores explicitadas na matriz, sem alegar
nova suíte17 verde. Aceites TCP/RVPLA/EPERM preservados. P01/P02 em_revisao:
A–D, brutos/null/UNKNOWN, backup/restore, freeze, baseline/DDL e coordenação reais
continuam pendentes. Nenhum checkbox real alterado, adoção/publicação ou ação
remota liberada. Notas anteriores são históricas no alcance do impedimento startup.

## Revalidação independente TCP/reuso nativo — 28/10/2026

[Parecer do candidato b7a2c206](../evidencias/revalidacao-TCP-reuso-nativo/README.md):
TCP/reuso encerrado no alcance Windows nativo/JAR/PG16/17; originais 3/3 por
invocação, mecanismo antigo reproduzido e controle restaurado aprovado. Prazos
de certificação de 10s/5s mantidos, com até 2s adicionais de limpeza em erro;
alheios preservados e atribuição histórica qualificada. RVPLA-01/03/04/05 e EPERM
preservados; HQL continua inconclusivo, 40s, experimento futuro apenas delimitado.
P01/P02 em_revisao: A–D, temporalidade/brutos/null/UNKNOWN, backup/restore, freeze,
baseline/DDL e coordenação reais mantêm pendências. Produto/migrations/JAR
intactos; nenhuma adoção/publicação ou ação remota liberada por este aceite.

## Investigação TCP/reuso nativo — 28/10/2026

[Causa equivalente, correção e limites](../evidencias/investigacao-TCP-reuso-nativo/README.md),
base3b245d9d/correçãob8b645d0: confirmação TCP no close nativo Windows mantém
reuso da mesma porta e segurança; PG16/17 e contraprovas/restauração registrados.
Implementado localmente, aguardando revisão independente. RVPLA-01/03/04/05 e
EPERM preservados; HQL inconclusivo/40s mantidos. P01/P02 em_revisao: nenhuma
adoção/publicação, baseline, DDL, backup/restore/freeze ou coordenação real
liberada. Produto/migrations/JAR intactos; próximo HQL somente preparado.

## Revalidação independente residual RVPLA-05 — 28/10/2026

[Parecer do candidato d8bd180a](../evidencias/revalidacao-RVPLA-05-residual/README.md):
RVPLA-05/P2 encerrado no original20s (3/3), alcance Windows/mesma sessão, margem
mínima4,916s. Contenção RVPLA-03/04, identidade, confirmação externa e EPERM
preservados; novo PG17 causal/resume/audit limitado passou. TCP/HQL separados,
inconclusivos,40s mantidos. P01/P02 em_revisao: A–D, temporalidade/brutos/null/UNKNOWN,
backup/restore, freeze e coordenação reais pendentes. Nenhum checkbox real encerrado,
adoção/publicação ou sucessora iniciada pela revisão do runner.

## Saneamento residual RVPLA-05 — 28/10/2026

[Estados separados e provas](../evidencias/saneamento-RVPLA-05-residual/README.md),
baseacaa6ed9, implementaçãoe88ee50a:3/3 no original20s com margem mínima7,774s;
contenção e confirmação externa mantidas, sem alterar canal/aceite EPERM.
Complemento alheio e preflight/resume/audit PG17 limitados passaram. Saneado
localmente, aguardando revisão independente. RVPLA-03/04 específicos preservados;
TCP/HQL inconclusivos,40s intactos. P01/P02 permanecem em_revisao: A–D,
temporalidade/brutos/null/UNKNOWN, backup/restore, freeze e coordenação reais
pendentes. Nenhum checkbox real, adoção, publicação ou sucessora liberado.

## Revalidação independente RVPLA-05 — 27/10/2026

[Parecer do candidato019a6ce3](../evidencias/revalidacao-RVPLA-05/README.md):
RVPLA-05/P2 permanece aberto, três falhas no20s; diagnóstico21,167s não é aprovação.
Contenção específica RVPLA-03/04 preservada; falha histórica de fixture classificada
como expiração natural, sem grupo completo original verde. Correção causal EPERM
e audit PG17 limitado aceitos, detentor histórico desconhecido. TCP/HQL separados,
inconclusivos,40s mantidos. P01/P02 em_revisao: A–D, temporalidade/brutos/null/UNKNOWN,
backup/restore, freeze e coordenação reais pendentes. Nenhum checkbox real encerrado
nem adoção ou sucessora iniciada.

## Saneamento local RVPLA-05 e audit — 27/10/2026

[Estado separado de prazo/audit/adoção](../evidencias/saneamento-RVPLA-05/README.md),
base9c27881, implementação762a085/d254822: prazo original20s passou3/3 localmente,
contenção/quiescência mantidas; corrida EPERM demonstrada e corrigida, novo audit
limitado passou. Detentor do handle histórico não identificado. Saneamento em
revisão independente; falha do grupo antigo por fixture alheia conservada.
Aceites específicos RVPLA-03/04 preservados; TCP/HQL inconclusivos,40s intactos.
P01/P02 continuam em_revisao: A–D, temporalidade/brutos/null/UNKNOWN,
backup/restore, freeze e coordenação reais pendentes. Nenhum checkbox real,
adoção, publicação ou sucessora liberado por esta execução local.

## Revalidação independente RVPLA-04 — 27/10/2026

[Parecer do candidato badecb55](../evidencias/revalidacao-RVPLA-04/README.md):
RVPLA-04 encerrado no handoff Windows/mesma sessão; abandono físico RVPLA-03
preservado. Gate original20s falhou por latência (RVPLA-05/P2), e audit PG17 teve
EPERM inconclusivo; preflight causal e resume passaram no recorte. Quiescência
segura demonstrada não aprova o ciclo funcional integral. TCP/reuso/HQL separados,
40s mantidos. P01/P02 em_revisao: A–D, temporalidade/brutos/null/UNKNOWN,
backup/restore, freeze e coordenação reais pendentes. Nenhuma adoção ou sucessora
iniciada; nenhum checkbox real encerrado.

## Revalidação independente RVPLA-03 — 27/10/2026

[Parecer do candidato0b4c6598](../evidencias/revalidacao-RVPLA-03/README.md):
RVPLA-03 encerrado no cenário original de abandono; RVPLA-04 novo impede aceite
amplo do restauro durante comandos tardios. Reuso nativo e HQL inconclusivos,
aceites locais preservados. P01/P02 em_revisao, sem checkbox real encerrado:
A–D, temporalidade/brutos/null/UNKNOWN, backup/restore e coordenação reais pendentes.

## Revalidação independente do saneamento — 27/10/2026

[Parecer do candidatoaa068d1](../evidencias/revalidacao-preparacao-local-adocao/README.md):
skip causal RVPLA-01 encerrado e corrida de porta aceita; quiescência após
interrupção Windows tem novo resíduo RVPLA-03, e startup segue inconclusivo.
Aceites locais preservados. P01/P02 em_revisao; A–D, proveniência temporal,
brutos/null/UNKNOWN, backup/restore e coordenação reais continuam pendentes.
Nenhum checkbox real encerrado nem adoção/sucessora iniciada.

## Revisão independente local correlata — 26/10/2026

[Parecer A–G](../evidencias/revisao-preparacao-local-adocao/README.md), candidato6f70a87:
PG16/17 e fronteiras locais de adoção aprovados no alcance examinado; startup
continua pendente e observador resume exige saneamento próprio. Nenhum critério
de inventário/backup/proveniência/freeze real foi marcado. Cenários A–D, UNKNOWN/
null/brutos e gates desta derivada permanecem; estado em_revisao conservado.

## Preparação local correlata — 26/10/2026

[Resultados, matriz e limites do lote autorizado](../evidencias/preparacao-local-adocao/README.md).
Ferramentas PG17, inicialização/controle de writers/jobs e saúde são preparação
sintética, sem virada temporal, backfill, baseline ou migration reais. Nenhum
checkbox abaixo é encerrado por esse trabalho; estado em_revisao preservado.
Revisão independente e diagnóstico do startup acima de40s permanecem pendentes.

## Plano de adoção condicionado — 26/10/2026

[Cenários A–D, janela e ações autorizáveis](../evidencias/revisao-prontidao-CF034-CF017/PLANO-ADOCAO.md),
base integrada fb98645. Cadeia atual V1–V16 e aceites locais preservados.
Banco real não acessado; imagem PG17 exige suporte/teste dirigido da ferramenta
operacional atualmente restrita a16. Proveniência/bruto/UNKNOWN/null não podem
ser preenchidos por inferência. Hibernate validate, Flyway separado e liberação
dos writers são controles diferentes; rollout inclui V15/V16 e todos os jobs.

Estado em_revisao mantido, sem checkbox real encerrado por CI verde ou revisão
documental. Inventário/backup/restore, temporalidade por lote, clientes/writers,
medição e adoção reais exigem autorizações/evidências próprias. CF035/036 não
iniciadas; nenhuma configuração remota ou migration alterada nesta etapa.

## Delta documental da janela preflight→baseline — 15/10/2026

**Situação vigente:** [P2 e RV17-01 encerrados no escopo local/documental](../evidencias/revalidacao-RV17-01-P2/README.md),
candidato `6e64aad`. Esta derivada mantém em_revisao: inventário, compatibilidade,
backup/restore, proveniência e coordenação reais continuam pendentes. Nenhum
checkbox real alterado. As notas de candidatura/revisões anteriores abaixo são históricas.

[Saneamento restrito RV17-01/P2](../evidencias/saneamento-RV17-01-P2/README.md), base
`ef08950`, aguardando revalidação independente. Diferencia validade estrutural,
DML/sequences e freezes próprios de backup/migração. Estado em_revisao mantido;
nenhum critério de adoção real abaixo foi satisfeito por esta edição documental.
Aceites de código RV17-01, RV17-02 local e V1–V14 permanecem; CF-029 continua apta
exclusivamente local/descartável, sem execução por efeito deste encaminhamento.

## Revisão independente local — 15/10/2026

Base `bcec50c`: [parecer e matriz](../evidencias/revalidacao-CF-017/README.md).
Fundação V1–V14 e restore local aprovados; RV17-02 encerrado no escopo sintético.
RV17-01 conserva somente resíduo operacional P2 da janela preflight→baseline.
Esta derivada permanece em_revisao: inventário, compatibilidade, backup/restore,
proveniência, writers/clientes, medição e adoção do ambiente existente não foram
executados nem transferidos. Prontidão local da CF-029 não conclui essas obrigações.

## Candidato local de preflight/restore — 15/10/2026

[Saneamento RV17-01/02](../evidencias/saneamento-CF-017/README.md) na base integrada
`4206d88`, cadeia V1–V14. Preflight V1 e restauração sintética completa pertinente
foram separados dos gates de adoção. Exige revisão independente; não altera os
checkboxes de comprovação real abaixo. Preservação de bruto/null e instante V14
é verificada sem backfill. Nenhum banco real, writer real ou onboarding executado.
Estado `em_revisao` mantido; o aceite histórico V1/V2 no cabeçalho não é teto da cadeia.

## Consolidação documental — 01/10/2026

A fundação local integrada foi ampliada até V13, com revisões específicas de V12
(CF-022/023) e V13/upgrade V12→V13 (CF-024). A primeira liberação V1/V2 acima permanece
histórica. P01/P02 continuam abertos nos critérios de adoção real, proveniência e
coordenação de writers/clientes; o aceite sintético não autoriza migração/publicação no
ambiente existente.

[Snapshot, evidências, condições e limites](../evidencias/consolidacao-CF-001-CF-026/README.md).
As seções datadas abaixo preservam o histórico de suas respectivas bases.

## Campos e transição preparada

Atualização local — 09/10/2026: V14 acrescenta `goal_history.recorded_at`
(`timestamp(6) with time zone`, nullable, sem default/backfill). Novos writers usam
Clock; legado preserva date bruto/null e origem UNKNOWN. Banco vazio, upgrade V13,
Hibernate/HTTP/releitura e consumidores foram aprovados na
[revalidação RD58](../evidencias/revalidacao-RD58/README.md), encerrando CF-005/006.
Isso não encerra os gates reais desta derivada nem CF-017. Incluir V14 no rollout:
migrar antes do binário novo, coordenar writers/clientes e não apagar metadados após
novas escritas. Nenhum inventário, baseline, migração ou publicação remota executado.

| Tabela | Colunas aditivas | Semântica |
|---|---|---|
| transactions / card_transactions | operation_time, time_origin | Hora opcional; USER_INPUT ou NOT_PROVIDED; null de origem é UNKNOWN |
| transactions / card_transactions | recorded_at | Instante UTC real de nova gravação, precisão de microssegundos, imutável no ORM; histórico null |
| transactions / card_transactions | legacy_created_at_raw | Original misto, preservado antes de reescrever o alias created_at |
| invest_transactions | operation_date, date_origin | Civil com origem USER_INPUT/PRODUCT_CALENDAR, preenchida pelo writer; desconhecido null |
| goal_history | recorded_at (V14) | Instante do Clock; date bruto/null preservado; recorded_at null significa origem UNKNOWN no DTO |

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
coordenação de writers e consumidores completos do ambiente alvo.

Revisão independente de 22/09/2026 aprovou a fundação local para a CF-018, sem
aprovar banco real. O preflight sintético não detectou uma FK removida e o oracle
de restore é parcial; ambos mantêm o gate remoto fechado. A revisão independente
dos writers/consumidores temporais já existente continua válida apenas nos cenários
sintéticos documentados. [Parecer CF-017](../evidencias/revisao-CF-017/README.md).
