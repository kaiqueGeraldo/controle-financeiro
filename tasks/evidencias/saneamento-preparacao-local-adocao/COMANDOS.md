# Execução e reprodução

PowerShell na raiz do repositório. Usar nomes novos sob
../controle-financeiro-runtimes/preparacao-adocao/saneamento-*. Não reexecutar
sobre as execuções preservadas; scripts recusam sobrescrever vários recibos.
JAVA_HOME explícito de leitura, sem alterar o Java25 do host:

```powershell
$env:JAVA_HOME = (Resolve-Path -LiteralPath 'controle-financeiro-backend/target/temurin21/jdk-21.0.12.1+1').Path
$env:PATH = "$env:JAVA_HOME/bin;$env:PATH"
```

## Resume

Original pelo blob07c3963; depois runner atual. Fault injection na fronteira de
ferramentas, sem banco/serviço real. A primeira reprodução02 foi feita antes de
editar o runner; a reprodução Git confere o mesmo SHA55849ecb…9292.

```powershell
node tasks/evidencias/saneamento-preparacao-local-adocao/reproduzir-resume.mjs ../controle-financeiro-runtimes/preparacao-adocao/saneamento-revisao-original
node tasks/evidencias/saneamento-preparacao-local-adocao/reproduzir-resume.mjs ../controle-financeiro-runtimes/preparacao-adocao/saneamento-revisao-corrigido fixed
node tasks/evidencias/saneamento-preparacao-local-adocao/contraprova-resume.mjs ../controle-financeiro-runtimes/preparacao-adocao/saneamento-revisao-mutante
```

Testes do mecanismo: diretório de fixtures explícito dentro de execução nova.
Não omitir a variável para repetir o erro de permissão do sandbox temporário.

```powershell
$env:RESUME_TEST_RUNTIME = [IO.Path]::GetFullPath('../controle-financeiro-runtimes/preparacao-adocao/saneamento-revisao-unit/fixtures')
node --test --test-reporter=tap tasks/evidencias/preparacao-local-adocao/counterproof-checkpoint.test.mjs
```

Prova causal real e reutilização, em runtime novo exportado. Seleção integra a
identidade; esses comandos não certificam o gate completo de cinco contraprovas:

```powershell
$taskRun = [IO.Path]::GetFullPath('../controle-financeiro-runtimes/preparacao-adocao/saneamento-revisao-real')
node tasks/evidencias/preparacao-local-adocao/prepare.mjs $taskRun
$taskImage = 'sha256:8c10218386234f364e264e898fa77e40cd56a0236f4eeab245cf6bb97f568ef1'
node tasks/evidencias/preparacao-local-adocao/counterproofs.mjs $taskRun $taskImage only=preflight-hides-missing-constraint
node tasks/evidencias/preparacao-local-adocao/counterproofs.mjs $taskRun $taskImage resume only=preflight-hides-missing-constraint
node tasks/evidencias/preparacao-local-adocao/counterproofs.mjs $taskRun $taskImage audit only=preflight-hides-missing-constraint
```

verificar-quiescencia.ps1 recebe runtime novo já exportado. Cria helper Java
inofensivo em diretório distinto, comprova bloqueio antes de Maven e encerra apenas
o PID criado. Depois continua/reutiliza a prova PG17 e faz audit; foi executado em
saneamento-quiescencia-01. A detecção conservadora também reconhece JVM adoption
que usa JAR compartilhado e não contém o caminho do runtime no comando.

O modo completo padrão ainda executa os cinco casos e witness restaurado,
propagando qualquer falha. Audit não executa testes. Copiar uma coleta sanitizada
para simular checkpoint não é um procedimento suportado.

## Startup

saneamento-startup-01 foi exportado antes da alteração do harness. Nele rodaram,
sem alteração de AdoptionRuntimeTest, os três métodos listados em STARTUP.md,
usando -Dpreparation.jar=p05/package/api.jar, major17 e reports originais separados.
PortRaceReproductionTest foi copiado somente à exportação antiga antes da correção;
não espera reproduzir o bug com o harness já corrigido.

Os demais comandos Maven foram na pasta backend exportada, sempre --batch-mode,
-Duser.timezone=UTC e -Dcf034.reportsDirectory novo, sem clean/skipTests/retry:

| Execução | Seleção / configuração |
|---|---|
| original-three.log | AdoptionRuntimeTest#releasedProcessPreservesAuthOwnershipAndEffectsThenCanFreezeAgain+readinessFailsWithinBudgetWhenDatabaseStopsAndRecoversWithoutRestart+enabledJobsActuallyRunButDisabledJobsLeaveNoLockOrSideEffect; major17; JAR p05 |
| port-before.log | PortRaceReproductionTest; major17; JAR p05 |
| timeline.log | StartupTimelineTest; major17; preparation.jar, preparation.image e diagnostic.runtime explícitos |
| portas-01/pg17.log | AdoptionPortAllocationTest mais os três métodos originais; major17; JAR p05 |
| portas-01/pg16.log | AdoptionPortAllocationTest; major16; JAR p05 |
| portas-01/image.log | Os três métodos originais; major17; ID da imagem p05 |
| port-mutante-01/port-mutant.log | AdoptionPortAllocationTest com alocador antigo isolado; major17; JAR p05; fonte restaurada |

preparar-diagnostico.ps1 compila agent externo com Byte Buddy1.17.8 já no cache;
não altera pom/dependências do produto. StartupTimelineTest é copiado somente à
exportação. Usar -Ddiagnostic.runtime=$taskRun. Dois processos sequenciais,90s
diagnósticos/40s registrados, sem aceitar automaticamente o wrapper JUnit.
O script não faz flush nativo antes do destroy; limitação preservada em STARTUP.md.
Reprodução nova que acrescente JFR.dump deve identificar o novo observador.

JFR Linux foi extraído com ferramentas do mesmo JDK:

```powershell
& "$env:JAVA_HOME/bin/jfr.exe" print --json --stack-depth 64 --events 'jdk.ExecutionSample,jdk.CPULoad,jdk.GarbageCollection,jdk.ClassLoadingStatistics' "$taskRun/agent/image.jfr"
& "$env:JAVA_HOME/bin/jfr.exe" print --json --events 'jdk.ThreadPark,jdk.SocketRead,jdk.FileRead,jdk.ClassLoad,jdk.Compilation,jdk.ObjectAllocationSample' "$taskRun/agent/image.jfr"
```

Saídas foram gravadas como jfr-selected-depth64.json e jfr-detail.json;
analisar-startup.mjs $taskRun produz recibo final sem sobrescrever o anterior.
Raw JFR/agent/classes não são versionados. contraprova-porta.ps1 recebe runtime
novo já exportado e só altera a cópia do harness, com restauração em finally.

## Coleta/preservação

preservar.mjs inicial/final verifica os bytes protegidos sem restaurar divergências.
coletar.mjs é específico destas execuções, reconcilia JUnit/TAP e compara832 inputs
com o HEAD de código b7b3be7 e831 fontes históricas p05 com seu manifesto. Não é
runner genérico de CI. Nenhum Maven verify ou empacotamento com skipTests foi
contado como teste neste saneamento. JAR/imagem antigos continuam com sua origem.
