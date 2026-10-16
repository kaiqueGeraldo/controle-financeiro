# Execuções e inventário

16/10/2026, Windows/PowerShell, Node24.18/JDK21.0.12.1+1, Chromium/Playwright1.63.0,
PostgreSQL16-alpine Testcontainers, Flyway1–14/validate. Email/cotações são doubles
externos; BFF/Spring/banco reais descartáveis. JVM UTC/browser São Paulo1440×900,
reducedMotion reduce herdado nos dois modos; animações continuam ativas.

## Preparação e comandos

`node tasks/evidencias/revalidacao-CF019-RVA03/prepare.mjs` exportou backend/frontend
de18c7150 para `.rv3`, sem checkout/reset. A junction encontrou EPERM no sandbox;
`resume-prepare.mjs` continuou após autorização automática, sem reexportar/apagar.
Docker também exigiu execução fora do sandbox; verificação confirmou29.6.2.

O script prepara a primeira versão de observações. Antes de iniciar Playwright,
a leitura do DTO/descrição confirmou prefixo `Compra Meta: `; locator novo foi
ajustado ainda na compilação Java, sem execução de assertion incorreta. A versão
final executada é `probe-run02.ts.txt`; os patches iniciais ficam como histórico.

```powershell
$env:JAVA_HOME=(Resolve-Path 'controle-financeiro-backend/target/temurin21/jdk-21.0.12.1+1').Path
$env:PATH="$env:JAVA_HOME\bin;$env:PATH"
$evidence=(Resolve-Path tasks/evidencias/revalidacao-CF019-RVA03).Path
./.rv3/controle-financeiro-backend/mvnw.cmd -f .rv3/controle-financeiro-backend/pom.xml --batch-mode '-Dtest=Cf019Rva03DiagnosticTest' "-Dreview.evidence=$evidence/run-01" '-Duser.timezone=UTC' test
node tasks/evidencias/revalidacao-CF019-RVA03/repair-isolation.cjs
./.rv3/controle-financeiro-backend/mvnw.cmd -f .rv3/controle-financeiro-backend/pom.xml --batch-mode '-Dtest=Cf019Rva03DiagnosticTest' "-Dreview.evidence=$evidence/run-02" '-Duser.timezone=UTC' test
node tasks/evidencias/revalidacao-CF019-RVA03/verify.mjs run-02
```

Os comandos reais redirecionaram stdout/stderr a run-01/02-raw.log. Exports
run-01/02-maven.log removem apenas whitespace de fim de linha. Não reutilizar
nomes de saída existentes. Para reproduzir em nova cópia, usar o probe final,
next-run02.ts.txt com raiz absoluta adequada e `maxFailures:1` no config do probe.
Após a coleta foi recolocado `*` no .gitignore da cópia, para mantê-la fora de
staging; antes de executar novamente, reaplicar o ajuste de scanner. Nenhum arquivo
de produto/artefato da cópia foi apagado. `target` não foi limpo.

## Resultados e falhas preservadas

| Rodada | Resultado / interpretação |
|---|---|
| run-01 | Primeiro probe20 excedeu90s antes do POST; screenshot sem classes de layout. Segundo120 começou; rodada interrompida de forma dirigida na árvore Playwright, Java exportou SQL e falhou. Zero card_payments/recibos, contas1000, compras120. Não são dois testes completos nem reprodução RVA03. |
| Diagnóstico scanner | Mesmas fontes, `.rv3/.gitignore=*` →0 arquivos/classes; removida só exclusão →322 arquivos/5582 candidatos, flex/fixed presentes. `isolation-scanner.json`. Config distDir nova preserva cache/artefatos antigos. |
| run-02 | Quatro probes completos,2,3min; Maven1 harness aprovado. Antigo120 conserva vermelho visual15s; controles Date-only passam fechamento/interação/pintura/reload. Nenhum retry, sleep arbitrário, timeout ampliado ou animação desativada. |
| Verificador | Invariantes causais/financeiras passaram; primeira falha posterior foi comparação literal CRLF versus blob LF, demonstrada no log. Ajustado somente comparador de fontes textuais. Segunda falha: favicon binário excedeu buffer padrão1MB do subprocesso; aumentado buffer de leitura, sem mudar teste/timeout de produto. Terceira execução exit0,431 arquivos de produto equivalentes,424 apenas CRLF. Não houve novo pagamento nessas execuções. |
| ESLint / TypeScript | Exit0/0 na cópia; logs vazios válidos. |

Lint/typecheck, cwd `.rv3/controle-financeiro-frontend`:

```powershell
node node_modules/eslint/bin/eslint.js tests/e2e/cf019-rva03.integrated.spec.ts tests/e2e/playwright.cf019-rva03.config.ts
node node_modules/typescript/bin/tsc --noEmit --project tsconfig.json
```

Na rodada válida, as observações novas de pintura/interação após reload aplicam-se
a Date-only. Não exigimos saída correta no controle deliberadamente defeituoso;
seu reload financeiro continua exigido. O antigo120 não é aprovação visual.
`verify.mjs` exige o defeito antigo, estado React fechado, animação negativa, delta
temporal e controles nativos, além de identidade, POST único, SQL e reload.

## Artefatos e inspeção

- `run-02/*-events.json`: rede e identidades; `*.json`: React, DOM, clocks, WAAPI,
  recibo, conta/fatura; `persisted.txt`: SQL por namespace799678a3. Quatro recibos
  em card_payments, não em financial_intent_receipts (outro protocolo).
- Inspecionados visualmente: original histórico test-failed-1.png; executor
  original120-terminal/date-only120-terminal; desta revisão original120-terminal,
  date-only120-terminal, date-only120-reload e date-only20-reload. Imagens mostram
  spinner antigo versus detalhe carregado e pagável0/100, sem spinner/skeleton.
- `*-interaction.json` + probe final registram fechar/reabrir por cliques reais;
  controles Date-only fazem isso antes e depois do reload, sem reenviar pagamento.
- `run-01/layout-failure.png` e error-context: falha da cópia; trace.stop também
  falhou porque contexto já fechado pelo timeout. Não se inventa trace completo.
- `original-trace-summary.json`: nova extração read-only do zip histórico;
  original-hashes.json, source-comparison.json e ancestry.json permitem conferir
  origem e integração. Vídeo antigo não foi inspecionado; não é fundamento novo.
- Quatro traces run-02 preservados localmente, ignorados pelo Git. Sanitização
  limitada à pasta nova retirou JWTs sintéticos de quatro zips; manifesto guarda
  hashes antes/depois. Nenhum trace histórico foi modificado.
- preservation-initial/final:68 arquivos históricos/README inalterados; produto
  isolado431 arquivos equivalentes ao commit, com conversões CRLF explícitas.

Não foi executada suíte geral, ensaio de zoom nativo ou backend financeiro amplo.
Reutilizadas as provas independentes da matriz. As duas jornadas originais do
executor em `../investigacao-CF019-RVA03/run-02-harness` passaram2/2 sem Fiber,
produto idêntico à base8a83c35, e foram confrontadas em fonte/log/JSON/SQL.
Suas screenshots com animations disabled não entram na prova causal nova.

## Commits e revisão do staging

Provas em commit local `949424a`,62 arquivos explicitamente listados, sem fontes
do produto ou README raiz. Pareceres/estados em commit documental separado.
Diff e inventário do staging inspecionados antes de cada commit. `diff --check`
das provas apontou apenas whitespace preservado em contexto de patch, log de
falha e linha final do script de retomada; não é falha funcional e esses registros
não foram reescritos para apagar a saída original. Diff documental sem erros.
