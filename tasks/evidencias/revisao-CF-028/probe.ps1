$ErrorActionPreference = 'Stop'
$culture = [Globalization.CultureInfo]::InvariantCulture
$root = (Resolve-Path (Join-Path $PSScriptRoot '../../..')).Path
$f = Get-Content -Raw (Join-Path $root 'tasks/evidencias/CF-028/examples.json') | ConvertFrom-Json
function D($s) { [decimal]::Parse($s, $culture) }
function Equal($actual, $expected) {
    if ($actual -ne $expected) { throw "Expected $expected; actual $actual" }
}
$s = $f.draft.payload.sections
# Decimal accumulator keeps all input cents exact, independently of the BigInt verifier.
$accounts = [decimal]0
foreach ($a in $s.accounts.items) { $accounts += D $a.balance.value }
$investments = [decimal]0
foreach ($i in $s.investments.items) { $investments += D $i.valuation.amount }
$debt = [decimal]0; $principal = [decimal]0; $credit = [decimal]0
foreach ($c in $s.cards.items) {
    $debt += D $c.opening.currentOutstanding
    $principal += D $c.opening.currentPrincipal.value
    $credit += D $c.opening.credit
    foreach ($p in $c.opening.futureInstallments) { $debt += D $p.amount; $principal += D $p.principal.value }
}
$reserved = [decimal]0
foreach ($a in $s.allocations.items) { $reserved += D $a.amount }
Equal $accounts (D '1300'); Equal $investments (D '501'); Equal $debt (D '350')
Equal ($accounts + $investments + $credit - $debt) (D '1451')
Equal $reserved (D '550'); Equal $principal (D '344')
Equal ((D '1000') - $principal) (D '656')
Equal (($accounts - 200) + $investments - ($debt - 200)) (D '1451')
Equal ((D '1000') + (D '500') - (D '200')) (D '1300')
Equal ((D '-100') + (D '500') + (D '20') - (D '200')) (D '220')
Equal ([decimal]::Round((D '0.125') * (D '10.04'), 2, [MidpointRounding]::AwayFromZero)) (D '1.26')
Equal ([decimal]::Round((D '1') * (D '1.005'), 2, [MidpointRounding]::AwayFromZero)) (D '1.01')
Equal ([decimal]::Round((D '1') * 2 / 3, 2, [MidpointRounding]::AwayFromZero)) (D '0.67')
Equal ([decimal]::Round((D '1') / 3, 2, [MidpointRounding]::AwayFromZero)) (D '0.33')
$max = D '999999999999.99'
# Two valid accounts fully allocated to one monetary goal: neither source over capacity.
$goalCovered = $max + $max
Equal $goalCovered (D '1999999999999.98')
if ($goalCovered -le $max) { throw 'Probe must exceed Money' }
# Existing nominal reservation survives an actual debit into overdraft (FIN-05).
$sourceFree = -$max - $max
Equal $sourceFree (D '-1999999999999.98')
# All Fact alternatives in v1: none honestly encodes a known out-of-range amount.
$factStates = @('KNOWN', 'UNKNOWN', 'NOT_APPLICABLE')
if ($factStates -contains 'OUT_OF_RANGE') { throw 'Recheck changed contract' }
# Unknown legacy reservations admit at least two compatible worlds, not a fabricated zero.
$possibleFree = @(((D '1000') - (D '0')), ((D '1000') - (D '300')))
if ($possibleFree[0] -eq $possibleFree[1]) { throw 'Unknown must remain distinguishable' }
Equal ([DateTime]::DaysInMonth(2027,2)) 28
Equal ([DateTime]::DaysInMonth(2028,2)) 29
$today = [DateTime]::ParseExact('2026-10-09','yyyy-MM-dd',$culture)
foreach ($case in @(@('2026-10-08',50,100,$true), @('2026-10-09',50,100,$false), @('2026-10-08',100,100,$false))) {
    $deadline = [DateTime]::ParseExact($case[0],'yyyy-MM-dd',$culture)
    Equal (($deadline -lt $today) -and ($case[1] -lt $case[2])) $case[3]
}
Equal (Get-FileHash (Join-Path $root 'README.md') -Algorithm SHA256).Hash '6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA'
[ordered]@{
    scope='Documental; .NET decimal, sem helpers do executor ou produto'
    e01=[ordered]@{accounts='1300.00';investments='501.00';debt='350.00';netWorth='1451.00';reservations='550.00';principal='344.00';availableLimit='656.00'}
    R28_01=[ordered]@{covered=$goalCovered.ToString('F2',$culture);free=$sourceFree.ToString('F2',$culture);factStates=$factStates;result='Valor exato conhecido fora de Money sem estado representavel no DTO'}
    R28_02=[ordered]@{possibleFree=$possibleFree;result='reserved:Money exige numero apesar da reserva legada nao reconciliada'}
    boundaries='HALF_UP, NG-01 tercos, conta negativa, pagamento, prazo ontem/hoje/concluida e bissextos conferidos'
} | ConvertTo-Json -Depth 8
