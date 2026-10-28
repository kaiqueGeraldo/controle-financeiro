# Plano condicionado de adoção e publicação

## Situação vigente — 28/10/2026

[Consolidação e matriz atual](../consolidacao-pre-adocao/README.md): preparação
local16/17, controles operacionais, startup no recorte local40s, TCP e aceites
RVPLA/audit possuem pareceres finais posteriores. O delta de26/10 abaixo é
histórico quando indica revisão/startup ainda pendentes. CPA-01/P2 é impedimento
concreto da nova seleção Windows no job Linux; sanear/revisar separadamente antes
de publicar/CI. Não altera A–D ou satisfaz qualquer gate de banco/adoção real.
Nenhuma etapa remota deste plano foi executada pela consolidação.

## Delta de preparação local — 26/10/2026

O usuário autorizou o lote local posterior, entrada46b85ee:
[resultados, matriz e proveniência](../preparacao-local-adocao/README.md) e
[contrato operacional preparado](../preparacao-local-adocao/OPERACAO-LOCAL.md).
Os passos1/2 recebem implementação/ensaios descartáveis nessa entrega, em_revisao,
com provas finais registradas e gate de startup estável aberto por estouros de40s
em Windows e Linux. Revisão independente pendente; nenhum gate real foi atendido.
As alternativas A–D, janela, baseline explícita e autorizações separadas abaixo
continuam válidas. Para o passo11, selecionar adoption e manter writers/jobs false;
readiness503 é esperada e não deve promover esse processo restrito. O passo14 exige
parada/drenagem e reinício explícito; deploy fechado não congela uma réplica antiga.
Previews existentes e configuração externa update continuam pendências remotas.
O texto seguinte preserva o plano original da revisão, sem alegar execução real.

**Somente preparação. Nenhuma etapa operacional abaixo foi executada.**
Alvos conhecidos: Railway projeto19974952-914d-4072-9140-e62e5ed23c31,
production73f7324a-a15f-4940-b2dc-d5bcb5510441, API f4ad9689-58ed-4112-8bb2-2cfe4af24483,
PG79d2ee56-cfd0-47bc-8744-e932cf49ba69; Vercel prj_OdfwpJWp3wv8ZgfpcjVEBscrj03r.
Database/schema/geração física **ainda desconhecidos**, não preencher por hábito.

CF-017/P01/P02 continuam em_revisao; CF035/036 continuam propostas, não iniciadas.
Este plano não é execução de sucessora nem aprovação de seus critérios. A cadeia
atual é **V1–V16**: o runbook aprovado descreve V1–V14 em sua data, e V15/V16 foram
adicionadas por CF029/030. Preservar esses16 arquivos e seus checksums; não editar
migrations antigas para ajustar um banco desconhecido.

## Decisões e pré-condições por tipo de acesso

1. Preparar explicitamente ferramenta PG17 e schema/restore na major
   alvo; para inicializar a API, preparar health/readiness, controle de writers/jobs
   e imagem rastreável. Ainda
   não autorizado implementar nesta revisão. A recusa major16 do CLI atual é
   fail-closed aceito, não defeito a remover simplesmente trocando um número.
   A leitura inicial de catálogo pelo SQL somente leitura não depende de
   healthcheck, imagem nova, zoom ou CI ampliada: depende de autorização de acesso,
   identificação, privilégio de leitura e controle dos consumidores. SuportePG17
   é obrigatório antes de usar o CLI atual como preflight/restore em17, não para
   toda consulta SQL de classificação. Essa leitura delimitada não inicia CF035.
2. Decidir previews e resolver deploys antigos antes de reativar a API.
   Recomendação: novos previews desativados; staging sintético só com decisão
   de custo/escopo. main=false não protege as outras branches ou previews antigos.
3. Aprovar revisão/integração local e CI ampliada em etapa própria, preservando
   a separação entre CI e deploy. Resolver zoom200% com capacidade adequada antes
   de uso; não é pré-requisito para leitura de catálogo autorizada, mas é gate
   explícito de liberação integral, sem dispensa criada aqui.
4. Autorizar **apenas PG** se estiver offline e não houver acesso a snapshot
   isolado: identificar geração/volume, iniciar exclusivamente o banco existente,
   manter API e outros writers desligados, sem migration/DDL. Se o controle de
   todos os consumidores não puder ser demonstrado, parar antes de ativar.
   Preferir catálogo de clone/snapshot existente se disponível e representativo;
   clone não certifica sozinho o alvo real.
5. Aprovar credencial de leitura e canal privado do operador, sem copiar secrets
   ao Git/chat. Alteração de grants/rede/ativação é autorização separada quando
   necessária; conta existente não é garantia de visibilidade integral/RLS.

## Classificação A–D, feita somente após acesso autorizado

| Cenário | Evidência somente leitura necessária | Backup/restore e preflight | Baseline/migration | Validação, parada e writers |
|---|---|---|---|---|
| A. Banco/schema vazio | Identidade/geração, DB/schema e inventário integral mostram ausência de objetos/dados de aplicação e de history; schema não é apenas vazio por ACL/RLS; conferir outros schemas/extensões/consumidores | Preservar estado inicial/backup adequado inclusive roles/extensões; provar restauração em destino novoPG17; ensaiar cadeia vazia V1–V16. Preflight legado V1 não é aplicável nem deve ser forçado a aprovar vazio | Sem baseline; migrate V1–V16 por job, schemas/defaultSchema explícitos; schema ausente só pode ser criado se autorizado explicitamente | info/validate,16 versões/checksums, schema e Hibernate validate; parar em objeto inesperado/erro; writers só após gates e smoke |
| B. Legado sem Flyway | Inventário completo comprova V1 sem history, tipos/precisão/FKs/defaults/índices/objetos; origem/bruto por linha/lote separado; ferramenta alvoPG17 validada | Backup sob freeze incluindo nextval e DDL, restore equivalente; preflight V1 exit0 vinculado ao mesmo alvo/janela e inventário aprovado | Baseline **1 explícita**, somente se compatível com V1; conferir entrada BASELINE via info/history; depois V2–V16. Sem baseline automática | Conferir dados/bruto/null/UNKNOWN, história nova sem invenção; preflight2/3, divergência, corrida ou identidade incerta = STOP; não liberar writers por baseline bem-sucedida |
| C. Já versionado | history completa, versões, scripts/checksums/success, schemas/locations e migrador identificados; versão máxima e mudanças manuais; schema real coerente | Backup/restore atual e upgrade do clone a partir da versão observada; preflight legado deve recusar history e não é gate desse fluxo; usar info/validate e diff estrutural pertinente | Sem nova baseline; migrate somente versões pendentes até16 após histórico validado; se já16 e sem drift, nenhuma migration nova | Checksum divergente/versão desconhecida/future/failed/drift = STOP, sem repair; schema/dados e consumidores reconciliados antes dos writers |
| D. Incompatível/desconhecido | Falta de leitura integral, major não suportada, schema híbrido, V1 divergente, histórico inconsistente ou alvo não identificável | Capturar evidência de forma autorizada; preservar backup; ensaio e diagnóstico em clone somente | **Nenhuma baseline/migration**; projetar ajuste aditivo específico ou adaptação da ferramenta, com revisão e nova autorização | API/writers permanecem desligados/congelados. Não restaurar nem resetar origem para torná-la A/B/C |

Dump de banco vazio não substitui registro de identidades/privilégios/extensões.
Dados existentes não são fixtures de testes comuns. Clones com dados reais
precisam proteção e escopo autorizados; preferir dado sintético para testes de
produto e manter material sensível do restore em destino restrito.

## Ordem executável e gates

Cada item requer nova conferência de alvo/candidato no momento da ação. A coluna
de recuperação não concede autorização para executá-la. **Não encadear aprovações
de leitura, baseline, migration e publicação numa permissão implícita.**

A ordem abaixo é a sequência recomendada de preparação e adoção. O item5 pode
ser antecipado como inventário independente quando suas próprias pré-condições
e autorização forem atendidas; itens1–4 não criam um bloqueio técnico artificial
à leitura. Inicialização da API e promoção continuam dependentes dos seus gates.

| Ordem/alvo | Mecanismo previsto | Pré-condições | Efeito e evidência esperada | Parada | Recuperação possível / autorização |
|---|---|---|---|---|---|
| 1. Código local CF017/034 | Mudança isolada e revisão de PgSchemaInventory/RestoreSnapshot/CLI paraPG17, fixtures vazia/legada/versionada/negativa; testes dirigidos | Aceites atuais preservados; major17 confirmada como alvo | Ferramenta aceita16/17 apenas com invariantes provadas; pg_dump/restore17, V1–V16 e null/bruto conservados | Divergência de catálogo, perda ou oracle parcial | Manter ferramenta atual e não acessar alvo; precisa autorização de implementação |
| 2. Código local publicação | Controle de manutenção/writers/schedulers e health conforme CONFIGURACAO; pacote de imagem baseado em JAR testado ou imagem testada pelo digest | Contrato operacional escolhido; sem iniciar produto real | Provas DB indisponível, schema errado, sem writes/jobs, recuperação; digest da imagem e do JAR embarcado | Job escreve antes da liberação, endpoint protegido/vaza detalhes, pacote diverge | Descartar candidato local; precisa autorização de código/CI |
| 3. CI remoto CF034 | workflow_dispatch ci.yml suite=expanded, revisão do head_sha e artifacts | Lote aprovado/integrado; fixtures/outputs novos; gatilhos de deploy desligados; autorização de nova CI | Required e expanded reais, matriz/relatórios/zero skips/retry, pacote e cadeia daquele run | Checkout inesperado, falha, falta de relatório ou expiração | Preservar diagnóstico e parar; não iniciar retry para apagar falha; autorização só CI |
| 4. Config planejada Railway/Vercel | Painel/conector específico dos IDs acima; propor ORMvalidate, Flywayfalse na API, health/PORT, gate de jobs e previews | Changeset revisado; pending/staged/consumidores inventariados; evitar auto-aplicar deploy | Diff de configuração sanitizado e leitura após salvar; publicação antiga preservada | Plataforma inicia deploy/commit em cadeia não autorizado ou alvo diverge | Não confirmar/apply; restauração da configuração exige decisão; autorização de config separada |
| 5. Acesso inicial PG real | Operador inicia só PG se necessário; psql de leitura via service protegido; SQL proposto abaixo | Autorização exata PG+read; API/jobs/consumidores congelados e identificados | Identidade/geração/volume/major/DB/schema/ACL/RLS, inventário/history; classificar A–D | Visibilidade parcial, alvo incorreto, writer desconhecido, major inesperada | Encerrar sessão, manter API offline; parada do PG deve considerar consumidores; sem DDL |
| 6. Janela e backup | Freeze DDL/DML/nextval/admin e pipelines; pg_dump17 + capturas completas; registro de roles/extensões | Exclusividade demonstrada por responsáveis; armazenamento privado; alvo confirmado | Dump/hash/toolchain, snapshot bruto por PK/campo/relações/saldos/schema/sequences, janela vinculada | Qualquer alteração entre capturas/dump, falta de privilégio ou saída incompleta | Parar e repetir captura+dump sob nova janela, sem apagar anterior; autorizar backup |
| 7. Restore em destino novo | pg_restore17 --exit-on-error em DB clone novo; CLI snapshot/compare validadoPG17 | Origem protegida; destino vazio novo, ID distinto; recursos/custo aprovados | Restore equivalente por linha/campo/schema, null/bruto/metadados/saldos/FKs e sequences; ensaio da recuperação | Erro ou diferença, mesmo com contagens iguais | Preservar clone e falha; não migrar origem; criação/restauração de clone autorizadas |
| 8. Preflight e decisão A/B/C | CLI preflight sóB; catálogo completoA; Flywayinfo/validate+driftC | Backup/restore aprovado; exclusividade contínua de identidade/ferramentas/config | Recibo gate completo vinculado a commit/hashes/inventário, início/fim e manutenção da janela | Exit2/3, drift/DDL/redeploy/restauração, tool/config alterada ou perda de cobertura | Reidentificar/restabelecer janela e repetir gate; aprovação não vale por idade |
| 9. Baseline sóB | Maven Flyway baselineVersion=1, comando separado abaixo; info/history em seguida | Autorização **baseline** expressa; gateB exit0 ainda válido, todos vínculos e freeze contínuos | Entrada BASELINE1 bem-sucedida, nenhuma migration inesperada | Resultado incerto/erro/history inesperada | Inspecionar history antes de qualquer repetição; sem repair ou nova baseline às cegas |
| 10. Migration A/B/C | Flyway job único, schemas/defaultSchema/locations/target16 explícitos; info/validate antes/depois | Autorização migration, cenário aprovado, backup/restauração e ensaio; API continua offline | Cada versão esperada uma vez; logs/checksums e schema finais; duração/locks dentro da janela | Lock wait/timeout/versão não prevista/falha/dados divergentes | Parar, registrar estado real e falha. Transação PostgreSQL não garante que toda cadeia já aplicada voltou; correção progressiva revisada |
| 11. Validação sem writers | CLI catálogo/snapshot/compare pós, Flywayinfo/validate, verificação schema por Hibernate em modo sem migration/jobs/ingress de escrita | Cadeia final aprovada; guard testado; runtime sem DDL; autorização de iniciar API restrita | Schema validate, ausência de DDL/migrate no boot, identidade de imagem/JAR/config | Diff desconhecido, writer/job inicia, startup falha | Parar API, preservar logs e banco; manter schema; não habilitar update para subir |
| 12. Smoke de homologação | BFF→API→PG de homologação isolada: HTTPS/login/onboarding/operação/reload/export | CF035 autorizada e dependências/gates satisfeitos; sintéticos; política de e-mail/mercado; backup plano | Uma escrita autorizada tem efeito único e reconcilia SQL/UI/export; sessão/ownership/recovery | Falha de saúde, duplicidade, diferença monetária/temporal ou segredo | Congelar writes, preservar prova, escolher binário compatível; não usar registros reais como fixture |
| 13. Promoção CF036 | Deploy manual controlado pelo digest de imagem e versão frontend aprovados; promoção pelo mecanismo do provedor | CF033/034/035 aceitas no alcance necessário, zoom e CF017 reais satisfeitos, autorização de promoção e destino | URLs/revisões/config/digests e smoke sintético autorizado; schema compatível antes do binário | Revisão muda, health/smoke falha ou pacote diverge | Não promover ou retornar aplicação compatível; recuperação de banco é outra decisão |
| 14. Liberação de uso/writers | Remover manutenção/liberar writers e agendadores em ordem registrada; observar primeira execução | Responsável decide GO por evidência de todos os gates, baseline/migrate não bastam | Primeiro uso consistente; jobs/email/mercado somente no escopo autorizado | Inconsistência, 5xx sustentado, auth/owner incorreto, readinessdown | Congelar imediatamente writes/jobs; não apagar metadados novos |
| 15. Monitorar/reverter | Monitor externo readiness + logs sanitizados, BFF503/504, pool/locks, falhas de jobs e reconciliação | Dono e janela de observação definidos; sem PII nos logs | Smoke inicial,30min e24h propostos; prontidão observada separadamente de tráfego zero | Financeiro/auth incorreto: parada imediata; readinessdown repetido: manutenção/investigação | Rollback aplicação compatível; restore só em clone e decisão explícita sobre perdas/reconciliação |

Antes da promoção, registrar dono de cada ação e duração orçada a partir do
ensaio; orçamento/horário de janela, RPO/RTO, retenção privada e responsável de
alerta ainda exigem decisão. Não inventar disponibilidade/RTO medidos. Proposta
inicial: alertar após3 readiness falhos em intervalos30s; qualquer quebra de
isolamento/reconciliação monetária interrompe sem esperar os90s. Thresholds de
latência/pool devem vir do ensaio; não prescrever escala por um painel vazio.

## Comandos preparados, não executados

Os símbolos abaixo são parâmetros a preencher após identificação/autorização.
Não colocar connection strings/senhas na linha de comando, em arquivos Git ou
logs. PGSERVICE/PGSERVICEFILE/PGPASSFILE e variáveis CF017/FLYWAY devem ser
injetados por canal protegido do operador. `--dbname service=...` contém somente
nome de serviço, não segredo. Usar clientesPG17 para o servidor17 confirmado;
pg_dump16 não pode ser presumido compatível com servidor mais novo.

### Catálogo inicial somente leitura

```powershell
psql -X -v ON_ERROR_STOP=1 --dbname "service=$cf017ReadService" `
  -v "expected_database=$cf017Database" -v "target_schema=$cf017Schema" `
  --file tasks/evidencias/revisao-prontidao-CF034-CF017/inventario-somente-leitura.sql
if ($LASTEXITCODE -ne 0) { throw 'STOP: inventário incompleto' }
```

Esse arquivo contém BEGIN READ ONLY e rollback, consulta apenas catálogos/history
sem nomes de usuários/dados de negócio e confere database/schema. Não é um
certificador de V1; exige inventário semântico completo, ACL/RLS e vínculos de
identidade externos. Não imprime connection string e não inicia Spring.

CLI operacional existente, a executar apenas após suportePG17 revisto:

```powershell
# Backend; preparação local do classpath conforme ROLLOUT-LEGADO.md.
./mvnw.cmd --batch-mode -DskipTests compile dependency:build-classpath `
  '-DincludeScope=runtime' '-Dmdep.outputFile=target/cf017-classpath.txt'
if ($LASTEXITCODE -ne 0) { throw 'STOP: build da ferramenta' }
$cf017Classpath = 'target/classes' + [IO.Path]::PathSeparator + (Get-Content target/cf017-classpath.txt -Raw).Trim()
$cf017Main = 'com.controlefinanceiro.api.infra.migration.DatabaseVerificationCli'
& "$env:JAVA_HOME/bin/java" -cp $cf017Classpath $cf017Main preflight $cf017Schema $cf017Database
if ($LASTEXITCODE -ne 0) { throw 'STOP: sem baseline/migration' }
```

skipTests nesse comando produz a ferramenta/classpath, **não** nova evidência
de teste nem autorização de pacote. A revisão/ferramenta e JDK21 devem ser
vinculados ao recibo. Exit0/2/3 conservam o significado do runbook; não alterar
o verificador real para tornar desconhecido compatível. ParaA/C não chamar
preflight legado como se fosse exigência aplicável.

### Backup/restore e equivalência

```powershell
pg_dump --version
# CF017_* seleciona a ORIGEM; toda a janela de freeze já está comprovada.
& "$env:JAVA_HOME/bin/java" -cp $cf017Classpath $cf017Main snapshot $cf017Schema $cf017Database $cf017BeforeDirectory
if ($LASTEXITCODE -ne 0) { throw 'STOP: captura da origem' }
pg_dump --format=custom --dbname "service=$cf017BackupService" --file $cf017Dump
if ($LASTEXITCODE -ne 0) { throw 'STOP: backup falhou' }
Get-FileHash -LiteralPath $cf017Dump -Algorithm SHA256
# Destino NOVO previamente criado e conferido, nunca a origem.
pg_restore --exit-on-error --single-transaction --dbname "service=$cf017RestoreService" $cf017Dump
if ($LASTEXITCODE -ne 0) { throw 'STOP: restore falhou' }
# Operador seleciona CF017_* do CLONE por canal protegido, sem eco.
& "$env:JAVA_HOME/bin/java" -cp $cf017Classpath $cf017Main snapshot $cf017RestoredSchema $cf017RestoredDatabase $cf017RestoredDirectory
if ($LASTEXITCODE -ne 0) { throw 'STOP: captura do clone' }
& "$env:JAVA_HOME/bin/java" -cp $cf017Classpath $cf017Main compare $cf017BeforeDirectory $cf017RestoredDirectory
if ($LASTEXITCODE -ne 0) { throw 'STOP: restore não equivalente' }
```

A origem é capturada sob a mesma janela do dump, **antes** da
comparação; o bloco depende da seleção protegida e conferida de origem e clone.
Capturas completas e dump compartilham
snapshot ou freeze comprovado. pg_dump é snapshot consistente para dados MVCC,
mas sequences/nextval e sessões de captura separadas requerem freeze do runbook.
Snapshot de volume e dump lógico são recuperações diferentes; ensaiar a escolhida.
Não usar --clean nem restore em cima da origem. Roles/owners/extensões/globais
necessários devem ser inventariados e preservados por procedimento próprio; um
dump de database isolado não certifica sua reconstrução integral.

### Flyway operacional

No backend, com FLYWAY_URL/FLYWAY_USER/FLYWAY_PASSWORD injetados sem eco e sem
usar perfil/URL inferidos da aplicação. Config adicional comum a todo comando:

```powershell
$cf017FlywayArgs = @('--batch-mode', "-Dflyway.schemas=$cf017Schema", "-Dflyway.defaultSchema=$cf017Schema", '-Dflyway.createSchemas=false', '-Dflyway.target=16', '-Dflyway.outOfOrder=false', '-Dflyway.baselineOnMigrate=false', '-Dflyway.cleanDisabled=true', '-Dflyway.validateOnMigrate=true')
./mvnw.cmd @cf017FlywayArgs flyway:info
if ($LASTEXITCODE -ne 0) { throw 'STOP: info' }
# Somente B, depois de autorização específica e gate V1 válido:
./mvnw.cmd @cf017FlywayArgs '-Dflyway.baselineVersion=1' flyway:baseline
if ($LASTEXITCODE -ne 0) { throw 'STOP: baseline incerta; inspecionar history' }
# Conferir info/history da baseline antes de migrar. A/C não fazem baseline.
# Antes, comparar a lista Pending do info com o plano aprovado, arquivo por arquivo.
# Somente essas versões pendentes são esperadas na validação pré-migração.
./mvnw.cmd @cf017FlywayArgs '-Dflyway.ignoreMigrationPatterns=*:pending' flyway:validate
if ($LASTEXITCODE -ne 0) { throw 'STOP: validate' }
./mvnw.cmd @cf017FlywayArgs flyway:migrate
if ($LASTEXITCODE -ne 0) { throw 'STOP: migração; não repetir às cegas' }
./mvnw.cmd @cf017FlywayArgs '-Dflyway.ignoreMigrationPatterns=' flyway:validate flyway:info
if ($LASTEXITCODE -ne 0) { throw 'STOP: validação final' }
```

Este bloco reúne **alternativas condicionais**, não script pronto para executar
de ponta a ponta: baseline é sóB e exige autorização própria; bancoA inicia pelo
migrate depois do gate de vazio. O plugin no POM define locations
filesystem:src/main/resources/db/migration e a versão gerenciada correspondente;
conferir config efetiva/overrides/checksums e incluir versão de ferramenta no
recibo. Flyway embarcado conferido no JAR:11.14.1, driver PostgreSQL42.7.9,
Hibernate7.2.1.Final, HikariCP7.0.2. Standalone validate também pode recusar
migrations pendentes: a exceção pré-migração `*:pending` só é usada depois de
conferir a lista exata aprovada, não ignora checksum/missing/failed/future. Na
validação final a lista de padrões é esvaziada; qualquer pendência impede GO.
Ensaiar essa semântica na11.14.1 antes do alvo; não aceitar padrões genéricos de
ignorar erros. Não existe comando repair/clean nem baseline-on-migrate neste plano.

## Janela, concorrência e dados temporais

Vincular preflight a identidade e geração do recurso, environment, endpoint,
database/schema, commit, SHA do inventário legacy-v1.manifest, SQL comparador,
migrations e ferramentas/JDK/driver/config. O CLI não emite todos esses vínculos:
o operador precisa compor o recibo. Responsável único mantém controles de DDL,
restore, migradores, operadores, pipelines e aplicações até baseline/migration.

DDL após preflight, troca/restauração de alvo, alteração de ferramenta/config,
perda de continuidade ou executor desconhecido invalida o gate. Reestabelecer
controles, repetir e registrar. Resultado recente não elimina corrida; lock
posterior do Flyway não protege o intervalo anterior. DML e sequences não são
certificados pelo comparador V1: precisam freeze/capturas próprios para backup
e transformação, mesmo se a validade estrutural não mudou. V1 não contém
sequences; objeto adicional é divergência, não ignorá-lo por ser DML.

Preservar date/created_at bruto, legacy_created_at_raw, UNKNOWN/null e precisão.
recorded_at histórico não é data da operação, meia-noite, agora ou rename de
created_at. Novos writers usam Clock; V14 adiciona goal_history.recorded_at sem
backfill. Legado sem prova permanece desconhecido. Transformação temporal por
lote só com proveniência, versão do algoritmo, contagens e decisão de offset
ambíguo explícitas. Isso é migração de metadados separada da migração estrutural.

Coordenar todos os writers/clientes: conta/abertura, transações/recebíveis,
cartões/faturas/pagamento/estorno, investimento/ajuste/valoração, metas/hábitos,
onboarding/aplicação, crons/listeners, BFF/DTO/lista/detalhe/ordem/exportação e
clientes antigos/integradores. Binário antigo não pode escrever sobre linhas
canônicas sem atualizar os metadados. Preservação de dados requer prova por
PK/campo, relações e saldos, não só quantidade de linhas.

EXPLAIN/índices e paginação devem ser medidos no clone representativo autorizado:
preferir EXPLAIN sem execução na leitura inicial; EXPLAIN ANALYZE só depois de
aprovar a execução e sua carga. Ordenação pode custar O(N log N), offset pode
reler O(offset+limite). Não inventar índice ou prometer ganho/N+1 eliminado sem
plano real. Medição de ambiente real é pendência P01/P02, não bloqueio retroativo
dos testes locais já aceitos.

## Reversão de aplicação e recuperação de banco

Rollback de aplicação escolhe imagem/frontend **compatíveis com o schema já
migrado e as escritas novas**. A publicação antiga preservada pode não ser um
binário compatível: conferir writers/DTO/metadados antes de elegê-la como rollback.
Não basta clicar rollback no provedor.

Falha antes de escrita nova: verificar transação/history e versões já commitadas,
parar API, preservar backup/origem. Rollback de DDL transacional em curso é
diferente de desfazer uma cadeia inteira. Recuperação a partir do backup somente
com plano/identidade e autorização explícitos, preferindo destino novo validado.

Depois de escrita nova: congelar writers/jobs, preservar banco original e
metadados, levantar efeitos desde o backup. Não apagar colunas nem restaurar
automaticamente por cima perdendo novas operações. Preferir versão compatível
ou migration corretiva **posterior à última aplicada**, com reconciliação; restore
é recuperação extraordinária com decisão sobre RPO e perda de dados. Sem repair,
alteração de checksum ou down migration destrutiva como padrão.

Referências: [runbook aprovado](../CF-017/ROLLOUT-LEGADO.md),
[pg_dump17](https://www.postgresql.org/docs/17/app-pgdump.html),
[pg_restore17](https://www.postgresql.org/docs/17/app-pgrestore.html).
[Flyway Maven](https://documentation.red-gate.com/flyway/reference/usage/maven-goal)
documenta configuração por ambiente e sua precedência;
[validate](https://documentation.red-gate.com/flyway/reference/commands/validate)
inclui versões resolvidas ainda não aplicadas entre as possíveis falhas.
São procedimentos preparados; restauração/compatibilidade reais continuam sem prova.
