param([string]$Only = '')
$ErrorActionPreference = 'Stop'
$repo = (Resolve-Path "$PSScriptRoot/../../..").Path
$backend = Join-Path $repo 'controle-financeiro-backend'
$copy = Join-Path $backend ('target/review-joint-mutants-' + [guid]::NewGuid().ToString('N'))
$targetRoot = [IO.Path]::GetFullPath((Join-Path $backend 'target')) + [IO.Path]::DirectorySeparatorChar
if (![IO.Path]::GetFullPath($copy).StartsWith($targetRoot)) { throw 'Invalid isolated directory' }
New-Item -ItemType Directory -Path $copy | Out-Null
foreach ($entry in @('src','.mvn','pom.xml','mvnw.cmd')) {
    Copy-Item -LiteralPath (Join-Path $backend $entry) -Destination $copy -Recurse
}
$cases = @(
    @{Id='history-clock'; File='domain/goal/GoalHistory.java'; Needle='    private LocalDateTime date;'; Replacement="    @org.hibernate.annotations.CreationTimestamp`n    private LocalDateTime date;"; Test='HabitIntegrityIntegrationTest#persistedHistoryUsesClockAndUncheckRemovesOnlyOwnedEffect'},
    @{Id='habit-row-lock'; File='domain/habit/HabitRepository.java'; Needle='    @Lock(LockModeType.PESSIMISTIC_WRITE)'; Replacement=''; Test='HabitIntegrityIntegrationTest#simultaneousToggleActionsSerializeAndPreserveOneDayAndZeroNetProgress'},
    @{Id='weekly-retry'; File='service/HabitCronService.java'; Needle='        HabitStreakCalculator.apply(habit, logs, today);'; Replacement='        if (habit.getFrequency() == HabitFrequency.WEEKLY_GOAL) habit.setCurrentStreak(habit.getCurrentStreak() + 1); else HabitStreakCalculator.apply(habit, logs, today);'; Test='HabitIntegrityIntegrationTest#weeklyCronAcrossNewYearIsIdempotentAfterLockExpires'},
    @{Id='calendar-watermark'; File='domain/habit/HabitStreakCalculator.java'; Needle='return previous != null && previous.isAfter(requestedDay) ? previous : requestedDay;'; Replacement='return requestedDay;'; Test='HabitIntegrityIntegrationTest#olderOperationWaitingAcrossMidnightCannotHideNewerCalendarDay'},
    @{Id='scheduler-lock'; File='service/HabitCronService.java'; Needle='    @SchedulerLock(name = "processDailyHabitsLock", lockAtLeastFor = "1m", lockAtMostFor = "10m")'; Replacement=''; Test='HabitIntegrityIntegrationTest#independentRegisteredSchedulerCallbackUsesProductTriggerAndDatabaseLock'},
    @{Id='signed-principal'; File='infra/security/SecurityFilter.java'; Needle="userRepository.findById(identity.userId())`n                        .filter(found -> found.getEmail().equals(identity.email())).orElse(null)"; Replacement='userRepository.findByEmail(identity.email())'; Test='UserIsolationIntegrationTest#identityMustSurviveEmailRecycling'},
    @{Id='reorder-owner'; File='service/OwnedResourceOrder.java'; Needle='+ " = :owner and r.id in :ids"'; Replacement='+ " = :owner or 1=1) and r.id in :ids"'; Test='UserIsolationIntegrationTest#mixedReordersRejectAtomicallyIncludingMissingIds'}
)
$env:JAVA_HOME = Join-Path $backend 'target/temurin21/jdk-21.0.12.1+1'
$env:PATH = $env:JAVA_HOME + '/bin;C:/Users/Aluga.com/AppData/Local/Programs/DockerDesktop/resources/bin;' + $env:PATH
$results = @()
foreach ($case in $cases) {
    if ($Only -and $Only -ne $case.Id) { continue }
    $relative = 'src/main/java/com/controlefinanceiro/api/' + $case.File
    $shared = Join-Path $backend $relative
    $isolated = Join-Path $copy $relative
    $originalBytes = [IO.File]::ReadAllBytes($shared)
    $beforeHash = (Get-FileHash -LiteralPath $shared).Hash
    $original = [IO.File]::ReadAllText($shared).Replace("`r`n", "`n")
    if (!$original.Contains($case.Needle)) { throw "Missing anchor: $($case.Id)" }
    $mutated = $original.Replace($case.Needle, $case.Replacement)
    if ($case.Id -eq 'reorder-owner') { $mutated=$mutated.Replace('+ " r where " + ownerPath', '+ " r where (" + ownerPath') }
    [IO.File]::WriteAllText($isolated, $mutated)
    & git diff --no-index -- $shared $isolated > (Join-Path $PSScriptRoot ($case.Id + '.diff'))
    $log = Join-Path $PSScriptRoot ('logs/mutation-' + $case.Id + '.log')
    try {
        Push-Location $copy
        try {
            & .\mvnw.cmd --batch-mode '-Dmaven.repo.local=C:/Users/Aluga.com/.m2/repository' "-Dtest=$($case.Test)" '-Duser.timezone=UTC' test *> $log
            $code = $LASTEXITCODE
        } finally { Pop-Location }
        $summaries = @(Select-String -LiteralPath $log -Pattern 'Tests run: (\d+), Failures: (\d+), Errors: (\d+), Skipped: (\d+)')
        if (!$summaries.Count) { throw "No test result: $($case.Id)" }
        $summary = $summaries[-1].Matches[0].Groups
        $detected = $code -eq 1 -and [int]$summary[2].Value -gt 0 -and [int]$summary[3].Value -eq 0 -and [int]$summary[4].Value -eq 0
        $results += @{id=$case.Id; test=$case.Test; exit=$code; tests=[int]$summary[1].Value; failures=[int]$summary[2].Value; errors=[int]$summary[3].Value; skips=[int]$summary[4].Value; detected=$detected; sharedSha256=$beforeHash}
        Write-Output "$($case.Id): detected=$detected"
        if (!$detected) { throw "Mutation not detected causally: $($case.Id)" }
    } finally {
        [IO.File]::WriteAllBytes($isolated, $originalBytes)
        if ((Get-FileHash -LiteralPath $shared).Hash -ne $beforeHash -or (Get-FileHash -LiteralPath $isolated).Hash -ne $beforeHash) { throw 'Restoration failed' }
        if ($results.Count) { $results[-1]['restored']=$true; $results[-1]['sharedUnchanged']=$true }
        ConvertTo-Json -InputObject @($results) -Depth 5 | Set-Content -LiteralPath (Join-Path $PSScriptRoot ('mutation-results'+$Only+'.json'))
    }
}
