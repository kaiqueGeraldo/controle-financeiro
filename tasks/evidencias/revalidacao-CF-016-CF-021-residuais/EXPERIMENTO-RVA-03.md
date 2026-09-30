# Experimento limitado RVA-03

## Hipótese e limite definidos antes do resultado

A ocorrência original pode estar entre o término HTTP e a conclusão da reconciliação/remoção do modal. A rede200 não prova consumo do corpo nem resolução da promise; a presença do spinner não identifica uma lane. A sequência integral original pode ativar condições ausentes nos dois diagnósticos curtos. Essas são hipóteses, sem atribuir causa ao produto, ao PostgreSQL ou ao harness.

Executar **uma** sequência dos17 cenários originais, na ordem do arquivo, incluindo pagamento20 antes de120. Excluir somente SAN-RVA, que é cenário novo adicionado depois da ocorrência. Sem retry, aumento de timeout, sleep, clique forçado ou alteração de transportes. Assertions continuam com15s, caso90s e processo com limite original. Parar a investigação após essa tentativa e preservar qualquer vermelho; não repetir para obter verde.

## Preparação reproduzível

`node tasks/evidencias/revalidacao-CF-016-CF-021-residuais/prepare-experiment.mjs`, a partir da raiz. Exporta apenas backend/frontend do commit `0099185c22b743de3dd66e30e326c8378770b101` para diretório novo ignorado `.r3` na raiz. Node_modules é junction de leitura/execução para a dependência instalada; banco e saídas são próprios. O script rejeita diretório existente. A patch do saneamento anterior e os logs adicionais são aplicados **somente à cópia**. O checkout compartilhado não recebe alterações em src ou migrações.

Instrumentação da cópia em `instrumentacao-execucao.patch`: etapas de pagamento e participantes de refreshAll; começo/fim do consumo de `Response.text()`; lane/scope/revision, abort e finish; timestamps monotônicos do browser e de recepção no runner. `rva03-review-hooks.ts` acrescenta eventos de rede, pageerror, MutationObserver de presença/display/opacity/loading/recuperação, contador e último RAF enquanto modal presente. A coleta não intercepta respostas nem registra headers/cookies/corpos HTTP. Os dados financeiros sintéticos finais são consultados somente após capturar o estado terminal da UI.

Na cópia do backend, executar Maven com JDK21 e repositório local já instalados, `CF_RVA03_REVIEW=1`, `CF_RVA03_DIAGNOSTICS=0`, `-Dtest=MilestoneRemediationBrowserTest` e `-Dreview.evidence` apontando para o caminho absoluto desta pasta `/browser/experimento-curto`. O config da cópia usa `grepInvert: /SAN-RVA/`; todas as demais condições vêm do config original. A primeira tentativa com regex negativa na linha de comando não iniciou Maven/testes por parsing do wrapper Windows; preservada em `logs/experimento-preflight-wrapper.log`. O filtro foi transferido ao config da cópia, sem modificar prazo/ordem/assertions. Isso é falha de invocação, não reprodução do travamento.

## Discriminação ao primeiro limite

| Evidência | Classificação possível |
|---|---|
| Nenhum POST após ação; estado terminal e logs de entrada ausentes/presentes | Travamento antes do envio, ou clique/harness; requer confrontar ação e DOM. |
| POST enviado, sem resposta/recibo confirmado | Operação em andamento ou resultado desconhecido; não autoriza novo pagamento. |
| POST200/recibo/SQL confirmam um débito, modal loading sem ação de recuperação | Pagamento confirmado com interface sem recuperação visível; localizar promise/lane pendente se registrada. |
| Reconciliação termina, close/finally executam e DOM some, mas assertion falha | Investigar observação/harness. Não concluir exclusividade do harness só pela aprovação posterior. |

Recibo, conta, dívida e quantidade dePOST são lidos quando disponíveis; diagnóstico de sucesso ocorre após exclusão/reembolso, portanto crédito em cartão pós-reembolso não se confunde com dívida no instante do pagamento. SQL do Java é salvo mesmo quando um cenário falha. Consulta pg_stat_activity/pg_blocking_pids só é pertinente se houver requisição efetivamente pendente; não atribuir os nove GET200 anteriores a bloqueio prolongado de banco.

Logs/observadores podem alterar timing; uma aprovação instrumentada não prova resolução nem ausência da intermitência no produto. Encerramentos antigos e as provas do candidato sem instrumentação permanecem separados.

## Resultado observado e limites

Resultado final da única sequência: **10 aprovados, 7 falhas, 17 executados em13,4min**, Maven exit1. Falharam R03 nos quatro modos, SAN-BC-card20/120 e SAN-D1; todos os sete call logs mostram interceptação por `nextjs-portal` no clique de abertura, antes de confirmar pagamento. Persistência final exportada pelo Java mesmo no vermelho em `browser/experimento-curto/persisted.txt`. Não há certificação visual da cópia sem estilos; os dez verdes não são usados para reabrir ou reaprovar os encerramentos anteriores.

As preparações anteriores não executaram jornadas: parsing do wrapper Windows; junction fora da raiz do Turbopack (`logs/experimento-integral.log`); caminho profundo acima do limite do Windows (`logs/experimento-integral-execucao.log`). Não se aumentou o timeout de startup. A cópia curta `.r3` iniciou uma única sequência comportamental dos17 cenários; a ordem global foi a do runner, com R03 antes de SAN, e pagamento20 antes de120 no mesmo arquivo. Não se presume ordem global idêntica a todo run anterior.

No cenário120, o clique de abertura da fatura/pagamento ficou impedido por `<nextjs-portal>` interceptando eventos. A captura `browser/experimento-curto/pagamento120-antes-envio.png` mostra página sem estilização esperada. O limite original90s foi atingido antes de abrir o modal de pagamento. Os quatro R03 também falharam nessa abertura, antes de confirmar pagamento. Não se infere a causa da ausência de estilos nem se transfere essa falha da cópia isolada ao produto original.

Em `rva03-review-events.json`: nenhum `payment-dispatched`, nenhum POST de pagamento, nenhum modal de pagamento observado, RAF do modal0, loading/recuperação ausentes e nenhuma intenção de pagamento. O detalhe da fatura permaneceu aberto. Consulta direta somente no PostgreSQL16 descartável, namespace `san1821-608e082b`, em `pagamento120-sql-direto.txt`: recibos0, banco1000, compra/dívida120, paid_amount0, refund0, statusOPEN e crédito0. Portanto, **travamento antes de enviar a operação nesta cópia**; não houve operação em andamento ou pagamento confirmado nela. A exclusividade da ocorrência original ao harness continua indeterminada.

O clock sintético do browser e o timestamp do runner têm domínios diferentes; não subtrair os dois para inferir latência. Eventos de lane/body e presença registram as leituras anteriores ao envio, sem a etapa problemática original. Não havia pagamento/reconciliação pendente que justificasse consultar locks PostgreSQL. Os traces brutos locais permanecem ignorados por conter headers de autenticação sintética; não são versionados.

Esta tentativa não cumpre a reprodução pós-confirmação pretendida. Nenhuma nova tentativa foi feita para obter verde e nenhum clique foi forçado. O verde5/5 no candidato sem instrumentação continua como prova separada; a cópia instrumentada não o substitui. **RVA-03 permanece inconclusivo**, com impacto original de interface sem recuperação após pagamento confirmado.

## Responsável e próximo experimento proposto, sem execução nesta revisão

CF-019 deve capturar uma única sequência20→120 no runtime original do candidato, com observação passiva de POST/resposta, MutationObserver e recibo/SQL ao primeiro limite. Antes de iniciar, validar estáticos/estilização e ausência de portal que bloqueie o clique; se essa pré-condição falhar, não consumir uma tentativa de pagamento. Evitar wrappers adicionais de promises nesta próxima captura para reduzir perturbação de timing. Se o POST confirmar e o modal não recuperar, coletar imediatamente lane/revisão e leituras ainda pendentes, sem novo POST. Uma nova aprovação continua insuficiente para encerramento causal. CF-024 participa da coordenação e CF-020 da jornada de metas; nenhuma tarefa posterior foi iniciada aqui.
