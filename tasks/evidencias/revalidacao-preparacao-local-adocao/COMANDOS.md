# Comandos e condições de reprodução

Executados localmente em27/10/2026, PowerShell/Windows, JDK21 explícito. Nenhum
skip/retry ou timeout ampliado; surefire rerunFailingTestsCount=0. Docker Desktop
local e PostgreSQL sintético pelo Testcontainers, sem fallback externo.

```powershell
$env:JAVA_HOME = 'C:\Users\Aluga.com\Documents\Projetos\pessoal\controle-financeiro\controle-financeiro-backend\target\temurin21\jdk-21.0.12.1+1'
$env:PATH = "$env:JAVA_HOME\bin;C:\Users\Aluga.com\AppData\Local\Programs\DockerDesktop\resources\bin;$env:PATH"
# Para reproduzir, escolher execução NOVA; não usar a execução preservada01.
$taskRun = [IO.Path]::GetFullPath('../controle-financeiro-runtimes/preparacao-adocao/revalidacao-NOVA')
node tasks/evidencias/preparacao-local-adocao/prepare.mjs $taskRun
node tasks/evidencias/revalidacao-preparacao-local-adocao/revalidar-resume.mjs $taskRun
$env:REVALIDATION_RUNTIME = $taskRun
node --test --test-reporter=tap tasks/evidencias/revalidacao-preparacao-local-adocao/checkpoint-independente.test.mjs
node tasks/evidencias/revalidacao-preparacao-local-adocao/revalidar-porta.mjs $taskRun
./tasks/evidencias/revalidacao-preparacao-local-adocao/quiescencia-orfao.ps1 $taskRun
./tasks/evidencias/revalidacao-preparacao-local-adocao/revalidar-real.ps1 $taskRun
```

Rodar sequencialmente. A checagem conservadora de Java/adoption e containers
bloqueia outra preparação simultânea. revalidar-porta registra exit de cada
invocação; seu exit final não substitui conferir XMLs. Nesta execução, os probes
adicionais de reuso nativo imediato falharam mesmo com contratos originais verdes.
quiescencia-orfao confirma o defeito residual e para apenas os PIDs próprios;
não é instrução de recuperação de outra execução nem garantia contra qualquer
forma de interrupção do próprio probe.

revalidar-resume mantém critérios do fixture anterior, alterando somente a
allowlist de pasta saneamento→revalidacao. O runner antigo vem do blob07c3963 e
seu SHA55849ecb…9292 confere; o corrigido é copiado byte idêntico. A fronteira
spawnSync recebe falha sintética; não há DB/Docker real nessa reprodução.
O observador independente original fica byte idêntico; apenas fs.writeFileSync
de sua saída histórica é redirecionado por preload. Logs e hashes documentam isso.

O diagnóstico de transporte usou NativeTransportDiagnosticTest.java copiado só
ao backend exportado, com as mesmas flags JAR/major17 e seleção explícita:

```powershell
# A partir do backend exportado, após copiar o probe e definir os caminhos absolutos:
./mvnw.cmd --batch-mode '-Duser.timezone=UTC' '-Dcf017.postgres.major=17' `
  '-Dtest=NativeTransportDiagnosticTest' "-Drevalidation.runtime=$taskRun" `
  '-Dpreparation.jar=C:\Users\Aluga.com\Documents\Projetos\pessoal\controle-financeiro-runtimes\preparacao-adocao\p05\package\api.jar' `
  "-Dcf034.reportsDirectory=$taskRun/transport-diagnostic-reports" test
```

Primeira versão falhou ao ler log não UTF-8 depois da observação; v1 está preservada.
A segunda lê somente o marcador ASCII via ISO-8859-1 e salva a observação antes
da comparação de portas antigas. Não afrouxa o probe original de bind nem gate40s.
Consulta TCP antecede o novo bind: “immediateRebind” nesse JSON é após essa
consulta, portanto não mede a mesma janela imediata dos probes falhos.

Auditoria da entrega, sem novos testes:

```powershell
node tasks/evidencias/revalidacao-preparacao-local-adocao/auditar.mjs
```

preservar.mjs inicial/final, auditar-base.mjs e coletar.mjs foram executados uma
vez para seus recibos desta entrega, recusando sobrescrita. Encurtar-coleta moveu
três cópias novas após a recusa de git add por caminho longo; o coletor já incorpora
o mesmo mapeamento determinístico. Originais não foram movidos. Não repetir esses
comandos contra o diretório de evidências preenchido para simular uma nova revisão.

Commits locais: provas em af73bbd8fc6821a1e084dd1bcfdd436212811d82; parecer/estados
no commit seguinte, identificado na entrega. Staging explícito, auditoria SHA dos
93 blobs coletados, JSON/JS válidos e diff check de fontes/documentação. Logs
brutos conservam CRLF/espaços sob -text; não foram reformados para obter verde.
