# Validação e deploy

Em 12/11/2026, o A3 restrito passou com o JAR aprovado no CI, a API em
manutenção e o PostgreSQL de adoção em TLS privado. API e bancos estão
offline. A liberação funcional segue condicionada aos controles abaixo.
[Execução e fechamento](../../tasks/evidencias/revisao-a3-complementar/EXECUCAO-2026-11-12.md) ·
[Parecer independente de 06–07/11](../../tasks/evidencias/revisao-a3-complementar/PARECER.md)

O [roteiro e a matriz do A4](a4-homologacao-controlada.md) registram a preparação da homologação funcional restrita.

## Adoção Railway/Vercel após a PR #3 — 05/11/2026

Este é o procedimento vigente. A seção de destino e as pendências ao fim deste
documento registram a primeira sessão. Para o estado atual, consulte o
[inventário e a matriz pós-merge](prontidao-adocao-2026-11-05.md).
O plano atualiza o procedimento A–D da revisão local 46b85ee0 e preserva as
regras do ROLLOUT-LEGADO de 8a83c357. Ambos continuam recuperáveis pelo Git.
A cadeia atual termina em **V16**.

### Alvos da revisão anterior

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

### Adoção do zero — decisão de 06/11/2026

O destino é o PostgreSQL privado `postgres-adocao`, iniciado com volume novo
e sem importação. A API e o Postgres original ficam offline até as respectivas
decisões. A exclusão do serviço e do volume antigos é uma decisão posterior.

| Controles dispensados para o alvo novo | Controles exigidos para a adoção |
|---|---|
| Inspeção de PG_VERSION no volume antigo, consulta ao suporte, start do Postgres original, compatibilidade do esquema anterior, preflight legado, baseline explícita e importação. | Identidade de serviço e volume, versão real, acesso privado, confirmação de catálogo vazio, recuperação ensaiada, exclusividade de escrita, credenciais segregadas, integridade da cadeia V1–V16 e validação do candidato. |

#### Lote A1 — banco novo provisionado, verificado e desligado

| Controle | Evidência em 06/11/2026 |
|---|---|
| Identidade | Railway controle-financeiro, projeto 19974952-914d-4072-9140-e62e5ed23c31, production 73f7324a-a15f-4940-b2dc-d5bcb5510441. Sem duplicata no início. Serviço `postgres-adocao` f8b0e3e0-322e-4c68-b6c0-4972168957c8, uma réplica em `us-east4-eqdc4a`. Patch f1fdfff7-1ff7-42f1-865b-3b184d0ed386 restrito ao serviço e volume novos. |
| Volume | `postgres-adocao-volume` b4a172ec-5771-4bca-8b10-2ae7976b1f6e, capacidade 1.000 MB, vinculado ao serviço e montado em `/var/lib/postgresql/data`. `PGDATA=/var/lib/postgresql/data/pgdata`, `PG_VERSION=17` e presença de `global/pg_control` conferidos no container. |
| Versão e credencial | Imagem `ghcr.io/railwayapp-templates/postgres-ssl@sha256:5e806d28c18198f933d25e79989470a47a938f465bf0634e030b416961b3463e`. O servidor respondeu PostgreSQL 17.11, `server_version_num=170011`. Senha de bootstrap de `cf_adocao_admin` gerada em memória e enviada por entrada padrão à API oficial do Railway. `POSTGRES_PASSWORD` confirmada como selada. |
| Rede e catálogo | `postgres-adocao.railway.internal:5432`, sem domínio público ou proxy TCP. Pelo Railway SSH no próprio container, o psql autenticou via DNS privado, TCP fora de loopback e TLS com `sslmode=require`. A conexão de outro serviço e a verificação de identidade do certificado ainda serão aferidas no A2. O banco `controle_financeiro` tem somente `public` entre os schemas de usuário, com zero relações, tipos, rotinas ou restrições. `flyway_schema_history` ausente. Inventário em transação somente leitura encerrado com ROLLBACK e código 0. **Classe A, vazio.** |
| Janela e parada | Solicitação de aplicação às 09:47:53 e estado REMOVED confirmado às 09:52:02, em America/Sao_Paulo. Deployment 7d69c67b-3ab8-4495-9509-36d49bc67e08 criado às 09:50:02. A leitura final confirmou os três serviços sem deploy ativo, os dois volumes preservados e nenhum patch pendente. A chave SSH temporária foi revogada. |
| Custo | A tarifa publicada é US$ 20/vCPU-mês, US$ 10/GB-mês de RAM e US$ 0,15/GB-mês de volume utilizado. CPU e RAM são cobradas pelo uso durante a execução. O armazenamento utilizado persiste e pode gerar custo com o deploy desligado. O valor efetivamente faturado para esta janela não foi apurado. |

Recibo sanitizado no acervo externo
`controle-financeiro-runtimes/prontidao-adocao/20261106-lote-a1/recibo.json`.
SHA-256 `c4d35f56d1703a202b6b5f159e6d2324ffc624d7cca5caca3cca6c27181c6bdf`.
[Operações de deployment](https://docs.railway.com/deployments/deployment-actions) ·
[Rede privada](https://docs.railway.com/networking/private-networking) ·
[Variáveis seladas](https://docs.railway.com/variables) ·
[Preços Railway](https://docs.railway.com/pricing/plans)

#### Lote A2 — V1–V16 aplicadas e banco desligado em 06/11/2026

| Controle | Evidência observada |
|---|---|
| Alvo e janela | Railway production, serviço e volume do A1. Deployment `159fd4eb-86a3-4de2-9f76-48cca60987a6`. Start solicitado às 10:45:10 e `REMOVED` confirmado às 10:50:16 em America/Sao_Paulo (13:45:10–13:50:16 UTC). Janela de 5 min 06 s. API e Postgres original sem deploy ativo, volumes preservados, nenhum patch pendente. |
| Executor e TLS | Executor local Windows com Node 24.18.0, Temurin 21.0.12.1+1, Maven Wrapper 3.3.4, Maven 3.9.12, Flyway 11.14.1 e JDBC PostgreSQL 42.7.9. Túnel SSH com chave do gateway fixada, limitado ao loopback e encaminhado ao DNS privado do banco. O JDBC validou CA e nome `localhost` com `sslmode=verify-full`. A contraprova do ensaio rejeitou a CA errada. |
| Pré-condições | Identidade e montagem do volume confirmadas no container. PostgreSQL 17.11, database `controle_financeiro`, schema `public` vazio, zero history e zero clientes concorrentes antes do migrate. Autodeploy da API desativado. O executor autenticou com `cf_adocao_migrator`, com CONNECT, USAGE e CREATE e sem privilégios administrativos. |
| Recuperação | Arquivo lógico custom de catálogo vazio, com criação do database, roles sem senhas, ACLs e parâmetros relevantes. Restore do checkpoint real em PG17.11 isolado com metadados equivalentes. No ensaio de perda de conexão, o DDL em curso foi desfeito e o commit anterior preservado. O ponto cobre o catálogo vazio e seus metadados lógicos. Recuperação física, WAL e indisponibilidade do provedor ficaram fora do ensaio. |
| Flyway e catálogo | `info` inicial com 16 Pending, `validate` prévio com exceção apenas para pendências, um `migrate` de V1 a V16, `validate` final estrito e `info` final com 16 Success e zero pendências. Cinco comandos com código 0. As 16 entradas SQL em history conferiram versão, arquivo, ordem e checksum independente. Catálogo igual ao ensaio, com 36 tabelas de aplicação, 166 constraints e 97 índices, sem linhas de aplicação. O único INSERT da cadeia copia dados existentes em V6 e inseriu zero linhas no banco vazio. |
| Encerramento | Sessões do migrador drenadas. O owner `cf_adocao_migrator` permaneceu para preservar ownership, com NOLOGIN, senha removida e CREATE revogado. Túnel, watchdog e fixtures locais encerrados, chave SSH revogada. Um erro no fechamento local do túnel impediu a gravação do primeiro recibo após o estado `REMOVED`. O recibo foi reconciliado a partir dos logs, do catálogo e de consulta independente ao Railway. |
| Compatibilidade | Hibernate validate com o JAR aprovado e o perfil `adoption` passou no PostgreSQL descartável e preservou catálogo e history. A primeira inicialização da API real, os consumidores e a homologação funcional permanecem no A3 e nas fases seguintes. |

Recibo sanitizado, manifesto e logs no acervo externo
`controle-financeiro-runtimes/prontidao-adocao/20261106-lote-a2`.
SHA-256 do recibo `6511df02cebea8ed01837a5a86ff00a1c34e199c450b7c81bd670d8dcd1fce2b`.
O recibo associa os 16 SHA-256 de origem aos checksums gravados no Flyway.

##### Procedimento aplicado no A2

O candidato aprovado é `99025fa9fe93da19e9d40678d1e9eeeb78e698f9`.
No artefato GitHub Actions `13464315355`, o JAR de SHA-256
`36d9393bc6348555285411319c73a966c0d2be760f78dc0b2fe706cc81e604f0`
contém exatamente V1 a V16, com SHA-256 igual ao blob Git para cada SQL.
A última versão é `V16__onboarding_application.sql`. O JAR e o plugin
Maven usam Flyway 11.14.1. O executor leu apenas os 16 SQLs do candidato na localização aprovada. A pasta isolada não continha callbacks, scripts de inicialização ou overrides adicionais. O ensaio local em PG17.11 cobriu banco vazio,
histórico, reaplicação e Hibernate validate.

1. Reconfirmar os IDs do A1, a API e o Postgres original offline, ausência de
   deploys pendentes e exclusividade de escrita. Preparar um único executor
   com JDK 21 e Maven Wrapper do commit aprovado, em rede privada ou por
   túnel SSH autorizado. Testar seu próprio caminho TCP/TLS e a política de
   confiança do certificado antes de qualquer DDL. Preparar a parada por ID.
2. Iniciar somente o banco novo. Repetir o inventário e confirmar PG17.11,
   `controle_financeiro/public`, ausência de objetos e de history. Registrar
   encoding, locale, extensões, papéis e ACLs. Preservar um ponto de recuperação
   e demonstrar restore em alvo isolado antes de migrar. Ensaiar o mesmo
   candidato e grants no clone.
3. Provisionar o papel dedicado do migrador com CONNECT, USAGE e CREATE
   necessários e ownership dos objetos que criar. Injetar `FLYWAY_URL`,
   `FLYWAY_USER` e `FLYWAY_PASSWORD` por canal protegido. A URL JDBC aponta
   ao banco `controle_financeiro` pelo caminho privado confirmado. O papel
   de bootstrap fica reservado à administração. O futuro papel da API
   recebe credencial própria e somente os grants de runtime requeridos.
4. A partir do backend do candidato, usar os argumentos do
   [comando Flyway](#comandos-para-backup-preflight-e-migração). Fixar
   `schemas=public`, `defaultSchema=public`, `createSchemas=false`,
   `target=16`, `outOfOrder=false`, `baselineOnMigrate=false`,
   `cleanDisabled=true` e `validateOnMigrate=true`. O plugin lê
   `filesystem:src/main/resources/db/migration`. Em `flyway:info`, exigir
   exatamente 16 pendências, de 1 a 16. Rodar `flyway:validate` com
   `ignoreMigrationPatterns=*:pending` somente nesse precheck. Executar
   `flyway:migrate` uma vez desde V1, sem chamar `flyway:baseline`.
5. Rodar `flyway:validate` com a lista de padrões vazia e depois
   `flyway:info`. Conferir em leitura `public.flyway_schema_history`
   com 16 entradas SQL bem-sucedidas, versões 1 a 16 em ordem, checksums
   compatíveis e zero pendências. Conferir os objetos esperados e o resultado
   de Hibernate validate com o JAR aprovado no ensaio isolado. Registrar os
   resultados e remover apenas o deploy novo ao encerrar a janela, preservando
   seu volume. Manter a API de produção offline.
6. Em divergência de identidade, catálogo, versão, checksum ou falha de
   migração, bloquear o cutover, preservar estado e logs sanitizados e
   aplicar o procedimento de recuperação ensaiado. Reavaliar a janela antes
   de retomar. `repair`, `clean` e reedição de SQL aplicado ficam fora
   do procedimento.

#### Lote A3 — configuração segura e primeira inicialização da API

##### Resultado do A3 em 06/11/2026

| Controle | Evidência |
|---|---|
| Revisão dirigida do A2 | 24 hashes conferidos, CRC32 recalculado para V1–V16 e 16 sucessos sem pendências. Os 36 conjuntos de linhas estavam vazios. Restauração isolada do checkpoint A2 repetida sem migrations. O código 13 foi reproduzido como espera local duplicada após o túnel já encerrado e o deployment removido. O erro e o recibo reconciliado permanecem no acervo. A revisão independente continua pendente. |
| Alvo e duração | `postgres-adocao` 17.11 no volume b4a172ec-5771-4bca-8b10-2ae7976b1f6e. Deployment 79f07084-a3dd-43e0-97d2-a08127cc152a removido. Janela de 57 s, das 14:41:53 às 14:42:50 em America/Sao_Paulo, 17:41:53–17:42:50 UTC. API e Postgres original ficaram desligados. Os volumes foram preservados e a chave SSH temporária revogada. |
| Papel e TLS | `cf_adocao_api` criado sem privilégios administrativos e com senha própria selada. CONNECT, USAGE em public e SELECT em users, com transação somente leitura por padrão. Os testes em transação revertida recusaram escrita, DDL, TEMP e acesso ao histórico. O banco novo perdeu o grant TEMP de PUBLIC. Sem grants adicionais para sequences ou funções. O owner das migrations continuou sem login. O certificado real já cobria localhost e postgres-adocao.railway.internal, com a CA do volume. O psql autenticou o papel novo com verify-full pelo DNS privado. A validação pelo JDBC da réplica da API continua pendente. |
| Credenciais | JWT, BRAPI e Resend substituídos e selados em patch aplicado com skipDeploys. O JWT anterior perde validade na próxima ativação. A senha do papel novo substituiu a referência da API ao serviço Postgres original. A validade da senha legada no cluster desligado não foi testada. Por decisão do proprietário, a chave Resend Onboarding foi mantida. O token antigo da BRAPI continua ativo conforme confirmação do proprietário. |
| API e BFF | Configuração guardada sem deploy, com perfil adoption, Hibernate validate, Flyway e SQL init desligados, writers e jobs fechados, uma réplica e liveness com orçamento de 300 s. Regra Railway `rul_u0e4loeh3q43u` respondeu 403 no domínio público e permanece ativa. BACKEND_API_URL foi conferida e ficou só em Production para novos builds. Oito URLs de preview retornaram 302 de autenticação em teste anônimo. A Vercel retornou 404 ao gravar a regra WAF e não houve publicação. A contenção dos previews para o backend real foi aplicada na origem Railway. |
| Pacote e recuperação | A main manteve 99025fa9fe93da19e9d40678d1e9eeeb78e698f9. JAR aprovado do Actions 13464315355 verificado dentro de imagem local, sem deployment remoto da API. O novo checkpoint de estrutura V16 restaurou 36 tabelas de aplicação, 166 constraints e 97 índices em PostgreSQL isolado. O arquivo é schema-only e não contém as 16 linhas do histórico. O restore completo de V16 precisa de um backup que inclua esse histórico. |

Recibo no acervo externo
`controle-financeiro-runtimes/prontidao-adocao/20261106-lote-a3/recibo.json`.
SHA-256 `854dbb82733550e2b4fc13879f30fcf3b2308b2791e2ed5f702bf2e724cce1bb`.

##### A3 complementar em 06/11/2026

O proprietário manteve a chave Resend `Onboarding` e adiou a API. Confirmou
a revogação do token BRAPI antigo. A matriz distingue o que foi confirmado
pelo operador, pelo emissor e pelo Railway. [Rotação](rotacao-credenciais.md)

| Controle | Evidência e alcance |
|---|---|
| Revisão e captura real | Revisão dirigida do A2 conferiu 24 hashes e os 16 checksums. O novo backup saiu do `postgres-adocao` 17.11 no volume `b4a172ec-5771-4bca-8b10-2ae7976b1f6e`. O mesmo snapshot confirmou 36 tabelas de aplicação vazias e incluiu as 16 linhas Flyway. A captura ocorreu das 17:16:00 às 17:16:18 de Brasília, das 20:16:00 às 20:16:18 UTC. Deployment `f8cfb642-00ca-49a5-941e-22d2cc3745df` removido. API e banco legado ficaram desligados. |
| Restauração isolada | PostgreSQL 17.11 restaurou o archive completo. Flyway `validate` e `info` confirmaram V1–V16, 16 sucessos e zero pendências, sem `migrate`. Foram reconciliados 36 tabelas vazias, 166 constraints e 97 índices. Em 17 checks, a recriação de SQL apresentou casts equivalentes dos mesmos elementos de arrays. Os demais itens compararam exatamente. |
| Papel restrito | `cf_adocao_api` preservou CONNECT, USAGE em `public`, SELECT em `public.users` e padrão somente leitura. Sem escrita, DDL, TEMP ou acesso ao histórico. O papel tem alcance para startup e health em manutenção. `cf_adocao_migrator` possui os objetos e segue sem login. A verificação Flyway usou o bootstrap descartável da cópia. Grants para uso funcional ficam para etapa própria. |
| Candidato novo | Commit `b396630d1a821c5de4a5f626f81476aeb9626e9e`. JAR SHA-256 `e624abbc36155a36720ea92156298cd3d58ccb004dbd76a82134e4146a1eff64`. Os 16 SQLs embarcados correspondem aos hashes do A2. A imagem local `cf-adocao-api:b396630d-a3c` contém o JAR verificado em `/app/app.jar`. Cinco testes focados passaram. A revisão dos caminhos de vazamento orientou a correção e a revisão independente do candidato empacotado fica pendente. |
| Runtime do JAR em cópia isolada | Hibernate validate passou em 21,8 s de startup. PgJDBC com `verify-full`, CA da cópia e hostname `localhost`. PostgreSQL confirmou dez sessões TLS de `cf_adocao_api`. Liveness 200. Readiness, login e cadastro 503 por manutenção. Catálogo, histórico e contagens permaneceram iguais. O ensaio confirmou a fronteira de manutenção e não exercitou uma sessão autenticada. |
| Configuração e tráfego real | Railway reconfirmou JDBC privado, CA configurada, Hibernate validate, Flyway/SQL init e writers/jobs desligados, uma réplica configurada e healthcheck liveness de 300 s. Borda Railway bloqueou a origem pública (403) com API desligada. Oito previews existentes retornaram 302 de autenticação anônima e `BACKEND_API_URL` continua só em Production para novos builds. O upstream dos builds existentes e o comportamento com a réplica ligada ficam para a janela. |
| Encerramento | A chave SSH temporária foi removida do Railway e do host. Os volumes novo e legado foram preservados. A réplica de produção, o JDBC da API no DNS privado, a contenção com runtime ativo e a homologação funcional seguem pendentes. |

O acervo externo está em
`controle-financeiro-runtimes/prontidao-adocao/20261106-lote-a3-complementar`.
O recibo vincula `backup-protegido/v16-completo.dump` (SHA-256
`7bffc68fc2c984c1138bf372b0dc1cb664e7d0f155dfee5f6d959eea6fa49323`)
e `backup-protegido/roles-sem-senhas.sql` (SHA-256
`dfe01c230cc991505dce10dd7ea38761e6d606bd8d53f1da9332d1b69f32a531`).

Para reproduzir a recuperação, conferir os dois hashes e preparar
PostgreSQL 17.11 descartável com bootstrap exclusivo. Aplicar o SQL de
roles sem senhas em `postgres` e usar `pg_restore --exit-on-error --create
-d postgres` com o archive completo. Validar banco, grants, catálogo e
histórico V1–V16 com o bootstrap. Usar Flyway `validate` e `info` sem
ignorar pendências. Criar senha sintética apenas para o papel da cópia,
usar a CA e o hostname dela com JDBC `verify-full` e executar o JAR em
`adoption`. Conferir as sondas e repetir catálogo, histórico e contagens
antes de remover a cópia. O script externo `restaurar-v16.mjs` registra
as etapas e compara com o manifesto A2.

##### Próxima janela de primeira inicialização restrita

Em 06/11, a decisão de manter `Onboarding` adiou a API. O proprietário
autorizou a revogação depois, e a janela descrita abaixo foi executada em
12/11. A validação das substitutas em uso real fica no recorte autorizado
de cada integração. Manter os jobs e writers fechados.
[Execução de 12/11](../../tasks/evidencias/revisao-a3-complementar/EXECUCAO-2026-11-12.md)

1. Confirmar ambiente, IDs de serviço e volume, ausência de deployments
   ativos e regra de borda `rul_u0e4loeh3q43u` bloqueando `/*`. Conferir
   retenção, hashes do checkpoint V16 e restauração. Fixar o commit e o
   binário aprovados. A fonte Railway ainda aponta para `main`. Usar imagem
   aprovada por digest ou fixar a fonte do build, verificar a proveniência
   e medir o hash de `/app/app.jar` dentro da réplica.
2. Conferir uma réplica, `PORT=8080`, perfil `adoption`, Hibernate
   `validate`, `SPRING_JPA_GENERATE_DDL=false`,
   `SPRING_FLYWAY_ENABLED=false`, `SPRING_SQL_INIT_MODE=never`,
   `APP_OPERATIONS_WRITERS_ENABLED=false` e
   `APP_OPERATIONS_JOBS_ENABLED=false`. Manter autodeploy desligado.
   O comando de partida grava a CA no contêiner e executa
   `java -jar /app/app.jar`. A URL JDBC usa
   `postgres-adocao.railway.internal:5432/controle_financeiro`,
   `sslmode=verify-full` e `sslrootcert=/tmp/cf-adocao-root.crt`.
   Usar somente a credencial selada de `cf_adocao_api`.
3. Armar o desligamento e reservar 15 minutos para encerrar dentro de
   uma janela autorizada de até 60 minutos. Ativar apenas o banco novo.
   Conferir identidade, V16, ausência de escritas inesperadas e
   conectividade privada. Preservar os grants do papel restrito. Ativar
   a réplica e verificar startup dentro dos 300 s de liveness. Usar
   acesso privado para provar Hibernate validate, papel, banco e TLS
   no JDBC da réplica, além de liveness 200 e readiness 503. Com writers
   fechados, readiness retorna antes de consultar o banco. Complementar
   com sessão PostgreSQL da API identificada em `pg_stat_activity` e
   `pg_stat_ssl` e uma prova de leitura sob o mesmo papel.
4. Validar login e cadastro bloqueados por manutenção, ausência de jobs,
   de migrations automáticas e de alterações no catálogo/history. Com a
   réplica ativa, reconferir 403 no domínio público e testar a contenção
   de previews/Development e do upstream efetivo quando houver acesso
   autorizado. As respostas anônimas 302 da Vercel confirmam proteção de
   entrada. A regra da origem Railway cobre o tráfego dos previews
   existentes que ainda apontem para a URL pública.
5. Registrar binário, deployment, tempos, probes e primeira falha.
   Desligar a API, fechar conexões e desligar o banco novo. Confirmar os
   deployments removidos e revogar acessos temporários. Preservar os
   volumes. Homologação funcional, smoke com escrita e publicação do
   frontend exigem etapa própria, após revisão independente.

Antes de abrir writers, validar CORS, destino server-only do BFF de
Production, isolamento de previews e Development e `VERCEL_ENV=preview`
com 503 sem chamada ao upstream no candidato. A homologação com escrita
deve comprovar readiness 200 com jobs fechados.

### Histórico do lote 1 — Postgres original e inventário

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

#### Retomada em 06/11/2026 — inspeção física e suporte

O lote 1 segue em classe D. O conector reencontrou o mesmo serviço e
volume, sem deployment ativo, patch preparado ou operação pendente. A
imagem pública ainda resolve para o mesmo índice OCI PG17.11. O
deployment histórico abfd21e0-ebf1-46ef-8b2c-44e48d09c343 retornou zero
linhas de log. O identificador de snapshot pertence ao deployment e não
demonstra backup ou a versão do volume.

| Alternativa | Capacidade comprovada e decisão |
|---|---|
| Metadados de API e conector | Identificam serviço, volume, montagem, estado e configuração, sem ler arquivos do cluster. Nenhuma operação somente leitura de PG_VERSION apareceu entre as capacidades disponíveis. |
| railway volume files ou SSH/SFTP | O código do CLI exige deployment ativo para o alvo de arquivos. SSH/SFTP também acessam o filesystem do container em execução. A via padrão não atende à inspeção offline. |
| Pre-deploy e montagem simultânea | O Railway documenta que o pré-deploy não monta volumes. A montagem normal dá leitura e escrita e os deployments ativos não compartilham a montagem do serviço. O conector oferece mover/anexar/destacar e alterar mountPath, com redeploy, sem opção somente leitura. |
| Deployment de manutenção | Há override de start documentado. Falta comprovar a montagem estritamente somente leitura e a substituição completa do entrypoint para a receita exata. O wrapper da imagem configurada pode alcançar o fluxo de inicialização. Comando aparentemente de leitura dentro de um volume gravável não satisfaz a garantia. |
| Snapshot ou clone | O painel do lote 1 não listou backup. O snapshot do deployment histórico não prova snapshot do volume. Criar backup, clone ou remontar exigiria aprovação e um procedimento do provedor com leitura isolada demonstrada. |

[Volumes Railway](https://docs.railway.com/volumes/reference) ·
[API de volumes Railway](https://docs.railway.com/integrations/api/manage-volumes) ·
[Montagem padrão](https://docs.railway.com/volumes) ·
[CLI de arquivos](https://github.com/railwayapp/cli/blob/master/src/commands/volume.rs) ·
[SSH Railway](https://docs.railway.com/cli/ssh) ·
[Pre-deploy](https://docs.railway.com/deployments/pre-deploy-command) ·
[Comandos de start](https://docs.railway.com/builds/build-and-start-commands)

Se o Railway demonstrar um método de manutenção, revisar antes de autorizar
a receita exata. Exigir imagem identificada e entrada que execute somente
a leitura de PG_VERSION e a checagem de global/pg_control, montagem somente
leitura da geração confirmada e API/Postgres normal desligados. O recibo
deve confirmar o modo de montagem e a identidade antes de ler. Limitar a
janela a 10 minutos, incluindo retirada do inspetor e verificação de
offline. Aprovar o teto de custo antes de provisionar. Preservar a associação
original e exigir um caminho de restauração da configuração que não inicie o
Postgres. Se o Railway não garantir algum desses controles, encerrar sem
provisionar. Essa alternativa depende de evidência e nova autorização.

**Próxima operação proposta.** Entrar no [Central Station](https://station.railway.com/)
com a conta proprietária do projeto. Se houver opção de thread privada,
enviar o texto abaixo após autorização específica para envio. Caso só
exista canal público, perguntar de forma genérica se há uma inspeção offline
somente leitura para PG_VERSION e global/pg_control, sem divulgar IDs, e
solicitar canal privado para o caso concreto. O suporte documenta threads
privadas no Pro e atendimento comunitário nos planos inferiores.
[Suporte Railway](https://docs.railway.com/platform/support)

**Texto para a Central Station pública**

> Qual procedimento o Railway oferece para ler PG_VERSION e verificar a presença de global/pg_control em um volume PostgreSQL com o serviço offline, sem executar o entrypoint ou montar com escrita? Se a inspeção depender da equipe Railway, por qual canal privado posso informar os identificadores do recurso?

**Minuta para canal privado**

> **Inspeção offline do PGDATA de um PostgreSQL Railway**
>
> Olá, equipe Railway. Preciso confirmar a versão física do cluster antes de
> reativar o PostgreSQL. O Postgres e a API estão offline.
>
> - Projeto controle-financeiro, 19974952-914d-4072-9140-e62e5ed23c31
> - Ambiente production, 73f7324a-a15f-4940-b2dc-d5bcb5510441
> - Serviço Postgres, 79d2ee56-cfd0-47bc-8744-e932cf49ba69
> - Volume postgres-volume, 1fe34e12-e948-4c99-8448-7cfbf871ec54
> - PGDATA em /var/lib/postgresql/data/pgdata
>
> O acesso por railway volume files exige um deployment ativo. O histórico
> acessível do deployment removido não mostrou logs que comprovem a versão da
> geração atual do volume.
>
> É possível confirmar em modo somente leitura, na geração atual do volume e
> nesse PGDATA, o conteúdo de PG_VERSION e a presença de global/pg_control?
> Por favor, informem como a leitura pode ser vinculada à geração correta.
> Se a equipe não puder consultar os dois metadados, qual é o procedimento
> suportado para verificá-los sem iniciar o PostgreSQL, sem executar seu
> entrypoint e sem montar o volume com escrita? Se houver qualquer ação ou
> custo, enviem o procedimento para avaliação antes de executá-lo.

Aceitar a resposta como evidência de major somente se ela vincular o
arquivo, PGDATA, volume e geração. A presença do arquivo de controle não
demonstra integridade completa ou recuperabilidade. Após resposta compatível,
reconferir rota privada, papel de leitura, exclusividade, startup e parada.
Somente quando essas condições forem satisfeitas vale retomar o inventário
na autorização original. [Layout PostgreSQL](https://www.postgresql.org/docs/17/storage-file-layout.html)

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
| 5. Homologação CF-035 | Ensaiar o rollout em alvo sintético isolado antes de intervenção de produção, com a mesma imagem/contrato. Validar BFF/frontend HTTPS em alvo isolado, com caixa de teste e cotação controlada. Um Preview Vercel para a jornada funcional exige revisão própria do bloqueio padrão. | Login/logout, onboarding, operação, reload/persistência, exportação, ownership, saldo e UX em erro. Medir boot, locks, pool e queries. | Fechar writers e corrigir no alvo isolado. Autorizar recursos e smoke de homologação. |
| 6. Baseline/migração no PG | Janela exclusiva vigente, recuperação ensaiada. Um executor Flyway e API offline. Aplicar caminho A/B/C com o plugin do POM. | BASELINE 1 apenas em B, migrations esperadas, info/validate final, reconciliação e Hibernate validate depois. Parar em erro, lock fora do orçamento ou efeito inesperado. | Inspecionar history/transações antes de retomar. Preservar versões já aplicadas. Autorizar baseline B e migrate explicitamente. |
| 7. API em manutenção | Schema final conferido, credenciais rotacionadas, imagem/JAR identificados, perfil adoption, writers/jobs false. Iniciar uma instância com acesso restrito e a configuração abaixo. | Liveness 200, readiness 503, rotas funcionais inclusive GET e OPTIONS 503, logs sem DDL/migrate e validação JPA no startup. Qualquer escrita, falha de boot ou pacote divergente interrompe. | Parar a instância e preservar schema, logs e receita de build. Autorizar configuração e start restrito. |
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

Aplicar as etapas abaixo na ordem do [plano de rotação](rotacao-credenciais.md). O conector reconfirmou os nomes das variáveis e os escopos da Vercel. Hibernate update e JDBC privado constam da observação anterior do painel. O fluxo de nova leitura desses valores foi interrompido pelo limite da revisão automática e nenhum valor sensível foi aberto.

| Serviço/ambiente e configuração | Atual | Proposto e momento | Validação e recuperação |
|---|---|---|---|
| Railway production/postgres-adocao, imagem/volume e rede | PG17.11 verificado, volume novo de 1.000 MB montado, DNS privado e sem exposição pública. Deploy removido após o A1. | A2 inicia somente o novo banco para aplicar V1–V16, com o original offline. | Reconfirmar identidade, montagem, versão e isolamento antes de migrar. Remover apenas o deploy ao final. |
| Railway production/postgres-adocao, recuperação | Cluster vazio ao final do A1. | Preservar ponto de recuperação e ensaiar restore em destino isolado antes de DDL no A2. Definir retenção, RPO e RTO na janela. | Validar restore, papéis e equivalência do catálogo. Preservar fonte e recibos. Mudança de plano exige decisão própria. |
| Railway production/API, origem/build | Git main, autodeploy off, Dockerfile recompila, sem deployment ativo. | Manter autodeploy off. No plano atual, manter fonte Git se o registro privado exigir upgrade. Fixar o SHA, conferir o build e homologar os bytes resultantes antes de produção. Dockerfile.release é a via para reaproveitar exatamente o JAR da main, condicionada ao transporte privado aprovado. | Conferir JAR embarcado, labels, digest e arch do deployment. Se aprovado caminho Git, verificar checkout, base, toolchain, JAR real e imagem Railway, homologando esse binário. Retornar à imagem comprovadamente compatível se necessário. |
| Railway production/API, Hibernate/Flyway/SQL init | adoption, Hibernate validate, Flyway false, SQL init never e geração de DDL false aplicados sem deploy no A3. | Usar essa configuração no start restrito. Flyway pelo executor separado. | Confirmar perfil efetivo, Hibernate validate e logs sem DDL. Parar ao recusar override. |
| Railway production/API, flags/jobs | Writers e jobs configurados como false. Sem cron Railway. | Usar false/false no start restrito, true/false no smoke autorizado e true/true após GO de jobs e reinício separado. | Confirmar manutenção 503 e ausência de escrita e jobs. |
| Railway production/API, PORT/health/recursos | Uma réplica, PORT 8080, liveness com 300 s e start override para carregar a CA. O A3 verificou a configuração com a API desligada. | Confirmar liveness no start restrito e readiness na fase de liberação. | Conferir probes, startup e consumo por ambiente. Parar deployment defeituoso preservando diagnóstico sanitizado. |
| Railway production/API, conexão, CORS e auth | Datasource privado para postgres-adocao.railway.internal, papel restrito e quatro credenciais seladas. Borda pública retorna 403. | Confirmar JDBC verify-full no container real e CORS exato no teste de integração. Encerrar as revogações pendentes e revisar os clientes externos antes do startup. | Verificar grants, autenticação e rejeição de sessão antiga no smoke autorizado. |
| Vercel Production, BFF e publicação | BACKEND_API_URL aponta ao host Railway e está limitado a Production nos novos builds. O alias público serve revisão anterior e o host Railway está bloqueado pelo A3. | Publicar manualmente sem alias inicial e promover a mesma revisão após smoke aprovado. Confirmar domínio canônico. | Testar BFF, sessão, cookies host-only HttpOnly e HTTPS. Reverter somente a destino compatível após congelar escrita. |
| Vercel Preview/Development, rede e deploys antigos | Variável de produção removida dos dois escopos. Oito previews antigos exigiram autenticação em teste anônimo. A regra de origem Railway bloqueia acesso ao backend real. | Usar backend local ou descartável no Development e manter VERCEL_ENV=preview no candidato integrado. Antes de remover o bloqueio de origem, provar que previews antigos e aliases não alcançam o backend. | A variável nova só vale para builds futuros. Conferir guarda 503 no candidato e isolamento de deploys antigos, inclusive para usuário autenticado. |

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
