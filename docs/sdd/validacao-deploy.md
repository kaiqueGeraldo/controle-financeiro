# Validação e deploy

## Adoção Railway/Vercel após a PR #3 — 05/11/2026

Este é o procedimento vigente. A seção de destino e as pendências ao fim deste
documento registram a primeira sessão. Para o estado atual, consulte o
[inventário e a matriz pós-merge](prontidao-adocao-2026-11-05.md).
O plano atualiza o procedimento A–D da revisão local 46b85ee0 e preserva as
regras do ROLLOUT-LEGADO de 8a83c357. Ambos continuam recuperáveis pelo Git.
A cadeia atual termina em **V16**.

### Alvos e decisão atual

- Railway, projeto controle-financeiro, ID 19974952-914d-4072-9140-e62e5ed23c31,
  ambiente production 73f7324a-a15f-4940-b2dc-d5bcb5510441. API
  f4ad9689-58ed-4112-8bb2-2cfe4af24483. Postgres
  79d2ee56-cfd0-47bc-8744-e932cf49ba69, volume postgres-volume
  1fe34e12-e948-4c99-8448-7cfbf871ec54 em /var/lib/postgresql/data. Ambos offline.
- Vercel, kaiquedev/controle-financeiro, ID prj_OdfwpJWp3wv8ZgfpcjVEBscrj03r.
  Production acompanha main. Homologação exige alvo descartável identificado,
  PostgreSQL separado e fixtures sintéticas.
- A revisão de produto é 99025fa9fe93da19e9d40678d1e9eeeb78e698f9. Banco
  **desconhecido**. A configuração da imagem é PG17 e há indicação histórica
  de PG16 operacional. Resolver o major do volume antes de iniciar um binário
  contra ele.

### Lote 1 para autorização — somente Postgres e inventário

1. Reconfirmar os IDs acima, a geração/volume, API offline, ausência de changeset
   Railway, autodeploy desligado e exclusividade frente a clientes, scripts,
   operadores e jobs. Usar canal privado existente, papel de leitura já
   disponível e saída sanitizada. Se faltar canal, papel adequado ou controle
   dos consumidores, interromper e apresentar a alteração separada.
2. Procurar evidência de major compatível sem ligar a API. Usar histórico
   inequívoco da mesma geração ou inspeção autorizada e somente de leitura do
   metadado PG_VERSION, se a plataforma a permitir sem inicializar ou
   remontar em modo de escrita. A tag PG17 sozinha é insuficiente. Se persistir
   a dúvida, encerrar o lote antes da ativação e preparar inspeção offline ou
   recuperação compatível para autorização própria. Se PG16 for confirmado,
   usar somente runtime PG16 comprovado, com nova autorização caso seja
   preciso alterar a imagem. [Política de versões PostgreSQL](https://www.postgresql.org/support/versioning/)
3. Com os controles comprovados, iniciar somente o Postgres existente com
   runtime compatível, no mesmo ambiente e volume. Selecionar o deployment do serviço Postgres no painel. Se houver apenas
   redeploy, confirmar antes o snapshot/configuração, a resolução da imagem
   e o mesmo volume. O start pode gerar cobrança e efeitos normais de startup, WAL ou recuperação do servidor.
   Limite proposto de 30 minutos online, com operador acompanhando desde o
   start. Sem infraestrutura adicional, mudança de plano, proxy público,
   troca de imagem, reconfiguração de acesso ou aceite de patch de ambiente.
   Se a única operação disponível iniciar outros recursos, trocar configuração
   ou publicar outra revisão, interromper.
4. Consultar somente versão, catálogos, metadados do schema e histórico Flyway
   pelo roteiro abaixo. Registrar resumo sanitizado, alvo e horário. Sem leitura
   de linhas financeiras ou pessoais neste lote. Em caso de major inesperado,
   erro ou privilégios insuficientes, manter classificação desconhecida.
   Encerrar sessão e devolver o Postgres a offline com a operação de parada
   do deployment específico no painel (Remove do deployment). Confirmar offline, volume e duração.
   A falta de caminho de parada confiável impede o start.

O lote exige autorização para inventário do alvo real e, condicionalmente,
start/stop do Postgres. A API permanece offline. O inventário inicial independe
do zoom nativo, do deploy da API e de CI novo.

#### Resultado do lote 1 em 05/11/2026

A execução autorizada parou antes da ativação. O Postgres e a API continuaram
offline. A imagem configurada resolve para PostgreSQL 17.11 no registro
consultado. A geração e a versão major do volume não foram comprovadas.
Nenhum inventário SQL do alvo ocorreu. Consulte a
[matriz e o recibo do lote](prontidao-adocao-2026-11-05.md#lote-1--parada-anterior-à-ativação-em-05112026).

O próximo passo é obter do Railway um recibo do PG_VERSION em
/var/lib/postgresql/data/pgdata, ligado à geração atual do volume
1fe34e12-e948-4c99-8448-7cfbf871ec54. Pedir confirmação da presença de
global/pg_control como evidência de cluster inicializado. A inspeção deve
ocorrer offline, sem montagem com escrita, execução do entrypoint ou
transferência de arquivos de dados. Alternativamente, obter histórico
verificável de startup bem-sucedido vinculado ao mesmo volume, geração e
PGDATA, com confirmação de que não houve substituição ou restauração
posterior. O CLI de arquivos exige deployment ativo, então é preciso
confirmar com o provedor um caminho offline. Abrir chamado em nome do
usuário ou criar snapshot/montagem depende de autorização própria.

Com PG17 comprovado, reconferir a resolução da imagem e os scripts de
startup, a exclusividade, o papel de leitura, a rota privada e a parada
antes de retomar a janela. Preparar um limite de 30 minutos que inclua
tempo para remover o deployment e confirmar offline, com relógio e
operador disponíveis antes do start. Se o major for 16, o caminho com
runtime compatível exige um procedimento separado caso altere imagem ou
configuração. Se faltarem o arquivo ou a identificação inequívoca,
manter classe D e interromper antes do start. A ausência de PG_VERSION
não comprova banco vazio.

### Inventário somente de leitura

No terminal do operador com rede privada, usar psql com PGSERVICEFILE/PGPASSFILE
protegidos e login previamente autorizado. Confirmar projeto, ambiente, serviço,
volume, endpoint, database, schema e identidade do papel antes da conexão.
Railway SSH pode ser usado em serviço já ativo e autorizado se houver rota
privada e papel. Um terminal local fora dessa rede não resolve o DNS privado.

~~~powershell
psql -X -v ON_ERROR_STOP=1 --dbname "service=$cf017ReadService" -v "expected_database=$cf017Database" -v "target_schema=$cf017Schema" --file docs/sdd/inventario-postgres-somente-leitura.sql
if ($LASTEXITCODE -ne 0) { throw 'STOP: inventário incompleto ou alvo divergente' }
~~~

O SQL usa transação somente leitura e limites de instrução e lock. Em caso de
sucesso, encerra com ROLLBACK. Em caso de erro, o psql fecha a sessão e
interrompe com exit diferente de zero. Conferir schemas adicionais, extensões, grants, RLS e histórico em
outro schema. Se o catálogo não permitir decidir, preparar consulta suplementar
autorizada por tabela aprovada, com resultado agregado ou EXISTS, sem exportar
linhas. RLS, contagens aproximadas e visibilidade parcial não provam ausência.

| Classe | Prova necessária | Caminho a autorizar |
|---|---|---|
| A. Vazio | Identidade/geração confirmadas e visibilidade suficiente em todo o escopo. Sem objetos de aplicação nem history. Schema ausente exige verificação independente antes de autorizar sua criação. | Preservar estado inicial, roles/ACL/extensões relevantes, demonstrar recuperação e ensaiar criação no clone. Flyway migrate V1–V16, sem baseline. |
| B. Legado | Schema não versionado, inventário semântico e compatibilidade V1 aprovados. Um schema de aplicação com zero linhas continua exigindo compatibilidade. | Backup/restore verificável e preflight legado exit 0 dentro da janela. Baseline explícita 1, checar BASELINE no history e migrar V2–V16. |
| C. Versionado | History completo e confiável, scripts/versões/checksums/success e schema sem drift incompatível. | Backup/restore e ensaio do delta. Flyway info/validate e migrate somente as pendentes aprovadas até V16. Se já em V16 e validado, seguir sem novo DDL. |
| D. Desconhecido/incompatível | Serviço offline, major divergente, schema híbrido, histórico inconsistente, visibilidade parcial ou identidade incerta. | Manter API offline. Inventário/diagnóstico de leitura ou ensaio em cópia, conforme autorização. Suspender baseline e migrate até resolver. |

### Fases, evidência e recuperação

Cada GO exige responsável, alvo e versão reconferidos, evidência registrada e
autorização específica. Suspender diante de erro de identidade, drift, perda
de exclusividade ou falha de integridade.

| Fase e alvo | Pré-condição, ação e efeito esperado | Evidência e parada | Recuperação e autorização |
|---|---|---|---|
| 0–2. Alvo e leitura inicial no PG | Executar o lote 1 acima. Se houver alteração pendente ou restart em cadeia, parar antes de tocar o volume. | Recibo da geração, major, inventário e classificação. D bloqueia schema e API. | Fechar sessão e retornar a offline preservando volume. Autorizar inventário e start/stop do Postgres. |
| 3. Backup da origem e restore isolado | A/B/C identificados, capacidade e custódia definidas, freeze de DDL, DML, jobs e sequences. Usar clientes compatíveis, dump lógico e cópia separada com controles de acesso, roles e extensões equivalentes. | SHA-256 do dump, recibo do restore, equivalência de schema, chaves/campos, relações, saldos e sequences. Parar por erro, visibilidade parcial ou diferença. | Preservar fonte, dump e falha. Repetir em destino novo após diagnóstico. Autorizar backup, dados no clone e recursos da janela. |
| 4. Preflight e ensaio | Mesmo alvo/ferramenta, restore equivalente. B usa preflight legado, A confirma vazio integral, C compara schema/history e Flyway info/validate. Ensaiar até V16 no clone antes da origem. | Recibo com hashes, versões, tempos/locks e janela contínua. B exige exit 0 e relatório compatível sem REVIEW_REQUIRED. | Perdeu validade, reidentificar, restabelecer freeze e repetir o gate. Autorizar ensaio e preflight no alvo. |
| 5. Homologação CF-035 | Ensaiar o rollout em alvo sintético isolado antes de intervenção de produção, com a mesma imagem/contrato. Validar BFF/frontend HTTPS em Preview protegido e isolado, e-mail com caixa de teste e cotação controlada. | Login/logout, onboarding, operação, reload/persistência, exportação, ownership, saldo e UX em erro. Medir boot, locks, pool e queries. | Fechar writers e corrigir no alvo isolado. Autorizar recursos e smoke de homologação. |
| 6. Baseline/migração no PG | Janela exclusiva vigente, recuperação ensaiada. Um executor Flyway e API offline. Aplicar caminho A/B/C com o plugin do POM. | BASELINE 1 apenas em B, migrations esperadas, info/validate final, reconciliação e Hibernate validate depois. Parar em erro, lock fora do orçamento ou efeito inesperado. | Inspecionar history/transações antes de retomar. Preservar versões já aplicadas. Autorizar baseline B e migrate explicitamente. |
| 7. API em manutenção | Schema final conferido, imagem/JAR identificados, perfil adoption, writers/jobs false. Iniciar uma instância com acesso restrito e a configuração abaixo. | Liveness 200, readiness 503, rotas funcionais inclusive GET e OPTIONS 503, logs sem DDL/migrate e validação JPA no startup. Qualquer escrita, falha de boot ou pacote divergente interrompe. | Parar a instância e preservar schema, logs e receita de build. Autorizar configuração e start restrito. |
| 8. Candidato de produção CF-036 | CF-033/034/035 e adoção CF-017 revisados no alcance necessário, decisão de zoom para release, autorizações e rollback compatível. Isolar previews antigos e clientes antigos antes de abrir writers. Configurar BFF Production e criar deployment Vercel manual sem alias de produção. | BFF para destino confirmado, revisão identificável, domínio/HTTPS/cookie corretos e acesso restrito. Se o isolamento do BFF antigo/API não for demonstrável, parar. | Manter alias anterior e API em manutenção. Autorizar configuração e publicação controlada separadamente. |
| 9. Smoke controlado e promoção | Manter público e clientes antigos fora. Parar/drenar processo de manutenção e iniciar o mesmo digest com writers true/jobs false e readiness. Validar o deployment Vercel sem alias com conta sintética autorizada. | Readiness 200 e reconciliação após reload. Com GO, promover o mesmo deployment, liberar clientes da revisão compatível e validar domínio oficial. | Falha congela writers. Retornar frontend/API apenas para versões compatíveis com schema e efeitos já gravados. Autorizar smoke com escrita, promoção e abertura de uso. |
| 10. Jobs e observação | Uso estável, revisar backlog, cron, timezone, ShedLock, replay, notificações e mercado. Reinício separado para jobs true. | Primeira rodada e checkpoints propostos de 30 min e 24 h. Disponibilidade, 5xx/503/504, pool, CPU/memória/locks, reconciliação e e-mails sem PII. | Falha monetária/auth/ownership congela escrita imediatamente. Três falhas de readiness em intervalos de 30 s disparam avaliação de manutenção. Autorizar jobs e efeitos externos. |

A homologação sintética da fase 5 pode começar independentemente da
classificação do banco real. Seu aceite precede a migração de produção. O clone restrito da fase 3
serve ao ensaio de recuperação e compatibilidade, com custódia separada.

No modo inicial da fase 7, usar liveness como healthcheck de um deployment
restrito ou verificar liveness via rede privada. Readiness retorna 503 enquanto
writers estão fechados. Na fase 9, aplicar readiness antes de abrir tráfego.
O healthcheck Railway valida o cutover e requer HTTP 200 na porta configurada,
com Host healthcheck.railway.app quando houver filtro de hosts. A observação
contínua exige monitor externo. Liveness é O(1) sem banco. Readiness saudável
faz um empréstimo do pool e isValid(1). [Healthchecks Railway](https://docs.railway.com/deployments/healthchecks)

### Comandos para backup, preflight e migração

Em checkout descartável da revisão de produto, no backend, use JDK 21 e o
wrapper. O CLI abaixo é a entrada operacional existente, sem bootstrap Spring.
Vincular versões e hash do inventário legado, migrations e ferramenta ao
recibo. Usar o mesmo conjunto de versões ensaiado, com pg_dump/pg_restore da
major efetiva. Injetar CF017_JDBC_URL, CF017_DB_USER, CF017_DB_PASSWORD e
FLYWAY_URL, FLYWAY_USER, FLYWAY_PASSWORD por canal protegido, sem eco.

~~~powershell
./mvnw.cmd --batch-mode -DskipTests compile dependency:build-classpath '-DincludeScope=runtime' '-Dmdep.outputFile=target/cf017-classpath.txt'
if ($LASTEXITCODE -ne 0) { throw 'STOP: preparo do CLI' }
$cf017Classpath = 'target/classes' + [IO.Path]::PathSeparator + (Get-Content target/cf017-classpath.txt -Raw).Trim()
$cf017Main = 'com.controlefinanceiro.api.infra.migration.DatabaseVerificationCli'
$cf017Java = Join-Path $env:JAVA_HOME 'bin/java'

# CF017_* da origem, sob freeze. Diretório novo e protegido.
& $cf017Java -cp $cf017Classpath $cf017Main snapshot $cf017Schema $cf017Database $cf017BeforeDirectory
if ($LASTEXITCODE -ne 0) { throw 'STOP: snapshot da origem' }
pg_dump --format=custom --dbname "service=$cf017BackupService" --file $cf017Dump
if ($LASTEXITCODE -ne 0) { throw 'STOP: dump' }
Get-FileHash -LiteralPath $cf017Dump -Algorithm SHA256

# Restaurar em database novo, destino privado conferido e distinto da origem.
pg_restore --exit-on-error --single-transaction --dbname "service=$cf017RestoreService" $cf017Dump
if ($LASTEXITCODE -ne 0) { throw 'STOP: restore' }
# Selecionar CF017_* do clone sem eco antes de capturar.
& $cf017Java -cp $cf017Classpath $cf017Main snapshot $cf017RestoredSchema $cf017RestoredDatabase $cf017RestoredDirectory
if ($LASTEXITCODE -ne 0) { throw 'STOP: snapshot do clone' }
& $cf017Java -cp $cf017Classpath $cf017Main compare $cf017BeforeDirectory $cf017RestoredDirectory
if ($LASTEXITCODE -ne 0) { throw 'STOP: divergência no restore' }

# Somente B, com CF017_* apontando à origem autorizada na janela de preflight.
& $cf017Java -cp $cf017Classpath $cf017Main preflight $cf017Schema $cf017Database
if ($LASTEXITCODE -ne 0) { throw 'STOP: sem baseline/migration' }
~~~

O dump deve permanecer íntegro e protegido. Sem --clean ou restore sobre a
origem. Registrar versão, roles/owners, grants, RLS, extensões, encoding, locale
e parâmetros necessários, com equivalência no destino isolado. O snapshot pode
exigir inventário complementar de objetos e dados fora do seu alcance, inclusive
em A. Comparar sem publicar arquivos de linhas/campos. Capturas separadas
exigem freeze contínuo, inclusive de sequences, fora da proteção MVCC. Em A
com schema ausente, recuperação do estado original e criação explícita do schema
são operações distintas. [pg_dump](https://www.postgresql.org/docs/17/app-pgdump.html) · [pg_restore](https://www.postgresql.org/docs/17/app-pgrestore.html)

Para o Flyway, identificar o schema padrão/history e conferir overrides, estado
Pending e hashes do conjunto antes de cada operação. Executar cada comando
separadamente, com parada imediata em exit diferente de zero.

~~~powershell
$cf017FlywayArgs = @('--batch-mode', "-Dflyway.schemas=$cf017Schema", "-Dflyway.defaultSchema=$cf017Schema",
  '-Dflyway.createSchemas=false', '-Dflyway.target=16', '-Dflyway.outOfOrder=false',
  '-Dflyway.baselineOnMigrate=false', '-Dflyway.cleanDisabled=true', '-Dflyway.validateOnMigrate=true')
./mvnw.cmd @cf017FlywayArgs flyway:info
# B somente, após preflight aprovado e autorização de baseline.
./mvnw.cmd @cf017FlywayArgs '-Dflyway.baselineVersion=1' flyway:baseline
./mvnw.cmd @cf017FlywayArgs flyway:info
# A/B/C antes de migrate, após conferir cada pendência esperada.
./mvnw.cmd @cf017FlywayArgs '-Dflyway.ignoreMigrationPatterns=*:pending' flyway:validate
./mvnw.cmd @cf017FlywayArgs flyway:migrate
# Após migrate, ou em C sem pendências, checar versões sem ignorar pending.
./mvnw.cmd @cf017FlywayArgs '-Dflyway.ignoreMigrationPatterns=' flyway:validate flyway:info
~~~

Ensaiar configuração e semântica do validate na 11.14.1, inclusive esvaziamento
do padrão final. Parar em versão futura, failed, checksum divergente, migration
ausente ou drift. Sem repair, clean, reescrita de migração aplicada ou baseline
automática. [Flyway validate](https://documentation.red-gate.com/flyway/reference/commands/validate)

### Janela, capacidade e compatibilidade

O recibo liga projeto/ambiente/serviço/volume/geração, endpoint, database/schema,
commit, inventário, migrations, ferramenta/configuração e responsável único.
Manter exclusividade entre preflight e baseline/migrate. Mudança de alvo,
schema, history, ferramenta/configuração, restore ou perda de controle exige
reavaliar e repetir o gate afetado. O lock Flyway começa depois do preflight.
DML conhecido pode preservar a validade estrutural, mas escrita, nextval ou
setval durante freeze invalida as capturas de dados afetadas. Sem continuidade
demonstrada, recomeçar a janela. A validade depende da evidência da janela.

DDL pode obter locks fortes e bloquear até leitura. Validações, varreduras,
índices e reescritas consomem I/O, WAL e espaço temporário. Medir no clone
autorizado tamanho por tabela/índice, folga de volume/WAL, duração por versão
e retenção de locks, na mesma major e com capacidade representativa. Consultar
pg_locks e pg_stat_activity sem capturar texto sensível. Definir lock_timeout,
statement_timeout, limite da janela, folga de storage, RPO/RTO e dono do GO
pelo ensaio. Tempos sintéticos, inclusive 40 s de boot local, não projetam
produção. Validar orçamento de healthcheck com boot frio, sem DDL no processo
da API. Uma réplica inicial, sem sobrepor writers. Definir RAILWAY_DEPLOYMENT_DRAINING_SECONDS para cobrir a janela graciosa medida (Spring prevê até 30 s por fase) e confirmar quiescência antes de iniciar o substituto. O padrão de overlap do provedor não garante exclusividade. [Deployments Railway](https://docs.railway.com/deployments/reference)

Readiness, Hikari e migração
compartilham capacidade do banco.

Preservar datas civis, offsets conhecidos, created_at bruto,
legacy_created_at_raw, UNKNOWN/null e precisão. V14 acrescenta recorded_at
histórico sem backfill. Transformação temporal só em lote separado com fonte
rastreável, algoritmo versionado, offsets ambíguos tratados e reconciliação.
Coordenar writers/consumidores de contas, transações, cartão/fatura,
planejamento, investimentos, metas/hábitos, onboarding, listeners, jobs,
clientes antigos, BFF e exportação. Medir EXPLAIN no clone por usuário, dia,
hora e ID. Ordenação pode custar O(N log N) nas N linhas selecionadas e OFFSET
faz atravessar linhas anteriores. Confirmar planos, cardinalidade, paginação e
consultas por requisição antes de aprovar índice ou afirmar ausência de N+1.

### Diff operacional proposto

| Serviço/ambiente e configuração | Atual | Proposto e momento | Validação e recuperação |
|---|---|---|---|
| Railway production/Postgres, imagem/volume e rede | PG17 configurado, major do volume desconhecida, volume 5 GB, DNS privado, sem proxy público. | Preservar volume/DNS. Lote 1 só com runtime compatível. Upgrade de major segue procedimento próprio. | Conferir geração/PG_VERSION/version_num e ausência de exposição. Se divergente, parar sem reset. |
| Railway production/Postgres, backups | Painel sem backups. Criação e PITR condicionados a Pro no plano atual. | Backup lógico privado, restore isolado antes de qualquer mudança. Definir retenção/RPO/RTO ao aprovar a janela. | Validar restore e equivalência. Preservar fonte e recibos. Mudança de plano exige decisão própria. |
| Railway production/API, origem/build | Git main, autodeploy off, Dockerfile recompila, sem deployment ativo. | Manter autodeploy off. No plano atual, manter fonte Git se o registro privado exigir upgrade. Fixar o SHA, conferir o build e homologar os bytes resultantes antes de produção. Dockerfile.release é a via para reaproveitar exatamente o JAR da main, condicionada ao transporte privado aprovado. | Conferir JAR embarcado, labels, digest e arch do deployment. Se aprovado caminho Git, verificar checkout, base, toolchain, JAR real e imagem Railway, homologando esse binário. Retornar à imagem comprovadamente compatível se necessário. |
| Railway production/API, Hibernate/Flyway/SQL init | Hibernate update. Sem perfil ou override Flyway/SQL init informado. Defaults implicariam Flyway ativo ao iniciar. | Antes do start, SPRING_PROFILES_ACTIVE=adoption, SPRING_JPA_HIBERNATE_DDL_AUTO=validate, SPRING_FLYWAY_ENABLED=false, SPRING_SQL_INIT_MODE=never, SPRING_JPA_GENERATE_DDL=false. Flyway pelo executor separado. | Guard de adoção, Hibernate validate e logs sem DDL. Parar ao recusar override, mantendo proteção. |
| Railway production/API, flags/jobs | APP_OPERATIONS_WRITERS_ENABLED e APP_OPERATIONS_JOBS_ENABLED ausentes, defaults normais true. Sem cron Railway. | false/false no start restrito, true/false no smoke autorizado, true/true somente após GO de jobs e reinício separado. Manter clientes antigos isolados. | Manutenção 503, ausência de jobs/escrita, depois smoke e primeiro job observado. Falha retorna a false/false com drenagem. |
| Railway production/API, PORT/health/recursos | Domínio HTTP porta 8080. Sem healthcheck ou start override. 1 réplica, limite de 8 vCPU/8 GB, restart On Failure 10. | PORT=8080 alinhado ao domínio, uma réplica. Liveness no start restrito, readiness para liberar. 300 s como ponto de ensaio, ajustar por startup real. Evitar loop de restart após falha de configuração. | Conferir probes e consumo por ambiente. Parar deployment defeituoso preservando logs antes de mudar orçamento. |
| Railway production/API, conexão, CORS e auth | JDBC aponta postgres.railway.internal:5432. FRONT_URL aponta controle-financeiro-kaiquedev.vercel.app. JWT/Resend/BRAPI presentes por nome. | Preservar JDBC privado, revisar papel, TLS e timeout. Fixar FRONT_URL em origem HTTPS exata do alias de uso aprovado. Recuperação usa código por e-mail. Revisar destinatários e logs de auth antes de uso. | Confirmar conexão, login/logout e recuperação em destinatário controlado. Evitar coleta de PII e isolar efeitos externos no ensaio. Corrigir destino preservando sessão quando compatível. |
| Vercel Production, BFF e publicação | BACKEND_API_URL com um valor para três ambientes. Host histórico API Railway, valor atual exige reautenticação. Alias público em release anterior. | Destino servidor-only de Production para API aprovada. Publicar manualmente sem alias inicial e promover a mesma revisão após smoke. Confirmar domínio canônico, hoje FRONT_URL difere do primário do painel. | BFF → API, cookies host-only HttpOnly, Secure em produção, SameSite=Lax. Testar origens, sessão e HTTPS. Restaurar alias/frontend compatível após congelar writes. |
| Vercel Preview/Development, rede e deploys antigos | Mesma variável compartilhada, previews READY antigos, proteção Vercel Authentication. | Remover destino compartilhado ou usar backend exclusivamente sintético. Antes de writers reais, conter deploys/aliases antigos que mantenham o destino. Manter git.deploymentEnabled=false no candidato. | Confirmar isolamento de preview/cliente/BFF antigo. Variáveis novas não alteram deployments existentes. Se a contenção for insuficiente, manter manutenção e revisar controle de ingresso em escopo próprio. |

Preparar contexto isolado contendo apenas api.jar e usar Dockerfile.release da
revisão. Revalidar hash antes da construção. Passar JAVA_RUNTIME com digest,
INPUT_COMMIT e JAR_SHA256, e escolher a platform conferida. Comparar JAR
extraído da imagem e registrar digest publicado, arquitetura e java -version.
No Railway, confirmar digest efetivamente executado.

~~~powershell
# A partir do checkout de produto. Contexto externo contendo só o api.jar verificado.
docker build --platform $cfPlatform --build-arg "JAVA_RUNTIME=$cfJavaRuntimeDigest" --build-arg "INPUT_COMMIT=$cfInputCommit" --build-arg "JAR_SHA256=$cfJarHash" -f controle-financeiro-backend/Dockerfile.release -t $cfLocalImage $cfImageContext
if ($LASTEXITCODE -ne 0) { throw 'STOP: build da imagem' }
docker image inspect --format '{{.Os}}/{{.Architecture}} {{.Id}}' $cfLocalImage
docker run --rm --network none --entrypoint java $cfLocalImage -version
~~~

Extrair /app/api.jar de um container criado sem start e comparar com
Get-FileHash -Algorithm SHA256. Só publicar no registro e selecionar a fonte
por digest depois da autorização própria.

Essa opção preserva o JAR do Actions. O Railway exige Pro para credenciais
de registro privado. No plano atual, a rota de menor custo incremental é
continuar com fonte Git e autodeploy desligado, desde que seja possível ensaiar
no ambiente separado e provar a identidade efetivamente executada antes de
abrir writers. Rebuild troca a unidade testada. Nunca publicar a imagem em
registro público só para contornar a restrição. Se a plataforma não permitir
promover a mesma imagem ensaiada ou comprovar seus bytes, manter o bloqueio e
decidir sobre transporte privado ou autorização para outro ensaio por digest.
[Registros privados Railway](https://docs.railway.com/builds/private-registries)

 No Vercel, usar projeto vinculado e revisão exata, vercel deploy --prod
--skip-domain e vercel promote para o mesmo deployment depois do smoke.
Revisar proteção, rota e aliases preexistentes. [Vercel deploy](https://vercel.com/docs/cli/deploy) ·
[Variáveis](https://vercel.com/docs/environment-variables) · [Autodeploy Git](https://vercel.com/docs/project-configuration/git-configuration)

### Recuperação e recibo de liberação

Rollback de aplicação retorna API/BFF a revisões compatíveis com schema e
dados novos. Se essa compatibilidade não estiver provada, manter manutenção
e preparar correção progressiva. O rollback de uma transação PostgreSQL
preserva as versões já aplicadas em outras transações. Falha de baseline/migrate
exige checar history antes de retomar.

Restore exige autorização própria. Antes de novas escritas, preservar a
origem, restaurar em destino novo e reconciliar antes da troca. Após novas
escritas, congelar jobs/writers, preservar a origem e identificar as operações
posteriores ao backup. Restaurar sobre a origem perderia dados posteriores ao
ponto recuperado. Aprovar RPO efetivo e reconciliação ou reaplicação antes da
troca. Backups do provedor têm limites de ambiente/retenção.
[Backups Railway](https://docs.railway.com/volumes/backups)

Registrar no GO/STOP horário, responsável, SHA/digests, alvo, janela, flags,
migrations, backup/ensaio, smoke/reconciliação e quem assume a observação inicial.

## Evidências da primeira sessão

- Leitura estrutural das nove abas da planilha e inventário do código concluídos.
- Reprodução executável anterior ao patch: 07/09 aparece 06/09; “hoje” às 23h30 vira 08/09; janeiro/31 + um mês vira março/03; prazo de hoje aparece atrasado.
- `npm test`: cinco cenários por fuso, 15 execuções aprovadas em America/Sao_Paulo, UTC e Pacific/Kiritimati. Abrange utilitários de calendário, não a renderização de todas as telas.
- `npm run build`: aprovado com Next 16.1.6; download de fontes precisou de rede autorizada. Aviso existente de middleware depreciado permanece para T-011.
- `npm run typecheck`: aprovado.
- `npm run lint`: falhou com 70 erros e 37 avisos em 54 arquivos. Detalhamento em [baseline de lint](lint-baseline.md); nenhuma regra desabilitada. Predominam any explícito, variáveis não usadas, regras de hooks/componentes e entidades JSX.
- Instalação npm concluída após uso de cache temporário e rede autorizada. Sem mudança de versões/lockfile. npm reportou scripts de instalação bloqueados de sharp/unrs-resolver; o build e o lint conseguiram executar.
- Backend: Maven `package -DskipTests` aprovado usando distribuição 3.9.12 existente e repositório local explícito. JVM disponível 25.0.4 compilou com release 21; repetir em Java 21 no CI antes de liberação. Não foi executada suíte com PostgreSQL, pois ainda não existe perfil isolado e Docker não foi encontrado no PATH.
- Wrapper Maven falhou localmente ao acessar Target nulo; alternativa de execução não corrigiu o wrapper. Cache offline inicialmente incompleto foi resolvido com download autorizado.
- Nenhum ambiente remoto alterado, dado real importado ou deploy executado nesta etapa.

## Comandos de verificação

Frontend (Node 24, alinhado ao CI):

```powershell
cd controle-financeiro-frontend
npm ci
npm test
npm run lint
npm run typecheck
npm run build
```

Backend (Java 21 e PostgreSQL isolado, após T-005):

```powershell
cd controle-financeiro-backend
.\mvnw.cmd verify
```

Até existir perfil de teste isolado, `contextLoads` usa configurações da aplicação; não apontar a banco real para fazê-lo passar. Compilar com skipTests é evidência apenas de build, não de funcionamento. Testes Node de TypeScript requerem suporte nativo presente no Node 24 do CI.

## Matriz de auditoria visual/funcional

Executar em 360×800, 768×1024 e 1440×900; claro/escuro, com/sem privacidade; teclado e mouse/toque. Registrar console e rede por falha, sem capturar dados reais. Estado inicial de todas as linhas: pendente de validação em navegador.

| Tela | Fluxos e invariantes prioritários |
|---|---|
| Autenticação | Registrar, entrar, erro de senha, recuperação, sessão expirada, logout; erros preservam campos apropriados |
| Dashboard | Saldos, patrimônio, metas vinculadas, gráfico, faturas, recentes; vazio distinto de erro de API |
| Contas | Criar com saldo positivo/zero/negativo, editar, arquivar, reordenar; saldo e histórico conciliados |
| Extrato | Receita, despesa, transferência, pendente/pago, filtros, paginação, mês, edição e exclusão/estorno |
| Cartões | Cadastro, limite, fechamento/vencimento, compra parcelada, pagamento parcial/total/antecipado e histórico |
| Planejamento | Criar, guardar/pagar, competência, copiar se disponível, previsão de renda e vínculo com fatura |
| Investimentos | Criar, comprar, vender, rendimento, preço médio, taxas, histórico e vínculo com meta |
| Metas | Monetária/numérica, prazo, progresso, depósitos, checklist, compra e exclusão com estorno |
| Hábitos | Frequência diária/semanal, marcar/desmarcar, calendário, meta vinculada e virada de dia |
| Resumo anual | Ano anterior/atual, total investido versus atual, notas, totais e relação com extrato |
| Configurações | Perfil, senha, tema, privacidade, preferências, exportação e erros de download |
| Onboarding | Rascunho, etapas condicionais, revisão, finalização, retry e conta legada após implementação |

Todo bug visual derivado precisa de: ID, URL/tela, versão, viewport, tema, fixture, passos, esperado/atual, captura e requests relevantes. Não marcar “validado” só porque a classe CSS foi alterada.

## Destino e preservação

Confirmado pelo usuário: backend no Railway (desligado), frontend na Vercel. Não foi confirmado se há dados reais; padrão de trabalho é preservá-los. Identificar serviços/projetos, branch, domínio e banco antes de reativar ou migrar. Não registrar credenciais na documentação.

Pré-publicação:

1. Verificar schema e backup existente; restaurar cópia isolada e testar migrações sobre essa cópia.
2. Homologar backend com PostgreSQL separado, configurações de e-mail/cotação sem comunicação real e fuso definido.
3. Configurar BACKEND_API_URL apenas no servidor Next, JWT/banco/serviços apenas no backend, CORS para origens exatas. Validar nomes contra os arquivos da aplicação.
4. Executar suites e matriz com fixtures; revisar isolamento por usuário e relatórios de abertura.
5. Publicar versão identificável em homologação; testar registrar → entrevista → operação financeira → extrato → logout/login.
6. Só promover com backup, plano de reversão e critérios acima atendidos. Migração incompatível exige estratégia de expansão/contração; voltar binário não desfaz schema automaticamente.
7. Após promoção verificar HTTPS, autenticação, persistência após reload, readiness, erro de backend e exportação. Registrar versão, horário e resultado sem dados pessoais.

## Pendências para liberação

Onboarding não implementado; integridade de abertura/relatórios não validada; migrações ausentes; suites financeiras e E2E ausentes; auditoria visual pendente. Essas lacunas impedem declarar a aplicação pronta para uso diário com dados reais.

## Revisão do lote de calendário

Mudanças restritas a helpers e seus consumidores, sem dependências novas, payloads ou schema alterados. Helpers têm custo O(1); navegação usa atualização funcional de estado e preserva o valor anterior. Timestamps de histórico não foram convertidos. Testes de calendário adicionados ao CI; o resultado remoto do CI ainda não foi executado.

Fontes técnicas consultadas para semântica de calendário e rotas: [MDN Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date) e [Next.js Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers). A evidência principal do lote são os testes locais e a compilação do código instalado.
