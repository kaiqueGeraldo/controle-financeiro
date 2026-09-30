# Saneamento dirigido dos residuais CF-016–CF-021

30/09/2026. Base exata confirmada: e927aea03801562dba1cacbc196aaee6721b155c. Candidato anterior e encerramentos permanecem no [parecer independente](../revalidacao-CF-016-CF-021/README.md). Inicialmente, staging vazio e somente README raiz alheio modificado; SHA256 6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA.

**Rodada parcialmente resolvida; marco aguardando revisão independente.** RVA-01/RVA-02 corrigidos e verificados localmente. RVA-03 permanece pendente porque não foi isolada a causa do travamento original. Nenhuma decisão NG-01 foi reaberta, nenhum encerramento anterior sem regressão demonstrada foi reiniciado, nenhum trabalho CF-022+ executado.

## Matriz dos identificadores originais

| ID | Causa e correção / investigação | Prova | Situação |
|---|---|---|---|
| RVA-01 / RVI-21, RVI-18 e NG-01 | Compensação reavaliava 0,67/2 em vez de conservar 1/3; replay agora redimensiona a declaração original, preservando TOTAL/PRICE/referência/data/origem. | REVAL02 vermelho 0,34 versus 0,33 → verde; oito casos novos + regressões anteriores e SAN-RVA pela UI/PG/reload. | Corrigido/verificado localmente; decisão permanece total autoritativo proporcional. |
| RVA-02 / RVI-07, consumidores RVI-06/10 | Custo histórico null contaminava remanescente vazio; custo atual zero quando unidades acabam, custo baixado/resultado/proveniência permanecem desconhecidos. Leitura de posição encerrada antiga preserva null bruto sem backfill. | REVAL01 vermelho null versus zero → verde; parcial/final/resgate monetário/legado/relatório e reload. | Corrigido/verificado localmente; não certifica completude de história desconhecida. |
| RVA-03 / RVI-11 e jornada de metas/cartão | POST 200 e leituras 200 anteriores não explicam modal pendente. Duas reproduções diagnósticas definidas por condição terminaram as quatro promises, request atual e fechamento. Sem mudança funcional de pagamento. | Isolado 1/1; sequência 20→120: 2/2; R03 quatro modos, SAN-D1 e pagamento120 final; primeiro vermelho independente preservado. | Pendente, causa inconclusiva. Verde posterior não demonstra resolução. Próximo experimento em RVA-03.md. |

Detalhes, oráculos, custos e limites: [FINANCEIRO.md](FINANCEIRO.md) e [RVA-03.md](RVA-03.md). RVA-04 já encerrado pelo revisor permanece encerrado; não se iniciou rodada visual ampla ou zoom nativo 200%.

## Execuções e contagem

| Execução | Resultado | Evidência |
|---|---|---|
| Duas provas originais antes | 2 falhas de assertion / 2 testes, zero erros de infraestrutura | rva01-rva02-antes.log |
| Primeiro diff financeiro | 60/60 | backend-afetado.log |
| Backend afetado final | 62/62, zero falhas/erros/skips; inclui REVAL01/02 e oito novos casos | backend-afetado-final.log |
| Componentes afetados | 38/38 em oito arquivos | componentes-afetados.log |
| Diagnóstico pagamento120 isolado | 1/1 jornada, Java/SQL aprovados | browser-diagnostico120.log; browser/diagnostico120 |
| Diagnóstico sequência20→120 | 2/2 jornadas, Java/SQL aprovados | browser-sequencia20-120.log; browser/sequencia20-120 |
| Candidato sem instrumentação: R03 + SAN-RVA | 5/5 jornadas, Java/SQL aprovados | browser-financeiro-recuperacao.log; browser/financeiro-recuperacao |
| Candidato sem instrumentação: intenção/counter final | 2/2 jornadas, Java/SQL aprovados | browser-intencoes-pagamento120-final.log; browser/intencoes-pagamento120-final |
| TypeScript | Aprovado, processo finalizado; log vazio | typecheck.log |
| ESLint do harness alterado | Zero erros/warnings; log vazio | lint-afetado.log |
| Build produção Next | Aprovado; aviso anterior de middleware permanece | build.log |

Os 60 estão incluídos nos 62. Os sete cenários finais de navegador são verificações do candidato sem instrumentação temporária; os três cenários diagnósticos são experimentos distintos, não casos financeiros adicionais nem prova de resolução de RVA-03. Não somar Java orquestrador como jornada extra. Não foi repetida a auditoria integral: H01/H02, matriz temporal 18 e suíte 234 anteriores conservam seus encerramentos/evidências, sem ser apresentados como novos runs desta rodada. Lint global não repetido; baseline anterior 23 erros/21 warnings permanece fora do escopo. Nenhuma assertion anterior removida, skip, expected adaptado ou sucesso financeiro mockado.

SAN-RVA executa compensação pelo botão/modal real. Aberturas, provento e vendas de fixture usam HTTP explícito; não são apresentados como ações feitas pela UI. Após compensação e venda, API/reload conservam quantidade 1/custo 1/avaliação 0,33/TOTAL/data 10/01/2027/origem informada. Final e venda de posição desconhecida deixam custo/valor 0, ganho histórico null, banco 1253; resumo anual apresenta posição atual zero e resultado incompleto. SQL pós-commit está em persisted.txt. Os cenários R03/SAN-D1/compra/exclusão/reembolso usam ações reais nos consumidores descritos. Email/cotação somente doubles externos; PostgreSQL descartável com Flyway V1–V11 e Hibernate validate.

## Reprodução

No backend, PowerShell, Docker disponível e JAVA_HOME em target/temurin21/jdk-21.0.12.1+1. Maven com --batch-mode e -Dmaven.repo.local=C:/Users/Aluga.com/.m2/repository. Comandos executados:

~~~powershell
./mvnw.cmd --batch-mode '-Dmaven.repo.local=C:/Users/Aluga.com/.m2/repository' '-Dtest=IndependentRemediationBoundaryTest' '-Duser.timezone=UTC' test
./mvnw.cmd --batch-mode '-Dmaven.repo.local=C:/Users/Aluga.com/.m2/repository' '-Dtest=IndependentRemediationBoundaryTest,ResidualInvestmentRegressionTest,MilestoneValuationTest,MilestoneInvestmentCorrectionTest,Cf020InvestmentGoalIntegrationTest,MilestoneReportingPositionTest,MilestoneReportingCoverageTest,MilestoneCashPresentationTest,IntegratedMilestoneReviewTest' '-Duser.timezone=UTC' test
./mvnw.cmd --batch-mode '-Dmaven.repo.local=C:/Users/Aluga.com/.m2/repository' '-Dtest=MilestoneRemediationBrowserTest' '-Dreview.evidence=../../saneamento-CF-016-CF-021-residuais/browser/revalidacao-financeiro' '-Dreview.grep=R03: pagamento|SAN-RVA' test
./mvnw.cmd --batch-mode '-Dmaven.repo.local=C:/Users/Aluga.com/.m2/repository' '-Dtest=MilestoneRemediationBrowserTest' '-Dreview.evidence=../../saneamento-CF-016-CF-021-residuais/browser/revalidacao-intencoes' '-Dreview.grep=SAN-D1|pagamento 120' test
~~~

Primeiro comando foi vermelho antes da correção e está contido nos 62 após. Harnesses sequenciais, porta 3107 livre; usar diretórios novos para não sobrescrever provas. Diagnósticos: CF_RVA03_DIAGNOSTICS=1 e grep 'pagamento 120' ou 'SAN-BC-card'; patch temporária preservada, aplicada somente em checkout isolado para refazer as etapas. Não aplicá-la ao candidato para aceite; ela registra logs e pode mudar timing, outra razão para não inferir resolução.

No frontend foram executados tsc --noEmit, ESLint de tests/e2e/milestone-remediation.integrated.spec.ts, next build e Vitest com tests/component/vitest.config.mts, restringindo aos oito arquivos: cf015-reconciliation-lifecycle, cf015-payment-reconciliation, cf015-recovery-expanded, cf015-revalidation-overlap, milestone-payment-intent, revalidation-payment-scope, cf021-reporting e goals-investments-habits-annual-audit (extensão .test.tsx). Scripts via node node_modules/...; nenhum timeout, configuração de retry ou regra de lint alterado.

## Commits, preservação e limites

Commit financeiro local: cc089c6db956dbac1731baef8f998e503f93de86 — fix(investments): preserve valuation reference and closed residual cost. Contém código, regressão e provas antes/depois. Commit seguinte agrupa harness, investigação, logs e notas; HEAD final e intervalo integral exatos entregues no chat. Sem reescrita, push/deploy, banco real, Railway ou mensagens/emails reais.

V1–V11, provas do revisor, relatórios históricos, oráculos/hashes originais e README alheio preservados. Instrumentação temporária do produto removida; frontend/src fica sem diff desta rodada. Tarefas CF-019/020/021 conservam em_revisao; pendências CF-017, zoom nativo 200% e CF-023/024/025/027/032 mantidas. Verificador histórico CF-016 permanece com o vermelho anterior de pom.xml; não houve atualização de hashes nem novo aceite retrospectivo.

Errata documental da descrição anterior de locks: pagamento atual adquire cartão antes da conta no listener. Não foi demonstrado ciclo oposto; não se declara deadlock novo nem se altera ordem por hipótese. H01 conta/investimento permanece no escopo provado. Replay O(n) por correção, potencial acumulado O(n²); sem consulta adicional por linha/ativo ou benchmark amplo.

RVA-03 impede declarar saneamento integral resolvido ou publicar o marco. O próximo experimento é delimitado e consta de RVA-03.md. Autotestes não substituem aprovação independente. Estado final esperado do Git: somente README raiz preexistente modificado, staging vazio.
