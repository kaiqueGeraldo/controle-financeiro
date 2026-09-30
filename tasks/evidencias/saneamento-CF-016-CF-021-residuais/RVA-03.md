# RVA-03 — investigação do travamento de pagamento120

**Pendente: causa inconclusiva.** Falha anterior confirmada, sem reprodução local da condição nesta rodada. Não se atribui ao produto, harness, locks ou infraestrutura por suposição; nenhum timeout, sleep, retry automático ou clique forçado foi acrescentado. Nenhuma alteração funcional em pagamento/reconciliação foi mantida.

## Evidência anterior examinada

[ACHADOS.md](../revalidacao-CF-016-CF-021/ACHADOS.md), error-context, captura, rede, logs do servidor, persisted e repetição aprovada foram confrontados. A primeira jornada recebeu POST 200 e permaneceu com modal/spinner após 15s; banco 880, pagável 0 e um pagamento120. Exclusão e reembolso não haviam ocorrido. A repetição dirigida anterior concluiu essas ações e SQL/reload, sem isolar causa.

A rede anterior (rva03-rede-anterior-resumo.json) registra POST 200 em 132ms e nove GET posteriores200, duração entre 50 e 286ms. As leituras incluem cartões, fatura, conta, categorias, posição, fluxo, recentes, gráfico e planejamento. Isso enfraquece a hipótese de espera prolongada de lock nessas requisições concluídas; não prova término das promises de reconciliação no browser. Algumas requisições mais antigas não têm término no trace; podem ser cancelamentos de navegação, sem causalidade demonstrada. Não há deadlock/clock-leap correspondente nos logs inspecionados. Não foi adicionado lock nem feita auditoria transversal.

## Experimentos limitados, definidos por hipótese

| Condição | Instrumentação | Resultado / limite |
|---|---|---|
| Pagamento120 isolado | Etapas de PayInvoiceModal e quatro participantes de useCards.refreshAll, request/response/requestfinished/requestfailed/pageerror | 1 jornada aprovada; quatro reads resolvidos, batch e payment ainda atuais, onClose e finally atingidos. Não reproduziu travamento. |
| Pagamento20 seguido de 120, mesma ordem do recorte original | Mesma instrumentação, usuários sintéticos isolados por cenário | 2 jornadas aprovadas; ordem de término dos reads mudou, mas todos concluíram e modal fechou. Não demonstra causa nem resolução da intermitência. |
| Candidato final sem logs temporários | R03 ok/read/lost/overlap e SAN-RVA | 5 jornadas aprovadas; recuperação, leitura substituída e recibo real mantidos, POST único por cenário R03, banco 900, dívida 0, planejamento PAID e reload. |
| Validação de intenção/counter final | SAN-D1 + pagamento120 | 2 jornadas aprovadas, POST único no pagamento120 e nova intenção/retry/conflito mantidos. É regressão das assertions do diff, não nova evidência de resolução causal. |

Instrumentação temporária está preservada em rva03-instrumentacao-temporaria.patch para repetir em checkout isolado; foi removida integralmente de src antes da verificação final. O harness mantém coleta opt-in CF_RVA03_DIAGNOSTICS=1, metadados sem corpos/cookies/headers, sem mudança do transporte. Sem a patch, coleta rede/pageerror; com a patch, inclui etapas. Trace bruto não é versionado.

Duas execuções diagnósticas são o limite de investigação nesta rodada. A verificação de SAN-D1/pagamento120 posterior acrescenta execução das assertions de intenção nova/retry/conflito e contador POST único, com instrumentação removida. Não é repetição até passar nem motivo para encerrar RVA-03.

## Garantias e próximo experimento recomendado

R03 continua com servidor/banco reais: resposta perdida só após commit, GET de recibo, nenhum segundo débito, reconciliação cancelada/substituída não certifica sucesso. SAN-D1 conserva chave nova para intenção nova, replay imutável e conflito 409 por conteúdo diferente. SQL e leituras finais mantêm banco/dívida/crédito e fato sobrevivente ao apagar meta. Componentes dirigidos acrescentam cobertura de owner/cartão/sessionStorage e respostas antigas. Não certifica protocolo entre dispositivos ou perda de sessionStorage da CF-024.

Próximo experimento: registrar timestamps de cada fase, body-consumed e abort/revision de cada lane na sequência integral original, além de entrada/saída de onSuccess/onClose e estado de presença/opacidade/RAF do modal. Capturar ao primeiro timeout mantendo 15s e preservar o primeiro vermelho. Se onSuccess/onClose terminarem mas o DOM persistir, investigar presença/animação/harness; se uma promise não terminar, identificar lane e cancelamento. Só consultar pg_stat_activity/pg_blocking_pids simultaneamente quando existir uma requisição realmente pendente; HTTP200 com leitura encerrada não justifica atribuir o spinner a lock. Não alterar coordenação ou animação sem reprodução causal.

A rodada não fica integralmente resolvida: RVA-03 e o aceite integrado de CF-019/020/021 continuam sujeitos à investigação/revisão independente. Encerramentos anteriores sem regressão demonstrada permanecem.
