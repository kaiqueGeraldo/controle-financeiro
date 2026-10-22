param([Parameter(Mandatory=$true)][string]$RuntimeRoot)
$ErrorActionPreference='Stop'
$repo=(Resolve-Path "$PSScriptRoot/../../..").Path
$runtime=[IO.Path]::GetFullPath($RuntimeRoot)
$allowed=[IO.Path]::GetFullPath("$repo/../controle-financeiro-runtimes/CF-032/")
if(-not $runtime.StartsWith($allowed,[StringComparison]::OrdinalIgnoreCase)){throw 'Runtime must belong to the CF-032 external directory'}
if(Test-Path -LiteralPath $runtime){throw 'Never overwrite a previous execution'}
New-Item -ItemType Directory -Path "$runtime/frontend","$runtime/backend","$runtime/logs" | Out-Null
foreach($name in @('src','public','scripts','package.json','package-lock.json','tsconfig.json','next-env.d.ts','next.config.ts','postcss.config.mjs','eslint.config.mjs')){
 Copy-Item -LiteralPath "$repo/controle-financeiro-frontend/$name" -Destination "$runtime/frontend" -Recurse
}
New-Item -ItemType Directory -Path "$runtime/frontend/tests" | Out-Null
foreach($name in @('component','e2e','oracles','cf032','date.test.mjs','README.md')){
 Copy-Item -LiteralPath "$repo/controle-financeiro-frontend/tests/$name" -Destination "$runtime/frontend/tests" -Recurse
}
New-Item -ItemType Junction -Path "$runtime/frontend/node_modules" -Target "$repo/controle-financeiro-frontend/node_modules" | Out-Null
# Turbopack resolves a junction only when both targets belong to its filesystem
# root. This runtime-only configuration changes no application/domain source.
$common=(Resolve-Path "$repo/..").Path | ConvertTo-Json -Compress
$nextFile="$runtime/frontend/next.config.ts"
$nextSource=[IO.File]::ReadAllText($nextFile)
[IO.File]::WriteAllText($nextFile,$nextSource.Replace('const nextConfig: NextConfig = {',"const nextConfig: NextConfig = {`n  turbopack: { root: $common },"))
foreach($name in @('src','.mvn','mvnw','mvnw.cmd','pom.xml')){
 Copy-Item -LiteralPath "$repo/controle-financeiro-backend/$name" -Destination "$runtime/backend" -Recurse
}
$manifest=[ordered]@{repo=$repo;runtime=$runtime;head=(git -C $repo rev-parse HEAD);branch=(git -C $repo branch --show-current);readme=(Get-FileHash -LiteralPath "$repo/README.md" -Algorithm SHA256).Hash;created=(Get-Date).ToString('o');node=(& node --version);dependencyJunction="$repo/controle-financeiro-frontend/node_modules"}
$manifest | ConvertTo-Json | Set-Content -LiteralPath "$runtime/manifest.json"
# Copy only the approved synthetic E01 fixture, never the repository README or environment files.
Copy-Item -LiteralPath "$repo/tasks/evidencias/CF-028/examples.json" -Destination "$runtime/e01.json"
Write-Output "Runtime prepared: $runtime"
