# Execuções independentes e limites

Candidato0f0b619,621 fontes do manifesto final conferidas sem diferenças. Node24.18.0, Java21.0.12.1+1 existente em target, PostgreSQL Testcontainers16-alpine, Chromium153.0.8010.12. Nenhum acesso a banco real. Não houve clean/reset ou limpeza geral de target.

| Execução | Resultado | Alcance |
|---|---|---|
| directed.log | falha EPERM antes de casos | Cache Vitest impedido pela sandbox; não é falha de produto |
| directed-authorized.log |75/75|47 contrato+17 flow+11 tela; não somar64 das contraprovas como casos novos |
| unit.log |6/6|Calendário original |
| lint.log / typecheck.log |exit0/0|Candidato sem alteração de produto |
| build.log |exit0|Next build, rota onboarding; aviso preexistente middleware/proxy |
| baseline/candidate-regressions.log |6/9 em cada|Três mesmas falhas em base6d819aa e candidato; análise individual separada |
| counterproof-results.json |5 detectadas;64/64 controle restaurado|Mutação em cópia temporária;206 arquivos iguais após restauração |
| probes-initial.log |erro de import da configuração|Observador não executou produto; config original preservada em probes.config.initial.txt |
| probes.log |1 passa/3 falham|Controle E01 válido; rejeições ausentes RC031-01/02 |
| probes-expanded.log |4 passam/3 falham|Acrescenta2 diagnósticos provider e1 modal; mesmos defeitos, sem duplicar contagem |
| receipt-browser-probe.log |timeout de visibilidade|Primeiro observador encontrou valor oculto pela preferência de privacidade da fixture; não prova exposição |
| receipt-browser-probe-corrected.log + RC031-01-browser.json/png |defeito reproduzido|Preferência explicitamente false; GET adulterado somente depois de commit real; servidor relido950 |
| e2e/ + e2e-reports/ |11/12; Java falha|RI031-T01, loading inicial desktop/+14; SQL não alcançado |
| e2e-serial/ + e2e-serial-reports/ |11/12; Java falha|RI031-T02, releitura após login tablet/UTC; SQL não alcançado |

## Jornadas reais e SQL

As12 jornadas são quatro cenários em três combinações largura/fuso: vazio+perda de resposta após commit; E01 completo; draft/conflito/pausa/resume/503/401/descarte; extremos e desconhecido com preparação cancelada. São browser→Next BFF→Spring→PostgreSQL reais. Somente perda/adulteração de **retorno** é injetada depois da chamada real, não sucesso financeiro pré-programado. Relógio Date-only conserva timers nativos.

O runner Java verifica contas/soma, recibos, application_items, transações pendentes/pagas e reservas por owner. Porém verifica primeiro o exit do Playwright: as duas falhas acima impediram o checkpoint SQL final, portanto os JSON de checkpoint do browser **não** são prova SQL. Não reutilizamos sql-proof do executor como se fosse produzido pelo revisor.

Seleção `e2e-sql-mobile` foi solicitada exclusivamente para obter quatro checkpoints SQL com as assertions originais, sem outra rodada ampla; seu resultado final consta do adendo ao fim deste documento.

## Duas ocorrências novas, não apagadas

- **RI031-T01:** primeira rodada, desktop1440/Kiritimati, spec linha81: heading Contexto não encontrado em12s. Snapshot de erro mostra loading; screenshot posterior já mostra o formulário. Houve um probe em outro contexto de browser no mesmo servidor durante essa rodada; isso não demonstra a causa. Sem prova de bug de fuso ou animação.
- **RI031-T02:** rodada sem probes concorrentes, tablet768/UTC, spec linha99: nome persistido não encontrado em12s após relogin. Snapshot mostra sessão encerrada e toast “Não foi possível conectar à API”. Falha de transporte observada; não há captura suficiente para atribuir sua origem ao BFF, backend ou ambiente. Não inferir perda do rascunho, autenticação cruzada ou causa comum aT01.

Classificação de ambas: **inconclusiva quanto à causa**, cobertura integral real pendente. Encaminhar probe dirigido com metadados de latência/status sem tokens/cookies, precondições de sessão verificadas e mesmas assertions. Não aumentar timeout/retry, não declarar o conjunto verde por passes posteriores.

## Reprodução

Na pasta frontend:

```powershell
node node_modules/vitest/vitest.mjs run --config src/screens/private/onboarding/vitest.config.mts
node node_modules/vitest/vitest.mjs run --config ../tasks/evidencias/revisao-CF-031/probes.config.mts
node node_modules/vitest/vitest.mjs run --config tests/component/vitest.config.mts tests/component/habit-product-day.test.tsx tests/component/temporal-presentation.test.tsx
node scripts/test.mjs
node node_modules/eslint/bin/eslint.js .
node node_modules/typescript/bin/tsc --noEmit
node node_modules/next/dist/bin/next build
```

Na raiz, scripts `baseline-regressions.ps1`/`counterproofs.ps1` são cópias dos scripts auditados, com saídas relativas a esta pasta. Para futura reprodução, copiar a uma nova pasta da mesma profundidade para não sobrescrever evidências. Contraprovas: own-status, geração tardia, identidade de confirmação, patrimônio incoerente, versão/status de save perdido. Todas falharam por AssertionError, não por configuração; ver diffs individuais.

Na pasta backend, JAVA_HOME apontando ao JDK21 preservado:

```powershell
./mvnw.cmd --batch-mode '-Dtest=OnboardingFrontendPostgresE2E' '-Dcf031.evidence=../tasks/evidencias/NOVA-PASTA/e2e' test
# Seleção restrita, quatro jornadas e quatro checkpoints esperados:
./mvnw.cmd --batch-mode '-Dtest=OnboardingFrontendPostgresE2E' '-Dcf031.project=mobile-360-SP' '-Dcf031.evidence=../tasks/evidencias/NOVA-PASTA/mobile' test
```

`receipt-browser-probe.mjs` requer esse runtime descartável ativo em3111 e checkpoint E01 recém-produzido. A primeira versão está preservada em `.initial.mjs`; a correção tornou explícita a precondição de privacidade desligada, sem modificar critério, produto ou expected. Não executá-lo contra ambiente real.

## Adendo final — 22/10/2026

**e2e-sql-mobile:4/4; Java1/1; quatro checkpoints SQL aprovados.** Saídas em `e2e-sql-mobile/`, relatório em `e2e-sql-mobile-reports/`, comando/resultado em `e2e-sql-mobile-maven.log`. É seleção restrita com propósito de persistência, não substituição retroativa das duas rodadas11/12.

SQL por owner: vazio=conta padrão0/um recibo/zero itens aplicados/zero transações; E01=três contas somando1300/um recibo/16 itens aplicados/uma previsão pendente e nenhuma paga/reservas550; draft e visual=conta padrão0/zero recibos/zero aplicação/zero transações. Patrimônio1451 e limite656 são verificados pelo browser/contrato; não se confundem com soma das contas1300. Perda de resposta ocorre após POST real persistido, e recuperação mantém a identidade. Quantidade de requests não é quantidade de aplicações.

As12 combinações têm ao menos uma passagem entre as rodadas, mas nenhuma das duas rodadas completas passou12/12. SQL independente cobre quatro fixtures em360/SP, não doze. Os P2 continuam falhando nos probes e impedem aceite. Não foi feita nova suíte ampla.
