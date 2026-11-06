# Consolidação pós-PR #3 — 05/11/2026

Base Git e produto **99025fa9fe93da19e9d40678d1e9eeeb78e698f9**. O
[runbook vigente](validacao-deploy.md)
concentra sequência, comandos, diff de configuração, recuperação e o primeiro
lote autorizável. Esta matriz registra a decisão desta rodada. Os arquivos
individuais das tarefas mantêm os estados canônicos.

## Decisão de adoção do zero e conclusão do A1 — 06/11/2026

O alvo novo `postgres-adocao` foi provisionado em Railway
controle-financeiro / production com volume novo de 1.000 MB. O servidor
respondeu PostgreSQL 17.11 por TCP e TLS via DNS privado. O catálogo de
`controle_financeiro` tinha apenas o schema padrão `public`, sem objetos
da aplicação nem histórico Flyway. O deploy novo foi removido às 09:52:02
em America/Sao_Paulo e o volume foi preservado. A API e o Postgres antigo
continuaram offline. O [runbook vigente](validacao-deploy.md) registra os
identificadores, o recibo sanitizado e a preparação do lote A2.

Os dados históricos ficam fora do fluxo de adoção. A inspeção do volume
antigo e os controles de preflight e baseline do legado foram dispensados
para o alvo novo. CF-017/P01/P02 continuam em revisão. Permanecem
recuperação, exclusividade de escrita, credenciais segregadas, execução
e validação da cadeia V1–V16 e validação dos consumidores reais. O A1
encerrou o provisionamento e a classificação do alvo como vazio.

## Retomada — volume e credenciais em 06/11/2026

A investigação partiu de d900c30471f58438d3a9c42f8eea425dba41787e e do
recibo do lote 1. Às 09:12:13 de 06/11 em America/Sao_Paulo
(12:12:13 UTC), o Railway continuava sem deployment ativo para API ou
Postgres, sem changeset e sem trabalho pendente. O Postgres permaneceu
offline por toda a execução. Não houve SQL real, alteração remota,
emissão/revogação de credenciais ou mensagem enviada. O índice OCI
consultado continua sendo o da imagem 17.11 do recibo anterior. A
versão do cluster persistido permanece inconclusiva. Não foi demonstrada
uma leitura offline do volume pelo acesso disponível.

O [runbook](validacao-deploy.md) reúne as capacidades confirmadas e a
minuta do Central Station. A evidência exigida é PG_VERSION, presença
de global/pg_control e vínculo inequívoco ao PGDATA e à geração atual
do volume. O lote 1 não foi retomado. CF-017/P01/P02 permanecem em
revisão, com inventário real, recuperabilidade, compatibilidade e
migrações ainda pendentes.

As quatro credenciais relatadas são tratadas como expostas. O
[plano de rotação](rotacao-credenciais.md)
separa contenção dos provedores, troca da senha no papel PostgreSQL,
renovação do JWT e cutover da API. O conector atual listou variáveis
com valores ocultos. Uma releitura visual restrita a Hibernate e
destino JDBC foi interrompida pelo limite de revisão automática. O
runbook usa para esses valores a última leitura registrada e a
captura relatada. A identidade do papel e o encadeamento de
referências de credenciais continuam a confirmar. A revisão de
metadados não vinculou a chave antiga a um ID inequívoco no provedor.

### Auditoria sanitizada

- Varredura local de 107.780 arquivos de texto e 24.416 entradas de texto
  em 404 ZIPs, entre checkouts, logs e acervos. Foram registrados
  somente tipo, arquivo e linha. As 151 ocorrências candidatas apontaram
  para contextos sintéticos. 148 coincidiram em memória com as
  bases sintéticas do Docker Compose, do inicializador de teste e de
  um timeline histórico. As três restantes estão em um timeline de
  startup local, com marcadores sintéticos e sem destino Railway.
- Histórico local, refs e reflogs. Os 17.238 blobs de texto elegíveis
  produziram cinco ocorrências, todas coincidentes com fixtures
  controladas. Nenhuma evidência de exposição adicional foi confirmada
  nesse recorte.
- Passada complementar dirigida a traces e texto escapado dos 11
  artefatos preservados do smoke da PR, expanded da PR e smoke da main.
  83 entradas de texto elegíveis, sem candidato adicional e sem erro de
  leitura nesse recorte. Traces fora desses ZIPs não têm essa mesma
  cobertura complementar.
- O conector não retornou linhas dos logs Railway da API consultados.
  Uma busca por padrões não compara os valores de produção, que
  permaneceram ocultos. Imagens, formatos binários, ZIP aninhado,
  quatro itens acima do limite de tamanho e 29 erros de abertura ou
  leitura ficaram fora da primeira passada. A captura relatada
  continua sendo o motivo da rotação.
- O acervo externo
  controle-financeiro-runtimes/prontidao-adocao/20261105-retomada
  guarda os resultados sanitizados. Para tratar uma eventual cópia
  adicional, revogar primeiro a credencial, restringir acesso à
  evidência sob aprovação separada e reavaliar retenção e cópias.
  Preservar histórico e acervos durante a investigação.

## Lote 1 — parada anterior à ativação em 05/11/2026

Leituras de **21:38:53 a 21:43:45 em America/Sao_Paulo**, equivalentes a
**00:38:53–00:43:45 UTC de 06/11**. A worktree iniciou limpa em
ba0331441701e5a487a1131f6e25926d3f9ef7e5. O lote terminou com **0 min de
PostgreSQL ativo**. API e Postgres foram observados offline no painel, sem
deployment ativo no início e no fechamento do conector. Nenhum comando de
ativação ou desligamento foi enviado. O estado offline foi confirmado
diretamente.

| Controle | Evidência sanitizada e limite |
|---|---|
| Alvo | Railway controle-financeiro 19974952-914d-4072-9140-e62e5ed23c31, production 73f7324a-a15f-4940-b2dc-d5bcb5510441. Postgres 79d2ee56-cfd0-47bc-8744-e932cf49ba69, API f4ad9689-58ed-4112-8bb2-2cfe4af24483. |
| Associação e PGDATA | postgres-volume 1fe34e12-e948-4c99-8448-7cfbf871ec54 associado ao Postgres, mount /var/lib/postgresql/data. Variável PGDATA conferida no painel como /var/lib/postgresql/data/pgdata. Identidade da geração física e major do cluster seguem sem prova. |
| Imagem e startup | Tag configurada ghcr.io/railwayapp-templates/postgres-ssl:17. O manifesto público retornou índice OCI sha256:5e806d28c18198f933d25e79989470a47a938f465bf0634e030b416961b3463e. Configurações amd64 e arm64 anunciam pacote 17.11-1.pgdg13+2. Sem override de start nem pre-deploy informado. O comando da imagem executa postgres na porta 5432, via tini e wrapper.sh, que delega ao docker-entrypoint.sh com fluxo de inicialização. A tag é mutável e o registro histórico não traz digest efetivamente executado. |
| Histórico e armazenamento | Deployment Postgres abfd21e0-ebf1-46ef-8b2c-44e48d09c343 REMOVED, com a mesma tag declarada. O painel não mostrou logs de startup disponíveis e a consulta histórica do conector não forneceu logs. Nenhum backup listado. A indicação histórica de PG16 não está vinculada a uma geração do volume. |
| Exclusividade e acesso | Só API e Postgres no ambiente, ambos offline, sem cron declarado, patch staged ou pending work. Autodeploy da API desativado. Sem proxy TCP público, DNS postgres.railway.internal. A listagem de automações pelo conector falhou. A visibilidade disponível não prova exclusividade de clientes externos nem um papel de leitura com acesso ao schema/history. |
| Desligamento | A operação Remove no deployment específico para seu processo e preserva o serviço e volume. O painel mostrava apenas o deployment histórico removido. O procedimento foi conferido para uso futuro. |
| Resultado do inventário | Versão efetiva do servidor, major do volume, schemas e histórico Flyway não observados. Classificação **D, inconclusiva**. Nenhuma sessão SQL real, nenhuma leitura de registros financeiros ou pessoais e nenhuma alteração de estado remoto. |

A consulta do arquivo esperado /var/lib/postgresql/data/pgdata/PG_VERSION
depende de acesso de leitura à geração física correta. A implementação oficial
do CLI Railway exige deployment ativo para railway volume files. Um caminho
de leitura offline não foi encontrado no painel nem no conector. A versão
do pacote no manifesto da imagem e a tag histórica não demonstram a versão
do cluster gravada no volume. [CLI Railway](https://github.com/railwayapp/cli/blob/master/src/commands/volume.rs) ·
[Layout PostgreSQL](https://www.postgresql.org/docs/17/storage-file-layout.html) ·
[Wrapper da imagem identificada](https://github.com/railwayapp-templates/postgres-ssl/blob/09ff77dca25f9af407827b9f27c7de9c5c660790/wrapper.sh) ·
[Operações de deployment Railway](https://docs.railway.com/deployments/reference)

O SQL gravado em ba033144 continha um delimitador de bloco inválido. A
validação anterior aceitava o texto da instrução no erro de sintaxe como se
fosse a mensagem emitida pelo guard. Reproduzi SQLSTATE 42601 no arquivo
original e corrigi os três delimitadores em c5700fbf. Em PostgreSQL local
16.15 e 17.11, a revisão corrigida encerrou os três guards com P0001 e a
falta de SELECT no history com 42501. Os dois casos válidos retornaram 0
e executaram ROLLBACK. Foram sete verificações por major contando a
contraprova original. Fixtures sem rede, em tmpfs e removidas.

Recibo sanitizado no acervo externo em
controle-financeiro-runtimes/prontidao-adocao/20261105-lote1/recibo.json.
SHA-256 423f32953b8a69d06500a306c760fb55639fc7645211d7043a8d0bb5c20042f1.
O [runbook](validacao-deploy.md) registra a próxima verificação. Os critérios
de CF-017/P01/P02 permanecem no alcance anterior.

## Base, evidência e diferenças

A leitura ao vivo de refs/heads/main por git ls-remote e a comparação do GitHub
confirmaram o SHA acima, sem commit posterior. Primeiro pai
fb986456a37a48afcafef204f165d15354294d26, segundo pai e candidato
0ce5ab00cd67adaff8fafd33cf10cf4716cb3247. O checkout sintético da PR foi
8ad56033d470d940e15ac224888cbfcc8b40ecc9. Os três têm árvore
28e7221bfee2bb0a2c34057ea2e3d269523010ba. A diferença entre head_sha da PR e SHA
do pacote smoke é esperada pelo checkout de refs/pull/3/merge.
[PR #3](https://github.com/kaiqueGeraldo/controle-financeiro/pull/3)

| Execução, tentativa 1 | Checkout e produtor | Java, Linux + Windows | Frontend | Financeiro | Required |
|---|---|---:|---|---|---|
| [Smoke PR 42092120335](https://github.com/kaiqueGeraldo/controle-financeiro/actions/runs/42092120335) | 8ad56033, linux 127473386741, windows-native 127472587691 | 101 classes / 913 testes | 626/71 arquivos, 18 temporais em três fusos | 6 jornadas / 36 checkpoints | success 127478995411 |
| [Expanded PR 42093309828](https://github.com/kaiqueGeraldo/controle-financeiro/actions/runs/42093309828) | 0ce5ab00, expanded 127482819724, windows-native 127476740919 | 116 / 928 | 626/71, 18 temporais | 13 / 73 | success 127503357920 |
| [Smoke main 42130458720](https://github.com/kaiqueGeraldo/controle-financeiro/actions/runs/42130458720) | 99025fa9, linux 127606181674, windows-native 127605450749 | 101 / 913 | 626/71, 18 temporais | 6 / 36 | success 127610192553 |

As contagens coincidem com PARECER.md, MATRIZ.md, ARTEFATOS.md e recibos
de reconciliação no acervo privado externo
controle-financeiro-runtimes/publicacao-pr3/20261105-diagnostico-integral.
Arquivos não movidos nem editados. Required da expanded depende do job
expanded aprovado. Nos dois smokes, expanded foi skipped pela condição do
modo. O modo de diagnóstico é separado do aceite.

Na expanded, 15 recibos de wrappers de navegador mais o recibo independente
FinancialJourneyPostgresE2E compõem os 16 caminhos completos. RF15 C23 passou
por identidade dentro de Rf15RemediationBrowserTest, sem somar 23 à contagem
Java. A DEC-ZOOM-05 adiou apenas R10 em cf015.native-zoom.integrated.spec.ts
e RF15 em rf15-native-chrome.integrated.spec.ts, projeto review-sao-paulo.
SAN-E2 teve mecanismo LCD reproduzido e corrigido. A falha histórica de RF15
permanece sem causa atribuída. Reabrir se o wrapper voltar a falhar, faltar
recibo/identidade ou surgir evidência da falha antiga. Preservar primeira falha
e confrontar expected/started/finished, versão do navegador, fase e primeiro
erro sanitizado. Repetir diagnóstico dirigido sem substituir required.
[Falha histórica](https://github.com/kaiqueGeraldo/controle-financeiro/actions/runs/42024046159) ·
[RF15 dirigido](https://github.com/kaiqueGeraldo/controle-financeiro/actions/runs/42084295478) ·
[DEC-ZOOM-05](decisoes/005-excecao-temporaria-zoom-expanded.md)

Se retornarem timeout de componentes, falha pré-bind/HQL ou falha de cleanup,
reabrir o gate afetado com primeiro erro, fase, propriedade do recurso,
carga/versão e contraprova dirigida. Os resultados históricos inconclusivos
permanecem recuperáveis, sem reabrir aceites que não dependem deles.

## Proveniência e retenção

| Pacote | Artifact e SHA-256 do ZIP | SHA-256 do manifesto | SHA-256 do JAR |
|---|---|---|---|
| Smoke PR | 13447375257 · 07d0af8ec4f9f68040d047f1172be109ef88921579fbea8ddd7ec1366ae8c2a8 | 32974a26976a2e78a6fb68ba42c2aff96a7951abd336e7ca4bc11ddedb12325f | 2d182a19c5218fdcc9e4b7994c125ffec1b64924477566107e23e3d00837f527 |
| Expanded PR | 13450510586 · 0b07f038353cf4db7ab506a0869b36810e9a38e56375a6177ad70a8d8813c008 | f0829a583e17db772723bc3d71d4fa5080223e00ec93c6e457a428544fdd596f | 67c75fcbfda4654dbfd7903a15101d9266241145576a1601250f24c13e8bacad |
| Smoke main | 13464315355 · 5123adafd6f3374436632c64b0dfa9850a690637813f9e5aaac699775deaffd9 | a5f8ec354bf2aeeeef65596590fcce479c0fd9cab9ccf1fd3fc175a12c4f3f04 | 36d9393bc6348555285411319c73a966c0d2be760f78dc0b2fe706cc81e604f0 |

Os 11 ZIPs preservados das três execuções foram lidos no acervo. Os hashes
dos 11 ZIPs coincidiram com os digests da API e os JARs e manifestos
conferidos de dentro dos ZIPs. O diagnóstico main 13462669703 e o Windows
13463101817 acompanham o pacote. O diagnóstico final da expanded é 13450405730,
com quatro artefatos de apoio/diagnóstico na mesma execução. Usar os recibos
por run para atribuir fase e produtor, distinguindo saídas preparatórias do
resultado final. A retenção remota é de 7 dias. A API retornou expired=false
para os pacotes, com expiração em 12/11/2026 às 16:26, 17:10 e 20:45
(America/Sao_Paulo), respectivamente. O acervo já tem cópias verificadas.
[Pacote main](https://github.com/kaiqueGeraldo/controle-financeiro/actions/runs/42130458720/artifacts/13464315355) ·
[Pacote expanded](https://github.com/kaiqueGeraldo/controle-financeiro/actions/runs/42093309828/artifacts/13450510586)

O manifesto main declara checkout 99025fa9 e sourceDigest
f9edc858993cb520cf274faa5eda3250d8835668d51172c0f38c1009f83770c8, igual aos
manifestos da PR. A verificação independente confrontou os 871 caminhos e hashes de cada
manifesto com seu objeto Git, com 870 blobs exatos e normalização prevista de
mvnw.cmd. Logs da mesma execução registram Linux
amd64, Temurin 21.0.13, Maven 3.9.12 e Node v24.22.2. O JAR contém
Spring Boot 4.0.2, Flyway 11.14.1, JDBC PostgreSQL 42.7.9, Hibernate 7.2.1.Final,
HikariCP 7.0.2 e V1–V16. O frontend fixa Next.js 16.1.6 e React 19.2.3.
As suítes Java usam PostgreSQL 16 descartável. As provas operacionais locais
de 16/17 têm escopo próprio. O manifesto não afirma build reproduzível.

A igualdade de inputs autoriza reaproveitar as evidências da expanded sobre
o código e a seleção integrada. Os bytes do JAR expanded pertencem ao seu
build, e os bytes de adoção preferidos são os do JAR main. Ensaio de imagem,
arquitetura efetiva, schema, capacidade, secrets, rede, smoke HTTPS e rollback
pertencem ao alvo a homologar. O Dockerfile hoje configurado no Railway
recompila via Maven 3.9.6/Temurin 21 com skipTests e executa app.jar em
Temurin 21 JRE Alpine. Sem deployment ativo, arquitetura e patch Java de
produção ainda não são observáveis. Dockerfile.release empacota exatamente o JAR testado e valida seu hash.
O Railway exige Pro para credenciais de registro privado. A alternativa no
plano atual é recompilar com fonte Git e homologar o novo binário identificado.
[Registros privados Railway](https://docs.railway.com/builds/private-registries)

## Matriz por critério

| Tarefa e exigência | Evidência e alcance | Estado atual | Pendência e próxima ação |
|---|---|---|---|
| CF-034, regressão real bloqueia avanço e configuração CI executa | Contraprovas locais de regra/data do aceite DEC-CI-04, negativos de falha/upload/agregação, falha remota de harness no run 40323062343 e required real nos três runs da tabela e smoke/expanded separados. | Atendido no CI integrado | Repetir recorte apenas se mudar teste, regra ou mecanismo de gate relevante. |
| CF-034, checkout limpo, sem segredos reais, cleanup e sem retry que mascara | Actions Linux/Windows, PostgreSQL sintético, uma tentativa, seleção por identidade; cleanup ordinário. Contraprova Linux histórica de cancelamento antes do descarte e Windows Job Object/TCP nativos no escopo dos pareceres. | Fluxo ordinário atendido. Critério amplo parcialmente coberto | Falta prova dirigida de Ctrl+C nativo e cleanup dos containers/processos nos caminhos de cancelamento ainda abertos. Usar fixture própria com controle alheio, recibo antes de descarte e garantia de pacote bloqueado. |
| CF-034, build e pacote publicados correspondem à revisão | Jobs produtores, relatórios, 871 inputs, manifestos e hashes da tabela. | Atendido para artifacts do CI | Rastreabilidade de imagem executada é gate de homologação/publicação, tratado no runbook. |
| CF-034, evidências, limites e testes preservados | Diagnósticos completos da expanded, contraprovas e reviews locais, exceção com duas identidades exatas, nenhum skip indevido registrado. | Atendido para o recorte integrado | Preservar diagnósticos históricos e o limite de zoom. |
| CF-034, dependências integrais, seleção e gatilhos | CF026/032/033 com aceites locais, DEC-CI-04 e DEC-ZOOM-05, workflow com verify, seleção e artifacts sanitizados. | CI aceito no recorte integrado. Tarefa em_revisao | Fechar limite de cancelamento e dependência CF015/zoom. Adoção real tem gates próprios. |
| CF-010, 360 px/zoom 200%/teclado | R10 e RF15 nativos adiados. Os demais controles de foco, rolagem, geometria, temas e evidências mantêm aceite. | AC-UI-001 pendente, em_revisao | Retomar N01–N12 do protocolo assistido em ambiente nativo e revisão exata. |
| CF-015, P0/P1, defeitos temporais/estado, relatório e preservação | Checkboxes e pareceres independentes preservados, RF15 obrigatório aprovado na expanded. | Critérios já aceitos preservados. Marco em_revisao por zoom | Resolver os dois casos ou obter decisão específica de release. |
| CF-017, execução idempotente/constraints/versões e falha de upgrade | Fixture vazia/legada, testes de idempotência e rollback em PostgreSQL descartável e aceites locais de V1–V16 no alcance. | Aceites sintéticos preservados | Ensaiar no clone do alvo após inventário, sem reabrir fundação por associação. |
| CF-017, compatibilidade do banco real | Painel Railway mostra volume, configuração e serviço offline. Não houve inspeção do schema real. | em_revisao, compatibilidade desconhecida | Lote 1, depois backup/restore e preflight conforme A–D. |
| CF-017, evidências e limites | RV17-01/P2 e RV17-02 aceitos no alcance local, histórico e gates documentados. | Aceite local preservado | Vincular execução real, sem extrapolar a partir de PostgreSQL sintético. |
| P01/P02, schema real/precisão/origem | Inventário e schema comparador prontos, geração do volume ainda desconhecida. | Pendente | Identificar alvo, executar leitura inicial e depois inventário semântico e trilhas por lote. |
| P01/P02, baseline/versionamento | V1–V16 e plugin explícito, migrations dentro do JAR 99025fa9. | Planejamento e fundação aceitos | Baseline somente B e após preflight válido. |
| P01/P02, backup/restore e reconciliação | Provas locais descartáveis, nenhum backup listado no alvo. | Pendente no real | Produzir dump protegido e restaurar em destino compatível com equivalência. |
| P01/P02, proveniência por lote | Contratos UNKNOWN/null e preservação de bruto no código/testes. | Pendente no real | Manter valores sem inferência. Transformar somente lotes com origem provada. |
| P01/P02, writers, DTO/BFF, listas e exportação | Guard, flags, health e provas locais do consumidor. | Pendente no real | Inventariar todos os produtores/consumidores e validar compatibilidade e reconciliação. |
| P01/P02, rollout e reversão | Runbook canônico atualizado a partir de 46b85ee0 e 8a83c357. | Planejado, aceito no documental | Ensaiar, fixar janela e provar caminho de recuperação. |
| P01/P02, EXPLAIN/índices | Sem plano de execução ou cardinalidade do alvo. | Pendente | Medir no clone representativo com autorização, incluindo paginação e consultas por requisição. |
| P01/P02, revisão independente e remoção de alias | Aceites locais limitados e consumidores reais desconhecidos. | em_revisao | Revisar upgrade/consumidores após ensaio. Anunciar retirada de alias só após inventário. |
| CF-035, identificação e registro de bloqueio de promoção | Inventário remoto sanitizado e diff preparados nesta rodada. | Preparação em_execucao, registro do bloqueio atendido | Homologação sintética pode avançar em escopo autorizado. Reconferir valores opacos e custo. |
| CF-035, restauração comprovada | Nenhum restore do alvo executado. | Pendente | Autorizar backup e restore, conferir checksum/schema e equivalência. |
| CF-035, smoke HTTPS | CI fez E2E sintético em runner, sem homologação Railway/Vercel. | Pendente | Homologar alvo isolado com login, entrevista, operação/reload e exportação. |
| CF-035, evidências e limites | Preparação documentada, testes do produto intactos. | Parcial | Registrar execução e revisão da homologação/restore. |
| CF-036, P0/P1, compatibilidade e restore | Revisões locais e CI integrado, destino ainda sem classificar. | Pendente, proposta | Só promover após CF-035, decisão de zoom e gates de adoção, com autorização própria. |
| CF-036, smoke de produção sem dados reais como fixture | Nenhum deploy/smoke de produção. | Pendente | Smoke restrito com conta sintética autorizada, HTTPS e verificação de persistência. |
| CF-036, versão efetivamente publicada e rollback | JAR main identificado, Vercel ainda anterior e API offline. | Pendente | Comprovar digest real, deployment sem alias, smoke e promoção da mesma versão. |
| CF-036, evidências e limites | Plano, pacote e procedimento de recuperação preparados. | Parcial | Registrar versão publicada, logs sanitizados, saúde, alerta e recuperação testada. |

## Inventário sanitizado, leitura de 05/11/2026

### Railway

- Projeto controle-financeiro, workspace kaiquegeraldo's Projects, environment
  production, IDs no runbook. Nenhum changeset pendente. A API e o PostgreSQL
  aparecem offline no painel. API tem último registro SKIPPED
  58cf4748-2eb1-4ba4-aa87-be5f224ecdce no 272001f e deployments anteriores REMOVED.
  Postgres tem registro REMOVED abfd21e0-ebf1-46ef-8b2c-44e48d09c343. Não houve
  registro ativo de 99025fa9.
- API conectada ao GitHub kaiqueGeraldo/controle-financeiro, main, autodeploy off,
  Wait for CI off, root /controle-financeiro-backend, builder Dockerfile e watch
  /controle-financeiro-backend/**. Runtime da plataforma V2, domínio
  controle-financeiro-production-aa40.up.railway.app para 8080 e
  controle-financeiro.railway.internal. Sem override de start, healthcheck, cron
  Railway ou serverless. Uma réplica em US East/Virginia, 8 vCPU/8 GB de limite
  por réplica. On Failure com até 10 restarts. Esses valores são limites do
  painel, sem medida de capacidade ou consumo efetivo.
- Postgres: ghcr.io/railwayapp-templates/postgres-ssl:17, runtime V2, uma réplica
  na mesma região, mesmos limites exibidos. DNS postgres.railway.internal,
  sem domínio nem proxy TCP público. Volume persistente de 5 GB em
  /var/lib/postgresql/data. Nenhum backup listado, nenhuma política ativa
  demonstrada. Painel exige Pro para criar, agendar ou habilitar PITR. A
  documentação informa retenção 6/27/89 dias para daily/weekly/monthly quando
  habilitados, sem aplicabilidade observada neste alvo. Logs disponíveis do
  deployment removido não confirmaram major efetiva. O PG16 histórico não
  comprova a geração presente do volume. [Backups Railway](https://docs.railway.com/volumes/backups)
- API: SPRING_DATASOURCE_URL privado (host postgres.railway.internal, porta
  5432), SPRING_DATASOURCE_USERNAME/PASSWORD presentes. FRONT_URL aponta a
  controle-financeiro-kaiquedev.vercel.app, Hibernate override update.
  JWT_SECRET, BRAPI_TOKEN, RESEND_API_KEY e EMAIL_RESEND presentes por nome.
  Ausentes no serviço SPRING_PROFILES_ACTIVE, SPRING_FLYWAY_ENABLED,
  APP_OPERATIONS_WRITERS_ENABLED e APP_OPERATIONS_JOBS_ENABLED. Flyway e jobs
  ativos são comportamento inferido dos defaults fora do perfil adoption.
  Nenhuma observação de processo atual. Fuso de produto/Jackson em código
  America/Sao_Paulo. TimeZone do servidor PG fica para o inventário.
  [Painel Railway](https://railway.com/project/19974952-914d-4072-9140-e62e5ed23c31)

### Vercel

- Projeto controle-financeiro, team kaiquedev (kaique-projetos, Hobby), GitHub
  kaiqueGeraldo/controle-financeiro, Production main, Preview demais branches,
  Development local. Next.js, root controle-financeiro-frontend, Node 24.x,
  build e instalação padrão sem overrides. Sem deploy hooks listados.
  Configuração Git do candidato tem git.deploymentEnabled=false global.
  [Configuração de build](https://vercel.com/kaiquedev/controle-financeiro/settings/build-and-deployment)
- Production READY dpl_FkfL25jbyrt6FdD5Di5wqoLH9iHm, commit
  272001f7b4c39aebd18bdcd856109f9a0f6c1213. Preview READY
  dpl_84SbeoTjMRB4bVFtQipmXCvT5HvY, mesma revisão, branch
  codex/cf015-zoom-gate-cf034. Histórico inclui outros READY de outubro.
  Domínio primário controle-financeiro-three-black.vercel.app, aliases
  controle-financeiro-kaiquedev.vercel.app e
  controle-financeiro-git-main-kaiquedev.vercel.app.
  [Ambientes](https://vercel.com/kaiquedev/controle-financeiro/settings/environments)
- BACKEND_API_URL, único registro criptografado, sem escopo de branch, vale
  para Production/Preview/Development. O destino histórico era a API Railway.
  O conector retornou valor opaco e o painel exigiu nova autenticação, então
  o host atual ficou sem reconfirmação. O compartilhamento de escopo está
  confirmado. Conferir somente o host quando houver sessão autorizada.
  [Variáveis Vercel](https://vercel.com/kaiquedev/controle-financeiro/settings/environment-variables)
- Vercel Authentication habilitada no modo all_except_custom_domains.
  A aplicação usa JWT do backend e cookie token host-only, HttpOnly,
  SameSite=Lax, Secure em produção, path /, 24 h. Recuperação é por código
  e-mail com validade de 10 minutos, sem callback OAuth no fluxo verificado.
  O BFF usa BACKEND_API_URL no servidor, com fallback localhost:8080.
  AuthService registra endereço em fluxos de recuperação. Usar destinatário
  de teste, evitar coleta de PII e revisar o nível de log antes da liberação.
  A proteção Vercel restringe acesso a preview, mas não separa seu destino BFF.

## Verificação descartável do inventário

O SQL histórico usava a metacomanda psql \quit 2. PostgreSQL 16 ignorou o
argumento e retornou sucesso para database divergente. O roteiro vigente ativa
ON_ERROR_STOP e emite erro explícito dentro da transação somente leitura.
Validação dirigida em postgres:16-alpine e postgres:17-alpine, sem rede nem
portas publicadas, volume em tmpfs e fixtures sintéticas. Em cada major,
schema existente vazio e histórico sintético legível retornaram 0. Database
divergente, schema ausente, falta de USAGE e falta de SELECT no history
retornaram 3. Os dois containers foram descartados. Nenhuma suíte do produto
foi repetida.

## Git e preservação

| Checkout preexistente | HEAD | Estado inicial e preservado |
|---|---|---|
| Principal | c16e6545488c8f13efda4dab9efa8aa896fcddaa | codex/saneamento-cpa01-selecao-testes, README.md modificado. SHA-256 6235da8e1d2247dad2c585fe7b2e7b0d2fd41f47414a4a2701b20f7fbf7d12ca. |
| Worktree publicacao-limpa | 1c4173f2e9a8bd459a9f2ecd4acf2d803245be88 | codex/publicacao-limpa-ci, limpa. README SHA-256 e7d3458fbd8ac227520be27996ce23c73e8c3be2086d8cfbd51ad59568f4cee0. |
| Worktree pr3-expanded-source | 0ce5ab00cd67adaff8fafd33cf10cf4716cb3247 | codex/saneamento-pr3-expanded, limpa. Mesmo SHA-256 de README da worktree publicacao-limpa. |
| Nova worktree prontidao-adocao | Base 99025fa9 | codex/prontidao-adocao, fora do checkout de fontes original. README com mesmo hash das worktrees limpas. |

A main local permanece 272001f7, 110 commits atrás do origin/main já conferido.
A ponta local de codex/publicacao-limpa-ci é anterior à referência remota.
Entre branches com upstream, codex/cf014-historico-invisivel tem 6 commits
locais à frente. Outras branches locais sem upstream têm histórico próprio,
preservado. O trabalho novo parte do SHA remoto confirmado. Nenhuma branch,
worktree, manifesto ou acervo histórico foi removido ou atualizado.
