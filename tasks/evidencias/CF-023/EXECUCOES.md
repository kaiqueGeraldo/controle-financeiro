# Execuções CF-023

Base e preservação: `git status --short`, `git diff -- README.md`, `git log -5
--oneline`, `git diff --cached --stat`, `Get-FileHash README.md -Algorithm SHA256`.
Dependências e pareceres foram lidos antes de qualquer alteração. Fontes e
comandos abaixo usam a árvore local final; hashes identificam os artefatos.

## Antes/depois e falhas preservadas

| Log | Comando/probe | Resultado |
|---|---|---|
| logs/backend-before.log | Primeira invocação default sandbox via `-f` | Maven exit1 no compilador/acesso ao cache;0 regressões executadas, não prova causal |
| logs/backend-before-runtime.log | UserIsolationIntegrationTest / implementação original |35/20 falhas/0 erros/skips, exit1; header,400 e reorder parcial |
| logs/backend-before-expanded.log |6 casos separados de reorder/identidade |6/6 falhas/0 erros/skips, exit1; JWT A autenticava B, mixed reorders204/SQL alterado |
| logs/backend-after-1.log | Primeiro candidato |40/40, exit0 |
| logs/security-expanded-before.log | perfil +320 requests privados + recuperação |3 probes,1 falha de serialização de password,0 erros/skips, exit1 |
| logs/frontend-before.log | actions/BFF novos |1 falha/1 aprovação, exit1; maxAge604800 observado/86400 esperado |
| logs/backend-expanded-1.log | Matriz50 casos e novas bordas |62,1 falha,0 erros/skips, exit1; mensagem alheio/ausente de refund diferente |
| logs/backend-expanded-2.log | XLSX/recibos/correções/reorders |70,2 falhas,0 erros/skips, exit1: export converte404 em400; probe de refund próprio esperava200 em vez de204 |
| logs/browser-before.log + browser/before/playwright.log | UI real com duas abas |exit1: após logout API401/cookie removido, segunda aba mantinha A após5s |
| logs/browser-after.log + browser/after/playwright.log | Mesma jornada, correção entre abas |exit0,1 jornada e pós-condições SQL aprovadas |
| logs/backend-verify-1.log | Primeira suíte completa |345,1 falha,0 erros/skips, exit1; assertion antiga CF-022 exigia BusinessRule400 para meta alheia |
| logs/backend-verify-final.log | Suíte completa depois da assertion legítima documentada |345/345,0 falhas/erros/skips, exit0; verify/JAR |
| logs/mutation-owner.log |4 probes, predicado owner neutralizado na cópia |4/4 falhas por snapshot/status,0 erros/skips, exit1; cópia restaurada por SHA |
| logs/frontend-components-all.log | Suite completa Vitest |36 arquivos,157/157, exit0 |
| logs/frontend-unit.log | `scripts/test.mjs` |6 por TZ,18/18 execuções, exit0 |
| logs/frontend-typecheck.log, logs/frontend-lint.log | tsc/eslint focado |exit0; sem diagnósticos |
| logs/frontend-build.log | Next build no sandbox |exit1; download de Geist/Geist Mono indisponível |
| logs/frontend-build-network.log | Next build com acesso à rede |exit0; compilação/TypeScript/prerender14 rotas |

Outras falhas de comando, sem regressão executada: `npm` do PATH apontava para
um npm-cli.js inexistente; foi usado Node direto sobre os executáveis já
instalados, sem reinstalar dependências. Primeiro comando de mutação usava
quatro níveis `..` no log em vez de três e não iniciou Maven; caminho corrigido
antes da prova. Leituras exploratórias tiveram caminhos/globs PowerShell
inexistentes; foram corrigidas, sem efeito de produto. Nenhum desses erros é
apresentado como vermelho causal.

O probe de refund próprio foi corrigido para **204**, contrato sem corpo de
CF-008/consumidor CF-020, mantendo a assertion financeira2290 e as recusas404.
Não houve correção de runtime para transformar204 em200. A assertion antiga de
meta alheia mudou conforme DEC-09, acrescentando mensagem exata; as demais
assertions do teste CF-022 foram preservadas. Não houve skip/only/retry adicional,
relaxamento de tolerância ou renovação de snapshot.

Uma tentativa de backend verify e outra de build com rede **não executaram**:
o revisor automático de aprovação ficou sem cota e não concluiu a revisão.
Não foi decisão de insegurança e não houve bypass. Depois da mensagem humana
autorizando continuar com a cota restabelecida, as mesmas operações foram
autorizadas e concluídas nos logs finais acima.

## Comandos reproduzíveis

Backend, em `controle-financeiro-backend`:

```powershell
$env:JAVA_HOME=(Resolve-Path 'target/temurin21/jdk-21.0.12.1+1').Path
.\mvnw.cmd --batch-mode '-Dmaven.repo.local=C:/Users/Aluga.com/.m2/repository' '-Dtest=UserIsolationIntegrationTest' '-Duser.timezone=UTC' test
.\mvnw.cmd --batch-mode '-Dmaven.repo.local=C:/Users/Aluga.com/.m2/repository' '-Dtest=UserIsolationBrowserIntegrationTest' '-Duser.timezone=UTC' '-Dcf023.run=after' test
.\mvnw.cmd --batch-mode '-Dmaven.repo.local=C:/Users/Aluga.com/.m2/repository' '-Dtest=*,!UserIsolationBrowserIntegrationTest,!HabitBrowserIntegrationTest,!IntegratedMilestoneBrowserReviewTest,!MilestoneRemediationBrowserTest,!TemporalBrowserApiPostgresE2E' '-Duser.timezone=UTC' verify
```

O gate completo exclui orquestradores de browser, executados separadamente
somente onde pertinente ao diff. As outras jornadas históricas não foram
reexecutadas nem contadas como novas. O Java orquestrador não é teste de browser
adicional à sua própria jornada. O próximo run de browser deve usar outro valor
de `cf023.run` para preservar capturas/logs desta execução.

Frontend, em `controle-financeiro-frontend`:

```powershell
node scripts/test.mjs
node node_modules/vitest/vitest.mjs run --config tests/component/vitest.config.mts
node node_modules/typescript/bin/tsc --noEmit
node node_modules/eslint/bin/eslint.js src/actions/authActions.ts src/actions/sessionBoundary.ts src/hooks/useAuth.ts src/contexts/userContext.tsx tests/component/cf023-auth-boundary.test.tsx tests/component/cf023-session-invalidation.test.tsx
node node_modules/next/dist/bin/next build
```

Mutação, a partir da raiz (requer cópia nova; script recusa sobrescrever existente):

```powershell
node tasks/evidencias/CF-023/mutation.cjs prepare
# Em controle-financeiro-backend/target/cf023-ownership-mutant:
$env:JAVA_HOME=(Resolve-Path '../temurin21/jdk-21.0.12.1+1').Path
.\mvnw.cmd --batch-mode '-Dmaven.repo.local=C:/Users/Aluga.com/.m2/repository' '-Dtest=UserIsolationIntegrationTest#mixedReordersRejectAtomicallyIncludingMissingIds' '-Duser.timezone=UTC' test
# Novamente da raiz, mesmo quando Maven falhar:
node tasks/evidencias/CF-023/mutation.cjs restore
```

O restore repõe somente o arquivo mutado da cópia, confirma hash e verifica
que o fonte compartilhado não mudou. Em uma futura repetição, escolher outro
diretório de cópia/evidência após inspeção; não apagar automaticamente a prova.
Logs separam experimentos/implementação; sanitização posterior feita com
`node tasks/evidencias/CF-023/sanitize-evidence.cjs` e manifesto de SHA.

Código/testes/contrato: commit local `1b93704f72b9a255075c09d08ea0e97f218f1721`.
O checkpoint foi gravado uma vez com `node tasks/evidencias/CF-023/checkpoint.cjs record`
após confirmar cada SHA de fonte/JAR testado. Verificar sem sobrescrever com
`node tasks/evidencias/CF-023/checkpoint.cjs`: compara os fontes com esse commit,
HEAD e árvore de trabalho, e confere os logs publicados normalizando apenas
CRLF/LF. O JAR é artefato gerado local, não incluído no Git.

Staging explícito e diff/tarefa inspecionados antes de cada commit; README raiz
fora do índice e com SHA inicial preservado. `git diff --cached --check` passou
no commit de aplicação. No commit documental, o check completo aponta espaços
finais emitidos por Maven/console nos logs brutos; foram preservados para manter
os hashes de evidência. `git diff --cached --check -- . ':(exclude)*.log'` passou
para documentação/scripts/manifestos. Não houve nova alteração de runtime após
os gates, apenas registro verificável da revisão testada.
