# Execuções e proveniência

Execuções iniciadas em04/10/2026; parecer consolidado em05/10/2026 após retomada.
Logs são outputs desta revalidação, não reconstruções históricas. Candidato98d0343.

## Preparação e frontend

Na raiz: `git status --short`, `git branch --show-current`, `git rev-parse HEAD`,
`git diff --cached --name-only`, `Get-FileHash README.md`;
`git merge-base --is-ancestor 28e5682 2d3245d` e `2d3245d 98d0343` (ambos0).
`git diff --name-status 28e5682..98d0343`; diff funcional salvo em product.diff.

Cópia frontend TEMP registrada em frontend-copy.txt: src/tests/package.json/
tsconfig.json/next-env.d.ts copiados, node_modules por junction. Original histórico
copiado byte a byte de revalidacao-RVR24-01-teto/json-precision.test.tsx para
tests/component/json-precision-original.test.tsx. Novo parser-independent.test.tsx
copiado desta pasta para tests/component da cópia. Nenhum teste principal editado.

Na cópia, comando base:

```powershell
node node_modules/vitest/vitest.mjs run --config tests/component/vitest.config.mts tests/component/json-precision-original.test.tsx
node node_modules/vitest/vitest.mjs run --config tests/component/vitest.config.mts tests/component/parser-independent.test.tsx
```

Outputs respectivamente original.log (1falha/6passam) e parser-independent.log
(4falhas/12passam). Falhas do original e do probe novo têm decisões distintas no parecer.

Na raiz: `./tasks/evidencias/revalidacao-RVR24-01-precisao/run-client-counterproof.ps1`.
Muda uma expressão em api.ts somente TEMP para JSON.parse, executa originais
(6falhas/1passa), depois três transportes do probe novo com `-t inherited-only`
(3passam;13 fora da seleção). Não é aprovação de toda a suíte mutante nem exclusão
para mascarar os quatro vermelhos candidatos. Restauração em finally/hash igual.

Frontend principal, comando base Vitest acima, estes15 arquivos explícitos:

```text
tests/component/precision-boundary.test.tsx
tests/component/precision-decimals.test.tsx
tests/component/decimal-independent.test.tsx
tests/component/rv24-ceiling.test.tsx
tests/component/financial-result-review.test.tsx
tests/component/rv24-gross.test.tsx
tests/component/rv24-residual.test.tsx
tests/component/rv24-independent-review.test.tsx
tests/component/rv24-creation-intent.test.tsx
tests/component/temporal-forms.test.tsx
tests/component/async-state.test.tsx
tests/component/http-contract.test.tsx
tests/component/bff-contract.test.tsx
tests/component/cf026-contracts.test.tsx
tests/component/rv24-original-contract.test.tsx
```

components.log:226/226. No mesmo cwd, após encerrar os dev servers integrados:

```powershell
node node_modules/eslint/bin/eslint.js --format json --output-file ../tasks/evidencias/revalidacao-RVR24-01-precisao/lint.json
node node_modules/typescript/bin/tsc --noEmit --incremental false
node node_modules/next/dist/bin/next build
```

static-result.json:todos exits0. lint.json zero erros/avisos; typecheck.log/build.log.

## Backend e browser

Scripts copiados do saneamento e adaptados somente no destino durável rv24.run;
geram backendTEMP e configuração browser externa, sem sobrescrever execuções.
JDK21 lido do runtime-path.txt histórico existente; cache Maven local e Docker
autorizados pela execução, PostgreSQL16 descartável. Sem clean.

```powershell
./tasks/evidencias/revalidacao-RVR24-01-precisao/run-precision-integration.ps1 -RunName ng01 -SpecPath tasks/evidencias/saneamento-RVR24-01-precisao/recovery.integrated.spec.ts -Selection 'Rv24CreationBrowserIntegrationTest,FinancialIntentsIntegrationTest,HttpContractControllerTest,TemporalJsonContractTest'
./tasks/evidencias/revalidacao-RVR24-01-precisao/run-buy-integration.ps1 -RunName buy
./tasks/evidencias/revalidacao-RVR24-01-precisao/run-backend-counterproof.ps1
```

NG01:30/30 (6HTTP,18temporal,5recibos,1runner browser). BUY:6/6
(5recibos repetidos,1runner browser). Um teste Playwright em cada execução,
fontes/config efetivas, SQL, corpos brutos e logs nas respectivas subpastas.
Não somar runner Java e browser como duas jornadas.

Contraprova backend reaproveita cópia ng01: remove somente
`.with(DeserializationFeature.USE_BIG_DECIMAL_FOR_FLOATS)` e executa
`FinancialIntentsIntegrationTest#exactExistingDecimalReceiptSurvivesRecoveryAndTypedReplayWithoutRewrite`.
Uma falha causal (1.0E12); finally restaura bytes; mesmo teste passa1/1 após
recompilar. Logs separados backend-old/restored, hashes iguais no JSON.

## Verificação final

sanitize-evidence.ps1 aplica redação de credenciais sintéticas apenas em outputs
novos; sanitization.json registra hashes de origem/publicação. Não modifica
históricos, fontes de teste nem atribui autenticidade a dados reconstruídos.

`node tasks/evidencias/revalidacao-RVR24-01-precisao/verify-review.cjs` confere:
originais contra blobs Git/hashes, produto intacto, fontes TEMP restauradas,
exits/contagens, oráculos SQL/corpos e README. Gera checkpoint.json com hashes
dos artefatos. `--check` valida esse checkpoint sem regravar.

Staging explícito somente desta pasta e dos dois canônicos RV24-01/CF-009;
`git diff --cached --stat`, `--name-only`, `--check` e diff documental inspecionados
antes do commit. README alheio permanece fora do index. Commit local registrado
na resposta final; nenhum push/deploy ou implementação CF-028.

O diff --check integral sinaliza CRLF e espaços de outputs brutos preservados
com `* -text`; não foram reformatados para apagar avisos e alterar seus hashes.
O check dos documentos/probe/verificador autorais, com core.whitespace=cr-at-eol,
passou. Essa observação de whitespace é documental, não falha de teste ou harness.
