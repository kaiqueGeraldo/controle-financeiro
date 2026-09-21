# Execuções independentes — 21/09/2026

Base de runtime: `681102b9c23e4fb1c296d97897fc2bf8ab802f4c`, equivalente a
`aade169` nas camadas de produto. Nenhum arquivo de src de produto foi alterado.
Windows/PowerShell, dependências já instaladas, PostgreSQL 16 descartável,
JDK 21 em `C:/Users/Aluga.com/AppData/Local/Temp/cf006-jdk21/jdk-21.0.12.1+1`.

## Comandos e resultados

Comandos frontend, a partir de `controle-financeiro-frontend`:

```powershell
node node_modules/vitest/vitest.mjs run --config tests/component/vitest.config.mts cf015
node node_modules/vitest/vitest.mjs run --config tests/component/vitest.config.mts
node scripts/test.mjs
node node_modules/typescript/bin/tsc --noEmit
node node_modules/eslint/bin/eslint.js . --format json --output-file ../tasks/evidencias/revalidacao-CF-015/lint.json
node node_modules/next/dist/bin/next build
```

| Evidência | Resultado efetivamente obtido |
|---|---|
| componentes-dirigidos.log | 21/21, sete arquivos, antes do novo probe RV01. |
| componentes-completo.log | Suíte recebida: 131/131, 28 arquivos, zero skipped; executada antes de adicionar RV01. **A suíte final com o teste novo não está toda verde.** |
| reconciliacao-sobreposta.log / reconciliacao-sobreposta-final.log | Um teste novo falha por chamada indevida a onClose. Segunda execução acrescenta fechamento/Escape durante espera, que passam; falha financeira permanece. |
| componentes-utc.log / componentes-kiritimati.log | 14/14 em cada execução, filtro `cf015-annual-races cf015-chart-race cf015-recovery-expanded`, `TZ` e `CF_TEST_TIMEZONE` definidos para o respectivo fuso. |
| unitarios.log | 6/6. |
| typecheck.log | Exit 0, arquivo vazio. Build final também executou TypeScript após as últimas assertions do probe. |
| lint.json / lint-comparison.json | Exit 1: 31 erros/26 avisos, mesmos diagnósticos do saneamento; zero introduzido/removido nesta revisão. |
| build.log | Exit 1: download de fontes Geist/Geist Mono falhou no sandbox. Não classificado como defeito de produto. |
| build-escalado.log | Exit 0: build de produção aprovado com rede liberada; middleware depreciado continua aviso preexistente. |

Comandos backend, a partir de `controle-financeiro-backend`, com JAVA_HOME
acima e redirecionamento de stdout/stderr para os logs:

```powershell
.\mvnw.cmd --batch-mode '-Duser.timezone=UTC' '-Dtest=CF015PlanningOwnershipTest,PlanningEditIntegrationTest,CF015PaymentRecoveryTest' test
$env:CF015_VISUAL_DIR='../tasks/evidencias/revalidacao-CF-015/visual'
.\mvnw.cmd --batch-mode '-Duser.timezone=UTC' '-Dtest=TemporalBrowserApiPostgresE2E' test
.\mvnw.cmd --batch-mode '-Duser.timezone=UTC' verify
```

| Evidência | Resultado efetivamente obtido |
|---|---|
| backend-dirigido.log | Exit 1 antes dos testes: sandbox não podia criar/acessar cache Maven. |
| backend-dirigido-escalado.log | 12/12: cinco propriedade, cinco edição e dois pagamento. PostgreSQL real descartável. |
| e2e.log / playwright.log | 16/16 Playwright nos dois fusos, sem retries/skips, mais teste Java/SQL/Excel aprovado. Namespace `cf007-fca0b227`. Tempo Maven 9m29s. |
| backend-completo.log | 104/104, zero falha/erro/skipped; JAR gerado. Inclui nova assertion de ausência de plano parcial em R06. E2E é separado desses 104. |

Os processos Next/Spring/PG desta jornada foram criados e encerrados pelo
harness. Sucessos de pagamento/nota não foram fabricados: a perda de resposta
aguarda `route.fetch()` no caminho BFF/Spring/PG e aborta somente a entrega.
Releituras 503 e falha de nota são injeções de erro controladas. SQL confirma
saldo 900, um débito de 100, PAID na fatura e no planejamento e nota final.
Recusa HTTP, duplo envio e perda de resposta/remontagem também são cobertos
nos componentes. RV01 foi comprovado em componente, não E2E/SQL.

Relógio de negócio fixo em 2027-01-31T05:00Z; autenticação em 2027-02-02T05:00Z.
Jornada temporal preserva campos civis, horário, origem, auditoria, edição,
calendário de hábitos e exportação. Testes de compatibilidade da suíte Java
cobrem hora ausente/00:00, bruto/origem desconhecida e auditoria imutável.
Nada disso certifica migração, proveniência real, restore ou rollout de CF-017.

## Capacidade das regressões

Na raiz:

```powershell
node tasks/evidencias/revalidacao-CF-015/regression-probe.mjs
node tasks/evidencias/revalidacao-CF-015/overlap-causality.mjs
node tasks/evidencias/revalidacao-CF-015/check-evidence.mjs
```

Primeiro probe: sete casos de defeitos originais falham em cinco
execuções isoladas (R01/R04: 2; R02: 1; R03: 1; R05: 2; R07: 1).
Os logs são a referência das contagens. O probe retorna exit 0 porque obteve os
exits 1 esperados dos testes sobre código defeituoso; não significa que o código
original passou. Todos os arquivos temporariamente substituídos foram restaurados.

Contraprova RV01: alteração de uma linha somente na cópia temporária faz o novo
teste passar; restauração confirmada. Não foi aplicada ao checkout compartilhado.
Os vermelhos Java históricos foram lidos e confrontados com código/testes atuais;
não foi reexecutada mutação Java nesta revisão. Limite de causalidade concorrente
detalhado em [ACHADOS.md](ACHADOS.md).

## Conteúdo autorizado e estado Git

Commit local desta revisão contém somente:

- teste novo RV01, assertion adicional R06 e parâmetro de saída visual do harness;
- evidências nesta pasta;
- atualizações documentais de CF-008–CF-015, mantendo em_revisao e reabrindo
  explicitamente o aceite de erro de CF-009.

Não há alteração de runtime, dependências ou expectativas de produto. O teste
RV01 permanece vermelho deliberadamente para entrega ao executor; não há skip
ou mudança de expected para mascará-lo. Não houve push/deploy/banco real.

O commit que introduz este documento é identificável por
`git log -1 -- tasks/evidencias/revalidacao-CF-015/EXECUCOES.md`.
Staging explícito e diff conferidos antes do commit. Estado final esperado e
conferido após commit: somente ` M README.md`, staging vazio, hash original
preservado. O hash do commit é informado no parecer final da conversa.

`git diff --cached --check` apontou espaços finais/linhas vazias somente em
logs brutos de Maven/Next/Vitest. Foram preservados como saída das ferramentas;
o check excluindo `*.log` aprovou. Nenhuma regra de teste/lint foi desabilitada.
