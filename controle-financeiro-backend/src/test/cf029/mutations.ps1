param([Parameter(Mandatory=$true)][string]$Backend)
$ErrorActionPreference='Stop'
$root=(Resolve-Path "$PSScriptRoot/../../../..").Path
$Backend=(Resolve-Path $Backend).Path
if($Backend -eq "$root/controle-financeiro-backend" -or -not $Backend.StartsWith("$root/.cf029-mutation".Replace('/','\'))){throw 'Use the dedicated isolated mutation copy'}
$cases=@(
    @{name='mutation-version';file='service/onboarding/OnboardingDraftService.java';old='if(current!=write.expectedVersion())';new='if(false)';tests='OnboardingIntegrationTest#bothFirstCreationAndExistingRevisionRaceHaveOneWinner'},
    @{name='mutation-owner';file='service/onboarding/DraftReferences.java';old='where user_id=:owner and id in (:ids)';new='where id in (:ids)';tests='OnboardingIntegrationTest#ownOnlyReferencesUniform404AndNoPartialSave'},
    @{name='mutation-precision';file='domain/onboarding/DraftValidator.java';old='BigDecimal value=new BigDecimal(s);';new='BigDecimal value=BigDecimal.valueOf(Double.parseDouble(s));';tests='DraftValidatorTest#unknownQuantityAndPriceExtremesNeverPassThroughFloatingPoint'}
)
$results=@()
foreach($case in $cases){
    $path=Join-Path $Backend "src/main/java/com/controlefinanceiro/api/$($case.file)"
    $original=[IO.File]::ReadAllBytes($path)
    $before=(Get-FileHash $path).Hash
    try {
        $text=[IO.File]::ReadAllText($path)
        if(-not $text.Contains($case.old)){throw 'Mutation anchor missing'}
        [IO.File]::WriteAllText($path,$text.Replace($case.old,$case.new))
        & "$PSScriptRoot/run.ps1" -Name $case.name -Tests $case.tests -Backend $Backend
        $exitCode=$LASTEXITCODE
        [IO.File]::WriteAllText("$root/tasks/evidencias/CF-029/$($case.name)/mutation.diff","--- $($case.file)`n+++ isolated/$($case.file)`n-$($case.old)`n+$($case.new)`n")
    } finally {
        [IO.File]::WriteAllBytes($path,$original)
        $restored=(Get-FileHash $path).Hash -eq $before
        if(-not $restored){throw 'Mutation copy restoration failed'}
    }
    $results+=@{name=$case.name;exitCode=$exitCode;restored=$restored;sha256=$before}
}
$results | ConvertTo-Json | Set-Content "$root/tasks/evidencias/CF-029/mutations.json"
if(@($results | Where-Object {$_.exitCode -eq 0}).Count -gt 0){throw 'Surviving mutation: inspect the oracle'}
