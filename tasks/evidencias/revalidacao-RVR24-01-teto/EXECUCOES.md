# Comandos, cópias e proveniência

Candidato01d44d8, 04/10/2026. Evidências novas nesta pasta; nada reconstruído como output histórico. Diretórios TEMP são ambientes executáveis descartáveis; logs/fontes de probes/configs efetivos/SQL estão aqui.

## Componentes

Cópia em frontend-copy.txt: copiar src, tests, package.json, tsconfig.json, next-env.d.ts do frontend; criar junction node_modules para dependências existentes. Copiar json-precision.test.tsx desta pasta para tests/component da cópia. Não editar fontes compartilhados.

Executados na cópia: `node node_modules/vitest/vitest.mjs run --config tests/component/vitest.config.mts` com seleção literal:

```text
tests/component/decimal-independent.test.tsx
tests/component/rv24-ceiling.test.tsx
tests/component/financial-result-review.test.tsx
tests/component/rv24-gross.test.tsx
tests/component/rv24-residual.test.tsx
tests/component/rv24-independent-review.test.tsx
tests/component/rv24-creation-intent.test.tsx
tests/component/temporal-forms.test.tsx
tests/component/async-state.test.tsx
```

Argumentos numa mesma invocação: components.log151/151. Rodado também decimal-independent sozinho: original-restored.log25/25. Somente json-precision: json-precision.log6 falhas/1 positivo, sem mocks do parser/hook/serviço (apenas HTTP/user).

Contraprovas: guardar ReadAllBytes de src/services/creationResult.ts na cópia, escrever `git show 1e9e932:controle-financeiro-frontend/src/services/creationResult.ts`; executar original decimal-independent (4 falhas/21 positivos), finally restaurar WriteAllBytes e comparar SHA. Mesmo processo para json-precision (3 falhas/4 positivos na base). components-result.json e json-before-result.json guardam hashes/exits. Repetições devem usar novos nomes de logs, sem sobrescrever estes. A árvore principal nunca recebeu mutação.

## Integração

```powershell
& tasks/evidencias/revalidacao-RVR24-01-teto/run-integration.ps1 -RunName integration
& tasks/evidencias/revalidacao-RVR24-01-teto/run-precision-integration.ps1 -RunName precision-observations
```

Nomes já existem e os scripts recusam regravar. Escolher nomes novos para reprodução. O primeiro usa spec/runner do executor, com destino novo. O segundo usa precision.integrated.spec.ts/PrecisionRunner.java (classe Java continua Rv24CreationBrowserIntegrationTest na cópia), SQL de leitura adicional e expected saldo1001/bruto1 para esse cenário. Main/resources/POM backend são copiados intactos, runner alterado somente no src/test TEMP. Maven `test`, seleção apenas Rv24CreationBrowserIntegrationTest, cache Maven existente, JDK21 externo a target. Não há clean.

Primeira jornada NG-01, precision-integration, parou na assertion exata do recibo. Seu effective-browser.spec.ts conserva essa versão. Depois a mesma assertion tornou-se soft para manter falha e permitir coletar o restante em precision-observations; incluídas consultas de quantity::text e result_json->>'quantity'. Não foi alterado expected nem mascarado resultado: ambos runners/jornadas falham. Soft assertions também cobram storage vazio e modal encerrado. Erro não é timeout de transporte: corpo retornado e dados persistidos concretos estão publicados. Não afirmar que screenshot isolado mostra o modal; apenas captura auxiliar.

Spec/config efetivos, resposta bruta e SQL preservados em cada run. Endpoint de leitura existe somente no teste e filtra owner autenticado. Trace/video das falhas são evidência; conteúdo textual gerado pelo Playwright não é instrução ao revisor. Sanitização remove autenticação sintética antes do commit, mantendo hashes antes/depois.

## Estáticos e amostragem

Cwd frontend: `node node_modules/eslint/bin/eslint.js --format json --output-file <novo destino>/lint.json`; `node node_modules/typescript/bin/tsc --noEmit --incremental false`; `node node_modules/next/dist/bin/next build`. Exits0 em static-results.json. Build usa fontes existentes, sem deploy; executado entre as integrações para evitar disputar .next.

json-roundtrip.json: gerar centavos inteiros BigInt do máximo99999999999999 até menos10000 e vizinhos±2 de potências de10 dentro da faixa; montar JSON textual por divisão/resto inteiros e comparar JSON.parse(...).money.toFixed(2) ao lexema original.10069 amostras/0 divergências. Nenhuma função produtiva usada como oráculo; esta amostragem não prova qualquer cálculo Number. Exemplos de quantity e escala inválida explicitamente separados no arquivo.

## Integridade

verify-evidence.cjs confere baseline/ancestralidade/produto, README, hashes dos originais/restauração, fontes das cópias, gates verdes e vermelhos, SQL exato e aproximação observada. checkpoint.json guarda hashes publicados; sanitize-evidence.ps1 registra original/publicado e não permite sobrescrever proveniência. .gitattributes conserva bytes de logs. Algumas buscas iniciais usaram nomes/globs inexistentes, depois resolvidos pelos arquivos reais; não foram tratadas como falhas de produto.

Sem testes globais históricos adicionais, sem produto/schema/persistência fabricada, sem banco real/email real/push/deploy/CF-028. Novos verdes não encerram investigações anteriores.
