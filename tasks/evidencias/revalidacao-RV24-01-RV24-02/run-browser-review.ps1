param([string]$RunName='browser-dom',[string]$Grep='')
$ErrorActionPreference='Stop'
$reviewRoot=(Resolve-Path (Join-Path $PSScriptRoot '../../..')).Path
$reviewCopy=Get-Content -LiteralPath (Join-Path $PSScriptRoot 'copy-path.txt') -Raw
$reviewFrontend=Join-Path $reviewRoot 'controle-financeiro-frontend'
$reviewConfig=Join-Path $reviewFrontend 'tests/e2e/playwright.rv24-independent.config.ts'
$reviewSpec=Join-Path $reviewFrontend 'tests/e2e/rv24-independent.integrated.spec.ts'
if((Test-Path $reviewConfig) -or (Test-Path $reviewSpec) -or (Test-Path (Join-Path $PSScriptRoot $RunName))){throw 'Preservar arquivos existentes'}
$reviewRunner=Join-Path $reviewCopy 'src/test/java/com/controlefinanceiro/api/Rv24CreationBrowserIntegrationTest.java'
$reviewRunnerText=[IO.File]::ReadAllText((Join-Path $reviewRoot 'controle-financeiro-backend/src/test/java/com/controlefinanceiro/api/Rv24CreationBrowserIntegrationTest.java'))
$reviewRunnerText=$reviewRunnerText.Replace('Path.of(System.getProperty("user.dir")).toAbsolutePath().resolveSibling("controle-financeiro-frontend")','Path.of("'+$reviewFrontend.Replace('\','/')+'")').Replace('tests/e2e/playwright.rv24.config.ts','tests/e2e/playwright.rv24-independent.config.ts')
if($Grep) {
 if($Grep -ne 'RV24 transaction before'){throw 'Recorte independente não definido'}
 $reviewRunnerText=$reviewRunnerText.Replace('assertThat(persistedAccounts).hasSize(6)','assertThat(persistedAccounts).hasSize(1)').Replace('assertThat(counts).hasSize(12)','assertThat(counts).hasSize(2)').Replace('namespace+"-%")).isEqualTo(6)','namespace+"-%")).isEqualTo(0)').Replace('Six investment operations; exact replay caused no extra rows.','Isolated transaction-before: two legitimate transaction intents, zero investment operations.')
}
[IO.File]::WriteAllText($reviewRunner,$reviewRunnerText)
$reviewSpecText=[IO.File]::ReadAllText((Join-Path $reviewFrontend 'tests/e2e/rv24-creation.integrated.spec.ts')).Replace("`r`n","`n")
$reviewSpecText=$reviewSpecText.Replace('expect(posts).toBe(1);'+"`n"+'    const identity', 'expect(posts).toBe(1);'+"`n"+'    await page.screenshot({path:join(process.env.CF_REVIEW_EVIDENCE!,`${kind}-${mode}-pending.png`),fullPage:true});'+"`n"+'    const identity')
$reviewCapture='    await page.screenshot({ path: join(process.env.CF_REVIEW_EVIDENCE!, `${kind}-${mode}.png`), fullPage: true });'
$reviewVisible=@'
    if(kind === "transaction") {
      await expect(page.getByRole("button", {name:"Lançar",exact:true})).toBeVisible();
      await expect(page.getByText(tag,{exact:true}).first()).toBeVisible();
    } else await expect(page.getByText("RV24",{exact:true})).toBeVisible();
'@
if(-not $reviewSpecText.Contains($reviewCapture)){throw 'Ponto da captura mudou'}
$reviewSpecText=$reviewSpecText.Replace($reviewCapture,$reviewVisible+"`n"+$reviewCapture)
$reviewConfigText='import {defineConfig} from "@playwright/test"; import base from "./playwright.rv24.config"; export default defineConfig({...base,testMatch:["**/rv24-independent.integrated.spec.ts"],outputDir:"../artifacts/rv24-independent"});'
try {
 [IO.File]::WriteAllText($reviewSpec,$reviewSpecText)
 [IO.File]::WriteAllText($reviewConfig,$reviewConfigText)
 if(-not(Test-Path (Join-Path $PSScriptRoot 'browser-review.spec.ts'))){[IO.File]::WriteAllText((Join-Path $PSScriptRoot 'browser-review.spec.ts'),$reviewSpecText)}
 [IO.File]::WriteAllText((Join-Path $PSScriptRoot ($RunName+'-spec.ts')),$reviewSpecText)
 $env:JAVA_HOME=(Resolve-Path (Join-Path $reviewRoot 'controle-financeiro-backend/target/temurin21/jdk-21.0.12.1+1')).Path
 $env:PATH=$env:JAVA_HOME+'/bin;C:/Users/Aluga.com/AppData/Local/Programs/DockerDesktop/resources/bin;'+$env:PATH
 $reviewArgs=@('-f',(Join-Path $reviewCopy 'pom.xml'),'--batch-mode','-Dmaven.repo.local=C:/Users/Aluga.com/.m2/repository','-Dtest=Rv24CreationBrowserIntegrationTest',('-Drv24.run=../revalidacao-RV24-01-RV24-02/'+$RunName))
 if($Grep){$reviewArgs+=('-Dreview.grep='+$Grep)}
 & (Join-Path $reviewCopy 'mvnw.cmd') @reviewArgs test *> (Join-Path $PSScriptRoot ($RunName+'-backend.log'))
 $reviewExit=$LASTEXITCODE
} finally {
 foreach($reviewTemp in @($reviewConfig,$reviewSpec)){if(Test-Path -LiteralPath $reviewTemp){Remove-Item -LiteralPath $reviewTemp}}
}
exit $reviewExit
