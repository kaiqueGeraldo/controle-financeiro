param([Parameter(Mandatory=$true)][string]$RuntimeRoot)
$ErrorActionPreference='Stop'
$repo=(Resolve-Path "$PSScriptRoot/../../..").Path
$rt=(Resolve-Path $RuntimeRoot).Path
$allowed=[IO.Path]::GetFullPath("$repo/../controle-financeiro-runtimes/CF-032/revalidacao-")
if(-not $rt.StartsWith($allowed,[StringComparison]::OrdinalIgnoreCase)){throw 'Only this review runtime may be mutated'}
$file="$rt/backend/src/main/java/com/controlefinanceiro/api/service/onboarding/OnboardingOpenings.java"
$bytes=[IO.File]::ReadAllBytes($file)
$original=[IO.File]::ReadAllText($file)
$before=(Get-FileHash $file).Hash
$needle='        bindNewDeclarationsToCommittedInventory(owner,p,ids,now);'
if(-not $original.Contains($needle)){throw 'Mutation target missing'}
try {
 [IO.File]::WriteAllText($file,$original.Replace($needle,'        // REVIEW MUTANT: omit certification of persisted inventory'))
 $mutant=(Get-FileHash $file).Hash
 & "$repo/controle-financeiro-backend/src/test/cf032/run.ps1" -RuntimeRoot $rt -Evidence "$PSScriptRoot/mutant-certification" -Tests 'CertificationProbeTest#certificateBindsPersistedInventoryPreservesHistoryAndExpiresOnLaterChange'
 $result=$LASTEXITCODE
} finally {
 [IO.File]::WriteAllBytes($file,$bytes)
 $after=(Get-FileHash $file).Hash
 @{before=$before;mutant=$mutant;after=$after;restored=($before -eq $after);exitCode=$result;mutation='omit final binding, keep original assertions'} | ConvertTo-Json | Set-Content "$PSScriptRoot/mutation.json"
}
if($before -ne $after){throw 'Source restoration failed'}
