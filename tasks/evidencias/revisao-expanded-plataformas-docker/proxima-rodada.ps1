param(
    [Parameter(Mandatory = $true)][string]$Runtime,
    [Parameter(Mandatory = $true)][string]$Java21
)
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
$repository = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../../..'))
$allowed = [IO.Path]::GetFullPath((Join-Path $repository '../../controle-financeiro-runtimes/preparacao-adocao')) + [IO.Path]::DirectorySeparatorChar
$destination = [IO.Path]::GetFullPath($Runtime)
if (-not $destination.StartsWith($allowed, [StringComparison]::OrdinalIgnoreCase)) { throw 'Runtime fora da raiz autorizada' }
if (Test-Path -LiteralPath $destination) { throw 'Use um runtime novo' }
if (-not (Test-Path -LiteralPath (Join-Path $Java21 'bin/java.exe'))) { throw 'JDK 21 ausente' }
$daemon = & docker --context desktop-linux info --format '{{.ID}}'
if ($LASTEXITCODE -ne 0 -or $daemon -ne '2455a676-938f-48d8-a0ef-67c98474314d') { throw 'Daemon diferente do preflight: revalidar infraestrutura antes da expanded' }
$env:JAVA_HOME = $Java21
$env:Path = (Join-Path $Java21 'bin') + [IO.Path]::PathSeparator + $env:Path
$env:MAVEN_ARGS = '--offline'
$env:DOCKER_HOST = 'npipe:////./pipe/dockerDesktopLinuxEngine'
$env:DOCKER_CONTEXT = 'desktop-linux'
$env:TESTCONTAINERS_HOST_OVERRIDE = '127.0.0.1'
$env:CF034_SUITE = 'expanded'
$env:PLAYWRIGHT_BROWSERS_PATH = '0'
foreach ($variable in @('TESTCONTAINERS_RYUK_DISABLED','TESTCONTAINERS_CHECKS_DISABLE','RF15_RVA_ONLY','GITHUB_ACTIONS')) {
    Remove-Item -LiteralPath ('Env:' + $variable) -ErrorAction SilentlyContinue
}
$env:TESTCONTAINERS_REUSE_ENABLE = 'false'
Push-Location -LiteralPath $repository
try {
    $candidate = & node (Join-Path $PSScriptRoot 'preparar-proxima.mjs') $destination
    if ($LASTEXITCODE -ne 0) { throw 'Preparacao recusada' }
    & node (Join-Path $candidate '.github/scripts/ci.mjs') all $candidate (Join-Path $destination 'windows-expanded')
    if ($LASTEXITCODE -ne 0) { throw 'Rodada incompleta: preservar primeira falha e nao reapresentar como aprovada' }
} finally {
    Pop-Location
}
