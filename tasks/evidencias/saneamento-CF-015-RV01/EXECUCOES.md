# Execuções e revisão exata — 21/09/2026

Base: `f550b9e240f32220291ac0a3819d035df679b2b3`.
Produto corrigido: `8ec920c70b471f2046d90df1a391448d4ff1025c`.
Windows/PowerShell; dependências existentes; Node 24.18, Chromium
153.0.8010.12, JDK 21.0.12.1, PostgreSQL 16 via Testcontainers.

## Componente, tipos e build

Executar em `controle-financeiro-frontend`:

```powershell
node node_modules/vitest/vitest.mjs run --config tests/component/vitest.config.mts cf015-revalidation-overlap
node node_modules/vitest/vitest.mjs run --config tests/component/vitest.config.mts cf015-revalidation-overlap cf015-reconciliation-lifecycle cf015-payment-reconciliation cf015-financial-consumers cf015-recovery-expanded async-state cards-planning-audit
node node_modules/typescript/bin/tsc --noEmit
node node_modules/next/dist/bin/next build
```

| Log | Resultado |
|---|---|
| antes.log | Exit 1 antes de qualquer edição de produto. Teste do revisor falha na linha 47: fechamento indevido uma vez. |
| depois-componentes.log | 33/33; teste original do revisor aprovado sem alteração. |
| lifecycle-audit.log | 14/14, após acrescentar verificação de erro original e lote invalidado com leituras já concluídas. |
| componentes-final.log | **41/41**, sete arquivos; inclui regressões pagamento, concorrência, consumidores reais e ciclo de vida. |
| typecheck-final.log | Exit 0, arquivo vazio; após o código final e cenário E2E `overlap`. |
| build-final.log | Exit 0; produto final, TypeScript e rotas de produção. Aviso preexistente de middleware depreciado. |

O blob do teste original do revisor é idêntico na base e no candidato:
`bd65cf47cd29f42c81acdc788622f4763d6f509f`. Conferido com `git rev-parse`
da base e `git hash-object` do arquivo. Revisão React das alterações TSX:
helper puro fora do componente, nenhuma dependência/effect/listener adicionado,
leituras paralelas e guard por operação preservados; não houve refatoração geral.

Não foi repetida a suíte completa de todos os domínios, matriz de fusos ou lint
global: a mudança é coordenação de reconciliação, sem cálculo/data/schema.
Os arquivos dirigidos compartilhados incluem alguns cenários já encerrados;
executá-los não reabre achados. Lint global mantém o diagnóstico histórico da
revalidação; esta rodada não o certifica como aprovado.

## PostgreSQL e jornada real

Executar em `controle-financeiro-backend` com:

```powershell
$env:JAVA_HOME='C:/Users/Aluga.com/AppData/Local/Temp/cf006-jdk21/jdk-21.0.12.1+1'
$env:CF015_VISUAL_DIR='../tasks/evidencias/saneamento-CF-015-RV01/visual'
$env:CF015_NATIVE_ZOOM='1'
.\mvnw.cmd --batch-mode '-Duser.timezone=UTC' '-Dcf007.playwright.project=sao-paulo' '-Dtest=TemporalBrowserApiPostgresE2E,CF015PaymentRecoveryTest' test
```

Primeira tentativa (`integrado.log`, `playwright-tentativa1.log`, namespace
`cf007-567ba10c`): os dois testes de proteção de pagamento PostgreSQL passaram;
oito testes Playwright existentes passaram. O nono falhou na configuração do
harness de zoom (`deviceScaleFactor` com viewport nulo), antes de acessar o
produto. A assertion de exit do orquestrador impediu suas conferências SQL
finais nessa tentativa; não se atribui a ela aprovação de SQL/Excel do E2E.

Segunda tentativa (`integrado-final.log`, `playwright-zoom-pendente.log`, namespace `cf007-b30049b5`):
configuração do zoom corrigida, fixture e janela reais abertas; controle nativo
recusou o identificador da janela. Assertion de zoom recebeu razão DPR 1 em
vez de 2. Esse vermelho é uma limitação de execução, não um defeito de produto
demonstrado. Detalhes e roteiro manual: [ZOOM.md](ZOOM.md).
Os oito testes integrados existentes passaram novamente; SQL final do
orquestrador ficou impedido pelo exit não zero do zoom.

Execução financeira final, já com `overlap`, isolando a pendência de zoom:

```powershell
$env:CF015_VISUAL_DIR='../tasks/evidencias/saneamento-CF-015-RV01/visual-financeiro'
$env:CF015_NATIVE_ZOOM='0'
.\mvnw.cmd --batch-mode '-Duser.timezone=UTC' '-Dcf007.playwright.project=sao-paulo' '-Dtest=TemporalBrowserApiPostgresE2E' test
```

**Aprovada:** `integrado-financeiro.log` e `playwright-financeiro.log`, namespace
`cf007-d2681ea6`: nove E2E, sem retries/skips, mais teste Java do orquestrador
com SQL/Excel (exit 0, 3m54s). Pagamentos `ok`, `read`, `lost` e `overlap` têm
saldo 900, exatamente um débito pago de 100, uma fatura PAID e item de plano
PAID de 100, conferidos diretamente em SQL depois do navegador. HTTP verifica
dívida 0, patrimônio/conta 900 e persistência após reload. JVM UTC/navegador
São Paulo; não se alega nova matriz completa de fusos.

Desativar o teste **opt-in** de zoom nessa execução separa dois resultados;
não o aprova, não elimina seus vermelhos e não fecha R10. Nenhum teste existente
foi removido/desabilitado. O código financeiro final é o commit `8ec920c`, os
testes/harness finais são `cd0bbd0` (somente comentário do teste E2E foi precisado
após iniciar a execução; nenhuma assertion/comportamento mudou).

O harness existente também executa temporal, notas e capturas responsivas antes
de conferir SQL/Excel; essas verificações acopladas foram preservadas. Capturas
em `visual*` são geradas pela automação de viewport já existente, sem novo parecer
visual de encerramento e **sem servir de evidência de zoom nativo**.

## Commits e limites

| Commit | Conteúdo |
|---|---|
| `8ec920c70b471f2046d90df1a391448d4ff1025c` | Correção R03/RV01 e regressões de componente. |
| `cd0bbd07b911bf75163f845eddb520c4307d1a11` | Sobreposição E2E, oráculo SQL e harness opt-in de zoom. |
| Commit que adiciona este documento (`git log -1 -- tasks/evidencias/saneamento-CF-015-RV01/EXECUCOES.md`) | Evidências e atualização das tarefas; nenhum runtime adicional. |

Intervalo **exato de produto e testes** para revalidação:
`f550b9e240f32220291ac0a3819d035df679b2b3..cd0bbd07b911bf75163f845eddb520c4307d1a11`.
O hash final do commit documental e o intervalo completo constam na entrega.
Staging explícito conferido por lote. README raiz preservado e fora dos commits;
relatórios anteriores sem alterações. [Hashes do candidato](candidato.json).

CF-015 em_revisao, aguardando confirmação independente de R03/RV01 e evidência
nativa para R10. CF-016 não iniciada. Nada publicado ou executado em banco real.
