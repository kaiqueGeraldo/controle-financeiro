# Execuções atuais e reprodução

14/10/2026, base8096b22. Não somar observações a testes únicos nem converter
assertions deliberadamente vermelhas do Clock antigo em falhas de produto.

| Rodada | Resultado | Limite |
|---|---|---|
| run-01-maven.log / run-01 | BUILD SUCCESS;1 Playwright passa,10 observações |3 invisíveis old-clock após reload/seleção; primeira abertura/reabertura atrasadas~4s; native5/5 pintadas. Campos Fiber provisórios |
| run-02-maven.log / run-02-causal | Maven falha,3 Playwright falham | Observador leu alternate antigo; API200/DOM8 e relógios já medidos. Não apresentado como verde |
| run-03-maven.log / run-03-causal-committed | BUILD SUCCESS;3 Playwright passam | Old-clock deve produzir falhaCSS15s/opacity0; native/Date-only devem pintar. Leitor usa raiz comprometida |
| run-04-maven.log / run-04-harness | BUILD SUCCESS;1 Playwright passa,13,5s | GET real retido → loading →8 registros; clique/scroll/foco/hit-test; reabrir/reload; DB antes=depois |
| lint-final.log / typecheck-final.log | exit0 / exit0 | Somente lint de fontes de teste afetadas; typecheck do frontend |
| harness-discovery.log |1 teste identificado | `--list` não é execução do cenário financeiro original |

Não houve retry, aumento do expect15s ou execução da suíte inteira. O primeiro
lint dos probes passou; uma chamada posterior a ESLint a partir da raiz falhou
por configuração ausente, não por lint/produto. O comando correto na pasta
frontend foi executado e passou. Não omitir a falha de instrumentação run-02.
Nenhuma fonte executável foi alterada depois dos gates finais, além do uso
localizado do helper já provado no `start('investment')` e verificado por
lint/typecheck/discovery. As fontes finais estão em SOURCE-SHA256.json.

## Comandos

PowerShell na raiz. Docker local disponível; nenhum fallback externo. Pasta
de evidência sempre nova; não sobrescrever execuções anteriores.

```powershell
$env:JAVA_HOME=(Resolve-Path 'controle-financeiro-backend/target/temurin21/jdk-21.0.12.1+1').Path
$env:PATH="$env:JAVA_HOME\bin;$env:PATH"
./controle-financeiro-backend/mvnw.cmd -f controle-financeiro-backend/pom.xml --batch-mode '-Dtest=Cf014HistoryDiagnosticTest' '-Ddiagnostic.run=nova-causal' '-Ddiagnostic.grep=contraprova causal' '-Duser.timezone=UTC' test
./controle-financeiro-backend/mvnw.cmd -f controle-financeiro-backend/pom.xml --batch-mode '-Dtest=Cf014HistoryDiagnosticTest' '-Ddiagnostic.run=nova-harness' '-Ddiagnostic.grep=harness civil' '-Duser.timezone=UTC' test
```

Para a matriz inicial, usar grep `diagnóstico delimitado` e outra pasta. Testes
têm orçamento90s, assertions15s, retries0; contraprovas são casos separados.
O tempo anterior25s é alcançado por condição de performance antes da navegação,
sem travar ou avançar os relógios. O cenário Clock antigo passa como probe
somente se a assertion original falhar **e** houver8 itens, relógio futuro e
opacity0: um timeout de ambiente não satisfaz essas garantias.

Na pasta frontend:

```powershell
node node_modules/eslint/bin/eslint.js tests/e2e/rf15-matrix.integrated.spec.ts tests/e2e/cf014-history-diagnostic.integrated.spec.ts tests/e2e/playwright.cf014-history.config.ts tests/e2e/support/civil-date-clock.ts
node node_modules/typescript/bin/tsc --noEmit --project tsconfig.json
$env:CF_REVIEW_EVIDENCE=(Resolve-Path '../tasks/evidencias/investigacao-CF014-historico-invisivel/run-04-harness').Path
node node_modules/@playwright/test/cli.js test --config tests/e2e/playwright.rvr24-visual.config.ts --grep 'investimentos histórico' --list
```

## Integridade e artefatos locais

`historical-hashes.json` preserva a origem; `historical-source-hashes.json`
registra componentes/harness/lockfile anteriores ao ajuste. O script
`summarize-original-trace.ps1` abre a origem somente para leitura e extrai campos
permitidos: nenhum cookie/header/token é publicado no resumo.

`sanitize-evidence.ps1` foi reutilizado do saneamento anterior, restrito à pasta
nova. `sanitization.json`:47 artefatos textuais/zip examinados,6 traces mudados
para expurgar JWT sintético,41 preservados. Arquivos de imagem não são alterados.
`inspect-current-traces.ps1` confirma zero JWT remanescente nos eventos de trace
e network. Autenticação ocorre antes de iniciar tracing; cookies de requests
subsequentes ainda exigiram sanitização. Evidências históricas não sanitizadas
novamente e nunca modificadas nesta rodada.

Uma checagem posterior encontrou a senha sintética em três excerpts de fonte
do `error-context.md` da rodada02. Foram expurgados separadamente por
`prepare-log-exports.ps1`, com proveniência em `sanitization-source-excerpts.json`.
O mesmo script conserva logs sanitizados originais em `*.raw.log` locais e
exporta apenas seus espaços finais de linha removidos, para `git diff --check`;
`log-exports.json` registra hashes antes/depois. Nenhum resultado, prazo ou
mensagem foi suprimido. O manifesto cobre ambos os formatos.

Traces de~0,7–5MB e a amostragem completa de frames permanecem locais, ignorados
somente nesta pasta por `.gitignore`. `EVIDENCE-SHA256.json` inclui todos esses
arquivos, além das provas pequenas versionadas; exceto o próprio manifesto.
As cinco capturas selecionadas, JSON causais, fixture antes/depois, resumos,
logs e scripts são versionados. Não há link CI porque não foi executada CI;
nenhum artefato foi enviado externamente. Os caminhos locais relativos ao
manifesto podem ser abertos nesta workspace. Git pode normalizar finais de
linha; hashes registram bytes locais antes do commit.
