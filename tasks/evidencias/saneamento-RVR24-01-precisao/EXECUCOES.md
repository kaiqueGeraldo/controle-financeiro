# Comandos reproduzíveis — RVR24-01 precisão

Executados a partir da raiz, PowerShell. Logs não foram sobrescritos para esconder falhas. Antecedentes: git status --short, git branch --show-current, git rev-parse HEAD, git diff --cached --stat, git show --stat 28e5682, git merge-base --is-ancestor 28e5682 HEAD, git log28e5682..HEAD. Base era HEAD, staging vazio.

## Independentes

Copiar byte a byte tasks/evidencias/revalidacao-RVR24-01-teto/json-precision.test.tsx para controle-financeiro-frontend/tests/component/json-precision.test.tsx.
No frontend: npm.cmd run test:component -- tests/component/json-precision.test.tsx
Antes: probes-before.log (6falham/1passa); depois: probes-after-original.log (1falha/6passam).
Após executar, a cópia intacta foi movida explicitamente para json-precision.original.test.tsx nesta evidência. Não há skip. Variante com fronteira corrigida é precision-boundary.test.tsx; motivo no README.

## Componentes e estáticos

No frontend:
npm.cmd run test:component -- tests/component/precision-boundary.test.tsx tests/component/precision-decimals.test.tsx tests/component/decimal-independent.test.tsx tests/component/rv24-ceiling.test.tsx tests/component/financial-result-review.test.tsx tests/component/rv24-gross.test.tsx tests/component/rv24-residual.test.tsx tests/component/rv24-independent-review.test.tsx tests/component/rv24-creation-intent.test.tsx tests/component/temporal-forms.test.tsx tests/component/async-state.test.tsx
→178/178, components-final.log.
npm.cmd run test:component -- tests/component/http-contract.test.tsx tests/component/bff-contract.test.tsx tests/component/cf026-contracts.test.tsx tests/component/rv24-original-contract.test.tsx
→46/46; após adicionar dois checks de bytes, bff-contract isolado8/8. Total único226.
npm.cmd run lint -- --format json --output-file ../tasks/evidencias/saneamento-RVR24-01-precisao/lint-final.json
npm.cmd run typecheck
npm.cmd run build
Build precedeu somente dois novos testes BFF; produto idêntico, lint/typecheck repetidos após os testes novos.

## Integrações (banco descartável)

Da raiz, scripts desta pasta:
./run-precision-integration.ps1 -RunName before
→compilação bloqueada antes dos testes (cache Maven no sandbox).
./run-precision-integration.ps1 -RunName before-authorized
→jornada original reproduz falha, fonte de produto28e5682.
./run-precision-integration.ps1 -RunName after-original -Selection 'Rv24CreationBrowserIntegrationTest,FinancialIntentsIntegrationTest'
→browser1/1; fixtureJava2falhas preservadas.
./run-precision-integration.ps1 -RunName after-recovery -SpecPath 'tasks/evidencias/saneamento-RVR24-01-precisao/recovery.integrated.spec.ts' -Selection 'Rv24CreationBrowserIntegrationTest,FinancialIntentsIntegrationTest,Cf024ConcurrencyCacheIntegrationTest'
→browser1/1, CF02430/30, fixtureJava1falha preservada.
./run-buy-integration.ps1 -RunName buy-regression
→browser1/1, FinancialIntents5/5 após correção da representação do fixture.

Os scripts recusam sobrescrever RunName já existente. Use outro nome para revalidar; nenhuma exclusão necessária. Wrapper Maven sem clean: --batch-mode -Dmaven.repo.local=C:/Users/Aluga.com/.m2/repository -Dtest=<seleção> -Drv24.run=<pasta durável> test. JAVA_HOME vem do runtime-path.txt histórico existente, não target. Serviços locais e Testcontainers encerrados pelos runners.

## Consumidor dos bytes reais

node --experimental-strip-types tasks/evidencias/saneamento-RVR24-01-precisao/verify-consumer.mjs
→parser/validador de produto sobre os três corpos capturados; consumer-projection.json. Não é nova operação nem reprodução histórica.

Sanitização explícita antes do staging: sanitize-evidence.ps1, preservando hashes de origem/publicação. Fontes originais de testes não são sanitizadas/reformatadas. verify-evidence.mjs verifica hashes, resultados e estados finais. Evidências não dependem de target.
