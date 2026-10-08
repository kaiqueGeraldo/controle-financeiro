# Comandos e proveniência — 07–08/10/2026

Raiz do monorepo, PowerShell. Scripts recusam sobrescrever diretório de integração.
Produto candidato b5e8550; logs novos nesta pasta, históricos sem regravação.

## Preparação

`git status --short`, `git branch --show-current`, `git rev-parse HEAD`,
`git diff --cached --name-only`, `Get-FileHash README.md`, ancestralidade
`git merge-base --is-ancestor d4e5a06 3ac2fc5` e `3ac2fc5 b5e8550`.
Diff de arquivos completo e produto salvos. Busca AGENTS na árvore/ancestrais.
Scripts de integração/contraprovas/runners/sanitização copiados do saneamento;
apenas destino de rv24.run alterado para esta pasta nos dois scripts de integração.

## Componentes e contraprovas

No frontend, comando base:

```powershell
node node_modules/vitest/vitest.mjs run --config tests/component/vitest.config.mts
```

Seleção explícita17arquivos, passada ao comando em ambas as tentativas:

```text
tests/component/parser-independent.test.tsx
tests/component/own-properties.test.tsx
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

Primeira execução restrita: components.log/result, EPERM rename de cache,
nenhum teste executado. Execução com permissão ao cache temporário:
components-authorized.log/result,267/267. Nenhuma alteração de assertions,
configuração, timeout ou exclusão entre essas tentativas.

Na raiz:

```powershell
./tasks/evidencias/revalidacao-RVR24-01-propriedades/run-counterproof.ps1
node tasks/evidencias/revalidacao-RVR24-01-propriedades/verify-vendor.cjs
```

Contraprova cria TEMP com src/tests/component e junction node_modules. Substitui
creationResult/creationIntent pela base d4e5a06, executa own-properties25:
17falhas/8positivos. Restaura, substitui três defineProperty por atribuições nos
dois módulos locais, executa original16:1falha/15positivos. Finally restaura
quatro arquivos; complemento25/25. Outputs e hashes em counterproof.json.
Isso não modifica a árvore principal nem apresenta mutantes como candidato.

Complemento desta revisão object-boundary.test.tsx copiado para tests/component
da cópia registrada em counterproof.json, depois executado pelo mesmo comando
base com esse arquivo explícito:5/5. Tem35fixtures de comparação não financeira,
setter restaurado, reviver, discriminador e wrapper. Hash da fonte executada
conferido pelo verificador final. Não adiciona teste artificial de produto nem
usa algoritmo financeiro produtivo como oráculo.

## Integrações

```powershell
./tasks/evidencias/revalidacao-RVR24-01-propriedades/run-integration.ps1 -RunName buy
./tasks/evidencias/revalidacao-RVR24-01-propriedades/run-precision-integration.ps1 -RunName ng01 -SpecPath tasks/evidencias/saneamento-RVR24-01-precisao/recovery.integrated.spec.ts
```

JDK21 do runtime-path.txt histórico, Maven cache local, PostgreSQL16 descartável,
sem clean. Runners Spring copiados para backendTEMP; browser spec/config externos,
frontend candidato principal sem mutações. Um runner/uma jornada por execução,
ambos passaram. Não somar runner Java e caso Playwright como jornadas diferentes.
Testes reais encerram serviços/banco; fontes principais/backendcopysrc comparadas.

## Gates finais

No frontend, após término dos dev servers integrados:

```powershell
node node_modules/eslint/bin/eslint.js --format json --output-file ../tasks/evidencias/revalidacao-RVR24-01-propriedades/lint.json
node node_modules/typescript/bin/tsc --noEmit --incremental false
node node_modules/next/dist/bin/next build
```

Todos exits0, lint zero erros/avisos. Logs/typecheck/build/static-result preservados.

## Preservação e commit

sanitize-evidence.ps1 aplicado somente a outputs novos; manifest de hashes antes/
depois, credenciais sintéticas redigidas quando presentes. Não alterar históricos
nem atribuir autenticidade histórica a reconstruções. Evidências não dependem de target.

verify-review.cjs confronta hash original/blobs/cópias, restauração de src, candidato
intacto, resultados, SQL/tokens, README e estados canônicos. Gera checkpoint.json;
`node tasks/evidencias/revalidacao-RVR24-01-propriedades/verify-review.cjs --check`
confere sem regravar. Staging explícito: esta pasta e notas/estados documentais.
Diff staged inspecionado; README raiz excluído. CRLF/espaços de logs são bytes
originais, preservados com -text, não reformatados para limpar avisos de whitespace.
Nenhum push/deploy/banco real/CF-028. Commit e HEAD finais informados na entrega.
