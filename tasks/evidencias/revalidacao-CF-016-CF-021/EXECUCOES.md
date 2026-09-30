# Execuções independentes e alcance

30/09/2026, Windows/PowerShell, JDK21 em `controle-financeiro-backend/target/temurin21/jdk-21.0.12.1+1`, Node24.18, PostgreSQL16 descartável via Testcontainers. Sem banco real, e-mail real, push ou deploy. E-mail/cotação são doubles externos nos harnesses; comandos financeiros percorrem navegador/BFF/Spring/PG. O processo foi interrompido por limite de uso e retomado; os logs anteriores desta revisão não foram sobrescritos.

## Inventário sem dupla contagem

| Execução | Resultado | Evidência |
|---|---|---|
| Direcionados RV/C, writers, H01/H02, comandos, correção e upgrades | 46/46 | logs/direcionados.log |
| Backend do candidato, excluídos três harnesses e as duas provas novas | 234/234, zero skips | logs/backend-candidato.log |
| H02 reforçado: escrita concorrente altera também a base de cobertura | 1/1, Flyway/validate; primeira base07/09, próxima08/09 | logs/h02-cobertura.log |
| Novas bordas independentes, Flyway V1–V11 + validate | 2 executadas, 2 falhas de assertion | logs/fronteiras-independentes.log |
| Browser saneamento, primeira execução | 16/17; SAN-BC-card120 falhou | logs/browser-saneamento.log; browser/saneamento/playwright.log; persisted.txt |
| Browser temporal, JVM UTC / São Paulo e Kiritimati | 18/18 e pós-condições Java SQL/XLSX aprovadas | logs/browser-temporal.log; browser/temporal/playwright.log e dois XLSX |
| Repetição dirigida: pagamento120 + SAN-E3 | 2/2, SQL salvo; captura360 refeita e inspecionada | logs/browser-repeticao-dirigida.log; browser/repeticao-dirigida/ |
| React do candidato | 152/152 em33 arquivos | logs/componentes.log |
| Novo componente: escopo owner/cartão/limpeza de intenção | 1/1 | logs/payment-scope.log |
| Node unitários | 6/6 | logs/unitarios.log |
| TypeScript | Aprovado (log vazio, processo concluído) | logs/typecheck.log |
| Build produção | Primeiro falhou ao baixar fontes no sandbox; repetição com rede aprovada | logs/build.log e build-rede.log |
| ESLint afetado pelo intervalo do saneamento | 0 erros/2 warnings anteriores | logs/lint-afetado.log |
| ESLint global | 23 erros/21 warnings, como baseline | logs/lint-global.log |
| CF-016 atual/adversarial | 49 estados; 6/6 mutações documentais rejeitadas; NG-01 extremos/terços | logs/oraculos-atuais.log |
| CF-016 preservação histórica estrita | Falha esperada em pom.xml, mantida | logs/preservacao-historica.log |
| XLSX realmente baixados no saneamento | Zero/ausência, gerencial10/1, caixa9/0, filtroTRANSFER aprovados | logs/xlsx.log |

Os46 direcionados estão contidos nos234; não somar como280 testes distintos. O harness Java orquestra cenários Playwright; não somar1 Java como jornada extra. O novo componente é adicional aos152. As duas falhas novas ficam fora da reprodução dos234 para comparar a alegação original, **não** para apresentar suíte ampliada verde: a execução padrão que as incluir continuará vermelha até correção. Os oráculos/mutações documentais não comprovam runtime financeiro.

## Comandos e reprodução

No backend, preparar `$env:JAVA_HOME` com o caminho acima. Todos os comandos Maven usaram `--batch-mode '-Dmaven.repo.local=C:/Users/Aluga.com/.m2/repository'`. Docker exigiu execução autorizada fora da restrição do pipe. Uma tentativa não iniciou porque o revisor automático atingiu limite de uso; após o usuário informar restabelecimento, a mesma execução foi autorizada e realizada. Não foi contornado o controle.

```powershell
.\mvnw.cmd --batch-mode '-Dmaven.repo.local=C:/Users/Aluga.com/.m2/repository' '-Dtest=IntegratedMilestoneReviewTest,MilestoneSourceConcurrencyTest,MilestoneExportSnapshotTest,MilestoneInvestmentCorrectionTest,MilestoneTransactionCommandTest,MilestoneWriterPolicyTest,IncrementalMilestoneReviewTest' '-Duser.timezone=UTC' test
.\mvnw.cmd --batch-mode '-Dmaven.repo.local=C:/Users/Aluga.com/.m2/repository' '-Dtest=IndependentRemediationBoundaryTest' '-Duser.timezone=UTC' test
.\mvnw.cmd --batch-mode '-Dmaven.repo.local=C:/Users/Aluga.com/.m2/repository' '-Dtest=*,!IntegratedMilestoneBrowserReviewTest,!MilestoneRemediationBrowserTest,!TemporalBrowserApiPostgresE2E,!IndependentRemediationBoundaryTest' '-Duser.timezone=UTC' test
.\mvnw.cmd --batch-mode '-Dmaven.repo.local=C:/Users/Aluga.com/.m2/repository' '-Dtest=MilestoneRemediationBrowserTest' '-Dreview.evidence=../../revalidacao-CF-016-CF-021/browser/saneamento' test
.\mvnw.cmd --batch-mode '-Dmaven.repo.local=C:/Users/Aluga.com/.m2/repository' '-Dtest=TemporalBrowserApiPostgresE2E' '-Duser.timezone=UTC' test
```

Harnesses usam3107 e foram executados sequencialmente. O primeiro saneamento usa namespace `san1821-f7516a59`; o temporal usa `cf007-2c4b80ff`. Cada browser registra novos usuários sintéticos. O harness original da revisão anterior não foi executado como se fosse teste do novo contrato. Seu vermelho e as adaptações permanecem consultáveis. As capturas/observações temporais completas permanecem em `controle-financeiro-frontend/tests/artifacts/cf007/cf007-2c4b80ff/visual`; os XLSX e log foram copiados para esta pasta.

No frontend:

```powershell
node node_modules/vitest/vitest.mjs run --config tests/component/vitest.config.mts
node node_modules/vitest/vitest.mjs run --config tests/component/vitest.config.mts tests/component/revalidation-payment-scope.test.tsx
node scripts/test.mjs
node node_modules/typescript/bin/tsc --noEmit
node node_modules/next/dist/bin/next build
node node_modules/eslint/bin/eslint.js .
```

Lint afetado: nomes retornados por `git diff --name-only 4e685ce..3d64e7a -- controle-financeiro-frontend`, filtrados para ts/tsx/js/mjs e passados como array ao ESLint. Na raiz, `node tasks/evidencias/CF-016/verify.mjs --current --adversarial`, `node tasks/evidencias/CF-016/verify-preservation.mjs` e `& tasks/evidencias/saneamento-CF-016-CF-021/verify-downloaded-xlsx.ps1 -Run '../../revalidacao-CF-016-CF-021/browser/saneamento'`.

## Auditoria das adaptações e capacidade causal

ADAPTACOES-DE-TESTES.md foi confrontado com diffs de testes, não tomado como prova suficiente:

- `totals`→`observed`: números10/1/9 e máximos foram mantidos no subtotal correto; adicionados null e motivo de cobertura nos totais completos. Não se chamou subtotal de total. XLSX muda coluna textual exata, mantendo significado de B/C e aba de cobertura.
- Planejamento pago: restante0 é confrontado com pagamento100 no fato e banco900. Não substituiu pagamento por zero.
- Correção temporal: seletor escolhe linha com hora08:15, preservando original23:30 e contagem2; Java verifica ambas no XLSX. Mudança evita selecionar arbitrariamente a primeira linha.
- Fixture UNKNOWN: não remove direção de TRANSFER canônica contra constraintV3. Legado de direção desconhecida permanece coberto separadamente. Log combinado vermelho do executor foi preservado; o candidato atual teve execução234 separada verde nesta revisão.
- R03: resposta perdida exige recuperar recibo de commit real e continua verificando umPOST; 404 em componente permite apenas intenção idêntica. Reconciliação substituída continua rejeitando falso sucesso. Novo teste verifica isolamento de sessionStorage por owner/cartão, retorno ao owner anterior e limpeza somente do escopo bem-sucedido. É teste de componente com HTTP double, não login/logout E2E nem durabilidade entre dispositivos.
- Capturas antigas/harness original foram substituídos por jornadas nomeadas SAN-B/C/D/E com ações reais. Setup de contas/ativos usa HTTP; compras, pagamentos, resgates, compensações, baixas, exclusões/reembolsos indicados nos nomes dos testes usam UI. JSON/SQL finais não transformam setup HTTP em ação de UI.
- Nesta revalidação, única alteração no harness existente aguarda opacity1 do pai da seção anual para capturar conteúdo. Não muda valores, assertion financeira, relógio, timeout ou retry. A imagem inicial vazia continua preservada.

Vermelho causal aproveitado proporcionalmente: logs da revisão original e `h01-vermelho.txt`/`h02-vermelho.txt` do saneamento foram lidos; também conferidos logs brutos locais `target/saneamento-h01-before.log` e `target/saneamento-h02-baseline-d2-retry.log`. H01 mostra deadlock entre PIDs61/62; H02 mostra duplicação/deslocamento de linha após commit independente entre páginas (sumário501 e502 linhas/501 únicas). O interceptor de H01 executa query real antes da barreira, e H02 usa transação independente, não mock de regra. Ambos passaram novamente no candidato. Não se apresenta a falha inicial de spy como causal. As novas REVAL01/02 acrescentam vermelhos reproduzidos nesta execução, com expected literal calculado do contrato. Não houve reversão destrutiva ou mutação de produto no checkout compartilhado.

## Migrações, desempenho e alcance visual

`git diff` de V1–V5 entre base/candidato vazio. Inspecionadas V6–V11: fatos de compra sobreviventes; referência de avaliação; replay/correções/revisões; fingerprint de pagamento; comandos/realização; cobertura. Legado não ganha sequência/auditoria inventada; referências existentes são preservadas e as constraints continuam reais. Os9 upgrades de versões2–10 até11 passaram; bancos vazio/legado e validate fazem parte dos234. Parte dos testes antigos continua usando schema Hibernate; não se afirma conversão integral para Flyway. Exportação, compensações e saneamento browser usam Flyway/validate; as duas provas novas também.

Replay O(n) e escrita de revisões por correção; carregamento de checklist em lote O(metas+itens); export pagina500/SXSSF100 com snapshot até fim e bytes finais proporcionais ao arquivo. Não se mediu benchmark/limite de carga nem se antecipou CF-025.

Capturas inspecionadas diretamente: investimento desconhecido360/1440, modal estorno360, compensação360, pagamento768 e anual768, além de anual360 vazio (RVA-04). Critério RVI-22 mostra texto integral no investimento pequeno; modal estorno tem motivo/data/ação acessíveis. Capturas1440/768/360 e assertions de geometria são dirigidas aos estados, não prova de toda combinação de tema/privacidade/tamanho nem zoom nativo200%.

## Resultados complementares após os primeiros runs

Temporal18/18, pós-condições SQL/XLSX Java aprovadas, sem erro de fixture. H02 reforçado passou após a alteração do teste (logs/h02-cobertura.log): base07/09 no snapshot corrente,08/09 no próximo; totais501/511 e linhas preservados. Os234 foram executados antes deste reforço de teste; o produto permaneceu idêntico, e o teste alterado foi reexecutado individualmente. Não se afirma outro run234 após a alteração do teste.

Repetição dirigida2/2, namespace `san1821-115748ae`. Comando Maven do harness de saneamento com `'-Dreview.evidence=../../revalidacao-CF-016-CF-021/browser/repeticao-dirigida' '-Dreview.grep=pagamento 120|SAN-E3'`. Executada depois do temporal e de H02, mesma porta livre, sem retries automáticos. Pagamento120/exclusão/reembolso/reload concluiu; SQL confirma banco880, compra paga/reembolsada e fato sobrevivente. Não houve repetição integral verde17/17 nesta revisão: primeiro16/17, depois2/2 dirigido. Os18 temporais são um run integral próprio.

A nova imagem anual360 foi inspecionada: conteúdo, indisponibilidade e base temporal visíveis. Também inspecionado histórico de compra120/reembolso em360. RVA-04 encerrado como erro do harness, imagem inicial mantida. RVA-03 permanece intermitência não explicada, mesmo com repetição aprovada. Lint das duas unidades frontend alteradas nesta revisão passou sem erros/warnings (logs/lint-revisao.log).
