# Achados da revalidação

Base exata e matriz de encerramento no [parecer](README.md). Prioridade não equivale automaticamente a bloqueio de todo desenvolvimento local.

## RVA-01 — P1 — Compensação de provento altera referência de NG-01

**Confirmado, bloqueante para aceite de CF-020 e do marco.** Responsável: CF-020, consumidores CF-021. Arquivo `controle-financeiro-backend/src/main/java/com/controlefinanceiro/api/service/InvestmentCorrectionService.java:108`; `Investment.evaluateTotal` redefine referenceAmount/referenceQuantity. A compensação chama esse método mesmo quando não altera a quantidade nem representa avaliação.

Reprodução independente em `IndependentRemediationBoundaryTest.REVAL02_dividendCompensationMustNotResetAuthoritativeValuationReference`:

1. Abertura: quantidade3, custo3, avaliação total1,00, data/origem informadas.
2. Venda1 a1,00: quantidade2, avaliação0,67.
3. Provento1,00 e compensação integral desse provento, taxa devolvida0. Nenhuma nova avaliação.
4. Venda de outra unidade a1,00.

Esperado literal por NG-01: quantidade1 e avaliação0,33 (referência original1/3). Observado em PostgreSQL:0,34. A compensação troca a referência original pelo valor intermediário arredondado0,67/2; a próxima baixa acumula arredondamento. O teste verifica0,67 antes/depois da compensação, isolando o efeito da referência oculta. A suíte de terços sem compensação passa.

Impacto: avaliação patrimonial deixa de respeitar o total autoritativo; o preço derivado continua não sendo fonte normativa. O defeito não reabre a decisão do usuário. A mesma chamada merece examinar manutenção da modalidade PRICE/TOTAL e da proveniência: esta revisão confirma numericamente a borda TOTAL, sem afirmar teste executado de todas as modalidades.

Encerramento: separar replay de quantidade/custo de avaliação. Compensação de provento deve preservar referência/modalidade/data/origem. Quando uma correção de quantidade exigir adaptar a posição, aplicar contrato explícito sem reancorar silenciosamente em valor arredondado. REVAL02 deve passar mantendo terços0,67/0,33/0, 200 milhões1/0,50/0 e replay de vendas dependentes/taxas/caixa. Nenhuma nova avaliação/auditoria fictícia.

## RVA-02 — P2 — Encerramento conserva custo residual desconhecido

**Confirmado, pendência de CF-020 com efeito em CF-021.** Arquivo `controle-financeiro-backend/src/main/java/com/controlefinanceiro/api/service/InvestmentService.java:246`; `AnnualSummaryService.java:98` considera incompleto qualquer custo null, inclusive do ativo sem unidades.

REVAL01 abre quantidade10 com custo e avaliação desconhecidos; vende todas as unidades por25 cada. SQL confirma quantidade0, avaliação0, ganho histórico null (correto), mas total_cost null. Esperado para a **posição residual**:0,00, sem transformar o custo histórico da venda ou o ganho realizado em zero. FIN-04 distingue custo desconhecido e exige baixar todo residual na última venda; desconhecimento histórico não implica exposição patrimonial remanescente.

Impacto: posição encerrada continua tornando custo agregado indisponível. Não há prova de perda de caixa: o problema confirmado é classificação da posição/completude. RVI-07 fica parcial: a avaliação zero foi corrigida, o custo residual não.

Encerramento: quantidade final zero deve zerar custo residual, mantendo custo baixado/resultado histórico desconhecidos quando não comprovados. Verificar abertura desconhecida, venda final com/sem taxa e consulta de posição/relatório. Não preencher história com custo inventado.

## RVA-03 — P2 — Jornada de pagamento120 interrompida após confirmação

**Falha de execução confirmada; causa ainda não isolada.** Donas: CF-019/CF-020 para jornada, possível interface com CF-024. Não é prova de débito duplicado ou defeito no reembolso. Local de observação: `tests/e2e/milestone-remediation.integrated.spec.ts:62`. Caminhos a investigar: `src/components/forms/payInvoiceModal.tsx:194` (espera reconciliação) e `src/hooks/useCards.ts:175` (refreshAll).

Primeira execução integral: SAN-BC-card120 recebe HTTP200 no POST, mas modal não fecha em15s; captura mostra controles desabilitados, loading, saldo bancário880 e pagável0. Não aparece a ação de recuperação naquele estado. SQL salvo confirma um pagamento120 e saldo880. A jornada para **antes** de excluir item/meta e reembolsar, portanto não se atribui conclusão a essas ações. SAN-BC-card20 e teste de domínio com pagamento parcial/total passam.

`browser/falha-pagamento120/error-context.md`, captura, resumo de rede e `browser/saneamento/persisted.txt` preservam a ocorrência. O resumo de rede remove corpos/cookies: POST e leituras posteriores registradas retornam200, enquanto algumas leituras anteriores à navegação não têm término no trace. Isso sugere investigar coordenação/cancelamento das leituras, mas não estabelece a causa. Trace bruto e vídeo foram preservados localmente; o trace não é versionado por conter cabeçalhos de autenticação sintética.

Não se aumentou timeout, retry automático ou tolerância. A reexecução isolada passou (namespace `san1821-115748ae`), incluindo exclusão/reembolso, reload e SQL; o verde não apaga o estado carregando nem comprova a causa. Classificação final: intermitência observada, sem causa isolada; pendência de confiabilidade da reconciliação, não defeito financeiro do reembolso demonstrado. Encerramento exige explicar a ocorrência e comprovar pagamento único e saída do loading ou recuperação explícita sem reenvio na condição causadora. Preservar R03 de resultado desconhecido e reconciliação substituída.

## RVA-04 — P3 — Captura anual360 transparente

**Erro de evidência/harness confirmado.** A primeira imagem `san-e3-anual-360.png` contém cabeçalho e corpo vazio. O DOM do conteúdo já existia, mas o pai Framer Motion ainda tinha animação de opacidade; captura em768 tem conteúdo. A imagem vazia não comprova legibilidade.

Correção permitida apenas no harness: aguardar `main > div.grid` com opacity1 antes da sequência de screenshots. Não injeta CSS, não remove animação do produto e não muda expected financeiro. A captura original foi preservada. Reexecução SAN-E3 aprovada; nova imagem360 inspecionada com texto visível e quebra adequada. **Encerrado o erro de captura**, sem encerrar CF-015/zoom nativo200%.

## Observações não impeditivas adicionais

- O inventário `saneamento-CF-016-CF-021/FRONTEIRAS-E-WRITERS.md` descreve conta→cartão no pagamento, mas o caminho atual adquire cartão em `CreditCardService.payInvoice` antes da conta no listener. Corrigir a descrição e considerar a ordem na futura CF-024. Não se demonstrou um ciclo oposto nesse par, portanto não se declara novo deadlock; H-01 conta/investimento tem prova independente própria.
- Replay de correção percorre operações e grava revisões: O(n) por correção e potencial O(n²) acumulado em muitas correções de um histórico crescente. Preserva auditabilidade, ao custo de locks/transação mais longos. Não foi executado benchmark amplo. CF-025 deve medir antes de escolher checkpoints/incrementalização que possam complicar reconstrução histórica.
- Exportação consistente mantém snapshot/conexão até terminar, reduzindo inconsistência, mas aumentando retenção MVCC. SXSSF limita linhas em memória a100 e pagina500; os bytes finais ainda custam O(tamanho do arquivo). Manter em CF-025, sem trocar consistência por desempenho presumido.
- Upgrades2–10→11 cobrem dados conhecidos/desconhecidos e bruto temporal, além do banco vazio. Isso não prova cada combinação de fato criado em V6/V8 e migrado posteriormente; a cobertura não é matriz exaustiva de todos os históricos. Caminhos críticos de compensação, exportação e navegador usam Flyway/validate, corrigindo a lacuna de depender só de create-drop nesses caminhos, sem converter toda a suíte antiga.
