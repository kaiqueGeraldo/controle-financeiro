param([string]$RunName = ('independent-' + [guid]::NewGuid().ToString('N')))
$ErrorActionPreference = 'Stop'
$reviewRoot = (Resolve-Path (Join-Path $PSScriptRoot '../../..')).Path
$reviewBackend = Join-Path $reviewRoot 'controle-financeiro-backend'
$reviewCopy = Join-Path $reviewBackend ('target/review-cf024-final-' + [guid]::NewGuid().ToString('N'))
$reviewOutput = Join-Path $PSScriptRoot $RunName
if (Test-Path -LiteralPath $reviewOutput) { throw 'O nome de execução já existe; preservar evidência.' }
New-Item -ItemType Directory -Path $reviewCopy,$reviewOutput | Out-Null
foreach ($reviewPart in @('src','.mvn','pom.xml','mvnw.cmd')) {
    Copy-Item -LiteralPath (Join-Path $reviewBackend $reviewPart) -Destination $reviewCopy -Recurse
}
foreach ($reviewProbe in @('Cf024IndependentReviewTest.java','Cf024V12UpgradeReviewTest.java')) {
    Copy-Item -LiteralPath (Join-Path $PSScriptRoot ('probes/'+$reviewProbe)) -Destination (Join-Path $reviewCopy 'src/test/java/com/controlefinanceiro/api/service')
}
$env:JAVA_HOME = (Resolve-Path (Join-Path $reviewBackend 'target/temurin21/jdk-21.0.12.1+1')).Path
$env:PATH = $env:JAVA_HOME + '/bin;C:/Users/Aluga.com/AppData/Local/Programs/DockerDesktop/resources/bin;' + $env:PATH
$reviewSelection = 'Cf024IndependentReviewTest#review*,Cf024V12UpgradeReviewTest,MilestoneInvestmentCorrectionTest'
& (Join-Path $reviewCopy 'mvnw.cmd') -f (Join-Path $reviewCopy 'pom.xml') --batch-mode '-Dmaven.repo.local=C:/Users/Aluga.com/.m2/repository' ("-Dtest="+$reviewSelection) '-Duser.timezone=UTC' test *> (Join-Path $reviewOutput 'backend.log')
$reviewExit = $LASTEXITCODE
$reviewResults = @(Get-ChildItem -LiteralPath (Join-Path $reviewCopy 'target/surefire-reports') -Filter 'TEST-*.xml' | ForEach-Object {
    [xml]$reviewXml = Get-Content -LiteralPath $_.FullName -Raw
    [ordered]@{ suite=$reviewXml.testsuite.name; tests=[int]$reviewXml.testsuite.tests; failures=[int]$reviewXml.testsuite.failures;
        errors=[int]$reviewXml.testsuite.errors; skipped=[int]$reviewXml.testsuite.skipped;
        cases=@($reviewXml.testsuite.testcase | ForEach-Object { [ordered]@{name=$_.name; failure=$_.failure.message; error=$_.error.message} }) }
})
$reviewSources = @(Get-ChildItem -LiteralPath (Join-Path $reviewBackend 'src') -Recurse -File | ForEach-Object {
    $reviewRelative = [IO.Path]::GetRelativePath($reviewBackend,$_.FullName)
    $reviewOriginalHash = (Get-FileHash -LiteralPath $_.FullName).Hash
    $reviewCopiedHash = (Get-FileHash -LiteralPath (Join-Path $reviewCopy $reviewRelative)).Hash
    if ($reviewOriginalHash -ne $reviewCopiedHash) { throw "Fonte de base alterado na cópia: $reviewRelative" }
    [ordered]@{file=$reviewRelative;sha256=$reviewOriginalHash}
})
$reviewManifest = [ordered]@{base='f225657';product='dbf828e';isolated_copy=$reviewCopy;selection=$reviewSelection;exit_code=$reviewExit;
    source_tree_matches=$true; sources=$reviewSources; results=$reviewResults;
    readme_sha256=(Get-FileHash -LiteralPath (Join-Path $reviewRoot 'README.md')).Hash}
$reviewManifest | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath (Join-Path $reviewOutput 'results.json') -Encoding utf8
Get-Content -LiteralPath (Join-Path $reviewOutput 'backend.log') -Tail 17
exit $reviewExit
