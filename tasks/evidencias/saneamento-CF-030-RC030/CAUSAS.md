# RC030 — causas, alterações e limites

Normas: SPEC004 FIN03, SPEC001 §§3–6/CivilDate/envelope1, SPEC002 anos0001–9999.
Condições independentes de encerramento: ../revisao-CF-030/ACHADOS.md. Não se altera
a norma para coincidir com a implementação; CF030 segue em_revisao.

## RC030-01 — prioridade global no conjunto elegível

CreditCardService.payInvoice recebia linhas ordenadas por competência/parcela/ID,
mas consumia todo o saldo da primeira antes dos encargos conhecidos posteriores.
O fluxo de caixa e a dívida batiam, enquanto o principal e o disponível divergiam.

CardPaymentDistribution planeja encargos identificados de TODAS as linhas elegíveis
antes de consumir o residual na ordem original. A ordenação SQL existente é mantida;
nenhuma nova consulta ou ordenação por componente. Composição desconhecida é
excluída da passagem de encargos identificados, continua dívida elegível na segunda
e permanece UNKNOWN nos leitores enquanto existir saldo sem composição provada.
Zero no vetor é apenas ausência de distribuição planejada, não principal/encargos
desconhecidos convertidos em zero. Bruto/principal/encargos de abertura permanecem.

As duas fases são somadas numa única distribuição persistida por linha/pagamento,
evitando duplicar o par. Soma distribuída deve cobrir exatamente o pagamento.
Resumo de saldos por fatura é calculado sobre as linhas elegíveis já carregadas,
eliminando o SELECT SUM por fatura afetada no trecho de baixa. A soma global de
controle existente continua no banco. Não há migração nem backfill.

Para N linhas/F faturas: planejamento e agregação O(N), memória O(N+F), sem
N+1 de componentes. Mantêm-se consultas/escritas de eventos e planejamento por
fatura já existentes; não se alega SQL total constante nem benchmark de produção.
Os locks de intenção/guard/cartão/conta, ownership, transação do débito bancário,
recibo e recovery não mudaram. Excesso continua rejeitado, sem criar crédito de
pagamento indevido. UNKNOWN não autoriza limite conhecido fictício.

## RC030-02 — configuração autoritativa e datas derivadas

OnboardingFinalRules validava o ciclo somente para CREATE. INITIALIZE_EMPTY não
traz closingDay/dueDay no request, portanto só a projeção do inventário consegue
validá-lo com os dados do servidor. A nova openingIssues usa o mesmo cálculo
para os dois caminhos; INITIALIZE_EMPTY a chama após ownership/pristina, com
configuração capturada sob guard. Complete reconstrói a projeção e verifica token;
uma mudança posterior à revisão produz SOURCE_CHANGED, exigindo nova revisão.

openingCycle valida fechamento/vencimento derivados no domínio0001–9999, tanto
antes de preparar como na escrita interna. As parcelas futuras também passam
pelo controle. Override válido não torna um ciclo derivado inválido aceitável.
Não se trunca ano, aplica clamp, troca configuração ou infere fuso/dia útil.
CardCycle continua calculadora interna; não foi limitado globalmente, pois limites
internos de consultas podem legitimamente ultrapassar o domínio civil público.

Um controle adicional de0001-01-28 revelou persistência0001-01-26 no mesmo caminho.
A fonte da dependência instalada Hibernate7.2.1 mostra LocalDateJavaType usando
java.sql.Date.valueOf no binding indireto. Invoice agora declara LocalDateJdbcType
apenas em closingDate/dueDate/dueDateOverride: setObject/getObject LocalDate,
sem calendário híbrido/fuso intermediário. Tipo SQL continua DATE, validado com
Flyway+Hibernate validate. É dependência específica de Hibernate já instalado,
preferida a configuração temporal global ou correção de valores após o insert.
Controles mantêm valores literais no SQL e na releitura por serviço. Nenhum dado
existente foi corrigido e não se auditam aqui outras entidades/datas históricas.

## RC030-03 — validação numérica anterior à conversão

Jackson3 lança JsonNodeException em intValue fora de faixa; o erro surgia depois
do catch de parsing. OnboardingCommand agora exige isIntegralNumber e
canConvertToInt antes da conversão/comparação com1. Apenas inteiro1 é válido;
intMax não é uma versão contratual válida. Não há novo catch genérico nem mudança
no handler500. Falha real de persistência com contrato1 continua INTERNAL_ERROR500
sanitizado, enquanto versão inválida gera INVALID_FIELD400/INVALID_COMMAND no campo.

O contrato é independente de expectedVersion (Revision string long) e das respostas
409 de conteúdo/concorrência. Prepare e complete são exercitados por MockMvc real,
incluindo números além de int/long, fracionários/exponenciais, textos, boolean/null.
Nenhuma dessas rejeições grava preparação ou efeito financeiro. Custo da condição
é limitado pelo envelope4KiB e pelo parser, sem acesso a banco por versão inválida.

## Prova original e ajuste demonstrado do observador

before-original-four:4 falhas de assertion,0 erros. Depois das correções, ainda
sem tocar os probes:3 passaram e o segundo probe de data lançou DraftProblem na
preparação, como exige o primeiro probe. O relatório preservado identifica a linha
66 do observador, não uma falha de infraestrutura ou novo defeito financeiro.

Não seria possível exigir rejeição em prepare e simultaneamente exigir um recibo
COMPLETED desse mesmo request inválido. Somente esse observador passou a aceitar
a rejeição específica400/DATE_INVALID, exigir ausência de fatura/batch/preparação/
recibo e manter IN_PROGRESS. O ramo que chegar a concluir conserva literalmente
a assertion original ano≤9999; nenhum expected ou tolerância mudou. Os outros
três probes permanecem com os mesmos corpos e assertions.

O original integral foi copiado antes da edição para
OnboardingReviewFinancialTest.original.java.txt e seu SHA256 é conferido contra o
manifesto inicial. Os outros82 arquivos independentes permanecem idênticos. Não
se afirma que os quatro probes byte a byte originais ficaram verdes: a distinção
entre produto corrigido e observador incompatível está registrada nos relatórios.
