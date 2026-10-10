$ErrorActionPreference = 'Stop'
$culture = [Globalization.CultureInfo]::InvariantCulture
$root = (Resolve-Path (Join-Path $PSScriptRoot '../../..')).Path
function D($value) { [decimal]::Parse($value, $culture) }
function Equal($actual, $expected) { if ($actual -ne $expected) { throw "Expected $expected; got $actual" } }
function F($value) { $value.ToString('F2', $culture) }
$f = Get-Content -Raw (Join-Path $root 'tasks/evidencias/CF-028/examples.json') | ConvertFrom-Json
$cases = (Get-Content -Raw (Join-Path $root 'tasks/evidencias/saneamento-CF-028-R28/cases.json') | ConvertFrom-Json).cases
$s = $f.draft.payload.sections
$accounts = [decimal]0; $investments = [decimal]0; $debt = [decimal]0; $credit = [decimal]0; $reserved = [decimal]0
foreach ($a in $s.accounts.items) { $accounts += D $a.balance.value }
foreach ($i in $s.investments.items) { $investments += D $i.valuation.amount }
foreach ($c in $s.cards.items) {
    $debt += D $c.opening.currentOutstanding; $credit += D $c.opening.credit
    foreach ($p in $c.opening.futureInstallments) { $debt += D $p.amount }
}
foreach ($r in $s.allocations.items) { $reserved += D $r.amount }
Equal ($accounts + $investments + $credit - $debt) (D '1451')
Equal $debt (D '350'); Equal $reserved (D '550')
# E16: use actual commands, not the separate executor components array.
$e16 = $cases[0]; $sumAccounts = [decimal]0; $sumReservations = [decimal]0
foreach ($a in $e16.draft.payload.sections.accounts.items) { $sumAccounts += D $a.balance.value }
foreach ($r in $e16.draft.payload.sections.allocations.items) { $sumReservations += D $r.amount }
Equal $sumAccounts (D '1999999999999.98'); Equal $sumReservations $sumAccounts
Equal (D $e16.summary.byGoal[0].covered.value) $sumReservations
Equal $e16.summary.byGoal[0].covered.outsideIndividualRange $true
# E17: derive from actual existing source and nominal allocation.
$e17 = $cases[1]; $negativeFree = (D $e17.existing.accounts[0].value) - (D $e17.existing.allocations[0].amount)
Equal $negativeFree (D '-1999999999999.98'); Equal (D $e17.summary.bySource[0].free.value) $negativeFree
Equal (D $e17.summary.bySource[0].newAllocationCapacity.value) (D '0')
# E18-E20: absence/proof are inputs; explicit expectations do not turn null into decimal0.
Equal $cases[2].existing.allocations[0].amount $null
Equal $cases[2].summary.bySource[0].reserved.state 'UNKNOWN'
Equal $cases[2].summary.byGoal[1].progress.state 'UNKNOWN'
Equal $cases[3].existing.allocations[0].knownComponents[0] '300.00'
Equal $cases[3].summary.metrics.reservedAccounts.state 'PARTIAL'
Equal $cases[3].summary.metrics.reservedAccounts.knownSubtotal '300.00'
Equal $cases[3].summary.metrics.freeAccountCash.knownSubtotal '500.00'
Equal $cases[3].summary.metrics.freeAccountCash.value $null
Equal $cases[4].existing.allocations.Count 0
Equal $cases[4].summary.bySource[0].reserved.state 'KNOWN'
Equal $cases[4].summary.bySource[0].reserved.value '0.00'
Equal $cases[4].summary.byGoal[1].covered.state 'NOT_APPLICABLE'
# Larger legitimate legacy: 101 maximum sources; not constrained by 100M draft bound.
$max = D '999999999999.99'; $legacyTotal = [decimal]0
for ($i = 0; $i -lt 101; $i++) { $legacyTotal += $max }
Equal $legacyTotal (D '100999999999998.99')
Equal (($max + $max) - $max) $max
Equal ((D '999999999999.99999999') + (D '0.00000001')) (D '1000000000000.00000000')
# Countermodel: identical observable legacy evidence, two possible source assignments.
# A=1000, B=500; legacy nominal400 lacks source proof. Request adds500 on B.
# This is NOT an implementation or a new rule: it proves that B is not certified free.
$worldA = [ordered]@{reservationSource='A';oldReservedB='0.00';afterB=F ((D '0') + (D '500'));withinCapacity=$true}
$worldB = [ordered]@{reservationSource='B';oldReservedB='400.00';afterB=F ((D '400') + (D '500'));withinCapacity=$false}
Equal $worldA.afterB '500.00'; Equal $worldB.afterB '900.00'
if ((D $worldB.afterB) -le (D '500')) { throw 'Expected concrete overallocation in second world' }
# Positive control: proof that the unknown reservation belongs to A isolates B.
$isolatedB = (D '500') - (D '0')
Equal $isolatedB (D '500')
# Two goals share A: an unknown second reservation prevents authorizing remaining700.
Equal ((D '300') + (D '400') + (D '700')) (D '1400')
# One goal uses uncertain A + proven200 on independent B: preserve200 as partial.
Equal ((D '500') - (D '200')) (D '300')
# A changed linked balance must invalidate the review, not silently reduce the command.
Equal ((D '400') - (D '500')) (D '-100')
[ordered]@{
    scope='Documental; aritmetica .NET decimal independente de BigInt/helpers do executor'
    E01=@{netWorth='1451.00';debt='350.00';reserved='550.00'}
    E16=F $sumAccounts; E17=F $negativeFree
    E18_E20='UNKNOWN/PARTIAL/KNOWN zero e NOT_APPLICABLE conferidos com entradas'
    legacy101Sources=F $legacyTotal
    sourceAmbiguity=@{observed='A1000/B500, reserva legada400 sem fonte comprovada, nova reserva500 em B';worlds=@($worldA,$worldB);result='A evidencia nao permite certificar capacidade500 em B'}
    controls=@{sourceProvenA='B500 permitido';twoGoalsOneSource='300 conhecido +400 possivel +700 novo =1400 >1000';multiSourceGoal='200 confirmado em B permanece subtotal; livreB300';changedBalance='SOURCE_CHANGED antes de aplicar500 sobre400'}
} | ConvertTo-Json -Depth 8
