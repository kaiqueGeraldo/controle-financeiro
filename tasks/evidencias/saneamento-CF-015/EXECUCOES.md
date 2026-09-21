# Execuções do saneamento CF-015

Ambiente: Windows/PowerShell, Node 24.18.0, Next 16.1.6, Playwright 1.63.0,
Chromium 153.0.8010.12, JDK 21.0.12.1+1, Maven Wrapper e PostgreSQL 16
Testcontainers. Dados/usuários sintéticos com namespace isolado, sem banco real.

## Comandos reproduzíveis

Na pasta frontend:

```powershell
node node_modules/vitest/vitest.mjs run --config tests/component/vitest.config.mts
node scripts/test.mjs
node node_modules/typescript/bin/tsc --noEmit
node node_modules/eslint/bin/eslint.js . --format json --output-file <log>
node node_modules/next/dist/bin/next build
```

Complemento de fusos: executar Vitest com `TZ=UTC` e `TZ=Pacific/Kiritimati`,
filtrando `cf015-annual-races cf015-chart-race cf015-recovery-expanded`.
A suíte padrão registra America/Sao_Paulo no setup. Foram 14 testes em cada
complemento. Não foram introduzidos `.skip`, `.only` ou retries de aprovação.

Na pasta backend, configurar JAVA_HOME para o JDK 21 disponível:

```powershell
.\mvnw.cmd --batch-mode '-Duser.timezone=UTC' verify
.\mvnw.cmd --batch-mode '-Duser.timezone=UTC' '-Dtest=TemporalBrowserApiPostgresE2E' test
```

A segunda chamada inicia PG descartável, Spring em porta aleatória e Next3107;
executa São Paulo e Kiritimati, depois confere SQL e Excel. O filtro opcional
`-Dcf007.playwright.project=sao-paulo` foi usado somente em iterações dirigidas.
Produto fixo em 2027-01-31T05:00Z e autenticação em 2027-02-02: não se usou a
expiração real do JWT como relógio de negócio. A inspeção visual usa relógio
nativo para evitar interferência em animações; não é oráculo de data financeira.

## Resultados e causalidade

| Execução / log | Resultado e interpretação |
|---|---|
| `componentes-inicial.log` | Candidato preexistente: 110 aprovados, seis falhas originais reproduzidas. |
| `backend-red.log` | POST de categoria alheia: esperado 404/zero linhas/sem nome privado; observado 200/linha/nome. |
| `backend-propriedade-ampliado-red.log` | Quatro cenários: dois falham (POST e cópia legada), dois passam. |
| `backend-propriedade-green.log` | Nove testes dirigidos aprovados: propriedade e PUT. A cópia legítima foi acrescentada depois e está na suíte final. |
| `backend-pagamento-red.log` | Duas falhas: repetição debita novamente; concorrência não produz a recusa esperada. |
| `backend-pagamento-green.log` | Duas regressões aprovadas com PostgreSQL após lock/guarda PAID. |
| `R05-original.log`, `R04-refetch-original.log` | Em cópia temporária isolada, arquivos de ad7fd81 reintroduzem vazio falso/perda de rascunho. Falham pelo comportamento; hashes provam restauração e working tree não alterado. |
| `browser-inicial.log` | Três testes Playwright passam e R12 falha pelo nome ausente. Java interrompe antes da verificação SQL final; não contar como jornada integrada aprovada. |
| `browser-recuperacao-1.log` | Docker indisponível; falha de ambiente, antes da jornada. |
| `browser-recuperacao-2.log`, `playwright-recuperacao-2.log` | Cinco passam/três falham na checagem final da conta por seletor ambíguo. Débito/PAID/recovery/reload anteriores passaram; não era aprovação da jornada inteira. |
| `browser-recuperacao-3.log`, `playwright-recuperacao-3.log` | Sete passam/um falha: helper visual tentou JSON em resposta vazia válida de criação de compra. |
| `browser-matriz-1.log`, `playwright-matriz-1.log` | 16 Playwright aprovados + Java/SQL/Excel aprovados. Inspeção das capturas ainda encontrou recorte com valores grandes; testes verdes não foram tratados como aprovação visual. |
| `componentes-entrega.log` | 131/131, 28 arquivos, sem skipped, após últimos ajustes de geometria. |
| `unitarios-final.log` | Seis unitários aprovados. |
| `componentes-utc.log`, `componentes-kiritimati.log` | 14/14 em cada fuso adicional. |
| `backend-final.log` | Maven verify aprovado: 104 testes, zero falha/erro/skipped, JAR gerado. E2E tem execução separada e não entra nesses 104. |
| `typecheck-entrega.log` | Exit 0, sem diagnóstico. Arquivo vazio é o resultado esperado do CLI. |
| `build-final.log` | Build de produção aprovado. Aviso de middleware depreciado preexistente permanece. |
| `lint-final.json`, `lint-comparacao.json` | Exit 1 por dívida existente: 31 erros/26 avisos. Baseline 31/30. Zero novo; quatro removidos exclusivamente do double CF-010. |
| `browser-final.log`, `playwright-final.log` | 16/16 Playwright, zero skipped; Java/SQL/Excel aprovados após os ajustes de recorte. Namespace `cf007-2e697d75`, 21/09/2026. Código final `aade169e3757d6e9a9e72eac6ab17b84b760e01a`. |

Logs intermediários de testes dirigidos, typecheck, build/fontes e lint foram
mantidos. `componentes-ajustes-finais.log` é uma falha do shim npm local; o CLI
instalado foi usado diretamente na execução seguinte. `componentes-ajustes-finais-2.log`
detectou perda do refresh explícito do dashboard: o ajuste foi corrigido para
não duplicar leituras e preservar a assertion existente, sem alterar o teste.

## Mudanças justificadas no harness

1. Regressões originais mantêm suas assertions. `cf015-invoice-focus` acrescenta
   cenário aninhado; o double de animação mantém o contrato e perde só bindings.
2. Novo roteiro de recuperação usava texto `Conta Corrente`, presente no resumo
   e no cartão. Trocou-se pelo botão semântico da conta sintética, preservando
   o expected R$ 900,00. Erro e locator ambíguo constam do log.
3. Helper de fixture visual aceita resposta sem corpo/204; continua exigindo HTTP
   de sucesso real. Nenhum sucesso financeiro foi fabricado. A injeção de perda
   de resposta usa `route.fetch()` até o backend/commit PG e somente então aborta
   a entrega. Injeções 503 são falhas, não resultados financeiros simulados.
4. Capturas passam ao diretório deste saneamento. A primeira execução havia
   escrito no diretório histórico: essas capturas foram arquivadas em
   `visual-inicial` e somente os arquivos históricos originalmente limpos foram
   repostos com bytes do commit eb40303 (script `preserve-review-visuals.mjs`).
   Não houve checkout/reset ou perda do parecer.
5. Seed visual foi ampliada para valor extenso e 12 itens; assertions financeiras
   do roteiro temporal permanecem idênticas. Espera pelo item persistido evita
   capturar a tela antes do debounce de planejamento. Foram acrescentadas
   assertions de geometria do valor no extrato recente e foco/teclado real.

## Limites

Componentes usam mocks nas fronteiras de serviço; não provam banco. Os testes de
integração usam ORM/serviços e PostgreSQL reais. E2E não substitui a revisão de
concorrência ampla ou de migração. O lock foi exercitado com duas transações,
sem sleep como barreira; não é ensaio de carga.

Zoom nativo não aplicado pelo harness: `zoom-capability.json` registra métricas
inalteradas após três atalhos. A captura 180px é apenas viewport adicional.
Logs podem conter caminhos locais e dados sintéticos; não representam tráfego
real. O estado testado é ligado aos commits e hashes em COMMITS.md.
