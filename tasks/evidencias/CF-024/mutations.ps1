$ErrorActionPreference = 'Stop'
$cf024Root = (Resolve-Path (Join-Path $PSScriptRoot '../../..')).Path
$cf024Backend = Join-Path $cf024Root 'controle-financeiro-backend'
$cf024Copy = Join-Path $cf024Backend ('target/cf024-mutations-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $cf024Copy | Out-Null
$cf024Output = Join-Path $cf024Copy 'evidence'
New-Item -ItemType Directory -Path (Join-Path $cf024Output 'logs') | Out-Null
foreach ($cf024Part in @('src', '.mvn', 'pom.xml', 'mvnw.cmd')) {
    Copy-Item -LiteralPath (Join-Path $cf024Backend $cf024Part) -Destination $cf024Copy -Recurse
}
$env:JAVA_HOME = (Resolve-Path (Join-Path $cf024Backend 'target/temurin21/jdk-21.0.12.1+1')).Path
$env:PATH = $env:JAVA_HOME + '/bin;C:/Users/Aluga.com/AppData/Local/Programs/DockerDesktop/resources/bin;' + $env:PATH
$cf024Java = 'src/main/java/com/controlefinanceiro/api/'
$cf024Mutants = @(
    @{ name='source-protection'; tests='differentCardsDebitTheSameAccountExactlyTwice'; changes=@(
        @{ path=$cf024Java+'domain/account/AccountRepository.java'; old='@Lock(LockModeType.PESSIMISTIC_WRITE)'; new='' },
        @{ path=$cf024Java+'domain/account/Account.java'; old='@Version'; new='' }
    ) },
    @{ name='idempotence'; tests='repeatedIdentifiedHttpCommandHasOneEffect'; changes=@(
        @{ path=$cf024Java+'service/FinancialIntentService.java'; old='if (key == null) return null;'; new='if (true) return null;' },
        @{ path=$cf024Java+'service/FinancialIntentService.java'; old='if (key == null) return;'; new='if (true) return;' }
    ) },
    @{ name='cache-before-commit'; tests='rollbackDoesNotInvalidateAndCommitInvalidatesOnlyTheOwnerYear+annualNoteInvalidationAlsoWaitsForCommit+nonTransactionalEventCannotInvalidateConfirmedData+accountDeletionCannotClearCachesBeforeCommitAndReceiptCleanupIsAtomic'; changes=@(
        @{ path=$cf024Java+'service/listener/CacheInvalidationListener.java'; old='@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)'; new='@org.springframework.context.event.EventListener' }
    ) },
    @{ name='fingerprint'; tests='repeatedIdentifiedHttpCommandHasOneEffect'; changes=@(
        @{ path=$cf024Java+'service/FinancialIntentService.java'; old='|| !receipt.getFingerprint().equals(fingerprint)'; new='' }
    ) },
    @{ name='receipt-owner'; tests='receiptOwnerIsolationAndCredentialFailurePreserveMoney'; changes=@(
        @{ path=$cf024Java+'service/FinancialIntentService.java'; old='receipts.findByIdAndUserId(key,user.getId())'; new='receipts.findById(key)' }
    ) }
)
$cf024Results = @()
foreach ($cf024Mutant in $cf024Mutants) {
    $cf024Backups = @{}
    $cf024Hashes = @()
    try {
        foreach ($cf024Change in $cf024Mutant.changes) {
            $cf024Path = Join-Path $cf024Copy $cf024Change.path
            if (-not $cf024Backups.ContainsKey($cf024Path)) { $cf024Backups[$cf024Path] = [IO.File]::ReadAllBytes($cf024Path) }
            $cf024Content = [IO.File]::ReadAllText($cf024Path)
            if (-not $cf024Content.Contains($cf024Change.old)) { throw "Alvo ausente: $($cf024Mutant.name) / $($cf024Change.path)" }
            [IO.File]::WriteAllText($cf024Path, $cf024Content.Replace($cf024Change.old,$cf024Change.new), [Text.UTF8Encoding]::new($false))
        }
        $cf024Diff = Join-Path $cf024Output ($cf024Mutant.name + '.diff')
        foreach ($cf024Path in $cf024Backups.Keys) {
            $cf024Relative = [IO.Path]::GetRelativePath($cf024Copy,$cf024Path)
            git -C $cf024Root diff --no-index -- (Join-Path $cf024Backend $cf024Relative) $cf024Path >> $cf024Diff
        }
        $cf024Log = Join-Path $cf024Output ('logs/mutation-' + $cf024Mutant.name + '.log')
        $cf024ReportPath = Join-Path $cf024Copy 'target/surefire-reports/TEST-com.controlefinanceiro.api.service.Cf024ConcurrencyCacheIntegrationTest.xml'
        if (Test-Path -LiteralPath $cf024ReportPath) { Remove-Item -LiteralPath $cf024ReportPath }
        & (Join-Path $cf024Copy 'mvnw.cmd') -f (Join-Path $cf024Copy 'pom.xml') --batch-mode '-Dmaven.repo.local=C:/Users/Aluga.com/.m2/repository' ("-Dtest=Cf024ConcurrencyCacheIntegrationTest#"+$cf024Mutant.tests) '-Duser.timezone=UTC' test *> $cf024Log
        $cf024Exit = $LASTEXITCODE
        if (-not (Test-Path -LiteralPath $cf024ReportPath)) { throw "Mutacao sem regressao executada: $($cf024Mutant.name)" }
        [xml]$cf024Xml = Get-Content -LiteralPath $cf024ReportPath -Raw
        $cf024Assertions = @($cf024Xml.testsuite.testcase | Where-Object { $_.failure } | ForEach-Object {
            @{ test=$_.name; message=$_.failure.message; type=$_.failure.type }
        })
        $cf024Result = [ordered]@{ name=$cf024Mutant.name; exit_code=$cf024Exit; tests=[int]$cf024Xml.testsuite.tests;
            failures=[int]$cf024Xml.testsuite.failures; errors=[int]$cf024Xml.testsuite.errors; skipped=[int]$cf024Xml.testsuite.skipped; assertions=$cf024Assertions }
    } finally {
        foreach ($cf024Path in $cf024Backups.Keys) {
            [IO.File]::WriteAllBytes($cf024Path,$cf024Backups[$cf024Path])
            $cf024Relative = [IO.Path]::GetRelativePath($cf024Copy,$cf024Path)
            $cf024SourceHash = (Get-FileHash -LiteralPath (Join-Path $cf024Backend $cf024Relative) -Algorithm SHA256).Hash
            $cf024CopyHash = (Get-FileHash -LiteralPath $cf024Path -Algorithm SHA256).Hash
            if ($cf024SourceHash -ne $cf024CopyHash) { throw "Restauracao incompleta: $cf024Relative" }
            $cf024Hashes += @{ path=$cf024Relative; source_sha256=$cf024SourceHash; restored_sha256=$cf024CopyHash }
        }
    }
    $cf024Result['restored'] = $cf024Hashes
    $cf024Results += $cf024Result
    $cf024Manifest = @{ isolated_copy=$cf024Copy; results=$cf024Results } | ConvertTo-Json -Depth 8
    [IO.File]::WriteAllText((Join-Path $cf024Output 'mutation-results.json'),$cf024Manifest+"`n",[Text.UTF8Encoding]::new($false))
    Write-Output ("{0}: tests={1}, failures={2}, errors={3}, restored={4}" -f $cf024Result.name,$cf024Result.tests,$cf024Result.failures,$cf024Result.errors,$cf024Hashes.Count)
    if ($cf024Result.exit_code -eq 0 -or $cf024Result.failures -eq 0 -or $cf024Result.errors -ne 0 -or $cf024Result.skipped -ne 0) { throw 'Mutacao sobrevivente ou falha de ambiente; consultar log.' }
}

# Rebuild restored sources as well; no mutated class is left as the copy's final tested runtime.
$cf024CleanLog = Join-Path $cf024Output 'logs/mutation-restoration.log'
if (Test-Path -LiteralPath $cf024ReportPath) { Remove-Item -LiteralPath $cf024ReportPath }
& (Join-Path $cf024Copy 'mvnw.cmd') -f (Join-Path $cf024Copy 'pom.xml') --batch-mode '-Dmaven.repo.local=C:/Users/Aluga.com/.m2/repository' '-Dtest=Cf024ConcurrencyCacheIntegrationTest' '-Duser.timezone=UTC' test *> $cf024CleanLog
$cf024CleanExit = $LASTEXITCODE
[xml]$cf024CleanXml = Get-Content -LiteralPath (Join-Path $cf024Copy 'target/surefire-reports/TEST-com.controlefinanceiro.api.service.Cf024ConcurrencyCacheIntegrationTest.xml') -Raw
$cf024Clean = @{exit_code=$cf024CleanExit;tests=[int]$cf024CleanXml.testsuite.tests;failures=[int]$cf024CleanXml.testsuite.failures;errors=[int]$cf024CleanXml.testsuite.errors;skipped=[int]$cf024CleanXml.testsuite.skipped}
if ($cf024CleanExit -ne 0 -or $cf024Clean.failures -ne 0 -or $cf024Clean.errors -ne 0 -or $cf024Clean.skipped -ne 0) {throw 'Copia restaurada nao aprovada.'}
$cf024SourceFiles = @(Get-ChildItem -LiteralPath (Join-Path $cf024Backend 'src') -Recurse -File)
$cf024CopyFiles = @(Get-ChildItem -LiteralPath (Join-Path $cf024Copy 'src') -Recurse -File)
if ($cf024SourceFiles.Count -ne $cf024CopyFiles.Count) {throw 'Arvore de fontes divergente.'}
foreach ($cf024File in $cf024SourceFiles) {
    $cf024Relative = [IO.Path]::GetRelativePath($cf024Backend,$cf024File.FullName)
    if ((Get-FileHash -LiteralPath $cf024File.FullName).Hash -ne (Get-FileHash -LiteralPath (Join-Path $cf024Copy $cf024Relative)).Hash) {
        throw "Fonte divergente na copia: $cf024Relative"
    }
}
$cf024Manifest = @{isolated_copy=$cf024Copy;results=$cf024Results;clean_validation=$cf024Clean;source_tree_matches_shared_checkout=$true} | ConvertTo-Json -Depth 8
[IO.File]::WriteAllText((Join-Path $cf024Output 'mutation-results.json'),$cf024Manifest+"`n",[Text.UTF8Encoding]::new($false))
Write-Output "Reexecucao preserva evidencias historicas; novos artefatos em $cf024Output"
