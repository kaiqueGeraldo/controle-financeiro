# Contrato operacional preparado localmente

## Situação vigente — 28/10/2026

Os [pareceres finais reconciliados](../consolidacao-pre-adocao/MATRIZ.md) aceitam
os controles locais de produto/PG16/17, startup local40s, TCP Windows/JAR e recortes
RVPLA/audit. O texto de preparação de26/10 abaixo preserva seus resultados e
falhas; referências a revisão ainda pendente/startup não aceito são históricas
no alcance substituído pelos pareceres posteriores. Não há nova suíte17 verde.
CPA-01/P2 exige saneamento da seleção Windows/job Linux antes de publicação/CI;
os gates operacionais reais descritos neste contrato continuam intactos.

## Registro da preparação de26/10/2026

Lote de preparação, aguardando revisão independente. Não autoriza adoção real,
configuração de provedor, CI remota, deploy, publicação ou uso. Ver resultados e
proveniência desta execução no README deste diretório; não usar pacotes históricos
como prova do candidato atual.

## Separação dos passos

1. Identificar/classificar A–D, estabelecer parada/drenagem de todas as instâncias,
   scripts, administradores, migradores, clientes antigos e jobs. Registrar freeze
   de DDL, DML e nextval; não prometer interrupção retroativa de transações.
2. Backup e restore em destino novo, com equivalência completa e controle de
   roles/ACL/RLS/extensões. Preflight legado somente para B, na mesma janela.
3. Job Flyway separado: info/validate e lista exata das pendências; baseline 1
   explícita somente B aprovado; migrate até V16; validate final sem ignorar
   pending/future/missing/failed/checksum. Comandos permanecem no plano A–D.
4. Iniciar API restrita com perfil `adoption`, writers e jobs false. Ela não
   executa Flyway nem SQL init; Hibernate apenas valida. Todas as rotas funcionais
   retornam 503 antes dos controllers/autenticação, inclusive GET, login, logout,
   OPTIONS e rotas ainda desconhecidas. Só GET dos dois probes passa.
5. Conferir identidade/pacote/schema/history e gates próprios. Readiness 503 em
   manutenção é intencional, não falha a ser mascarada. Encerrar esse processo.
6. GO autorizado exige reinício drenado com writers true e jobs false. A API só
   fica pronta após startup/JPA e banco válidos. Verificar smoke, ownership,
   persistência e reconciliação no ambiente autorizado antes de liberar uso.
7. Jobs true exigem outro reinício autorizado, depois de analisar execução
   acumulada/replay, emails e mercado. Não há endpoint de abertura ou alteração
   em runtime, nem sistema distribuído de flags.

As etapas não formam uma autorização automática em cadeia. A aplicação em modo
normal conserva defaults writers/jobs true; é obrigatório selecionar `adoption`
no procedimento preparado. O modo normal de desenvolvimento conserva Flyway.
Fechar só writers fora desse perfil não impede migrations no bootstrap.

## Configuração efetiva e limites

`application-adoption.yml` define Flyway false, Hibernate validate, SQL init never,
generate-ddl false, writers/jobs false, porta PORT/8080, encerramento gracioso de
30s, aquisição Hikari 3s e validação 1s. Não altera tamanho do pool ou defaults de
desenvolvimento. Os testes de indisponibilidade acrescentam timeouts JDBC 2s em
conexão/socket; isso limita o ensaio de rede congelada e deve ser considerado no
futuro changeset de conexão, sem reproduzir connection strings em evidências.

Spring admite overrides de ambiente, propriedades JVM, JSON e argumentos. O
initializer de adoção examina a configuração resolvida antes de refresh e recusa:
DDL-auto diferente de validate, Flyway true, SQL init diferente de never,
generate-ddl true, hbm2ddl alternativo diferente de validate e ações JPA paralelas
de schema (inclusive none, que poderia suprimir validate). Usa Binder para o mapa
JPA, incluindo chaves entre colchetes. Jobs true com writers false também é erro.
Um override inseguro causa saída não zero sem migrar/criar history. Guard não é
proteção contra código novo malicioso; novas fontes de inicialização exigem revisão.

O override remoto observado continua sendo `SPRING_JPA_HIBERNATE_DDL_AUTO=update`.
Não foi removido remotamente. O perfil deve recusá-lo até ser corrigido para
validate por operação futura autorizada. Não usar um argumento de maior
precedência para esconder configuração remota divergente.

Flags:

| Propriedade / variável de ambiente | Modo normal | Perfil adoption | Efeito |
|---|---|---|---|
| app.operations.writers-enabled / APP_OPERATIONS_WRITERS_ENABLED | true | false | Fecha todo ingresso funcional; não cancela operação anterior |
| app.operations.jobs-enabled / APP_OPERATIONS_JOBS_ENABLED | true | false | Scheduling só registrado com as duas flags true; nenhum ShedLock adquirido quando fechado |

Listeners internos são síncronos nos fluxos de negócio. A fronteira de HTTP e a
ausência de scheduling removem as fontes de execução inventariadas. Email também
recusa envio assíncrono se writers estiverem fechados, antes de criar o cliente.
Não há exclusividade de banco: chamadas diretas a serviços por código futuro,
scripts externos, outra instância e administradores não são bloqueados por esta
flag. Para freeze real, parar consumidores e controlar privilégios com responsáveis.

## Saúde e Railway — proposta, não aplicada

| Endpoint GET na mesma porta | 200 | 503 | Custo |
|---|---|---|---|
| /ops/health/liveness | Processo em LivenessState.CORRECT | Estado inicial/BROKEN; antes de abrir porta não há resposta HTTP | O(1), sem banco |
| /ops/health/readiness | ACCEPTING_TRAFFIC, writers abertos e conexão válida | Inicialização, manutenção ou banco indisponível | O(1); um borrow e isValid(1), sem tabelas financeiras |

Respostas públicas contêm somente `{"status":"UP"}` ou `{"status":"DOWN"}`,
Cache-Control no-store. Nenhuma URL, versão, credencial, stacktrace ou detalhe de
dependência. Probes GET exatos dispensam resolução de identidade JWT; um token
anexado não deve produzir consulta de usuário ou quebrar liveness com DB offline.
Demais rotas continuam protegidas; não há Actuator/admin liberado. HEAD/POST não
são probes públicos. Readiness não refaz catálogo/checksum por chamada: JPA valida
o modelo no startup; preflight/Flyway/catalog drift são gates operacionais prévios.
Drift de constraint após GO exige freeze e nova avaliação; não é certificado por
um probe barato. Hibernate validate sozinho não prova todas as constraints.

Proposta Railway para candidato liberado: healthcheck path
`/ops/health/readiness`, porta efetiva PORT/8080, orçamento inicial de startup 300s,
medido antes de homologação e sem migração dentro dele. A frequência do monitor
deve respeitar o pool; cada probe saudável custa uma conexão temporária/round-trip.
Nenhuma medição sintética permite dimensionar produção.

Processo em manutenção não satisfaz esse healthcheck de promoção. Ensaiar validação
restrita como execução isolada sem promoção/tráfego. **Não tentar congelar um
serviço existente só com rolling deploy de readiness 503:** a plataforma pode
manter o deployment anterior ativo. Parar/drenar writers existentes explicitamente.
Healthcheck Railway é gate de deploy, não monitor contínuo ou corte automático de
tráfego após queda do banco. Monitor externo e resposta operacional seguem pendentes.

## Previews — proposta concreta, não aplicada remotamente

`controle-financeiro-frontend/vercel.json` passa a propor
`git.deploymentEnabled=false` global. Só altera comportamento do provedor quando
a configuração for publicada/aplicada em etapa autorizada. Deploy manual/API e
deployments antigos não são revogados por esse arquivo.

O BFF local recusa toda operação em `VERCEL_ENV=preview` antes de cookies/body/fetch,
independentemente da URL configurada. Não oferece exceção por simples comparação
de host nem habilitação automática de staging. Não certifica isolamento universal
ou deployments antigos que ainda usam o código anterior.

Ordem futura: inventariar/proteger ou desativar previews existentes; revisar
desativação global de novos previews; remover destino de produção do escopo
preview/development; conferir os valores efetivos do deployment novo, sem secrets;
só reativar previews após backend/banco sintéticos isolados e revisão específica.
Manter API offline durante essas decisões. Não criar staging ou infraestrutura
remota por efeito deste lote.

## Pacote e imagem local

Exportar para runtime novo, conferir manifesto contra commit e bytes locais,
executar verify sem clean/skipTests. O JAR novo tem revisão e SHA próprios.
`Dockerfile.release` recebe somente esse JAR, confere SHA durante o build, registra
commit/hash em labels, usa usuário 10001 e perfil adoption. O digest do runtime
Java e o ID da imagem resolvidos precisam constar no recibo. Não publica registry.
O Dockerfile histórico permanece histórico; Railway ainda não foi configurado
para consumir a imagem preparada. A futura publicação deve escolher esse caminho
de pacote verificado ou produzir/testar outra imagem com proveniência própria.

No ensaio nativo Windows, o launcher de testes usa `-Xmx384m`; a imagem usa a
ergonomia padrão de heap do JDK no container. Há também diferença de patch Java.
Essas execuções não isolam a causa dos atrasos nativos. O critério novo de40s não
foi aumentado: uma falha em classes e três no JAR nativo ficam preservadas. A
matriz completa de17 casos passou em Linux com o mesmo JAR. No controle posterior
às mutações, dois startups Linux também excederam40s. Portanto a instabilidade
não está isolada a Windows; a causa permanece inconclusiva. Os hashes originais
foram restaurados e a imagem original não foi alterada. Não se certifica startup
estável, startup sob carga real ou o budget proposto de300s do Railway. Revisão
independente deve decidir o alcance e exigir diagnóstico antes de aceitar esse gate.

## Fontes oficiais consultadas em 26/10/2026

- [PostgreSQL 17 pg_dump](https://www.postgresql.org/docs/17/app-pgdump.html):
  pg_dump de major menor recusa servidor mais novo; saída não tem garantia para
  servidor antigo. Usar clientes da mesma major nos ensaios 16/17; sem downgrade.
- [PostgreSQL 17 pg_restore](https://www.postgresql.org/docs/17/app-pgrestore.html):
  exit-on-error e single-transaction usados nos destinos novos. Freeze de sequences
  continua necessário; globals/roles exigem procedimento próprio.
- [Release 17](https://www.postgresql.org/docs/17/release-17.html): novo
  transaction_timeout e mudanças de catálogo de locale; o comparador usa os
  campos comuns pertinentes e não os renomeados. Não filtra constraints/typmods
  para fazer o schema passar. Não modifica dumps para restaurar em PG16.
- [Railway healthchecks](https://docs.railway.com/deployments/healthchecks) e
  [Vercel Git](https://vercel.com/docs/project-configuration/git-configuration):
  semântica de gates e de desativação; estado remoto não foi consultado neste lote.
