# Execução local e reprodução

Windows/sessão atual, Node24.18.0, Java21 explícito, Maven wrapper3.9.12 e Docker
Desktop local. Novos nomes rvpla04-* obrigatórios; os desta coleta já existem.

```powershell
$taskBase = '../controle-financeiro-runtimes/preparacao-adocao'
$env:JAVA_HOME = (Resolve-Path 'controle-financeiro-backend/target/temurin21/jdk-21.0.12.1+1').Path
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
node tasks/evidencias/saneamento-RVPLA-04/handoff.mjs "$taskBase/rvpla04-NOVO-handoff" mutation
node tasks/evidencias/saneamento-RVPLA-04/inspection-faults.mjs "$taskBase/rvpla04-NOVO-faults"
node tasks/evidencias/saneamento-RVPLA-04/broker-lifecycle.mjs "$taskBase/rvpla04-NOVO-broker"
node tasks/evidencias/saneamento-RVPLA-04/broker-lifecycle.mjs "$taskBase/rvpla04-NOVO-before-child" before-child

$taskUnit = [IO.Path]::GetFullPath("$taskBase/rvpla04-NOVO-unit")
New-Item -ItemType Directory "$taskUnit/temp" | Out-Null
$env:REVALIDATION_RUNTIME = $taskUnit
$env:RESUME_TEST_RUNTIME = $taskUnit
$env:TEMP = "$taskUnit/temp"
$env:TMP = "$taskUnit/temp"
node --test --test-reporter=tap tasks/evidencias/preparacao-local-adocao/counterproof-checkpoint.test.mjs tasks/evidencias/revalidacao-preparacao-local-adocao/checkpoint-independente.test.mjs .github/scripts/ci.test.mjs

$taskReal = [IO.Path]::GetFullPath("$taskBase/rvpla04-NOVO-real")
node tasks/evidencias/preparacao-local-adocao/prepare.mjs $taskReal
node tasks/evidencias/preparacao-local-adocao/counterproofs.mjs $taskReal sha256:8c10218386234f364e264e898fa77e40cd56a0236f4eeab245cf6bb97f568ef1 only=preflight-hides-missing-constraint
node tasks/evidencias/preparacao-local-adocao/counterproofs.mjs $taskReal sha256:8c10218386234f364e264e898fa77e40cd56a0236f4eeab245cf6bb97f568ef1 resume only=preflight-hides-missing-constraint
node tasks/evidencias/preparacao-local-adocao/counterproofs.mjs $taskReal sha256:8c10218386234f364e264e898fa77e40cd56a0236f4eeab245cf6bb97f568ef1 audit only=preflight-hides-missing-constraint
node tasks/evidencias/saneamento-RVPLA-04/identity.mjs "$taskBase/rvpla04-NOVO-identity" $taskReal
```

Comparar SHA do checkpoint antes/depois de resume, número de tentativas e ausência
de Maven novo, não somente exit. O preflight real é contraprova: Maven1 com
assertion específica,0 erros/skips; o runner só conclui com a evidência causal.
Não certifica as outras quatro contraprovas ou o gate integral de startup.

A primeira reprodução usou o driver original da revisão antes de editar, com
única troca de allowlist para rvpla04-. O teste contratual original rodou byte
idêntico com RVPLA03_REVIEW_RUNTIME apontando para o novo runtime. Hashes estão
em original-01/reproduction.json; não repetir contra esse diretório preenchido.

Os grupos anteriores edges/shared/abandonment foram copiados para regression-01,
com allowlist/diretório de fixtures/import ajustados pela realocação; cópias e
recibos explicitam alterações. Os sources anteriores não foram editados. O probe
abandonment20s permaneceu falho e teve recuperação separada, sem retry automático.

preservar inicial/final e coletar inicial/append são operações exclusivas desta
entrega. Recusam sobrescrever snapshots. A coleta final reconfere fontes/cópias
anteriores, hashes dos inputs e Jobs por consulta de leitura; não encerra ninguém.
Os nomes longos são compactados por hash e mapeados, sem mover originais. Não usar
checkpoints sanitizados/realocados para resume. GUI/class de prova ficam externos.
