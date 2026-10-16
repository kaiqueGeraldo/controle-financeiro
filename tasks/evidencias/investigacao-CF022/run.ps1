param([ValidateSet('scheduler-lazy','scheduler-eager','browser-original','browser-date-only')][string]$Run)
$ErrorActionPreference='Stop'
$root=(Resolve-Path "$PSScriptRoot/../../..").Path
$backend=Join-Path $root '.cf22/controle-financeiro-backend'
$log=Join-Path $PSScriptRoot "$Run.log"
if(Test-Path -LiteralPath $log){throw 'Preserve existing runs; use a new evidence directory for a new experiment.'}
$env:JAVA_HOME=(Resolve-Path "$root/controle-financeiro-backend/target/temurin21/jdk-21.0.12.1+1").Path
$env:PATH=$env:JAVA_HOME+'/bin;C:/Users/Aluga.com/AppData/Local/Programs/DockerDesktop/resources/bin;'+$env:PATH
$source=Join-Path $backend 'src/main/java/com/controlefinanceiro/api/domain/habit/Habit.java'
$before=[IO.File]::ReadAllBytes($source)
try {
 if($Run -eq 'scheduler-eager'){
  $text=[IO.File]::ReadAllText($source)
  $from='@ElementCollection(targetClass = DayOfWeek.class, fetch = FetchType.LAZY)'
  if(-not $text.Contains($from)){throw 'Unexpected source'}
  [IO.File]::WriteAllText($source,$text.Replace($from,$from.Replace('LAZY','EAGER')))
 }
 Push-Location $backend
 try {
  $selection=if($Run.StartsWith('scheduler')){'Cf022SchedulerProbeTest#freshThenResidualFixtures'}else{'HabitBrowserIntegrationTest'}
  $mode=if($Run -eq 'browser-date-only'){'date-only'}else{'original'}
  & ./mvnw.cmd --batch-mode '-Dmaven.repo.local=C:/Users/Aluga.com/.m2/repository' "-Dtest=$selection" '-Duser.timezone=UTC' "-Dcf022.clock=$mode" "-Dcf022.evidence=$PSScriptRoot/$Run" test *> $log
  $result=$LASTEXITCODE
 } finally {Pop-Location}
} finally {
 [IO.File]::WriteAllBytes($source,$before)
 $same=[Convert]::ToHexString([Security.Cryptography.SHA256]::HashData($before)) -eq (Get-FileHash $source -Algorithm SHA256).Hash
 if(-not $same){throw 'Restoration mismatch'}
}
exit $result
