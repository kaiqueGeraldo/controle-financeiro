# Inventário, evidências e concorrência

Candidato: `864a3c7a02fb34fbdeaa3a54630dca226ab09d9c`; intervalo desde `f521523`.
Normas: SPEC-001 §5.1 (evidência, incidência, confirmações e finalização), FIN-05,
contrato de intenções. A implementação não é utilizada como definição da regra.

## Certificação

Evidência válida resolve ID/claim/reserva/fontes, tem base DOMAIN_RECORD ou
CURRENT_DECLARATION e é compatível com o inventário-base corrente. Não equivale
ao token composto que inclui as próprias reservas. Um vínculo de domínio ainda
presente pode comprovar origem de uma parte UNKNOWN; não comprova seu valor.
Exclusão sem prova ou prova vencida não concede independência. A união das
pendências por fonte continua bloqueando enquanto houver uma pendência relevante.

`OnboardingOpenings.apply` escreve contas, investimentos, metas, cartões,
declarações, pares, projeções de metas e previsões; executa flush e registra mapping.
Só então `bindNewDeclarationsToCommittedInventory` lê novamente o inventário e
grava o token nas declarações **novas dessa transação**, filtrando owner/ID/revisão.
O nome do método não significa commit já realizado: são gravações visíveis à mesma
transação, ainda reversíveis. `OnboardingApplicationService.complete` inclui
certificação, recibo e estado terminal no mesmo commit, sob guard exclusivo.

O token contém contas, investimentos, metas, pares, cartões/faturas/linhas relevantes,
defaults e categorias selecionadas pela carga; na certificação/dia a dia não há
categorias selecionadas nem fontes propostas. Exclui reservas para evitar ciclo.
Mudanças posteriores no inventário-base invalidam a declaração, sem renová-la.
Não é garantia eterna de capacidade: mesmo uma nova destinação legítima altera o
inventário. Essa conservadoriedade decorre da compatibilidade exigida pela norma;
não se propõe estreitar o token nesta revisão.

`declarations` preserva estado/evidência anterior em `onboarding_reservation_history`
antes de substituir o registro corrente. ASSIGN declara a situação atual completa,
pode revelar déficit e não cria transação monetária. CLOSE encerra só seu ID.
O recibo mantém a revisão/declaração aceita; não fabrica proveniência histórica.
Não foi identificada regra nova necessária para certificar o estado resultante:
o contrato exige aplicação atômica e compatibilidade com o inventário efetivo.

## Escritores diretamente pertinentes

| Caminho | Coordenação e efeito |
|---|---|
| GoalService.addValue com fonte | Exclusivo antes de leitura/locks; capacidade por fonte antes de aumentar par |
| setAllocation | Exclusivo para valor positivo, compartilhado para zero; capacidade apenas se delta positivo |
| moveAllocation | Exclusivo; fontes em ordem de chave; valida destino antes das duas escritas |
| InvestmentService BUY | Replay antes da autorização; exclusivo para operação nova; capacidade da conta antes de débito |
| Onboarding prepare/complete | Intenção → guard exclusivo → sessão; revalida snapshot e revisão; materializa pendências/declarações sob guard |
| Contas, transações/transferências, cartões/pagamentos/estornos, investimentos/avaliações/correções, MarketPriceWriter | Guard compartilhado antes dos locks e escritas; não podem atravessar autorização exclusiva |
| Metas/reduções/consumo/liberação/exclusão; hábitos; categorias; InvoiceCronService | Guard compartilhado nas escritas pertinentes; cron participa por transação/owner |
| Exclusão de usuário | Guard exclusivo; não pode intercalar com aplicação |

Criar meta monetária não admite progresso inicial positivo. Excluir histórico de
destinação só reduz valor positivo; ajustes negativos não podem ser apagados para
reconstituir reserva. Compra consome/reduz pares; estorno credita a fonte sem
recriar automaticamente a destinação. Cotação altera valor, não reserva nominal.
Criação de investimento ainda admite `goalId`: esse vínculo antigo, isoladamente,
é tratado como pendência de valor desconhecido, não como par monetário autorizado.
O probe adicional verifica ausência de alocação/progresso e rejeição de R$0,01;
não confundir o vínculo com comprovação de capacidade nem declará-lo bypass sem prova.

## Fronteira e alcance da concorrência

`FinancialInventoryGuard` usa advisory **transaction lock** PostgreSQL com chave
do usuário; exclusivo conflita com todos os writers compartilhados do mesmo usuário.
Ordem: intenção quando aplicável → inventário → agregados/fontes. Não há upgrade
shared→exclusive nos caminhos alterados. Timeout local máximo de lock é 5s.
Exceção propaga para rollback; os testes usam conexões/transações independentes e
barreiras, observando `pg_blocking_pids`, não sleeps para escolher vencedor.

DailyReservationConcurrencyTest disputa duas reservas600 em fonte1000: só600
persiste e outro owner progride. OnboardingReviewConcurrencyTest disputa writer real
contra aplicação, replay contra commit, cancelamento e exclusão; inclui leitura
independente antes do commit e rollback após escritas. CertificationProbeTest injeta
falha SQL no UPDATE final de evidência, depois do UPSERT, e exige reversão de
revisão/histórico/pares/progresso/recibo e recuperação PREPARED; retry explícito após
retirar a falha usa a mesma identidade. Isso não prova ausência universal de corridas
ou deadlocks, nem certifica latência de produção.

## Custo e trade-offs

Inventário: dez consultas por relação, com filtro de owner, lote/fetch256; não há
SELECT por fonte/pendência. Certificação acrescenta uma carga, não uma por declaração.
Há ordenação SQL/canonicalização e hash proporcional aos bytes; não é só acesso O(1).
Projeção usa mapas; incidência UNBOUNDED pode expandir fontes×pendências e atingir
200000 relações; materialização tem teto32MiB. Memória inclui inventário, evidências
e relações expandidas. Índice de evidência evita varrer toda a lista a cada lookup;
preservação de evidência anterior ainda filtra a lista por declaração (O(D×E), D≤200).
Batch de atualização final tem O(D) escritas. Não foi encontrada N+1 de leitura
introduzida pelo delta, mas EXISTS correlacionados exigem plano/índices apropriados.

A exclusividade por usuário estabiliza o token completo, ao custo de serializar
operações em fontes distintas desse usuário. O lock dura até commit, incluindo
carga, projeção, validação e escrita; não envolve chamadas externas no trecho
examinado. `listAllocations` só apresenta uma carga em lote, sem certificar permissão
nem tomar guard exclusivo; não se atribui a essa leitura a garantia de autorização
transacional dos comandos. Fixtures pequenas não medem cauda de latência/carga real.
