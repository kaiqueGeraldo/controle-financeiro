# Execuções e proveniência

04/10/2026; fontes candidatas e069e33. Todos os logs nesta pasta são novos desta execução. Históricos permanecem nas pastas anteriores e não foram reconstruídos.

## Componente e contraprova

Foi criada cópia TEMP `rvr24-independent-front-*` (caminho exato em frontend-copy.txt) copiando src, tests, package.json, tsconfig.json e next-env.d.ts; junction node_modules aponta dependências instaladas do frontend. Nenhum fonte compartilhado é escrito. O probe novo é copiado para tests/component/decimal-independent.test.tsx somente nessa cópia. Vitest usa a configuração original tests/component/vitest.config.mts com alias para src da cópia.

`run-components.ps1` preserva os bytes candidatos de creationResult.ts, lê o fonte de c45bfb6 via git show, aplica somente na cópia e executa financial-result-review. finally restaura os bytes; hash antes/depois idêntico. Roda o mesmo probe restaurado e seleção dirigida. A versão final do script exige RunName novo e conserva logs em subpasta, por exemplo:

```powershell
& tasks/evidencias/revalidacao-RVR24-01-bruto/run-components.ps1 -RunName component-rerun
```

Pré-requisito: cópia indicada em frontend-copy.txt disponível; se removida, criar outra como descrito e registrar caminho novo sem reatribuir os outputs desta execução. O script final retorna1 enquanto os quatro casos de teto falharem. A execução inicial, antes desses quatro casos, foi registrada em original-red.log, original-restored.log, components.log e components-result.json. Seu gate121 era verde. Nenhum desses outputs foi regravado.

Após acrescentar o limite normativo, executado primeiro somente decimal-independent.test.tsx (decimal-limits.log/result) e depois seleção final de oito arquivos (components-final.log/result):

```text
node node_modules/vitest/vitest.mjs run --config tests/component/vitest.config.mts
 tests/component/financial-result-review.test.tsx
 tests/component/rv24-gross.test.tsx
 tests/component/rv24-residual.test.tsx
 tests/component/rv24-independent-review.test.tsx
 tests/component/rv24-creation-intent.test.tsx
 tests/component/temporal-forms.test.tsx
 tests/component/async-state.test.tsx
 tests/component/decimal-independent.test.tsx
```

A seleção deve ser passada em uma invocação, com os argumentos unidos. Resultado final125:121 passam,4 falham. As quatro assertions novas não foram ajustadas ao observado; pertencem ao mesmo resíduo, não a falha de ambiente. Não houve timeout/retry/skip acrescentado.

## Integração

```powershell
& tasks/evidencias/revalidacao-RVR24-01-bruto/run-integration.ps1 -RunName integration
```

O destino integration já existe e o script recusará sobrescrita. Para repetição, usar nome novo. Script adaptado do executor apenas para apontar esta pasta nova; spec e template Java são cópias do harness publicado. Não representam autoria nova do cenário. Na cópia backend TEMP, o runner efetivo troca os caminhos para frontend/config externos. Main Java/resources/POM permanecem idênticos ao candidato. Testcontainers cria PostgreSQL descartável, sem clean; Maven test somente Rv24CreationBrowserIntegrationTest. JDK21 externo a target reutilizado do caminho registrado pela revisão anterior; a execução não reconstruiu outputs antigos. Artefatos de cenário/SQL/screens/logs foram gravados diretamente nesta pasta durável.

Resultado1 runner sem falhas/errors/skips e1 jornada Chromium. O script conserva spec/config efetivos em integration; o callback de route.fulfill adultera exclusivamente resposta após route.fetch real. A captura final foi inspecionada. Nada de inferir ausência de efeito apenas por toast ou pelo estado React. Endpoint SQL somente no teste, filtrado por owner autenticado; email/mercado doubles.

## Gates estáticos

Cwd frontend, sequencialmente: `node node_modules/eslint/bin/eslint.js --format json --output-file <evidência>/lint.json`; `node node_modules/typescript/bin/tsc --noEmit --incremental false`; `node node_modules/next/dist/bin/next build`. Exits separados em static-results.json; lint249 arquivos0/0. Build com acesso às fontes existentes, sem deploy. Fontes/configuração compartilhados intactos.

## Preservação e limites

verify-evidence.cjs confere original nos três locais e no blob c45bfb6; ancestrais/intervalo, diff de produto/históricos, README alheio, fontes das cópias, resultados positivos e negativos e checkpoints SQL. checkpoint.json guarda hashes dos artefatos publicados. sanitize-evidence.ps1, derivado da revisão anterior, preserva SHA antes/depois e remove credenciais sintéticas eventualmente presentes; sanitization.json não é reaplicado para apagar proveniência.

Logs preservam quebras/whitespace emitidos; .gitattributes evita conversão dos bytes. Primeiras buscas usaram dois caminhos/globs inexistentes, corrigidos pelos arquivos reais; isso não é falha de produto ou contraprova. O novo achado de teto surgiu na inspeção normativa depois do primeiro gate; a regressão ampliada vermelha foi preservada. Não surgiu ECONNRESET nesta jornada; investigações anteriores não foram encerradas. Nenhuma auditoria global, banco real, publicação ou implementação CF-028.
