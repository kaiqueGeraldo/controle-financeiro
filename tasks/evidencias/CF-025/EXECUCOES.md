# Execuções e reprodução CF-025

Raiz inicial846c64c, staging vazio, somente README raiz alheio. Regras/tarefa,
SDD e dependências lidos antes de edição. Nenhum serviço externo/banco real é
fallback. Comandos foram executados sequencialmente no mesmo target; nenhum
Maven simultâneo. Logs abaixo guardam as primeiras falhas, sem retries ocultos.

| Log | Código / resultado |
|---|---|
| before-sandbox.log | exit1, compilador impedido de acessar JAR no cache Maven; nenhum teste/regressão executado |
| before-fixture-error.log | exit1,3 erros; fixture sem openingRecordedAt viola constraint de abertura; erro de fixture, não regressão |
| before-instrumentation-initial.log | exit1,4 testes/1 falha/0 erros/skips; reorder4 SELECTs onde exige1; SQL nativo maiúsculo foi classificado incorretamente na medição inicial |
| before.log | exit1,4 testes/1 falha/0 erros/skips; benchmark com classificação corrigida, red causal de reorder (4≠1); restantes passam |
| after.log | exit0,7/7,0 falhas/erros/skips; mesmos quatro testes + atomicidade/dias e dois casos de lock/rollback |
| backend-verify-connections-error.log | exit1,396/0 falhas/9 erros/0 skips; TemporalCompatibility falha ao inicializar contexto por PostgreSQL `too many clients already`; CF-0257/7 e demais assertions sem falha |
| backend-verify-final.log | exit0,396/396,0 falhas/erros/skips, verify/JAR; CF-0257/7 e TemporalCompatibility9/9 |

O CSV `metrics-instrumentation-initial.csv` é **histórico inválido para contagem
de SELECT/escritas dos relatórios**, não comparador publicado: consultas
SELECT/WITH maiúsculas caíam na coluna writes, e seus planos não eram capturados.
O parser foi corrigido sem alterar expected/regra/produto e toda a medição
anterior foi repetida **antes** da mudança LAZY. Usar metrics-before.csv e
metrics-after.csv, obtidos pelo mesmo método corrigido. Logs preservam todos
os resultados; testes de regressão não foram flexibilizados.

Gate ampliado: o novo contexto/pool ficava retido no cache de testes, adicionando
conexões à suíte existente. O wrapper de DataSource passou a preservar
AutoCloseable e a classe CF-025 ganhou DirtiesContext AFTER_CLASS para liberar
seu pool. Nenhuma alteração na configuração global/pool de produção, limite
do PostgreSQL, número de assertions, timeout, retry ou exclusão de teste.
O contexto próprio agora tem ciclo de vida explícito. Reexecução final396/396
passou, incluindo os nove casos temporais. Não confundir a primeira execução396/9
com um gate aprovado. Comparação dirigida usa o run after anterior ao ajuste de
lifecycle; metrics-gate-final.csv/plans-gate-final.txt preservam o novo run final.

## Comandos

Executados da raiz, usando wrapper/JDK já presentes. Sandbox inicial impediu
acesso ao cache; execuções reais usaram aprovação automática de Maven/Docker.
Um comando somente de leitura do digest Docker também precisou execução fora
do sandbox. Não houve rejeição de aprovação automática pendente.

```powershell
$env:JAVA_HOME=(Resolve-Path 'controle-financeiro-backend/target/temurin21/jdk-21.0.12.1+1').Path
$env:PATH=$env:JAVA_HOME+'/bin;C:/Users/Aluga.com/AppData/Local/Programs/DockerDesktop/resources/bin;'+$env:PATH

# Baseline executado antes do LAZY: phase before-corrected, produto846c64c.
# Testes/fundação CF-025 presentes; somente o caso reorder falha pelo defeito.
& controle-financeiro-backend/mvnw.cmd -f controle-financeiro-backend/pom.xml --batch-mode '-Dmaven.repo.local=C:/Users/Aluga.com/.m2/repository' '-Dtest=Cf025QueryPerformanceIntegrationTest' '-Dcf025.phase=before-corrected' '-Duser.timezone=UTC' test

# Correção e7 casos: logs/after.log; fonte ainda sem as duas mudanças de disposal.
& controle-financeiro-backend/mvnw.cmd -f controle-financeiro-backend/pom.xml --batch-mode '-Dmaven.repo.local=C:/Users/Aluga.com/.m2/repository' '-Dtest=Cf025QueryPerformanceIntegrationTest' '-Dcf025.phase=after' '-Duser.timezone=UTC' test

# Gate completo: primeira execução phase gate; fonte final phase gate-final.
# Exclusões são somente os mesmos cinco orquestradores de browser da CF-024.
& controle-financeiro-backend/mvnw.cmd -f controle-financeiro-backend/pom.xml --batch-mode '-Dmaven.repo.local=C:/Users/Aluga.com/.m2/repository' '-Dtest=*,!UserIsolationBrowserIntegrationTest,!HabitBrowserIntegrationTest,!IntegratedMilestoneBrowserReviewTest,!MilestoneRemediationBrowserTest,!TemporalBrowserApiPostgresE2E' '-Dcf025.phase=gate-final' '-Duser.timezone=UTC' verify

# Evidência de fontes/bytes, normalização LF para comparar Git no Windows.
node tasks/evidencias/CF-025/checkpoint.cjs
node tasks/evidencias/CF-025/checkpoint.cjs --check-commit
node tasks/evidencias/CF-025/sanitize-evidence.cjs
git diff --check
```

Cada phase escreve CSV/planos em `controle-financeiro-backend/target/cf025-<phase>`;
escolher nome novo ao reproduzir para preservar artefatos históricos. O comando
de baseline executado no fonte final ficará verde: para reproduzir o vermelho,
usar cópia isolada da base846c64c com os três novos arquivos CF-025 de teste e
os mesmos helpers/POM integrados, ou restaurar somente FetchType.EAGER numa
cópia isolada do backend final. Conservar testes/expected, não editar o checkout
ou o README alheio. Essa é instrução de reprodução, não uma mutação adicional
alegadamente executada nesta sessão.

`checkpoint-measurements.json` captura303 fontes/POM depois do run after e antes
de DirtiesContext/AutoCloseable. `checkpoint.json` captura os303 fontes finais.
As únicas diferenças entre esses checkpoints são as duas mudanças de lifecycle
da infraestrutura de teste, sem mudança no método de medição, fixture, assertions
ou produto. Hashes originais/publicados dos logs ficam em evidence-sha256.json;
atributos locais preservam bytes dos logs/CSV/planos no Git. Alguns diagnósticos
Java vieram com substituições de codificação do Windows e não foram reconstruídos.
Imagem PostgreSQL usada identificada pelo digest em postgres-image.txt.

Produto/testes commit65ec14e, conferidos por303 hashes de fonte/POM normalizados
em LF. JAR gerado pelo gate final:86.049.232 bytes; SHA-256 registrado em
jar-sha256.txt. Artefato não versionado; posteriores builds podem substituí-lo
em target. Primeiro commit contém produto/testes/oráculos e início da tarefa;
segundo commit contém evidências e atualização final em_revisao. README alheio
continua com o SHA inicial e fora do staging.

Não somar4/7/396 ou repetições/métricas como testes distintos. Novo browser/E2E
não executado; os gates incluem contratos HTTP reais/ORM/PostgreSQL e os
consumidores existentes de hábitos/calendário/relatórios/concorrência/posse,
sem simular sucesso por mocks de regra financeira.
