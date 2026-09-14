# Revisão independente CF-015 — parecer com restrições

Executada em 13–14/09/2026. Escopo: CF-010 a CF-014 e revalidação dirigida de P01–P05. Não foram iniciadas CF-016 ou tarefas posteriores. A leitura da tarefa derivada CF-017 não é sua execução.

## Quatro conclusões distintas

| Decisão | Parecer e dependência concreta |
|---|---|
| **A. Aprovação do marco frontend CF-015** | **Não aprovado; CF-015 em_revisao.** R01/R02 apresentam dados da seleção abandonada; R03 não confirma reconciliação de pagamento; R05 converte indisponibilidade em vazio; R06 viola propriedade na criação consumida pelo planejamento. R04/R07/R08/R10 também impedem aceite de interação/layout. Esses bloqueios existem no ambiente novo e descartável e independem da adoção temporal. |
| **B. Revalidação do saneamento P01–P05** | **P03 (correção do PUT), P04 e P05 revalidados nos cenários delimitados abaixo. P01/P02: implementação candidata revalidada parcialmente, adoção continua aberta.** R06 é defeito preexistente do POST, não prova de regressão da edição P03; bloqueia a aprovação ampla do fluxo de planejamento. |
| **C. Aprovação integral de CF-001–CF-009** | **Não concedida.** A revisão inicial terminou com restrições, o saneamento existe, mas CF-005/006/007/008 ainda têm as condições de adoção de P01/P02. CF-009 retorna a em_revisao por R01/R02, apesar dos cenários anteriores de troca de usuário aprovados. Não se reabre CF-001–004 por associação. |
| **D. Prontidão para publicação** | **Não pronta.** O backend candidato requer novas colunas antes de operar sobre o banco existente; não há evidência de baseline/migrador, proveniência por lote, backup/restore e rollout exigidos em CF-017/P01/P02. Há também defeitos funcionais confirmados e candidato frontend ainda não integrado em commits. Teste em schema descartável não autoriza publicação no banco existente. |

O exame terminou e produziu um parecer; isso não significa que os critérios do marco foram satisfeitos. Não se declara ausência de bugs além do conjunto verificado.

## Base examinada e autoria

- HEAD inicial: **`1ced2f027fa46ab265b211829375581880cbb07b`**, branch `main`, staging inicialmente vazio.
- Intervalo de saneamento examinado: **`8dad1c1..1ced2f0`**. `8dad1c1` é a revisão inicial; `9a380ae` P05; `9bdb98b` P03; `171a5c3` P04; `ac87873` P01/P02; `1ced2f0` encerramento documental. Hashes completos e caminhos estão em [rastreabilidade-git.json](rastreabilidade-git.json).
- **Não existem commits de implementação CF-010–CF-014 na base encontrada.** As implementações, seus testes e relatórios já estavam no working tree quando esta revisão começou. Foram examinados `HEAD → working tree inicial`, incluindo arquivos novos. Relatos de tarefa concluída não foram tratados como prova nem como commit existente.
- A sobreposição posterior com os caminhos saneados contém `payInvoiceModal.tsx`, `invoiceDetails.tsx` e `useExtract.ts`. Não havia alteração posterior no backend temporal, na edição de planejamento ou no calendário de hábitos. Os três deltas frontend foram examinados junto dos testes de compatibilidade; R03 está no primeiro deles.
- [base-inicial.json](base-inicial.json) registra SHA-256 e tamanho de **57 arquivos preexistentes**. [preservacao.json](preservacao.json) confirma os 57 idênticos após os testes e antes das atualizações de status. Fontes de runtime e evidências históricas não foram alteradas pela revisão.
- README da raiz permanece com o patch alheio fora dos commits; SHA-256 inicial e preservado: `6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA`.
- Instruções examinadas: instruções AGENTS fornecidas na conversa, `tasks/README.md`, `EXECUCAO.md`, `POLITICA-DE-TESTES.md`, tarefas CF-010–015, SPEC-002, critérios/oráculos e roteiro exploratório, contrato HTTP, revisão CF-001–009, saneamento e CF-017/P01/P02. Relatórios históricos foram preservados.

## Achados e alterações

[ACHADOS.md](ACHADOS.md) contém severidade, arquivo/linha, reprodução, esperado/observado, origem, tarefa e condição de encerramento para R01–R12. Há cinco achados P1, cinco P2, um aviso P3 de lint e uma correção de harness. R05 é confirmado por inspeção estática; R01/R02/R03/R04/R06/R07/R08/R12 têm testes novos que falham pelo comportamento; R10 tem capturas renderizadas inspecionadas.

Correção realizada: **R09**, seis seletores estruturais quebrados substituídos por seleção semântica dos diálogos no E2E temporal. Nenhum resultado esperado foi adaptado. A execução original ficou preservada e a execução integrada posterior aprovou banco, resposta, Excel e reload. Foram adicionados testes adversariais, roteiro visual e documentação. **Não foi aplicada correção de runtime financeira, temporal ou de autenticação durante a revisão**; esses defeitos ficam explicitamente abertos para remediação e posterior revisão independente.

## Revalidação dirigida P01–P05

| Item | Inspeção e execução | Resultado / limite |
|---|---|---|
| P01 — origem | `OperationTemporal`, DTOs, writers de contas/transações/cartões/pagamentos/metas/investimentos/ajustes; origem civil de investimentos `USER_INPUT`/`PRODUCT_CALENDAR`; leitura e exportação; nove testes de `TemporalCompatibilityIntegrationTest`. | Novas operações examinadas explicitam origem; investimento legado desconhecido conserva bruto e não afirma data civil. Ordenação/exportação de fixtures com hora conhecida e desconhecida não inventam auditoria. Inventário produtivo de writers/lotes e migração **não executado**. |
| P02 — hora e auditoria | Criação sem hora versus `00:00`, edição com omissão/null, tentativa de alterar origem/bruto/auditoria, cartão e investimento; persistência e Excel. `recordedAt` capturado no servidor e `updatable=false`; `legacyCreatedAtRaw` preservado antes da alteração compatível. | Casos sintéticos aprovados: ausência não vira meia-noite; auditoria antiga permanece null; cliente não retrodata auditoria. `createdAt` continua alias misto, não um instante confiável para novos consumidores. Não há prova de proveniência ou transição de todos os clientes no ambiente existente. |
| P03 — edição planejamento | Contrato `UpdatePlanItemDTO`, serviço transacional, BFF/PUT, cinco testes de integração; dois E2E nos fusos SP/Kiritimati com reload e SQL. | Descrição/valor/vencimento/categoria editáveis; competência preservada; omissão mantém, categoria null limpa; campos não editáveis/valores inválidos/referência alheia não escrevem; item de cartão é protegido. Correção do PUT revalidada. POST continua vulnerável em R06; não aprovar todo planejamento apenas pelo PUT. |
| P04 — relógios | `TokenService`, `TemporalConfig`, config de testes, harness de credenciais e E2E com negócio em janeiro/2027 e autenticação em fevereiro/2027. Testes distinguem token válido/expirado; validação inclui assinatura, emissor e expiração. | Não depende de empurrar uma data para depois do relógio real: emissão e validação compartilham relógio controlado no teste. Produção usa `Clock.system(productZoneId)`; overrides fixos são do teste. Nenhum bypass produtivo introduzido. Não é auditoria completa de segurança do JWT. |
| P05 — hábitos | `browserTodayContext.tsx`, `useProductToday`, lista/detalhe/marcação; timer da próxima virada, focus e visibilitychange; backend usa calendário de negócio. Testes em SP, UTC e Kiritimati. | **`2026-09-08T02:59:59Z` → `2026-09-07` em Brasília**, inclusive navegador UTC+14. Virada/foco/visibilidade atualizam sem reload. Frequência/sequência exercitadas pelos testes existentes e código dessas regras preservado. Mutante que atrasa a virada falha. Matriz completa de frequências ao longo de meses não foi reexecutada como jornada de navegador. |

O SQL de upgrade usado no teste atua apenas em schema sintético e verifica preservação/rollback. Não é migração produtiva/idempotente, backup, restore real ou ensaio de rollout. A [CF-017 derivada](../../03-integridade/CF-017-P01-P02-adocao-temporal.md) permanece proposta e aberta.

## Matriz do marco frontend

| Fluxo | Critério | Risco | Verificação | Resultado | Evidência |
|---|---|---|---|---|---|
| Componentes, sidebar e layout | AC-UI-001/003 | Foco, campos sem nome, overflow e valores ocultos | Componentes comuns/sidebar; navegador 360/768/1440; inspeção de capturas | Parcial; R08/R10/R11 abertos; R09 corrigido | componentes-final.log; ACHADOS R08–R11; pastas visual |
| Auth e configurações | AC-UI-004/006/007/010 | Sessão, falso sucesso, perda de rascunho | Auth/settings, contratos HTTP/401/403/204/binário; usuário sintético real no E2E; nova ref de usuário durante edição | Cenários existentes passam; R07 falha. Recuperação por e-mail ponta a ponta não executada | draft-focus-red.log; backend-completo.log; smoke.log |
| Dashboard | AC-UI-002/003/008/011 | Erro vira zero; resposta antiga; valores ilegíveis | Retry e erro em componentes; teste 6M→1Y→6M; visual tablet/desktop | R02 e R10; suite anterior verde não cobria cache hit | cf015-chart-race.test.tsx; novos-achados-red.log; visual/768-dashboard.png (subpasta do projeto) |
| Contas e extrato | AC-TIME-001/005/006; AC-UI-002/011 | Data, filtro, página, reload, soma de página | Criação/edição UI real, PostgreSQL/Excel; erro/retry em componente; 31/jan→fev e testes de ano bissexto/inválidos | Temporal aprovado nos cenários; layout R10; F-018 permanece sobre escopo dos totais | integracao-final.log; unitarios.log; backend-jdk21.log |
| Cartões | AC-UI-001/002/006/008/011 | Pagamento duplicado, competência, leitura incompleta | Compra E2E, status/valor/mês em componente, hook+modal com 200 seguido de 503 | R03/R05/R08/R10. Pagamento completo com releitura/reload em navegador não comprovado nesta revisão | payment-red.log; draft-focus-red.log; componentes-final.log |
| Planejamento | Aceite P03; AC-FIN-005; AC-UI-005/011 | Edição parcial, dono, competência | PUT UI→BFF→Spring→PG→reload; invalid/null/managed; novo POST com categoria alheia | PUT aprovado; R06 bloqueia criação; R10 visual | backend-jdk21.log; integracao-final.log; backend-completo.log |
| Metas e investimentos | AC-TIME-001; AC-UI-002/003/012 | Legado desconhecido, posição atual como histórica | Operação/meta via E2E real; DTO/Excel de legado; componente posição histórica e erro; visual vazio/ativo sintético | Cenários aprovados, não certificação das regras financeiras completas | integracao-final.log; backend-jdk21.log; componentes.log |
| Hábitos | Contrato dia do produto; AC-TIME-003/004 | UTC+14, virada e foco | Componentes nos três fusos, backend, criação via E2E, mutação isolada do timer | P05 revalidado nos limites acima | kiritimati.log; utc.log; M02-stale-product-day.log |
| Resumo anual | AC-UI-008/009/011/012 | Ano errado, nota não persistida, histórico inventado | Nota UI real + reload + GET; trocas rápidas com cache; digitação durante save; histórico em componente | Caminho simples aprovado; R01/R04 bloqueiam aceite amplo | integracao-final.log; novos-achados-red.log |
| Estado compartilhado | AC-UI-008/009 | Logout A→B, abort ignorado, rollback tardio e duplicidade | Testes existentes de troca de identidade, duas mutações, single-flight e rollback | Cenários anteriores aprovados; novos cache hits R01/R02 falham | async-state.test.tsx; componentes-final.log |

Valores esperados dos novos testes são literais independentes: ano 2026, série 1300, nenhum fechamento antes de reconciliação, rascunho preservado, foco no diálogo e 404/zero linhas/sem nome privado. Helpers sob teste não calculam os próprios oráculos. Mocks controlam falhas e ordem; não comprovam persistência real.

## Execuções, imagens e lacunas

[EXECUCOES.md](EXECUCOES.md) registra comandos, ambiente, resultados, tentativas inválidas de harness e o alcance de cada camada. [VISUAL.md](VISUAL.md) distingue captura automática, inspeção humana pelo revisor e cenários não concluídos. Logs vermelhos foram mantidos, sem skip/retries adicionais nem exclusão de testes problemáticos.

Lacunas materiais: não foi executado build de produção nesta revisão; `tsc` não substitui build. Não foram cobertos todos os cruzamentos de tema/privacidade/dados volumosos em todas as telas, zoom nativo em todos os navegadores, recuperação por e-mail e troca real A→B no navegador com resposta atrasada, nem a jornada completa de pagamento com conferência de dívida/conta/patrimônio. Os testes de componente dessas interações não são alegados como E2E. Sem banco existente, sem migração produtiva, sem CI remota e sem publicação.

## Estado das tarefas após o parecer

| Tarefa | Estado | Justificativa |
|---|---|---|
| CF-001–004 | Mantido | Não se alteraram seus critérios nem foi descoberta evidência que exija reabertura nessa revisão dirigida. |
| CF-005–008 | em_revisao, mantido | Saneamento candidato revalidado; condições de adoção P01/P02 não satisfeitas. R06 acrescenta uma falha de propriedade no contrato consumido. |
| CF-009 | em_revisao | R01/R02 invalidam a conclusão ampla de estado assíncrono. |
| CF-010 | em_revisao | Layout R10, consumidor de diálogo R08 e novos avisos R11; seletor de harness R09 corrigido. |
| CF-011 | em_revisao | R07 e lacunas do aceite integrado. |
| CF-012 | em_revisao, mantido | R02/R10/R12; F-018 não foi encerrado. |
| CF-013 | em_revisao, mantido | R03/R05/R06/R08/R10 e pagamento ponta a ponta incompleto. |
| CF-014 | em_revisao | R01/R04; correções de apresentação histórica e calendário não resolvem essas falhas. |
| CF-015 | em_revisao | Parecer emitido, marco recusado com condições explícitas. |
| CF-017/P01/P02 | proposta, mantido | Apenas referência de dependência; nenhum trabalho de adoção executado. |

## Encaminhamento

Corrigir primeiro a propriedade de categoria em criação (R06), a reconciliação de pagamento (R03) e o vínculo de respostas à seleção (R01/R02); tratar R05 e os defeitos de interação/layout nas tarefas responsáveis. Preservar estes testes vermelhos como regressões. Solicitar nova revisão independente das correções, especialmente segurança e finanças. Não avançar para CF-016 por efeito deste parecer. A publicação continuará dependendo, separadamente, das evidências da adoção temporal.

Os commits locais e o estado remanescente são registrados em [COMMITS.md](COMMITS.md). A implementação preexistente do bloco e o README alheio permanecem fora do staging da revisão.
