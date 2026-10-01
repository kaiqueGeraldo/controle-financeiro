# Exemplos reproduzíveis: executar na raiz do repositório, com nomes browser novos.
$env:JAVA_HOME = (Resolve-Path 'controle-financeiro-backend/target/temurin21/jdk-21.0.12.1+1').Path
$env:PATH = $env:JAVA_HOME + '/bin;C:/Users/Aluga.com/AppData/Local/Programs/DockerDesktop/resources/bin;' + $env:PATH
& controle-financeiro-backend/mvnw.cmd -f controle-financeiro-backend/pom.xml --batch-mode '-Dmaven.repo.local=C:/Users/Aluga.com/.m2/repository' '-Dtest=Rv24CreationBrowserIntegrationTest' ("-Drv24.run=browser-"+[guid]::NewGuid().ToString('N')) test
if ($LASTEXITCODE -ne 0) { throw 'Falha das jornadas RV24.' }
& controle-financeiro-backend/mvnw.cmd -f controle-financeiro-backend/pom.xml --batch-mode '-Dmaven.repo.local=C:/Users/Aluga.com/.m2/repository' '-Dtest=Rv24CreationBrowserIntegrationTest' '-Dreview.grep=R03' ("-Drv24.run=payment-"+[guid]::NewGuid().ToString('N')) test
if ($LASTEXITCODE -ne 0) { throw 'Falha de R03.' }
Push-Location controle-financeiro-frontend
try {
    & node node_modules/vitest/vitest.mjs run --config tests/component/vitest.config.mts
    if ($LASTEXITCODE -ne 0) { throw 'Falha de componentes.' }
    & node node_modules/eslint/bin/eslint.js
    if ($LASTEXITCODE -ne 0) { throw 'Falha de lint.' }
    & node node_modules/typescript/bin/tsc --noEmit --incremental false
    if ($LASTEXITCODE -ne 0) { throw 'Falha de typecheck.' }
    & node scripts/test.mjs
    if ($LASTEXITCODE -ne 0) { throw 'Falha de unitários.' }
    & node node_modules/next/dist/bin/next build
    if ($LASTEXITCODE -ne 0) { throw 'Falha de build.' }
} finally { Pop-Location }
