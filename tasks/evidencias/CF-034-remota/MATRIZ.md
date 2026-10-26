# CF-034 — matriz da etapa remota

25/10/2026. Entrada aprovada `4d20fb00f929f70cd2fe30b7a3d9aab004526547`;
base remota observada `272001f7b4c39aebd18bdcd856109f9a0f6c1213`.
DEC-CI-04 e aceite independente local preservados. Esta matriz distingue plano
de execução e evidência concluída; configuração não é aprovação.

| Critério | Workflow/job e versões | Serviços descartáveis | Evidência esperada | Classificação |
|---|---|---|---|---|
| Lint e tipos | `ci.yml / required`, ubuntu-latest, Node 24 | Nenhum | Logs novos, ESLint sem warnings e tsc exit 0 | Obrigatório nesta etapa |
| Datas | Mesmo job, comando canônico `npm test` | Nenhum | 3 fusos São Paulo/UTC/Kiritimati, totais positivos, zero skips/falhas | Obrigatório nesta etapa |
| Componentes/onboarding | Vitest do lockfile | Nenhum | JSON bruto examinado, total positivo e zero falhas/erros/skips | Obrigatório nesta etapa |
| Backend | Temurin 21, Maven wrapper/POM, Docker | PostgreSQL 16 Testcontainers, schema por contexto, Flyway real | 94 classes originais e a regressão de pool acrescentada em26/10 (95 correntes); relatório de cada classe e contagens sem skips | Obrigatório nesta etapa |
| E2E smoke | Java + Playwright do lockfile, Chromium, JVM UTC | Spring/Next em loopback e PostgreSQL sintético | 6 jornadas CF032 A/B/G/H/K/L, SQL/reload, zero flaky/skips | Obrigatório nesta etapa |
| Build e JAR | Next build + Maven verify, sem skipTests no gate | Mesmos recursos do job | Manifesto novo, fonte efetiva, lock/POM, comandos, contagens e SHA256; download do artifact | Obrigatório nesta etapa |
| Runner/coleta e contraprovas | Node tests + experimentos isolados | Fixtures/processos sintéticos | Falha/subprocesso, relatório ausente, JAR alterado e coleta recusada bloqueiam avanço | Obrigatório nesta etapa |
| Sentinelas e upload | Sanitizador compartilhado → coletor → Actions artifact | Somente strings sintéticas | JSON/Bearer/cookie/JSON escapado sem segredo; aspa incompleta impede publicação; download inspecionado | Obrigatório nesta etapa |
| Cancelamento remoto | Execução sintética delimitada em Actions/Linux | Processo/descendente e PostgreSQL próprio | Início observado, cancelamento suportado, próximos passos bloqueados; distinguir cleanup de descarte da VM | Obrigatório nesta etapa |
| Eventos e isolamento | PR para main; push somente main; paths backend/frontend/.github/tasks/docs/sdd | VM por job | Eventos/SHAs reais, condições de upload, ausência de deploy e uso exclusivo de dados sintéticos | Obrigatório nesta etapa |
| RCI034-01/R1 e Windows/processos | Revisões locais já aceitas | Históricos preservados | Não repetir saneamento nem atribuir aceite Windows a Linux | Já aceito no alcance original |
| Expanded | 15 bridges históricos nomeados em suites.mjs, CF032 completo inclusive 3 casos temporais | Cada bridge requer seu preparo/fixtures | Execução própria e relatórios, sem produto/asserções enfraquecidas | Pendente fora do smoke corrente; não aprovado por associação |
| UI ampliada | Política: 360×800, 768×1024, 1440×900; fusos/temas/estados atribuídos por tela | Fixtures próprias | Não criar produto cartesiano arbitrário; roteiros históricos têm pré-condições próprias | Pendente fora do smoke corrente |
| Imagem do Dockerfile | Java 21, Dockerfile histórico com skipTests | Nenhuma imagem prevista para publicação por esta etapa | JAR de CI não certifica imagem reconstruída pelo provedor | Pendente fora do recorte de pacote JAR |
| Ctrl+C nativo, zoom 200%, adoção CF017/P01/P02, produção e sucessoras | Decisões próprias | Nenhum acesso real autorizado | Nenhum novo aceite alegado | Pendente fora do recorte |

`workflow_dispatch` não é mecanismo de bootstrap: `ci.yml` ainda não está na
default branch. Antes da integração, os gates ordinários devem partir do evento
`pull_request`, que testa o SHA sintético de merge. Não integrar só para habilitar
dispatch. Documentação: https://docs.github.com/en/actions/how-tos/manage-workflow-runs/manually-run-a-workflow.

## Publicação segura e decisão de main

Railway: produção acompanha main, `checkSuites:false`, PR Environments desativado.
Backend/PG offline não equivalem a autodeploy desabilitado. Vercel: preview para
todas as branches, main em Production com autoassign e nenhum Deployment Check.
O arquivo `controle-financeiro-frontend/vercel.json` bloqueia apenas a branch desta
execução, preservando configuração das demais branches. Conferir status remoto
após push/PR antes de declarar ausência de deploy.

Integração na main depende de uma separação explícita dos gatilhos de produção;
o pedido proíbe alteração de infraestrutura de produção e não autoriza acioná-la
por CI verde. A decisão pendente será apresentada com os alvos/configuração
exatos. Não contornar proteção (a main atualmente não tem regra remota) nem
considerar sua ausência como dispensa dos gates acordados.
