param([string]$Run = 'final-verificado')
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$directory = Join-Path $PSScriptRoot "browser/$Run"
function Read-Sheet([string]$File, [int]$Sheet) {
    $archive = [System.IO.Compression.ZipFile]::OpenRead((Join-Path $directory $File))
    try {
        $reader = [System.IO.StreamReader]::new($archive.GetEntry("xl/worksheets/sheet$Sheet.xml").Open())
        try { [xml]$document = $reader.ReadToEnd() } finally { $reader.Dispose() }
        $cells = @{}
        foreach ($cell in $document.SelectNodes("//*[local-name()='c']")) {
            $cells[$cell.GetAttribute('r')] = $cell.InnerText
        }
        return $cells
    } finally { $archive.Dispose() }
}
function Require([bool]$Condition, [string]$Message) {
    if (!$Condition) { throw $Message }
    $Message
}
$zero = Read-Sheet 'san-e3-zero-conhecido.xlsx' 1
$zeroCoverage = Read-Sheet 'san-e3-zero-conhecido.xlsx' 2
$absent = Read-Sheet 'san-e3-ausente.xlsx' 1
$absentCoverage = Read-Sheet 'san-e3-ausente.xlsx' 2
Require ($zero['B3'] -eq '0.0' -and $zero['C3'] -eq '0.00') 'Zero coberto: B3 numérico 0 e C3 decimal exato 0.00.'
Require ($zeroCoverage['A1'] -eq 'Cobertura: COMPLETE') 'Aba Cobertura: COMPLETE.'
Require ($absent['B3'].StartsWith('Indisponível') -and $absent['C3'] -eq '0.00') 'Período ausente: B3 indisponível, C3 observado 0.00 separado.'
Require ($absentCoverage['A1'] -eq 'Cobertura: UNAVAILABLE') 'Aba Cobertura: UNAVAILABLE.'
$cash = Read-Sheet 'san-e27-caixa.xlsx' 1
Require ($cash['C3'] -eq '10.00' -and $cash['C4'] -eq '1.00' -and $cash['C5'] -eq '9.00') 'E27 resumo gerencial observado: receita10, taxa1, resultado9.'
$incomeRow = ($cash.Keys | Where-Object { $_ -match '^C\d+$' -and $cash[$_] -eq 'Proventos: SANCASH' }) -replace '^C',''
$feeRow = ($cash.Keys | Where-Object { $_ -match '^C\d+$' -and $cash[$_] -eq 'Retenção de proventos: SANCASH' }) -replace '^C',''
Require ($incomeRow.Count -eq 1 -and $feeRow.Count -eq 1) 'Duas linhas E27 identificadas pelo fato, sem compensar erro por soma.'
Require ([decimal]$cash["G$incomeRow"] -eq 10 -and [decimal]$cash["L$incomeRow"] -eq 9 -and [decimal]$cash["M$incomeRow"] -eq 9) 'Provento: bruto10, caixa9 e sinal+9.'
Require ([decimal]$cash["G$feeRow"] -eq 1 -and [decimal]$cash["L$feeRow"] -eq 0 -and [decimal]$cash["M$feeRow"] -eq 0) 'Taxa: bruto1, caixa0 e sinal0.'
$transfers = Read-Sheet 'san-e2-transferencias.xlsx' 1
Require (-not ($transfers.Values -contains 'SAN compra cartão')) 'Filtro TRANSFER do arquivo efetivamente baixado exclui a compra em cartão.'
Require ($transfers['C4'] -eq '0.00') 'Filtro TRANSFER: consumo observado zero, sem inserir cartão.'
