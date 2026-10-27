# CF-017 — Criar migrações reproduzíveis e plano para banco legado

- Estado: em_revisao
- Prioridade: P1
- Modelo executor: gpt-5.6-sol
- Esforço: xhigh
- Revisor sugerido: gpt-6-astra / high
- Depende de: [CF-002](../00-fundacao/CF-002-ambiente-backend.md), [CF-016](../03-integridade/CF-016-regras-financeiras.md)
- Origem: T-005; F-011

## Revalidação independente RVPLA-04 — 27/10/2026

[Parecer do candidato badecb55](../evidencias/revalidacao-RVPLA-04/README.md):
RVPLA-04 encerrado no handoff Windows/mesma sessão; contenção específica RVPLA-03
preservada. Retomada original20s falhou por latência (RVPLA-05/P2); audit PG17
falhou por EPERM, causa inconclusiva, após preflight/resume aprovados no recorte.
Runner integral pendente; TCP/reuso e HQL inconclusivos, 40s intactos. Migrations,
JAR e históricos preservados. CF017/P01/P02 em_revisao: sem checkbox real
encerrado, inventário, backup/restore, freeze, baseline ou DDL reais liberados.

## Revalidação independente RVPLA-03 — 27/10/2026

[Parecer do candidato0b4c6598](../evidencias/revalidacao-RVPLA-03/README.md):
abandono original RVPLA-03 encerrado no recorte Windows; novo RVPLA-04 mantém
pendente a quiescência durante handoff. Reuso nativo e HQL inconclusivos. Suporte
PG16/17, migrations, controles locais e pacote preservados; CF017/P01/P02 em_revisao,
sem execução/liberação de inventário, backup/restore, freeze ou DDL reais.

## Revalidação independente do saneamento — 27/10/2026

[Parecer do candidatoaa068d1](../evidencias/revalidacao-preparacao-local-adocao/README.md):
RVPLA-01 encerrado, corrida de porta aceita; novo RVPLA-03 de quiescência do runner
e startup inconclusivo permanecem pendentes. Suporte local PG16/17, migrations,
guard/writers/jobs e proveniência preservados. CF017/P01/P02 em_revisao; nenhum
inventário, backup/restore, freeze, baseline ou migration real executado/liberado.

## Revisão independente da preparação — 26/10/2026

[Parecer e evidências](../evidencias/revisao-preparacao-local-adocao/README.md),
candidato6f70a87: suporte operacional local16.15/17.11 aprovado, incluindo
servidores/clientes, migrations/validate, preflight rigoroso e restore. Controles
de bootstrap/writers/jobs aprovados no alcance local; startup estável não aprovado.
RVPLA-01 afeta resume do observador, não o comparador ou migrations. Nenhuma
correção de produto/runner realizada nesta revisão.

CF017/P01/P02 permanecem em_revisao pelas obrigações reais de classificação,
backup/restore, proveniência e writers. Matriz/configuração e ordem A–D preparadas,
sem acesso ao banco, baseline, migration, ativação ou deploy remotos.

## Preparação exclusivamente local após revisão — 26/10/2026

[Lote local delimitado e resultados](../evidencias/preparacao-local-adocao/README.md), entrada
46b85ee: suporte explícito16/17, marcador de snapshot com major efetiva e teste dos
clientes reais; perfil adoption separa migrations de bootstrap e mantém validate.
Migrations V1–V16, comparador rigoroso e provas independentes preservados. Evidência
local não conclui inventário/backup/restore/proveniência/writers do alvo real.
Estado em_revisao mantido; provas locais registradas e revisão independente
pendente. Startup estável não certificado: estouros de40s em Windows e Linux.

## Plano de adoção após revisão CF034 — 26/10/2026

[Revisão de prontidão e procedimento A–D](../evidencias/revisao-prontidao-CF034-CF017/PLANO-ADOCAO.md),
base integrada fb98645. Cadeia atual V1–V16 preservada; aceites locais RV17-01/02
e regra da janela continuam válidos, sem reabertura. Imagem Railway configurada
PG17 e banco offline confirmados; PgSchemaInventory/CLI aprovado recusa major
diferente16. Preparar/revisar suporte17 em descartável antes de usar essa ferramenta
no alvo. Nenhuma mudança do verificador ou migrations nesta revisão.

Hibernate externo update, Flyway no bootstrap e agendadores exigem controles
antes de uma inicialização autorizada. Compatibilidade/inventário/backup/restore,
proveniência temporal e coordenação de writers reais continuam sem evidência;
CF017/P01/P02 **em_revisao**, sem novos critérios reais marcados. Plano/documentação
não executam CF035/036 nem autorizam ligar banco/API, baseline, migrate ou deploy.

## Delta documental RV17-01/P2 — 15/10/2026

**Situação vigente:** [revalidação independente de 6e64aad](../evidencias/revalidacao-RV17-01-P2/README.md)
encerra P2 e RV17-01 no escopo local/procedimento documentado. RV17-02 e V1–V14
preservados. CF-017 permanece em_revisao pelas obrigações de adoção real; CF-029
continua pronta somente local/descartável. O registro de candidatura abaixo é histórico.

Base `ef08950`: [regra de validade, cenários e encaminhamento restrito](../evidencias/saneamento-RV17-01-P2/README.md).
Runbook explicita identidade/versões, continuidade da janela, invalidação e parada
antes da baseline. Candidato aguardando revalidação independente; P2 não encerrado
pelo executor. Estado em_revisao, aceites locais e prontidão exclusivamente
local/descartável da CF-029 preservados; nenhuma execução de CF-029 ou adoção real.

## Revisão independente do saneamento — 15/10/2026

Reconferência sobre HEAD `d806f82`, código `bcec50c` sem delta posterior:
[75 testes reexecutados e parecer preservado](../evidencias/reconferencia-CF-017/README.md).
RV17-01 residual P2 aberto, RV17-02 encerrado localmente e adoção real pendente.

Base `bcec50c`, intervalo `4206d88..bcec50c`:
[parecer, matriz e provas](../evidencias/revalidacao-CF-017/README.md).
RV17-02 encerrado localmente. RV17-01 aprovado no comparador/read-only/fail-closed,
mas permanece aberto somente por resíduo operacional P2: validade do preflight
entre verificação, freeze e baseline, com repetição quando o alvo muda.
Fundação V1–V14, upgrade/rollback/Hibernate e restore local aprovados;71testes
dirigidos e4probes novos, sem falhas/skips. Migrações/configuração preservadas.

Estado integral `em_revisao`: restam esse resíduo e compatibilidade/adoção real,
incluindo inventário, backup/restore, proveniência e writers. Capacidade liberada
para **iniciar CF-029 somente local/descartável** sobre essa base, com CF-023 e
CF-028 integradas/aceitas. Não executar onboarding por efeito desta anotação;
nenhuma liberação de banco real ou publicação. Notas abaixo são históricas.

## Saneamento local RV17-01/02 — 15/10/2026, candidato em revisão

Base integrada `4206d88`, branch `codex/cf017-preflight-restore`. Reproduções atuais
confirmaram os dois achados antes da correção. Candidato acrescenta preflight
operacional read-only contra inventário semântico da V1, adversariais e oracle de
restore por linha/campo/schema com pg_dump/pg_restore em destinos descartáveis novos.
Cadeia atual V1–V14 preservada, sem editar migrations nem fabricar proveniência.

[Evidências, matriz, custos e encaminhamento independente](../evidencias/saneamento-CF-017/README.md).
Saneamento do executor não encerra achados por autoaprovação: CF-017 e sua derivada
continuam `em_revisao`. Inventário/backup/proveniência/writers/adoção reais permanecem
não autorizados e não comprovados. CF-029 permanece proposta, sem liberação automática.
As notas datadas abaixo são histórico; CF-014/CF-028 e pendências próprias da CF-015
foram preservadas, sem nova revisão integral do marco.

## Reconciliação de pendências — 03/10/2026

Estado `em_revisao` mantido. Categorias 2 e 5, separadas: RV17-01 exige preflight versionado completo com adversariais antes da baseline; RV17-02 exige fingerprint por PK/campos brutos/origem/saldos/relações e schema no restore. Inventário, backup/restore, proveniência e writers do ambiente real dependem de autorização e evidência próprias. V13 local aprovada não satisfaz esses três gates.

[Critérios, pareceres, bases, alterações posteriores e efeitos nas dependências](../evidencias/consolidacao-CF-001-CF-026/RECONCILIACAO-CF-001-CF-027.md). As seções anteriores de execução/revisão conservam sua data e alcance; esta nota não é novo aceite independente.

## Consolidação documental — 01/10/2026

Estado `em_revisao` mantido. Além das provas locais até V12, a revisão CF-024 (`f225657`)
revalidou banco vazio até V13 e upgrade V12→V13 no recorte de recibos, preservando dados
anteriores. Isso não encerra RV17-01/RV17-02, P01/P02, proveniência, backup/restore ou
adoção reais. A derivada temporal mantém seus critérios ainda não atendidos; V1/V2 é a
referência histórica da primeira liberação, não a versão máxima atual da base local.

[Snapshot, evidências, condições e limites](../evidencias/consolidacao-CF-001-CF-026/README.md).
As seções datadas abaixo preservam o histórico de suas respectivas bases.

## Problema e resultado esperado

Produção valida schema, local o altera automaticamente e não há migrações versionadas. Banco vazio e atualização de schema precisam ser reproduzíveis sem comprometer legado.

## Escopo e referências

- `controle-financeiro-backend/pom.xml`
- `controle-financeiro-backend/src/main/resources/`
- `controle-financeiro-backend/src/test/`

Caminhos de implementação relativos à raiz; infraestrutura de testes/arquivos novos devem ser criados dentro desses alvos. Ler o [SDD](../../docs/sdd/README.md), a [execução](../EXECUCAO.md) e a [política de testes](../POLITICA-DE-TESTES.md). A origem acima mantém o vínculo com o diagnóstico e os épicos anteriores.

## Trabalho

1. Escolher/configurar migrador compatível com Spring Boot 4; criar baseline de schema documentado incluindo ShedLock.
2. Testar schema vazio e fixture de schema legado com dados sintéticos representativos; validar Hibernate após migração.
3. Inventariar banco remoto somente em leitura quando identificado; documentar backup/restore e diferenças. A falta desse inventário não impede testar baseline sintético, mas impede certificar compatibilidade com Railway.

## Aceite e testes adversariais

- [x] Migrações aplicam uma vez e nova execução é estável; constraints e versões ficam verificadas.
- [x] Fixture de dados permanece reconciliada após upgrade; falha de migração não deixa versão falsamente aplicada.
- [ ] Compatibilidade com banco real só pode ser concluída com schema/backup conhecidos; caso contrário registrar bloqueio dessa parte.
- [x] Evidências e limitações registradas; testes não foram enfraquecidos para aceitar a implementação.

## Fora de escopo

ddl-auto update ou baseline-on-migrate indiscriminado em produção; reset de banco não descartável.

## Modelo e revisão

O escopo exige implementação e validação de comportamento entre camadas; priorizar investigação causal e testes proporcionais. Os motivos e limites das recomendações estão em [modelos](../MODELOS.md). A revisão sugerida é uma execução dedicada; sua abrangência deve seguir o risco desta tarefa.

## Evidências e estado

Preparação de 13/09/2026: [derivada P01/P02 de adoção temporal](CF-017-P01-P02-adocao-temporal.md).
Há candidato aditivo e testes sintéticos; CF-017 não foi executada nem concluída.

Execução local de 22/09/2026 sobre `2269b22`: Flyway 11.14.1, V1 pré-temporal,
V2 aditiva, fixture legada independente, Hibernate validate, checksum,
falha/recuperação e backup/restore sintético implementados e aprovados em PostgreSQL
16 descartável. `ddl-auto=update` local foi substituído por `validate`; baseline
automática e clean permanecem desabilitados. [Evidência, inventário e rollout](../evidencias/CF-017/README.md).
Implementação/testes: `ae494c0be844dc1d7fa3d39073ab2acef2005533`.

Permanece `em_revisao`: schema/volume/backup/restore reais não existem nesta base.
Logo compatibilidade Railway, baseline real, deploy e liberação de writers
continuam não comprovados e bloqueados. CF-018 não foi iniciada.

Revisão independente de 22/09/2026: a cadeia local V1/V2 foi aprovada como base
para iniciar CF-018 em PostgreSQL descartável. Adoção real permanece bloqueada e
o preflight sintético aceita ao menos uma incompatibilidade de FK; o restore
sintético também possui oracle parcial. Estado mantido `em_revisao` para não
confundir fundação local apta com baseline/publicação autorizadas.
[Parecer, achados e execuções](../evidencias/revisao-CF-017/README.md).

## Saneamento do marco em 30/09/2026

Saneamento acrescentou V6–V11 sem editar V1–V5. Provas locais de banco vazio/legado/upgrades, checksum, falha/recuperação e Hibernate validate em PostgreSQL descartável. V11 não fabrica cobertura para legados. RV17-01/RV17-02, inventário/backup/restore e adoção reais permanecem pendentes; não há autorização para publicação.

[Matriz, checkpoints e limitações](../evidencias/saneamento-CF-016-CF-021/README.md). Marco aguardando revisão independente; autotestes não são aceite. Sem banco real, Railway, email real, push ou deploy.

## Revalidação independente — 30/09/2026

Base local V1–V11 revalidada. Mantidas RV17-01/RV17-02 e adoção real; nenhuma autorização de publicação. Consulte a [matriz e o parecer](../evidencias/revalidacao-CF-016-CF-021/README.md) antes de considerar o marco encerrado. Sem correção de produto ou início de CF-022+ nesta revisão.

## Consolidação conjunta — 30/09/2026

Estado em_revisao preservado. A revisão CF-022/023 executou V12, banco vazio,
upgrade/legado/checksum/falha/recuperação e Hibernatevalidate em ambiente
descartável, sem encerrar RV17-01/RV17-02, adoção real ou P01/P02.
[Critérios pendentes e prontidão local](../evidencias/revisao-CF-022-CF-023/MATRIZ-ESTADOS.md).
Base local apta não é autorização de baseline/migração/publicação em banco real.
