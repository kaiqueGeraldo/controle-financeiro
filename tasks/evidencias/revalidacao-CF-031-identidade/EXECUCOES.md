# Execuções independentes e preservação

22/10/2026, candidato9d80d2e. Comandos na pasta frontend, saídas nesta nova pasta:

| Após node | Resultado/log |
|---|---|
| node_modules/vitest/vitest.mjs run --config src/screens/private/onboarding/vitest.config.mts |160/160; directed.log |
| node_modules/vitest/vitest.mjs run --config ../tasks/evidencias/revalidacao-CF-031-RC031/independent.config.mts |9/9; residual-probes.log |
| node_modules/vitest/vitest.mjs run --config ../tasks/evidencias/revisao-CF-031/probes.config.mts |7/7; original-probes.log |
| node_modules/vitest/vitest.mjs run --config ../tasks/evidencias/revalidacao-CF-031-identidade/consumers.config.mts |4/4; consumers.log |
| scripts/test.mjs |6 casos em SP/UTC/Kiritimati; unit.log, não18 casos diferentes |
| node_modules/eslint/bin/eslint.js . |exit0; lint.log |
| node_modules/typescript/bin/tsc --noEmit |exit0; typecheck.log |
| node_modules/next/dist/bin/next build |exit0; build.log, rota onboarding gerada |

test-results.json/checks.json registram exits. Nenhum timeout aumentado ou assertion
enfraquecida. consumers-harness-failure.log preserva a primeira tentativa dos quatro
probes: import de testing-library não resolvido por estar fora do frontend, zero
testes executados. consumers.initial.txt preserva o fonte inicial. Corrigidos apenas
imports explícitos das dependências e createElement equivalente ao JSX, seguindo
o harness anterior. Não foi falha de produto nem prova causal; execução seguinte4/4.

Contraprova: counterproofs.ps1 copiado da entrega, executado nesta pasta, com fontes
em TEMP e junctions de dependências/fixtures apenas para leitura. Reproduz cinco
arquivos de75ede48:14 passes/8 falhas entre22, com harness final. Restaura candidato:
149/149. Muta somente refKey para preferir id herdado:6 falhas/16 passes,127 casos
não selecionados pelo filtro. Finally restaura bytes:149/149 e210 hashes iguais.
Logs/diff/results/source-sha256 preservados. Essa mutação confirma causalidade,
não é nova aplicação financeira. Produto original permanece sem alterações.

Probes nove: SHA256173FA36FF7182F1D1F5B5DB08D0A21BA279D4E0499FA735FF19D72A77275EA7E;
config6221DB723E0FC537A50609F080DB3AB46A75D99306BE8C18175E6130B31EA58E.
Iguais aos registros da entrega e aos arquivos preservados da revisão. A prova
histórica7/9 é mantida: duas falhas residuais e sete controles aprovados. Assertions
originais não foram editadas. As falhas de harness/tipagem da implementação estão
documentadas na entrega anterior; a contraprova com harness final fecha essa lacuna.

initial.json/final-integrity.json conferem integralmente os manifestos:4123 arquivos
de runtimes,548 provas anteriores e133 arquivos da revalidação, nenhuma diferença.
README raiz preservado fora dos commits, SHA256 completo histórico:
6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA.
O primeiro hash abreviado/incompleto no pedido não foi usado como referência.
Staging inicial vazio; README modificado e .cf22/.cf22r/.cf22s não rastreados eram
preexistentes. Sem mudanças posteriores no candidato de produto. Nenhum AGENTS.md
adicional encontrado no repositório/ancestrais; instruções fornecidas pelo usuário
e política de execução/testes aplicadas.

Commits locais separam provas, parecer e estados. Diffs e staging explícitos
conferidos; logs brutos podem conservar espaços/linhas finais das ferramentas,
sem sanitizar a prova. Não houve clean/reset, limpeza de target, push/merge,
exclusão de branches, deploy ou acesso a banco real.
