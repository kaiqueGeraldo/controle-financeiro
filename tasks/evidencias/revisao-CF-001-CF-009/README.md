# Revisão independente CF-001 a CF-009 — 09/09/2026

**Parecer: bloqueado para aprovação integral do bloco e avanço recomendado a CF-010.**
A revisão encontrou 16 achados corrigidos (R01–R16) e cinco pendências (P01–P05).
O conjunto possui validações verdes relevantes, mas o cenário adversarial P05
continua vermelho e o contrato canônico de legado ainda não está implementado.
Esta conclusão não certifica ausência de outros bugs nem autoriza dados reais.

## Base, preservação e escopo

Base inicial: branch `main`, HEAD `169d7be4c7d3db97d4c318ff3f99d9de3a808067`,
staging vazio, alterações locais de várias tarefas ainda sem commits. O
[inventário inicial](base-inicial.json) registra paths, bytes e SHA-256 antes
das edições da revisão. Não havia commit CF-001–009 identificável no histórico;
foi revisado o working tree, não somente o HEAD antigo. Instruções AGENTS foram
fornecidas na conversa; nenhum AGENTS.md em arquivo foi localizado.

Foram lidos execução, política de testes, nove tarefas, SPEC-002/003, inventário
temporal, contrato HTTP, decisões e evidências históricas. Resultados antigos
foram tratados como pistas. Nenhum agente paralelo foi iniciado. Não houve
reset, clean, amend, rebase, push, merge remoto, deploy, migração ou envio real.

Os arquivos de catálogo e definições futuras já existentes sustentam referências
do validador CF-001; versioná-los como documentação não executa CF-010–036. Seus
conteúdos e estados foram preservados. A alteração geral do README da raiz fica
fora dos commits deste bloco, preservada byte a byte em relação ao inventário.
Fontes, scripts, testes, contratos e evidências selecionados estão mapeados no
[plano de commits](commit-plan.json). Logs temporários, builds, planilhas,
node_modules, configurações secretas e caches ficam fora do staging.

## Achados corrigidos

Localizações abaixo são da versão final; `F/` = `controle-financeiro-frontend/`,
`B/` = `controle-financeiro-backend/`. Evidências brutas ficam localmente em
`F/tests/artifacts/review-*`, ignoradas pelo Git. Os resumos e hashes persistem
em [resultados](resultados.json); testes referidos estão versionados.
Todas as reproduções usam dados sintéticos. Confirmação **alta** significa
assertion causal anterior e validação posterior, salvo R01, confirmado pela
seleção efetiva de testes e execução do smoke.

| ID / gravidade / tarefa | Arquivo e localização | Reprodução, anterior → esperado/corrigido | Critério e evidência |
|---|---|---|---|
| R01 P1 CF-003/007 | F/tests/e2e/playwright.config.ts:18 | Runner público selecionava também spec integrado: 9 casos com backend/relógio incompatíveis. Seleção explícita de dois specs públicos: 6 casos; integrado permanece opt-in. | Separação de camadas CF-003; listagem e smoke 6/6. Não foi adicionado skip. |
| R02 P1 CF-008/009 | F/src/contexts/userContext.tsx:60 | Releitura de perfil com 403/500/503 apagava usuário e emitia expiração; 401 emitia evento duplicado. Preservar perfil, apresentar erro e permitir retry; 401 expira uma vez. | AC-UI-007/008, `user-session-review.test.tsx`, provider real + cliente HTTP. |
| R03 P1 CF-009 | F/src/hooks/useOptimisticMutation.ts:42 | M1 de A termina após A/logout/A ou unmount e executa callback antigo. Geração de sessão invalida callbacks e locks antigos. | AC-UI-008/009; `async-state.test.tsx`, sucesso/falha após retorno ao mesmo ID e unmount. |
| R04 P1 CF-008/009 | F/src/app/api/[...path]/route.ts:43; F/src/services/api.ts:153 | Request já abortada ainda iniciava escrita; resposta 401 tardia de leitura cancelada expirava sessão atual. BFF devolve 499 sem enviar; cliente verifica abort antes dos efeitos. | Cancelamento sem efeito enganoso; `bff-contract.test.tsx`, `http-contract.test.tsx`. |
| R05 P1 CF-008 | F/src/services/api.ts:186 e :201; F/src/services/transactionService.ts | Escrita 500/501 ou JSON 200 malformado não exigia reconciliação; HTML 200 podia virar XLSX. Marcar resultado incerto e exigir MIME XLSX exato no export. | AC-UI-007/011; HTTP 500–504, JSON inválido, HTML/JSON/binário e erro de exportação. |
| R06 P1 CF-006/008 | B/src/main/java/com/controlefinanceiro/api/controller/AnnualSummaryController.java:38 | Em 2040-01-01T02:59:59Z, ano default usava JVM/parede. Esperado 2039 em Brasília; agora usa Clock do produto. | SPEC-002 DEC-01; `TemporalBoundaryReviewTest.r06DefaultYearUsesProductDayAtNewYear`. |
| R07 P1 CF-006/008 | B/src/main/java/com/controlefinanceiro/api/controller/TransactionController.java:45; PlanningController.java:49; domain/planning/dto/CopyPreviousPlanDTO.java | Competência parcial/vazia, mês 0/13, ano 0/10000, frações e status inválido chegavam ao serviço, truncavam ou geravam 500. Binding/Bean Validation retorna 400 com campos antes do serviço. | SPEC-002 competência; 27 casos `TemporalBoundaryReviewTest`; DTOs tipados, deserialização inteira estrita e handler de validação de método. |
| R08 P2 CF-005 | F/src/utils/date.ts:5 e :51 | Ano 0000 aceito; navegar em 0099 resultava em 1999 pelo construtor Date. Rejeitar zero e deslocar clone ancorado no dia 1 preservando ano. | AC-TIME-005/008; `date.test.mjs`, 6 casos em três fusos. |
| R09 P1 CF-009 | F/src/contexts/financeContext.tsx:90 | Evento refreshFinance após alteração não era ouvido; saldo 100 continuava 100. Provider relê e passa a 90. | Invalidação coerente; `async-state.test.tsx` com FinanceProvider real. |
| R10 P1 CF-009 | F/src/hooks/useExtract.ts:121 | Página 1 falha; retry avançava para 2, omitindo registros. Avançar página confirmada somente após sucesso; tentativas [0,1,1]. Loading usa página solicitada. | AC-UI-008/009; `temporal-navigation.test.tsx`. |
| R11 P1 CF-005/009 | F/src/components/forms/payInvoiceModal.tsx:47; operationModal.tsx:49 | Refetch de contas/ativo com novo objeto apagava data/hora editadas, inclusive após meia-noite. Inicializar por identidade da operação e resetar ao fechar. | SPEC-002 DEC-01; `temporal-forms.test.tsx`. Vermelho inicial observado no pagamento; assertions finais também cobrem operação. |
| R12 P1 CF-008/009 | F/src/components/forms/operationModal.tsx:120 | 409 chamava onSuccess. Callback separado onReconcile relê estado incerto; falha não fecha modal nem sinaliza sucesso. | AC-UI-009; `temporal-forms.test.tsx`, conflito real ApiError. |
| R13 P1 CF-005/009 | F/src/components/forms/{newTransactionModal,newCardTransactionModal,payInvoiceModal,operationModal}.tsx, handleSubmit | Dois submits no mesmo tick geravam duas chamadas. Ref síncrona impede a segunda e libera em finally. | AC-UI-009; quatro formulários com promessa pendente. Não prova idempotência bancária. |
| R14 P1 CF-009 | F/src/contexts/habitsContext.tsx:120 | M2 confirma dia 08; M1 falha dia 07; releituras falham: rollback de hábito inteiro removia M2. Restaurar somente log do dia 07. Sequências ficam no último valor confirmado pelo servidor até releitura. | AC-UI-009; `habits-rollback-review.test.tsx`, provider real, duas variantes (log prévio ausente/PENDING): 2 vermelhos → 2 verdes. |
| R15 P2 CF-006/008 | F/src/middleware.ts:15 | No instante exato de exp, rota ainda permitia navegação; contrato diz now >= exp. Comparação passa a <=, sem alterar verificação de assinatura no backend. | SPEC-002 DEC-01; `middleware-expiry-review.test.tsx`, antes/exatamente/depois: 1 vermelho → 3 verdes. |
| R16 P1 CF-002/006 | B/src/test/java/com/controlefinanceiro/api/utils/TemporalConfigTest.java:23 | Mutante Clock.systemUTC sobreviveu: teste só observava Clock.fixed que ele mesmo criava. Assertion adicional observa zona do bean real, esperada literalmente America/Sao_Paulo. | Qualidade de oracle; [sobrevivente preservado](backend-mutante-sobrevivente.json), depois M07 falha por esperado America/Sao_Paulo/observado Z. |

Não houve remoção de assertions, aumento de tolerância, snapshots atualizados,
skips ou desativação de regra para obter verde. O inventário foi atualizado para
os novos campos CopyPreviousPlanDTO.month/year; seu validador primeiro falhou
por ausência desses campos no documento. Isso corrige documentação, sem mudar
o contrato canônico ou a exigência de inteiro.

## Pendências e alcance da conclusão

| ID / gravidade / tarefa | Localização e reprodução | Observado → esperado; confirmação e encaminhamento |
|---|---|---|
| P01 P1 CF-006/008/017 | B/src/main/java/com/controlefinanceiro/api/domain/investment/dto/InvestTransactionResponseDTO.java:23; construir resposta de linha legada sem origem com date=2026-09-07T23:30 | `toLocalDate()` converte todas as linhas em civil e elimina bruto/origem na resposta. SPEC-002 DEC-02 exige Data indisponível quando significado civil não é comprovado e preservação literal do legado no detalhe. Confirmado estaticamente; nenhum banco pessoal foi consultado. Rollout exige proveniência/esquema/adaptador coordenados; não backfill por meia-noite, prefixo ou tipo da operação. |
| P02 P1 CF-006/008/017 | B/src/main/java/com/controlefinanceiro/api/service/TransactionService.java:87–88 e equivalentes de cartão/pagamento; criar com hora ausente | Fallback usa hora do servidor e created_at mistura operação/auditoria. Destino é time opcional desconhecido e recordedAt separado. Confirmado estaticamente, compatibilidade atual explícita em DateUtilTest; teste de fallback não aprova contrato canônico. Migração NOT NULL/origem pendente, preservada sem regra inventada. |
| P03 P1 CF-008/013 | F/src/services/planningService.ts:28–30 versus B/src/main/java/com/controlefinanceiro/api/controller/PlanningController.java | Frontend oferece PUT /planning/{id}; controller não possui mapeamento. Confirmado por confronto de contrato, sem alegar status HTTP medido nessa revisão. Definir update, validação e preservação de campos/competência pertence à conclusão desse fluxo, não implementada aqui. |
| P04 P2 CF-007 | B/src/test/java/com/controlefinanceiro/api/TemporalBrowserApiPostgresE2E.java:44 e F/src/middleware.ts:15 | Clock da API fixo em 2027, middleware usa Date.now real. Token de 24h dessa execução passará a ser recusado pelo middleware quando a parede alcançar sua expiração. Confirmado por análise dos dois relógios; execução futura não simulada no E2E. Separar controle de tempo de autenticação/calendário no harness, sem bypass produtivo de segurança. |
| P05 P1 CF-005/007 (CF-022 para semana/streak) | F/src/components/screens/habits/habitItem.tsx:48–49 e habitDetails.tsx:60–64; 2026-09-08T02:59:59Z, browser Pacific/Kiritimati | Marcar hoje envia 2026-09-08; produto ainda está em 2026-09-07. Contrato DEC-01 exige diaProduto/contexto Brasília e atualização da janela. **Confirmado por componente real**, [probe isolado](probes/habit-product-day.test.tsx): esperado 07, recebido 08, exit 1. Permanece aberto; aplicação coordenada do calendário compartilhado em lista/detalhe/janela ainda necessária, sem ratificar semana/streak pelo código atual. |

P05 é mantido como diagnóstico vermelho explícito, fora do comando de aceites
já implementados. [pending-probes.mjs](pending-probes.mjs) copia fonte/teste para
temporário e propaga exit 1: não converte defeito conhecido em skip ou em verde.
A regra do dia está clara; o parecer não apresenta esse fluxo como corrigido.
P01/P02 dependem de transição de dados e P03 de completar um fluxo de produto;
não foram inventadas regras para fechar a revisão.

Hipóteses não promovidas a defeitos: limpeza imediata de histórico selecionado
em todos os hooks após troca de usuário; ordenação global estável entre páginas
com timestamps legados; replay financeiro concorrente e divergências de streak.
Não foram demonstradas novas vulnerabilidades de isolamento nem ganho de SQL.

## Testes e limites por camada

| Camada | Resultado da revisão | O que comprova / limite |
|---|---|---|
| Artefatos CF-001 | 39 critérios, 17 achados, 31 cenários, dois usuários e 52 links válidos | Rastreabilidade/oracles; não executa produto. |
| Artefatos CF-004 | 22 grupos, 21 exemplos, 40 campos DTO Java e 14 TS, 12 links válidos | Formatos, offsets, competência, legado e exemplos; não comprova implementação canônica. |
| Unidade frontend | 6 testes × São Paulo/UTC/UTC+14 = 18 verdes | Civil, ano zero/bissexto, dias 29–31, imutabilidade, prazo hoje/ontem/amanhã e fusos. |
| Componentes/cliente/BFF | 59 verdes, dez arquivos | Providers/hooks/formulários reais; rede controlada, 400/401/403/409/204/5xx, binário, timeout/cancelamento, retries, ordem e sessão. Não é prova de transação no banco. |
| Probe adversarial aberto | 1 vermelho P05, exit 1 | Contradição diaProduto/diaNavegador; impede aprovação integral de CF-005/007. |
| Backend completo | 82 testes, zero falhas/erros/skips; clean verify JDK 21, JVM UTC | Unidades, binding/validação, segurança e integração PostgreSQL descartável. O teste E2E opt-in não entra nessa contagem. |
| E2E público | 6 verdes, três viewports 360×800/768×1024/1440×900 | Autenticação pública e relógio do harness; não certifica finanças. |
| E2E financeiro real | 1 teste Java orquestra 2 jornadas Playwright verdes | JVM UTC, browser São Paulo/UTC+14; cadastro/login pela UI, BFF/Spring/SQL reais, 400 sem persistir, criação/edição/reload de transação, compra cartão, investimento e efeito bancário, meta, hábito, exportação com leitura POI. Somente e-mail/cotação substituídos. |
| Mutação frontend | M01–M06 detectadas, controles verdes e restauração SHA-256 | UTC no default; fuso local em civil; overflow mês; fatura antiga; lock; 504→500. Assertions causais, não import/sintaxe. |
| Mutação backend | M07–M09 detectadas após R16, controles verdes e restauração SHA-256 | Clock UTC, hora inválida normalizada, ano zero aceito. Primeira sobrevivência de M07 preservada. |
| Mutação E2E integrada | M10 detectada: controle 0, mutante 1, cópia restaurada | API soma um dia no DTO do histórico; assertion de 30/01/2027 falha e DOM contém 31/01/2027. Browser/BFF/Spring/PostgreSQL reais, mesmos limites. |
| TypeScript/build | Typecheck exit 0; build Next final exit 0 | Compilação/14 rotas; não substituem lint ou testes financeiros. |
| ESLint src + tests/component | **46 erros e 30 avisos**, exit 1; base isolada: 48 erros/27 avisos | Dívida preexistente mantém gate vermelho. Escopo exato igual nos dois comandos; nenhuma regra desativada. Não equivale ao lint completo histórico de 70 erros. |

Não foram cobertas todas as combinações de status por endpoint; 404 é classificado
no cliente/handler, sem E2E completo de ausência/proprietário em todos os módulos.
Não houve matriz visual completa de todas as telas, acessibilidade, temas,
textos longos, concorrência de duas sessões reais, pagamento simultâneo,
idempotência bancária, EXPLAIN/benchmark nem migração de dados reais. O E2E
financeiro não exercita pagamento de fatura pelo modal; esse modal tem regressão
de componente e propagação temporal do evento no backend. No instante E2E os
dois calendários mostram 31/01; P05 evidencia o caso divergente ausente.

## Ambiente e falhas preservadas

Windows; Node 24.18.0; JDK 21.0.12.1; Maven wrapper/cache local; Docker 29.6.2;
PostgreSQL 16-alpine descartável por Testcontainers. npm global estava sem
npm-cli.js, por isso comandos executaram CLIs já instaladas por Node. Não se
alega instalação limpa via npm ci nem execução remota do GitHub Actions.

Ocorrências que **não** foram contadas como regressão causal: cache Maven sem
permissão no sandbox; compilação da primeira versão do handler por construtor
Spring incompatível (corrigido); .next/dev/types/validator.ts local corrompido;
primeiro E2E não chegou à jornada por timeout de webServer; uma cópia do cache
temporariamente sob src/tests entrou no typecheck (movida para TEMP); build sem
acesso às fontes Google (repetido com rede permitida e aprovado). Cache antigo
foi preservado fora da fonte. Na mutação E2E, primeira cópia sofreu rejeição de
junction pelo Turbopack; root foi ajustado só no isolamento, igualmente para
controle/mutante. Segundo controle atingiu timeout 120s durante a jornada e foi
preservado; limite e assertions não aumentaram. Verde posterior não apaga isso.

Na execução final M10, controle passou e mutante falhou na assertion da data
formatada. O detector inicial só procurava ISO no log e classificou a falha
como inconclusiva. Inspeção do DOM capturado mostrou 31/01/2027 diante do esperado
30/01/2027. `--classify-existing` registra a conferência causal e a restauração
sem repetir testes nem alterar o results.json bruto. O detector passou a exigir
esse par exato de assertion/DOM; nenhuma tolerância do Playwright mudou.

Houve interrupção por limite de uso do Codex; nenhuma ação destrutiva ou commit
foi executado durante a interrupção. O trabalho foi retomado na mesma base.

## Decisões de engenharia

Calendário por valor e competência ancorada são O(1); formatar n linhas custa
O(n). Locks/versões usam Map O(1) por chave e memória O(k) para requests ativos;
cancelamento reduz trabalho do cliente, mas não desfaz commit do servidor. A
geração evita ABA de sessão. Rollback de hábito varre hábitos/logs afetados
O(h+l), preserva alterações de outras datas e remove cálculo duplicado de
sequência; trade-off: contador fica no último valor confirmado durante a espera.

Validação inteira na fronteira evita truncamento/falhas tardias com custo
constante por parâmetro; DTOs explícitos substituem Maps sem ampliar domínio.
Travar formulário evita repetição na instância React, mas não entre abas ou
réplicas: CF-024 continua responsável por idempotência/transação no banco.
Reconciliação após escrita ambígua evita assumir rollback; não executa retry
financeiro automático. EntityGraph de hábitos carrega logs junto da listagem e
evita lazy fora da sessão observado no bloco; aumenta payload/volume por usuário.
Não há medição que autorize declarar N+1 eliminado em todos os domínios ou
consultas escaláveis. Paginação/janela de logs e EXPLAIN ficam em CF-025/022.

## Reproduzir

Na pasta frontend: `node scripts/test.mjs`,
`node node_modules/vitest/vitest.mjs run --config tests/component/vitest.config.mts`,
`node node_modules/typescript/bin/tsc --noEmit`,
`node node_modules/next/dist/bin/next build`, `node scripts/playwright.mjs test`.
Na raiz: executar os dois validadores nos caminhos da tabela e
`node tasks/evidencias/revisao-CF-001-CF-009/{mutations,backend-mutations,integrated-mutation,pending-probes}.mjs`
(um script por comando; backend requer JAVA_HOME 21). A opção `--resume-control`
do integrado repete controle após preparar cache, preserva o log anterior e não
liga retries automáticos. O probe pendente deve continuar retornando erro até
a correção de P05, quando pode ser promovido à suíte de produto.

Na pasta backend, PowerShell: definir JAVA_HOME para JDK 21 e incluir bin no Path;
`./mvnw.cmd --batch-mode '-Duser.timezone=UTC' '-Dmaven.repo.local=C:/Users/Aluga.com/.m2/repository' clean verify`.
Para E2E: trocar `clean verify` por `'-Dtest=TemporalBrowserApiPostgresE2E' test`.
As aspas preservam argumentos -D no PowerShell. Não configurar datasource externo.

## Estado e commits

CF-001/002/003/004 e CF-009 permanecem concluídas **nos limites descritos**.
CF-005/006/007/008 voltam a `em_revisao`, com P01–P05 visíveis. As narrativas
históricas anteriores permanecem datadas; a revisão atual prevalece para aceite.
Nenhuma tarefa posterior teve execução ou estado alterado. A recomendação é
resolver o diaProduto e os contratos/rollout pendentes antes de avançar CF-010
como continuação de uma fundação supostamente aprovada.

Commits são agrupados por responsabilidade, com implementação e regressões
juntas quando acopladas. Somente o conjunto final foi validado; **nenhum commit
intermediário é declarado isoladamente testado**. O manifest `codigo-validado.json`
identifica os bytes de fontes/configurações/testes efetivamente verificados e
`commits.json` registra hashes dos commits de implementação/documentação anteriores
ao commit final deste parecer. O hash final é fornecido na entrega e no git log;
não é embutido no próprio conteúdo do commit.

As árvores Git de backend, frontend e CI constam também em
`codigo-validado.json`; o commit final acrescenta somente documentação da revisão.
`git diff --check` do grupo documental apontou apenas linhas em branco finais
preexistentes em definições CF-010–036, catálogo, rastreabilidade e evidência
histórica de typecheck. Foram preservadas para não editar conteúdo alheio;
grupos de código/infra/E2E passaram nesse check. Isso não foi mascarado como
um check global verde.

Referência técnica consultada para a validação de parâmetros, além do código
Spring disponível localmente: [validação de controllers Spring MVC](https://docs.spring.io/spring-framework/reference/7.1/web/webmvc/mvc-controller/ann-validation.html).

## Encaminhamento posterior — 13/09/2026

[Execução de saneamento P01–P05](../saneamento-P01-P05-2026-09-09/README.md):
correções e autotestes posteriores, com pendências de adoção P01/P02 rastreadas na
CF-017. Este link não altera o parecer histórico acima nem constitui revisão
independente das novas alterações. O estado mais recente dos gates está no saneamento.
