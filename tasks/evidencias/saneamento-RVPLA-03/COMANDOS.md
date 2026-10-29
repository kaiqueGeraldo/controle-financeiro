# Reprodução em runtimes novos

PowerShell/Windows, Java21.0.12+8 explícito (diretório nativo21.0.12.1+1), Node24.18.0,
Maven wrapper3.9.12 e Docker Desktop local; PG16.15/17.11 descartáveis. Prazos
originais preservados; nenhuma repetição automática de teste para obter verde.
As pastas desta coleta já existem; escolher nomes novos antes de reproduzir.

```powershell
$env:JAVA_HOME = (Resolve-Path 'controle-financeiro-backend/target/temurin21/jdk-21.0.12.1+1').Path
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
$taskBase = '../controle-financeiro-runtimes/preparacao-adocao'
node tasks/evidencias/saneamento-RVPLA-03/process-probes.mjs "$taskBase/rvpla03-NOVO-processos"
node tasks/evidencias/saneamento-RVPLA-03/edge-probes.mjs "$taskBase/rvpla03-NOVO-janelas"
node tasks/evidencias/saneamento-RVPLA-03/shared-process-probe.mjs "$taskBase/rvpla03-NOVO-compartilhado"
node tasks/evidencias/saneamento-RVPLA-03/mutation.mjs "$taskBase/rvpla03-NOVO-mutacao"

New-Item -ItemType Directory "$taskBase/rvpla03-NOVO-unit" | Out-Null
$env:REVALIDATION_RUNTIME = [IO.Path]::GetFullPath("$taskBase/rvpla03-NOVO-unit")
node --test --test-reporter=tap tasks/evidencias/preparacao-local-adocao/counterproof-checkpoint.test.mjs tasks/evidencias/revalidacao-preparacao-local-adocao/checkpoint-independente.test.mjs .github/scripts/ci.test.mjs

node tasks/evidencias/preparacao-local-adocao/prepare.mjs "$taskBase/rvpla03-NOVO-pg"
node tasks/evidencias/saneamento-RVPLA-03/regression-worker.mjs "$taskBase/rvpla03-NOVO-pg"
# Auditoria de leitura; exige as rodadas nomeadas da entrega para comparar seus resultados.
node tasks/evidencias/saneamento-RVPLA-03/auditar.mjs "$taskBase/rvpla03-NOVO-auditoria"
```

Executar sequencialmente os cenários de aplicação. O wrapper de regressão salva
cada exit/log/XML e continua para registrar as invocações independentes; conferir
`regression.json` e XMLs, não interpretar exit final como todos os gates verdes.
PG16/17 incluem intencionalmente o probe original de reuso, que continuou falho.
Ele é copiado byte idêntico somente ao checkout descartável. A mutação de porta
também só ocorre ali, com restauração em finally e conferência SHA.

Para preflight real, após exportação NOVA, executar o runner canônico com imagem
local verificada e `only=preflight-hides-missing-constraint`; depois `resume` e
`audit` no mesmo escopo, com o mesmo ambiente. Comparar SHA do checkpoint antes
e depois; não copiar recibos entre raízes. Isso não certifica as outras quatro
contraprovas, o gate completo de startup ou adoção real.

A reprodução anterior foi `quiescencia-orfao.ps1` da revisão, antes da correção,
com destino adaptado em cópia isolada. O código antigo não deve ser executado
contra uma pasta de prova existente. SHA do original e da cópia adaptada estão
no runtime before-01; os critérios originais não foram modificados.

`preservar.mjs inicial` e `final` escrevem arquivos exclusivos; não sobrescrever
os snapshots desta entrega. `coletar.mjs` mantém SHA original/coletado, sanitiza
logs e encurta nomes por hash quando necessário. A primeira coleta foi feita
antes da defesa entre sessões; a coleta final acrescenta suas provas, sem apagar
o recibo parcial. Os probes v1/v2 falhos são evidência do próprio observador.
