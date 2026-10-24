param([Parameter(Mandatory=$true)][string]$RuntimeRoot)
$ErrorActionPreference='Stop'
$repo=(Resolve-Path "$PSScriptRoot/../../..").Path
$runtime=[IO.Path]::GetFullPath($RuntimeRoot)
$allowed=[IO.Path]::GetFullPath("$repo/../controle-financeiro-runtimes/CF-033/revalidacao-")
if(-not $runtime.StartsWith($allowed,[StringComparison]::OrdinalIgnoreCase)){throw 'Only dedicated review runtimes allowed'}
if(Test-Path -LiteralPath $runtime){throw 'Never overwrite a previous runtime'}
New-Item -ItemType Directory -Path "$runtime/backend" | Out-Null
foreach($name in @('src','.mvn','mvnw','mvnw.cmd','pom.xml')){
 Copy-Item -LiteralPath "$repo/controle-financeiro-backend/$name" -Destination "$runtime/backend" -Recurse
}
[ordered]@{runtime=$runtime;head=(git -C $repo rev-parse HEAD);branch=(git -C $repo branch --show-current);readme=(Get-FileHash -LiteralPath "$repo/README.md" -Algorithm SHA256).Hash;created=(Get-Date).ToString('o');scope='backend integration only; PostgreSQL Testcontainers16'} | ConvertTo-Json | Set-Content "$runtime/manifest.json"
