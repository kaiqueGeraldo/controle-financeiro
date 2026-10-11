# Execuções e limites — 10–11/10/2026

Windows/PowerShell; Node24.18.0, Java21.0.12 (Temurin local), Docker29.6.2, PostgreSQL16-alpine descartável, Flyway1–14, Next16.1.6, React19.2.3, Playwright1.63.0/Chromium153.0.8010.12. Config herdada do milestone-review, um worker, retries0, timeout90s/assertions15s. Browser São Paulo; relógio de negócio/autenticação fixo15/01/2027; roteiro visual geral conserva relógio nativo de outubro para animações (não é contraprova temporal). Prova de datas final fixa15/01. JVM/fusos adicionais têm aceites temporais anteriores, não novos testes de todos os fusos aqui.

## Comandos

Na raiz, selecionar JAVA_HOME em `controle-financeiro-backend/target/temurin21/jdk-21.0.12.1+1` e prefixar seu bin ao PATH. Executar:

```powershell
./controle-financeiro-backend/mvnw.cmd -f controle-financeiro-backend/pom.xml --batch-mode '-Dtest=FrontendClosureBrowserTest' '-Dreview.evidence=second' test
```

Sem CF_CLOSURE_TARGETED/FINAL: auth/preferências/semanal e visual por largura. `CF_CLOSURE_TARGETED=1`: privacidade arquivada, detalhe, lista100 e sequência20→120. `CF_CLOSURE_FINAL=1`: download e datas. Usar `review.evidence` exclusivo por execução. `review.grep` permite recorte dirigido. FINAL tem precedência sobre TARGETED. Não executar variantes concorrentemente: mesma porta Next3107. Docker/Maven precisaram permissão de execução fora do sandbox; ambiente continuou sintético e descartável.

No frontend:

```powershell
npm run lint
npx tsc --noEmit
npm run test:component -- --reporter=dot tests/component/common-components.test.tsx tests/component/sidebar-accessibility.test.tsx tests/component/auth-settings-accessibility.test.tsx tests/component/auth-screen.test.tsx tests/component/dashboard-accounts-extract.test.tsx tests/component/cards-planning-audit.test.tsx tests/component/goals-investments-habits-annual-audit.test.tsx tests/component/cf015-invoice-focus.test.tsx
```

## Resultados preservados

| Execução | Resultado | Arquivo / interpretação |
|---|---|---|
| Componentes inicial | 8 suites não carregadas,0 testes | components.log; EPERM cache, não assertion de produto. |
| Componentes com acesso adequado | 8 arquivos/30 testes aprovados | components-executed.log. |
| Browser primeira | 1 passou/4 falharam | browser-first.log + browser/playwright.log. Seletores/foco do probe, roteiro visual agregado timeout90s, criação mobile RF15-01. |
| Browser segunda | 6 passaram | browser-second.log + browser/second. Mesmo timeout; visual separado por largura, recuperação/preferências/semanal. |
| Targeted | 3 passaram/2 falharam | browser-targeted.log + browser/targeted. Pagamentos20/120 e lista100 aprovados; RF15-02/03 vermelhos. |
| Final inicial | 1 passou/1 falhou | browser-final.log + browser/final. Download aprovado; parse JSON indevido em resposta sem corpo no setup de compra. |
| Final corrigida | 1 passou/1 falhou | browser-final-corrected.log + browser/final-corrected. Download novamente aprovado (não caso adicional); RF15-04 três assertions falham após API correta. |
| Lint e typecheck finais | exit0 ambos | lint-final.log/typecheck-final.log, após todos os probes. |

Cada Maven agrega um teste orquestrador; não somar esse número ao de casos browser. Falhas de produto permanecem vermelhas intencionalmente, sem expected adaptado. Nenhum retry automático ou aumento de timeout. A primeira falha de setup das datas foi preservada; leitor agora aceita resposta vazia e mantém a exigência HTTP OK. Suites novas são dirigidas pela config específica, não alteram expected de suites históricas.

## Persistência e segurança das evidências

Spring e PostgreSQL reais, usuários `example.invalid` com namespace por execução; doubles apenas email e mercado. Falhas503/500 são injeções explícitas para o ramo de erro. Não há interceptação de sucesso financeiro. SQL final coletado mesmo quando browser falha: contas/transações/faturas/metas/investimentos. Hábitos/preferências/notas usam API/reload como evidência adicional; não alegar dump SQL de tabelas que não foram coletadas.

Mailbox contém códigos efêmeros somente em `tests/artifacts` ignorado; traces/videos desabilitados para evitar credenciais. Evidências duráveis selecionadas fora de target. Senhas literais de fixtures eventualmente citadas pelos logs de falha foram suprimidas nas cópias duráveis, sem remover stack/assertion/resultado; códigos válidos e tokens não entram no pacote. Screenshots de recuperação inspecionadas usam código inválido000000, senha mascarada.

Sem build de produção nem nova suíte backend total: não houve alteração de runtime/dependências. Testes de integração passaram pelas migrations reais. Não certifica produção, adoção CF017, carga, N+1, todos os modais, todos os fusos, nem zero bugs. Provas visuais têm o alcance de VISUAL; presença no DOM isoladamente não certifica legibilidade.

Conferência final: a referência a JVM UTC na matriz pré-execução não foi confirmada por captura do timezone default da JVM nesta rodada; o harness fixa explicitamente Clock em America/Sao_Paulo. Não usar essa referência como evidência de execução em UTC. Logs brutos preservam espaços finais/linhas vazias emitidos pelas ferramentas; diff-check de código e documentação autoral passou, com avisos restritos às saídas capturadas.
