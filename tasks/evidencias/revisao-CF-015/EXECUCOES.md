# Execuções e limites

Ambiente: Windows, PowerShell, Node 24.18.0, Next 16.1.6, React 19.2.3, Vitest 4.1.11, Playwright 1.63.0/Chromium, Maven Wrapper, Java 21.0.12.1, PostgreSQL 16 via Testcontainers. JVM UTC; navegadores America/Sao_Paulo e Pacific/Kiritimati; componentes também UTC. Não houve conexão com banco pessoal/produtivo nem envio de e-mail externo.

`F` abaixo é o diretório `controle-financeiro-frontend`; `B`, `controle-financeiro-backend`. Logs estão nesta pasta. Os comandos foram executados diretamente com Node pois os scripts locais já disponibilizam as dependências; não houve atualização de dependências.

## Testes dirigidos, depois suítes afetadas

| Diretório / comando | Resultado | Evidência e alcance |
|---|---|---|
| F: `node node_modules/vitest/vitest.mjs run --config tests/component/vitest.config.mts tests/component/planning-edit.test.tsx tests/component/habit-product-day.test.tsx tests/component/harness-credential-clock.test.tsx tests/component/temporal-compatibility.test.tsx` | 21 aprovados | [direcionados.log](direcionados.log). JSDOM não comprova layout real. |
| F: `node node_modules/vitest/vitest.mjs run --config tests/component/vitest.config.mts` | Antes dos novos casos: 110 aprovados. Depois: **110 aprovados, 6 falhas**, 26 arquivos, nenhum skip | [componentes.log](componentes.log), [componentes-final.log](componentes-final.log). Falhas R01/R02/R03/R04/R07/R08. |
| F: `node scripts/test.mjs` | 18 aprovados, seis por fuso | [unitarios.log](unitarios.log), SP/UTC/Kiritimati. |
| F: Vitest dirigido de `habit-product-day`, `harness-credential-clock` e `temporal-compatibility`, com `$env:TZ='Pacific/Kiritimati'` e depois `'UTC'` | 18 aprovados em cada execução | [kiritimati.log](kiritimati.log), [utc.log](utc.log). A tentativa inicial UTC com diretório digitado incorretamente não iniciou testes; a execução correta está registrada. |
| F: `node node_modules/typescript/bin/tsc --noEmit` | Aprovado nas execuções registradas | [typecheck.log](typecheck.log), [typecheck-encerramento.log](typecheck-encerramento.log). Uma anotação de fixture `CreditCard` foi corrigida durante preparação do novo teste; não mudou comportamento esperado. |
| F: `node node_modules/eslint/bin/eslint.js . --format json --output-file ../tasks/evidencias/revisao-CF-015/lint-final.json` | **31 erros, 30 avisos**, exit 1 | [lint-final.json](lint-final.json). Escopo inteiro, igual ao saneamento: antes 42/29. Sem ignore, exclusão ou limpeza global. |
| B: `./mvnw.cmd --batch-mode '-Duser.timezone=UTC' '-Dtest=PlanningEditIntegrationTest,TemporalCompatibilityIntegrationTest,CredentialExpiryClockTest,TemporalConfigTest,HabitServiceTemporalTest' test` | **18 aprovados**, nenhum skip | [backend-jdk21.log](backend-jdk21.log): 5 PUT planejamento, 9 compatibilidade temporal, 2 credenciais, 1 hábitos, 1 configuração. |
| B: `./mvnw.cmd --batch-mode '-Duser.timezone=UTC' verify` | **97 aprovados, 1 falha**, nenhum erro/skip | [backend-completo.log](backend-completo.log): R06 em `CF015PlanningOwnershipTest`. `verify` termina na falha do Surefire; etapas posteriores não foram aprovadas. Nome `*E2E` exige chamada explícita, não é contado nesses 98 testes. |
| F: `node scripts/playwright.mjs test` | 6 aprovados | [smoke.log](smoke.log): superfícies públicas e relógio em 360/768/1440; backend sentinela indisponível. **Não é integração financeira real.** |

Os testes novos foram executados primeiro em grupos pequenos (`novos-achados-red.log`, `payment-red.log`, `draft-focus-red.log`, `integracao-ampliada.log`) e depois incluídos nas suítes completas. Nenhuma falha conhecida foi excluída para produzir verde.

## Integração real e evolução do harness

Comando base em B:

```powershell
$env:JAVA_HOME='C:/Users/Aluga.com/AppData/Local/Temp/cf006-jdk21/jdk-21.0.12.1+1'
.\mvnw.cmd --batch-mode '-Duser.timezone=UTC' '-Dtest=TemporalBrowserApiPostgresE2E' test
```

O orquestrador cria PostgreSQL descartável, Spring em porta aleatória e Next/BFF em loopback 3107. Cada execução tem namespace e usuários sintéticos. O teste Java valida SQL e Excel **depois** de Playwright aprovar. Portanto, nas tentativas cujo Playwright falhou, a verificação SQL final do orquestrador não é contada como executada. As APIs financeiras bem-sucedidas não foram interceptadas.

| Log / namespace | Resultado e interpretação |
|---|---|
| [integracao.log](integracao.log), `cf007-eb334dc6` | 2 cenários planejamento aprovados, 2 financeiros falham por seletor estrutural de modal obsoleto (R09). Não prova defeito financeiro. |
| [integracao-ampliada.log](integracao-ampliada.log), `cf007-9350cac2` | Após R09, quatro cenários temporais aprovam. Dois visuais falham porque o identificador sintético gerou e-mail longo demais; fixture foi encurtada. Teste adicional R06 reproduz 200/linha alheia, uma falha real distinta do harness. |
| [integracao-final.log](integracao-final.log), `cf007-2cecfbec` | **6/6 Playwright e 1/1 Java aprovados**: quatro jornadas temporais/planejamento nos dois fusos e duas jornadas de captura/nota. SQL, Excel e reload confirmados. Captura automática ainda não aguardava opacidade JS: não equivale a aprovação visual de cada imagem. |
| [visual-final.log](visual-final.log) | Opacidade passa a ser exigida antes da captura. Em SP, dois cenários temporais passam, visual falha: opacidade 0. Não se alterou expected nem timeout. |
| [visual-avancando.log](visual-avancando.log), `cf007-97521279` | Troca de `clock.setFixedTime` por `clock.install` avançando não resolve a transparência; 2 passam, 1 falha. Essa tentativa não foi ocultada. |
| [visual-nativo.log](visual-nativo.log), `cf007-a04b7848` | Com relógio nativo **somente no roteiro visual**, as 30 capturas, nota/reload e tema/reload passam pelas respectivas assertions. Depois o acionador mobile sem nome acessível impede continuar: R12. Dois cenários temporais continuam aprovados; teste visual completo falha. A transparência não se reproduziu nessa comparação. |
| [browser-encerramento.log](browser-encerramento.log), `cf007-a171a218` | 4 cenários temporais aprovados; 4 visuais falham por seletor estrutural que apontava para pai errado do título. Não comprova falha de nome pela assertion; mantido como erro de preparação de teste. |
| [browser-conferencia.log](browser-conferencia.log), `cf007-5bc8cab5` | **3 Playwright aprovados, 1 falha R12**, SP: roteiro visual/modal/nota/tema completo e dois cenários temporais aprovados; assertion de nome acessível recebe string vazia. Seletor estrutural corrigido sem mudar a exigência de nome. Java interrompe no gate Playwright; SQL final não executado nessa tentativa. Detalhes e limites em VISUAL.md. |

Para execuções SP apenas, foi acrescentado `'-Dcf007.playwright.project=sao-paulo'`. `integracao-ampliada.log` usou `'-Dtest=TemporalBrowserApiPostgresE2E,CF015PlanningOwnershipTest'`. Logs de cada tentativa não foram sobrescritos pela posterior.

O roteiro temporal mantém negócio em `2027-01-31T05:00:00Z`; credenciais do BFF/Spring usam relógio de autenticação separado. O roteiro visual final deixa o relógio **do navegador** nativo e prepara o planejamento no mês/ano ali exibido; isso não é teste de fronteira temporal, comparação de fechamento anual ou conformidade de relógios produtivos. O backend continua descartável sob seu clock de teste. Datas de fixture visual não são usadas como oráculo de regras financeiras.

## Mutações dirigidas

Comando na raiz: `node tasks/evidencias/revisao-CF-015/mutations.mjs`.

- M01, cópia isolada: substituir o default civil por `toISOString().slice(0,10)`. Dois testes de formulário passam a falhar: dia esperado 07, observado 08. [M01-utc-default.log](M01-utc-default.log).
- M02, cópia isolada: atrasar a atualização do dia do produto para 2147483647ms. Um teste de virada de hábitos falha mantendo o estado do dia anterior. [M02-stale-product-day.log](M02-stale-product-day.log).
- [mutations.json](mutations.json) registra hashes original/mutado/restaurado e integridade do working tree. Cópia em diretório temporário `cf015-mutation-*`; não se introduziu mutante em runtime compartilhado. Os testes originais passam fora da cópia.

## Lint, limitações de ambiente e rastreabilidade

O comando e o escopo da contagem 42/29 foram conferidos contra o JSON histórico. [lint-compare.mjs](lint-compare.mjs) e [lint-comparacao.json](lint-comparacao.json) identificam deltas por arquivo: onze erros a menos; quatro avisos novos em `common-components.test.tsx` e três avisos antigos removidos, produzindo 31/30. Não se conclui que zero novos erros por contagem agregada isolada: os arquivos e diagnósticos do delta foram examinados. Arquivos `cf015*` adicionados pela revisão não geraram diagnósticos no lint final.

Primeira tentativa Maven no sandbox não conseguiu escrever no cache (`backend-tentativa.log`); repetição autorizada com JDK padrão 25 foi rejeitada pelo enforcer (`backend-escalado.log`). O JDK 21 já disponível foi utilizado nas execuções seguintes. Esses dois resultados são **testes não executados por ambiente**, não aprovação nem defeito do produto. Docker/Testcontainers funcionou nas execuções autorizadas; não houve fallback para banco existente.

Build de produção, CI remota, carga/EXPLAIN, backup/restore e rollout **não executados**. Pagamento financeiro completo com navegação/reload não é comprovado pelo mock do teste R03. Capturas não medem queries nem demonstram responsividade de todas as combinações de dados/tema.

Na preparação documental, `git diff --cached --check` retornou exit 2 com 297 diagnósticos de whitespace exclusivamente em logs brutos e no patch de staging (cujo contexto usa espaços). [diff-check.json](diff-check.json) registra todos os locais; não houve diagnóstico fora de `.log`/`.patch`. As saídas originais e o patch foram preservados, sem normalizar a evidência. Código e documentos foram conferidos separadamente; isso não é exceção de lint nem exclusão de teste. Typecheck final e lint dirigido dos arquivos de revisão terminaram com exit 0 (`typecheck-final-review.log`, `lint-revisao.log`, `lint-visual-final.log`).
