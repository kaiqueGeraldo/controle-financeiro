param([Parameter(Mandatory=$true)][string]$RuntimeRoot,[Parameter(Mandatory=$true)][string]$Evidence)
$ErrorActionPreference='Stop'
$repo=(Resolve-Path "$PSScriptRoot/../../../..").Path
$runtime=(Resolve-Path -LiteralPath $RuntimeRoot).Path
$allowed=[IO.Path]::GetFullPath("$repo/../controle-financeiro-runtimes/CF-032/")
if(-not $runtime.StartsWith($allowed,[StringComparison]::OrdinalIgnoreCase)){throw 'Mutations require an isolated CF032 runtime'}
$out=[IO.Path]::GetFullPath($Evidence)
if(Test-Path -LiteralPath $out){throw 'Never overwrite mutation evidence'}
New-Item -ItemType Directory -Path $out | Out-Null
function Browser([string]$name,[string]$grep) {
    & "$PSScriptRoot/run.ps1" -RuntimeRoot $runtime -Evidence "$out/$name" -Grep $grep
    return (Get-Content -LiteralPath "$out/$name/execution.json" -Raw | ConvertFrom-Json)
}
function Components([string]$name,[string[]]$tests) {
    New-Item -ItemType Directory -Path "$out/$name" | Out-Null
    Push-Location "$runtime/frontend"
    try { & node node_modules/vitest/vitest.mjs run --config tests/component/vitest.config.mts @tests *> "$out/$name/vitest.log"; $code=$LASTEXITCODE }
    finally {Pop-Location}
    [ordered]@{exitCode=$code;tests=$tests} | ConvertTo-Json | Set-Content -LiteralPath "$out/$name/execution.json"
    return [pscustomobject]@{exitCode=$code}
}
$frontTests=@('tests/component/cf032-card-limits.test.tsx','tests/component/cf032-investment-identity.test.tsx')
$baseline=Browser 'baseline-browser' 'E2 fonte|R3 horário'
if($baseline[-1].exitCode -ne 0){throw 'Fixed browser baseline must pass before mutation'}
$baselineFront=Components 'baseline-components' $frontTests
if($baselineFront.exitCode -ne 0){throw 'Fixed component baseline must pass before mutation'}
$changes=@(
    @{name='capacity';layer='browser';grep='E2 fonte';files=@(
        @{file='backend/src/main/java/com/controlefinanceiro/api/service/SourceReservationService.java';before='if(source==null || !source.known())';after='if(source==null)'})},
    @{name='card-limit';layer='component';test=$frontTests[0];files=@(
        @{file='frontend/src/hooks/useCards.ts';before='available: monetaryAggregate(cards.map(card => cardLimitMetrics(card).available ?? NaN)),';after='available: totalLimit === null || totalInvoice === null ? null : monetaryAggregate([totalLimit,-totalInvoice]),'},
        @{file='frontend/src/components/screens/cards/creditCardItem.tsx';before='const { available, percentage: percentual } = cardLimitMetrics(card);';after='const { percentage: percentual } = cardLimitMetrics(card); const available = card.limit - card.currentInvoiceValue;'})},
    @{name='investment-name';layer='component';test=$frontTests[1];files=@(
        @{file='frontend/src/utils/investmentLabel.ts';before='return asset.ticker?.trim() || asset.name?.trim() || "Investimento sem identificação";';after='return asset.ticker?.trim() || "";'})},
    @{name='export-seconds';layer='browser';grep='R3 horário';files=@(
        @{file='backend/src/main/java/com/controlefinanceiro/api/service/TransactionService.java';before='DateTimeFormatter timeFmt = DateTimeFormatter.ofPattern("HH:mm:ss");';after='DateTimeFormatter timeFmt = DateTimeFormatter.ofPattern("HH:mm");'})}
)
$results=@()
foreach($mutation in $changes) {
    $originals=@();$patches=@()
    foreach($change in $mutation.files) {
        $target=Join-Path $runtime $change.file
        $text=[IO.File]::ReadAllText($target)
        if(-not $text.Contains($change.before)){throw "Missing mutation anchor: $($mutation.name)"}
        $originals+=@{file=$change.file;target=$target;bytes=[IO.File]::ReadAllBytes($target);sha256=(Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash}
        $patches+="$($change.file)`n- $($change.before)`n+ $($change.after)"
    }
    $patches -join "`n" | Set-Content -LiteralPath "$out/$($mutation.name).patch.txt"
    $item=[ordered]@{name=$mutation.name;layer=$mutation.layer;detectedByInvariant=$false;files=@()}
    try {
        foreach($change in $mutation.files) {
            $target=Join-Path $runtime $change.file
            [IO.File]::WriteAllText($target,[IO.File]::ReadAllText($target).Replace($change.before,$change.after))
        }
        if($mutation.layer -eq 'browser'){
            $execution=Browser $mutation.name $mutation.grep
            $code=$execution[-1].exitCode
            $log=[IO.File]::ReadAllText("$out/$($mutation.name)/playwright.log")
        }else{
            $execution=Components $mutation.name @($mutation.test)
            $code=$execution.exitCode
            $log=[IO.File]::ReadAllText("$out/$($mutation.name)/vitest.log")
        }
        $specific=switch($mutation.name){
            'capacity' { $state=Get-Content -LiteralPath "$out/capacity/E2-after-attempt-sql.json" -Raw | ConvertFrom-Json; $log.Contains('400') -and $log.Contains('204') -and $state.reservedAccounts -eq '0.01' }
            'card-limit' { $log.Contains('656') -and $log.Contains('950') }
            'investment-name' { $log.Contains('Ver detalhes do investimento Reserva A') -and $log.Contains('Unable to find') }
            'export-seconds' { $log.Contains('12:34:56') -and $log.Contains('"12:34"') }
        }
        $item.exitCode=$code
        $item.detectedByInvariant=($code -ne 0 -and $specific -and $log -notmatch 'Cannot find module|No tests found|No test files found|Failed Suites|BadSqlGrammar|Failed to load ApplicationContext')
    }finally{
        foreach($original in $originals){
            $mutantHash=(Get-FileHash -LiteralPath $original.target -Algorithm SHA256).Hash
            [IO.File]::WriteAllBytes($original.target,$original.bytes)
            $restoredHash=(Get-FileHash -LiteralPath $original.target -Algorithm SHA256).Hash
            $item.files+=@{file=$original.file;beforeHash=$original.sha256;mutantHash=$mutantHash;restoredHash=$restoredHash}
            if($restoredHash -cne $original.sha256){throw 'Source restoration failed'}
        }
        $results+=@($item)
        $results | ConvertTo-Json -Depth 7 | Set-Content -LiteralPath "$out/results.json"
    }
}
$restored=Browser 'restored-browser' 'E2 fonte|R3 horário'
$restoredFront=Components 'restored-components' $frontTests
[ordered]@{browserExitCode=$restored[-1].exitCode;componentsExitCode=$restoredFront.exitCode;allRestoredHashesMatch=(@($results.files | Where-Object {$_.beforeHash -cne $_.restoredHash}).Count -eq 0)} |
    ConvertTo-Json | Set-Content -LiteralPath "$out/restored-control.json"
if($restored[-1].exitCode -ne 0 -or $restoredFront.exitCode -ne 0 -or @($results | Where-Object {-not $_.detectedByInvariant}).Count){throw 'Mutation or restored control failed; preserve all artifacts'}
Write-Output 'Four causal counterproofs detected and sources restored.'
