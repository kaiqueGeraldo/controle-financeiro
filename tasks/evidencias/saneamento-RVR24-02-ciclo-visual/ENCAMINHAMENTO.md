# Encaminhamento ao mesmo revisor

Achado exato: **P2 confirmado — CF014, ciclo visual da operação (vínculo RVR24-02)**. Revalidar somente este recorte, conservando RF15-01/02/03/04, resíduos já encerrados e CF011/012. Base cbbf58df6d4034d8c28fd813fc3d7948f4c7da2e; branch codex/cf-028-contrato-onboarding; intervalo completo cbbf58d..HEAD do commit documental desta entrega. Sem pedido de nova auditoria integral.

## Arquivos e provas

Commit de implementação/testes: **cf97e8d7f1e789813bb28ad854345bf6d43a7047**. O commit documental que contém este encaminhamento é a ponta do intervalo completo **cbbf58d..HEAD**, sem commits intermediários alheios. Identificá-lo por `git log --oneline cbbf58d..HEAD`; o hash da própria entrega documental consta também da resposta final.

Resultado final: prova original de componente e navegador vermelha antes, verde depois;19 novos casos de componente passaram; sete jornadas browser finais passaram com backend/PostgreSQL descartáveis. Seleção ampla final217 passaram/dois timeouts5000ms; os dois arquivos envolvidos passaram13/13 com um worker, sem mudar prazo/assertions. Lint/typecheck/build finais exit0. A primeira seleção ampliada219/219 corresponde à implementação intermediária e não substitui esse registro final.

Limite visual: ABA-preserved e lost-preserved mostram o formulário íntegro; late-recovery-preserved e algumas capturas originais não pintam a camada esperada apesar de DOM/foco verificados. VISUAL.md descreve cada imagem. Não há certificação visual integral nem encerramento da investigação de histórico invisível. Original-hashes/hash-check confirmam119 provas intactas; sanitization.json registra a única sanitização de credenciais sintéticas nas evidências novas.

- Produto: controle-financeiro-frontend/src/components/forms/operationModal.tsx. Nenhum hook compartilhado, manager, serviço, DTO, backend de produto ou protocolo alterado.
- Complementos: tests/component/rvr24-visual-instance.test.tsx (19 casos), tests/e2e/rvr24-visual.integrated.spec.ts e playwright.rvr24-visual.config.ts; Rvr24VisualBrowserTest.java somente harness descartável.
- Provas originais: rf15-review-lifecycle.test.tsx e rf15-review-residual.integrated.spec.ts, intactas; hash-check.json e original-hashes.json (119 arquivos). Regressão de histórico/Escape/foco original em rf15-matrix.integrated.spec.ts.
- Evidências: README.md descreve causas/resultados intermediários; VISUAL.md registra inspeção e limites; browser-before-ready conserva vermelho causal, browser/final concentra rodada final; persisted.txt correlaciona banco sintético, JSON correlaciona requisição/recibo/UI. Traces de falha preservados em artifacts.

## Condições objetivas de encerramento

1. Probes originais antes vermelhos passam sem alterar expectativas positivas: um POST, onSuccess legítimo, envelope confirmado resolvido e nenhum onClose de A sobre B.
2. A→B→A e fechar/reabrir são novas instâncias visuais, mesmo com ID repetido; refetch do mesmo ID mantém rascunho. Sucesso/erro/recover/retry tardios não fecham, limpam, destravam loading de outra execução nem deslocam seu foco.
3. Unknown conserva UUID/payload; recuperar A desde B não trata A como sucesso de B. Resultado confirmado continua atualizando dados e removendo apenas o envelope validado. B em operação preserva UUID e loading enquanto a reconciliação A termina.
4. Troca/expiração de sessão e unmount conservam isolamento e recuperação anterior. Fluxo normal continua fechando e retornando foco ao acionador correto.
5. Recibo real, SQL, conta980, A2/custo20, B0 e histórico único confirmam o alcance financeiro executado. Não inferir duplicação a partir do defeito visual.

CF014/015 seguem em_revisao até decisão independente. Zoom200 pendente, RVA-03 inconclusivo e histórico invisível separado; observação de opacidade nesta rodada não encerra esses itens. Nenhuma tarefa posterior ou onboarding.

## Comandos reproduzíveis

PowerShell, Docker local, Java21 em controle-financeiro-backend/target/temurin21/jdk-21.0.12.1+1, Node24.18.0, PostgreSQL16 Testcontainers, Chromium Playwright1.63/Next16.1.6. Backend e auth com Clock 15jan2027, JVM UTC, browser São Paulo. E-mail/cotação falsos. Retries0, um worker browser e limites originais. Use pasta nova em review.evidence para não sobrescrever a entrega.

```powershell
$env:JAVA_HOME=(Resolve-Path 'controle-financeiro-backend/target/temurin21/jdk-21.0.12.1+1').Path
./controle-financeiro-backend/mvnw.cmd -f controle-financeiro-backend/pom.xml --batch-mode '-Dtest=Rvr24VisualBrowserTest' '-Dreview.evidence=revisor-novo' '-Dreview.grep=visual real|resposta tardia|investimento confirmed|investimento lost|investimentos histórico' '-Duser.timezone=UTC' test
npm.cmd --prefix controle-financeiro-frontend run test:component -- rf15-review-lifecycle rvr24-visual-instance rv24-residual rv24-independent-review rv24-creation-intent rv24-investment-probe rf15-residual-investment rf15-residual-dialogs --maxWorkers=1
npm.cmd --prefix controle-financeiro-frontend run lint
npm.cmd --prefix controle-financeiro-frontend run typecheck
npm.cmd --prefix controle-financeiro-frontend run build
```

Execute build após encerrar navegador/servidor de teste. Seleção ampla e resultados ficam nos logs de componentes; dois timeouts da execução com26 arquivos foram investigados em arquivos isolados sem aumento do prazo5000ms, sem retry automático ou alteração das provas.

Somente README.md raiz permanece como alteração alheia; nunca staged/commitado. Hash esperado 6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA. Sem push, deploy, banco real, checkout/reset/merge/rebase/clean. Este arquivo prepara o encaminhamento, sem envio externo automático.

Staging explícito inspecionado: fontes, documentação autoral, JSON e script sem problemas de whitespace. O diff check integral aponta espaços finais e linhas finais vazias dos logs e do error-context.md emitidos pelas ferramentas; foram preservados como evidência, sem reformatar resultados. published-hashes.json registra bytes locais publicados (antes da normalização de fim de linha do Git); source-hashes.json registra fontes testadas.
