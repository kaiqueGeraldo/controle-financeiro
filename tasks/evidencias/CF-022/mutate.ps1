param([string]$Repository = (Resolve-Path "$PSScriptRoot/../../..").Path, [string]$Prefix = 'mutation')
$ErrorActionPreference = 'Stop'
$backend = Join-Path $Repository 'controle-financeiro-backend'
$candidate = Join-Path $backend ('target/cf022-mutation-' + [guid]::NewGuid().ToString('N'))
$resolved = [IO.Path]::GetFullPath($candidate)
if (!$resolved.StartsWith([IO.Path]::GetFullPath((Join-Path $backend 'target')) + [IO.Path]::DirectorySeparatorChar)) { throw 'Invalid mutation workspace' }
New-Item -ItemType Directory -Path $candidate | Out-Null
foreach ($item in @('src','.mvn','pom.xml','mvnw.cmd')) { Copy-Item -LiteralPath (Join-Path $backend $item) -Destination $candidate -Recurse }
$paths = @('src/main/java/com/controlefinanceiro/api/domain/goal/GoalHistory.java',
    'src/main/java/com/controlefinanceiro/api/domain/habit/HabitRepository.java',
    'src/main/java/com/controlefinanceiro/api/service/HabitCronService.java',
    'src/main/java/com/controlefinanceiro/api/domain/habit/HabitStreakCalculator.java')
$before = @{}
foreach ($relative in $paths) { $before[$relative] = (Get-FileHash -LiteralPath (Join-Path $backend $relative)).Hash }
try {
    $file = Join-Path $candidate $paths[0]
    $source = [IO.File]::ReadAllText($file).Replace('    private LocalDateTime date;', '    @org.hibernate.annotations.CreationTimestamp' + "`n" + '    private LocalDateTime date;')
    [IO.File]::WriteAllText($file, $source)
    $file = Join-Path $candidate $paths[1]
    $source = [IO.File]::ReadAllText($file).Replace('    @Lock(LockModeType.PESSIMISTIC_WRITE)', '')
    [IO.File]::WriteAllText($file, $source)
    $file = Join-Path $candidate $paths[2]
    $source = [IO.File]::ReadAllText($file).Replace('        HabitStreakCalculator.apply(habit, logs, today);',
        '        if (habit.getFrequency() == HabitFrequency.WEEKLY_GOAL) habit.setCurrentStreak(habit.getCurrentStreak() + 1); else HabitStreakCalculator.apply(habit, logs, today);')
    [IO.File]::WriteAllText($file, $source)
    $file = Join-Path $candidate $paths[3]
    $source = [IO.File]::ReadAllText($file).Replace('return previous != null && previous.isAfter(requestedDay) ? previous : requestedDay;', 'return requestedDay;')
    [IO.File]::WriteAllText($file, $source)
    foreach ($relative in $paths) {
        & git diff --no-index -- (Join-Path $backend $relative) (Join-Path $candidate $relative) >> (Join-Path $PSScriptRoot ($Prefix + '.diff'))
    }
    $env:JAVA_HOME = Join-Path $backend 'target/temurin21/jdk-21.0.12.1+1'
    Push-Location $candidate
    try {
        & .\mvnw.cmd --batch-mode '-Dmaven.repo.local=C:/Users/Aluga.com/.m2/repository' '-Dtest=HabitIntegrityIntegrationTest#persistedHistoryUsesClockAndUncheckRemovesOnlyOwnedEffect+simultaneousToggleActionsSerializeAndPreserveOneDayAndZeroNetProgress+weeklyCronAcrossNewYearIsIdempotentAfterLockExpires+olderOperationWaitingAcrossMidnightCannotHideNewerCalendarDay' '-Duser.timezone=UTC' test *> (Join-Path $PSScriptRoot ($Prefix + '.log'))
        $mutationExit = $LASTEXITCODE
    } finally { Pop-Location }
    if ($mutationExit -ne 1) { throw "Expected mutation to fail, exit=$mutationExit" }
} finally {
    $result = foreach ($relative in $paths) {
        Copy-Item -LiteralPath (Join-Path $backend $relative) -Destination (Join-Path $candidate $relative)
        $original = (Get-FileHash -LiteralPath (Join-Path $backend $relative)).Hash
        $restored = (Get-FileHash -LiteralPath (Join-Path $candidate $relative)).Hash
        if ($original -ne $before[$relative] -or $restored -ne $original) { throw "Restoration failed: $relative" }
        "$relative original=$original restored=$restored unchanged=True"
    }
    $result | Set-Content -LiteralPath (Join-Path $PSScriptRoot ($Prefix + '-restoration.txt'))
}
Get-Content -LiteralPath (Join-Path $PSScriptRoot ($Prefix + '.log')) -Tail 32
