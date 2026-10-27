# Comandos, resultados e reprodução

Raiz: C:/Users/Aluga.com/Documents/Projetos/pessoal/controle-financeiro.
Runtimes **novos e preservados**:
`../controle-financeiro-runtimes/preparacao-adocao/revisao-20261026-01` (testes),
`revisao-20261026-02` (parser). Nunca reexecutar em cima deles: escolher novos
nomes para uma nova revisão. Não carregar .env ou variáveis de banco real.

## Preparação e fatos Git

branch --show-current, rev-parse dos três commits, status --porcelain=v2,
diff cached e merge-base --is-ancestor conferiram branch/HEAD/ancestralidade e
staging vazio antes da revisão. Somente README.md estava modificado. O diff
46b85ee..6f70a87 tem212 arquivos; produtor24844b5..6f70a87 não muda inputs de
produto/CI. Hashes completos/bytes constam em preservacao-inicial/final.json.

```powershell
node tasks/evidencias/revisao-preparacao-local-adocao/preservar.mjs inicial
node tasks/evidencias/preparacao-local-adocao/prepare.mjs $taskRuntime
```

prepare foi invocado uma vez para cada runtime novo;831 inputs e29 históricos
conferidos. JDK explícito de leitura:
`controle-financeiro-backend/target/temurin21/jdk-21.0.12.1+1`.
JAVA_HOME/PATH foram definidos por sessão; Java25 do host não foi modificado.
Wrapper Maven3.9.12, Node24.18.0, npm11.16.0, Docker29.6.2. Versões de bibliotecas
estão no JAR verificado e no toolchain anterior. Native Java21.0.12.1+1;
imagem21.0.12+8.

## Seleções executadas

Invocações Maven abaixo foram na cópia backend. Todos usaram --batch-mode,
-Duser.timezone=UTC, reportsDirectory novo e sem retry/skipTests. Os comandos
literais das contraprovas estão nos recibos; logs/hash por classe em resultados.json.

| Log / comando pertinente | Resultado |
|---|---|
| pg17-independent.log: primeira tentativa, JAVA_HOME relativo calculado do cwd errado | Wrapper recusou antes de Maven/testes; zero testes. Log mantido |
| pg17-independent-02.log: major17, test=TemporalCompatibilityIntegrationTest,EmailMaintenanceTest,HealthControllerTest,Cf017ManifestTest,Cf017OriginalFindingsTest,Cf017PreflightTest,Cf017RestoreTest,EmptyDatabaseMigrationIntegrationTest,GoalHistoryUpgradeTest,LegacyDatabaseMigrationIntegrationTest,SchedulingBoundaryTest; verify | exit0,74/0/0/0;6min51s |
| startup-diagnostic.log: major17, test=StartupDiagnosticTest; preparation.jar=p05/package/api.jar; preparation.image=ID8c102183…; review.runtime=$taskRuntime; test | exit0,1/0/0/0; dois processos observados;2min05s |
| original40.log: major17, test=AdoptionRuntimeTest; preparation.jar=p05/package/api.jar; test | exit1,17 testes/3 falhas/0 erros/0 skips;5min58s |
| amostrar-startup.ps1 -Runtime $taskRuntime, ao lado do controle original |8 tentativas de dump,6 válidas;2 attach falhos; script terminou e não deixou observador ativo |
| npm ci --offline --ignore-scripts --no-audit --no-fund na cópia frontend | exit0;564 pacotes;7min; sobrepôs parte do original40, sem atribuir causalidade |
| npm run test:component -- tests/component/bff-contract.test.tsx --reporter=json --outputFile=$taskRuntime/bff.json | exit0,14 testes, zero falhas/pendentes; upstream loopback inutilizado e env development; preview alterado explicitamente nos casos |
| counterproofs.mjs $taskRuntime ID8c102183… | preflight detectado; filtro parou antes da escrita; gerador exit1 Missing causal effect; não houve resume; todas fontes tocadas restauradas |
| pg16-independent.log: major16, test=Cf017ManifestTest,Cf017OriginalFindingsTest,EmptyDatabaseMigrationIntegrationTest,LegacyDatabaseMigrationIntegrationTest,OperationBoundaryProbeTest; test | exit0,15/0/0/0;2min35s; servidor/clientes16.15 |
| contraprovas-dirigidas.mjs $taskRuntime | quatro mutantes exit1 com assertion e efeito; witness4/0/0/0 exit0;831 inputs restaurados |
| HqlParserProbe, javac21 contra classes/libs extraídos do p05, java -Xmx384m |76 queries, exit0;4,746s de processo; sem contexto/DB |
| HqlParserProbe via PropertiesLauncher com loader.path do probe | Mesmas76, exit0;8,187s; sem Spring/DB |
| hql-frio.mjs $taskRuntime2 | Cinco maiores queries em JVMs novas, prazo30s por subprocesso; todos exit0; sem DB/contexto |
| verificar-pacote.ps1 e imagem.mjs $taskRuntime |22 recursos, SHA do JAR e SHA embarcado iguais; comandos locais de imagem com network none e entrypoint de inspeção |
| pacote-contraprova.mjs $taskRuntime | Uma cópia adulterada divergiu; byte restaurado, cópia/original voltaram ao SHA esperado |
| auditar-resume.mjs $taskRuntime | Predicado de resume pula writer sem efeito causal; somente leitura, fonte/log vinculados por SHA |
| coletar.mjs $taskRuntime $taskRuntime2 |68 arquivos duráveis, hashes original/coletado; contagens individuais sem somar casos sobrepostos |

Os probes Java foram copiados somente à exportação descartável ou compilados
fora do checkout de produto. No repositório, permanecem como fonte de evidência.
A correção de JAVA_HOME foi preparação de ambiente e não um retry de teste que
falhou. A falha do gerador original ficou preservada e suas outras três mutações
não foram implicitamente declaradas executadas. Os novos probes estreitos são
verificações independentes e não substituem o contrato de processo/startup.

Para reproduzir as contraprovas estreitas em execução nova, copiar
OperationBoundaryProbeTest.java à package de testes migration da exportação,
executar primeiro seu controle positivo e SchedulingBoundaryTest, e só então
contraprovas-dirigidas.mjs. O script exige hash restaurado e mantém relatórios
próprios para cada caso. A prova de guard usa contexto mínimo com supplier Flyway
real: não é auto-configuração completa do Boot; o teste original do JAR cobre
a fronteira completa, e o probe acrescenta observabilidade de16 migrations.

## Remoto e auditoria dos artefatos

Railway list-projects teve solicitação inicial de autenticação, aceita; nova
consulta retornou o projeto. describe-environment, describe-service e deployments
foram leituras. Vercel get-project/env/deployment e duas páginas de deployments,
GitHub main e painéis completaram os campos omitidos. Nenhum valor de token/senha
foi emitido. JDBC/FRONT_URL atuais permaneceram não reconfirmados após falhas de
interação; a UI permaneceu mascarada no estado observado. Nenhuma ação Save,
Deploy, Enable, Restart, SQL, CI dispatch, push ou merge foi executada.

Falha do observador de URL: URL não existe no V8 de functions.exec; o primeiro
false era erro de observação. Recibo original preservado, seguido de comparação
exata com o destino esperado em remoto-destino-corrigido.json. Não foi uma
correção remota nem uma prova de que a URL estava errada.

Coleta guarda originais completos fora do Git e cópias sanitizadas com hashes
separados. Não editar cópia para obter whitespace verde: logs CRLF/espaços
produzem avisos no diff textual, mantidos como dados. Foi inspecionado o staging
explícito das provas; nenhum arquivo fora deste diretório, nem README raiz,
entrou no primeiro commit. Parecer e estados ficam em commit local separado.
Nenhum teste de produto foi alterado para aceitar o candidato.
