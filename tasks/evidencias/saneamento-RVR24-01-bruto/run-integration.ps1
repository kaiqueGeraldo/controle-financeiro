param([string]$RunName='integration')
$ErrorActionPreference='Stop'
if($RunName -notmatch '^[a-z0-9-]+$'){throw 'Nome inválido'}
$taskRoot=(Resolve-Path (Join-Path $PSScriptRoot '../../..')).Path
$taskBackend=Join-Path $taskRoot 'controle-financeiro-backend'
$taskFrontend=Join-Path $taskRoot 'controle-financeiro-frontend'
$taskCopy=Join-Path ([IO.Path]::GetTempPath()) ('rv24-residual-'+[guid]::NewGuid().ToString('N'))
$taskEvidence=Join-Path $PSScriptRoot $RunName
if(Test-Path -LiteralPath $taskEvidence){throw 'Preservar execução anterior'}
New-Item -ItemType Directory -Path $taskCopy,$taskEvidence | Out-Null
foreach($part in @('src','.mvn','pom.xml','mvnw.cmd')){Copy-Item -LiteralPath (Join-Path $taskBackend $part) -Destination $taskCopy -Recurse}
# Keep all shared frontend sources/config/tests untouched. The existing independent spec runs externally.
$taskBrowser=Join-Path $taskCopy 'browser'
New-Item -ItemType Directory -Path $taskBrowser | Out-Null
New-Item -ItemType Junction -Path (Join-Path $taskBrowser 'node_modules') -Target (Join-Path $taskFrontend 'node_modules') | Out-Null
$taskSpec=[IO.File]::ReadAllText((Join-Path $taskRoot 'tasks/evidencias/saneamento-RVR24-01-bruto/gross.integrated.spec.ts'))
$taskSpec=$taskSpec.Replace('"./support/synthetic-auth"','"'+(Join-Path $taskFrontend 'tests/e2e/support/synthetic-auth').Replace('\','/')+'"')
[IO.File]::WriteAllText((Join-Path $taskBrowser 'cf027.spec.ts'),$taskSpec)
[IO.File]::WriteAllText((Join-Path $taskEvidence 'effective-browser.spec.ts'),$taskSpec)
$taskConfig='import {defineConfig} from "@playwright/test"; import base from "'+(Join-Path $taskFrontend 'tests/e2e/playwright.rv24.config').Replace('\','/')+'"; export default defineConfig({...base,testDir:".",testMatch:["**/cf027.spec.ts"],outputDir:"'+(Join-Path $taskEvidence 'browser-artifacts').Replace('\','/')+'",webServer:{...base.webServer,cwd:"'+$taskFrontend.Replace('\','/')+'"}});'
[IO.File]::WriteAllText((Join-Path $taskBrowser 'cf027.config.ts'),$taskConfig)
[IO.File]::WriteAllText((Join-Path $taskEvidence 'effective-browser.config.ts'),$taskConfig)
$taskRunner=Join-Path $taskCopy 'src/test/java/com/controlefinanceiro/api/Rv24CreationBrowserIntegrationTest.java'
$taskRunnerText=[IO.File]::ReadAllText((Join-Path $PSScriptRoot 'Rv24CreationBrowserIntegrationTest.java'))
$taskRunnerText=$taskRunnerText.Replace('Path.of(System.getProperty("user.dir")).toAbsolutePath().resolveSibling("controle-financeiro-frontend")','Path.of("'+$taskFrontend.Replace('\','/')+'")').Replace('tests/e2e/playwright.rv24.config.ts',(Join-Path $taskBrowser 'cf027.config.ts').Replace('\','/'))
[IO.File]::WriteAllText($taskRunner,$taskRunnerText)
$taskSelection='Rv24CreationBrowserIntegrationTest'
[IO.File]::WriteAllText((Join-Path $taskEvidence 'selection.txt'),$taskSelection)
[IO.File]::WriteAllText((Join-Path $taskEvidence 'copy-path.txt'),$taskCopy)
$env:JAVA_HOME=([IO.File]::ReadAllText((Join-Path $taskRoot 'tasks/evidencias/revisao-CF-025-CF-027-RV24/runtime-path.txt'))).Trim()
$env:PATH=$env:JAVA_HOME+'/bin;C:/Users/Aluga.com/AppData/Local/Programs/DockerDesktop/resources/bin;'+$env:PATH
& (Join-Path $taskCopy 'mvnw.cmd') -f (Join-Path $taskCopy 'pom.xml') --batch-mode '-Dmaven.repo.local=C:/Users/Aluga.com/.m2/repository' ('-Dtest='+$taskSelection) ('-Drv24.run=../saneamento-RVR24-01-bruto/'+$RunName+'/browser') test *> (Join-Path $taskEvidence 'backend-verify.log')
$taskExit=$LASTEXITCODE
$taskSuites=@(Get-ChildItem -LiteralPath (Join-Path $taskCopy 'target/surefire-reports') -Filter 'TEST-*.xml' | ForEach-Object {
 [xml]$report=Get-Content -LiteralPath $_.FullName -Raw
 # Do not publish full Spring system properties / synthetic credentials from reports.
 [pscustomobject]@{name=$report.testsuite.name;tests=[int]$report.testsuite.tests;failures=[int]$report.testsuite.failures;errors=[int]$report.testsuite.errors;skipped=[int]$report.testsuite.skipped}
})
[pscustomobject]@{maven_exit=$taskExit;copy=$taskCopy;suites=$taskSuites} | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath (Join-Path $taskEvidence 'result.json')
Get-Content -LiteralPath (Join-Path $taskEvidence 'backend-verify.log') -Tail 35
exit $taskExit
