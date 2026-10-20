# Achados independentes

Candidato `89760e64a73b6268d8cf34745cf41d6b00dcd781`. Nenhuma correção de produto.
Caminhos abreviados abaixo têm prefixo
`controle-financeiro-backend/src/main/java/com/controlefinanceiro/api/`.

## RC030-01 — P2 — encargos conhecidos não têm prioridade entre linhas/faturas

- **Localização:** `service/CreditCardService.java:608–619` (distribuição do
  pagamento), em conjunto com o novo `domain/card/CardTransactionRepository.java:15–23`
  e `domain/card/CardTransaction.java:70–74` (principal remanescente).
- **Reprodução:** onboarding cria cartão com outubro100 de principal e novembro100,
  sendo90 principal e10 encargos. Conta1000. Pagamento normal de1 em outubro
  rola99 de principal. Adiantamento10 em novembro alcança essa rolagem e a dívida
  de novembro, usando somente os serviços reais e transações comitadas.
- **Esperado:** FIN-03 manda quitar encargos identificados antes do principal
  mais antigo. Depois dos dois pagamentos, conta989, dívida189, principal189,
  disponível811 de limite1000. Os10 do segundo pagamento vão aos encargos de
  novembro, sem liberar principal.
- **Observado:** conta989/dívida189 estão corretas, mas principal179/disponível821.
  A distribuição percorre a linha mais antiga e consome seus10 de principal
  antes dos encargos da outra linha. O teste falha por `expected189 / actual179`.
  O pagamento integral do exemplo E01, com apenas uma linha corrente, não expõe
  essa combinação.
- **Critério violado:** SPEC-004 FIN-03; SPEC-001 §3/§8 exige componentes e leitores
  financeiros coerentes com as novas aberturas. É integração diretamente afetada
  pelos novos dados CF-030, não solicitação para implementar CF-032.
- **Impacto:** limite gerencial liberado em excesso e composição remanescente
  incorreta. Não se observou duplicação do patrimônio/débito de conta neste caso.
- **Encerramento objetivo:** distribuir encargos elegíveis primeiro entre todas
  as linhas alcançadas, depois principal na ordem normativa; preservar
  atomicidade, rastreabilidade da distribuição e replay. Este probe deve passar,
  mais controle com várias linhas da mesma competência, encargos parcialmente
  pagos e composição UNKNOWN sem principal inventado.
- **Prova:** `OnboardingReviewFinancialTest#identifiedChargesMustBePaidBeforeOlderPrincipalAcrossRolledInvoices`;
  `independent-probes-corrected` e `additional-financial-temporal`.

## RC030-02 — P2 — INITIALIZE_EMPTY permite persistir vencimento fora de CivilDate

- **Localização:** `domain/onboarding/OnboardingFinalRules.java:17–24` ignora
  INITIALIZE_EMPTY; `service/onboarding/OnboardingOpenings.java:146–150` calcula
  e persiste o ciclo usando configuração do cartão existente.
- **Reprodução:** cartão próprio, vazio, fechamento31/vencimento30; abertura
  INITIALIZE_EMPTY em competência9999-12, dívida100, principal100/encargos0.
  Nenhuma data de entrada ultrapassa o contrato.
- **Esperado:** rejeitar com400/DATE_INVALID antes de preparar uma aplicação
  válida, pois o vencimento derivado cai em10000-01-30. A mesma validação já
  existe para CREATE. Não é o limite superior interno de uma consulta anual:
  é a data civil efetiva da fatura.
- **Observado:** prepare e complete aceitam; conexão independente lê
  `due_date=10000-01-30`, recuperação retorna `COMPLETED`.
  Duas assertions falham: ausência do400 e ano persistido10000>9999.
- **Critério violado:** SPEC-001 §4 CivilDate/Competence e SPEC-002; revalidação
  das referências/configuração autoritativa da abertura.
- **Impacto:** recibo de conclusão autoriza efeito com data fora do domínio
  público, comprometendo consumidores que validam anos0001–9999.
- **Encerramento objetivo:** validar ciclos/overrides também para INITIALIZE_EMPTY
  com configuração lida do servidor, antes de preparar e antes de escrever.
  Ambos os probes devem passar; manter controle CREATE, dezembro9999 válido
  quando o vencimento ainda é9999, fevereiro e override civil suportado.
- **Provas:** `initializeEmptyMustRejectCalculatedDateOutsideCivilContractAtPrepare`
  e `initializedInvoiceCannotPersistYear10000BehindACompletedReceipt`;
  linha `RC030_CIVIL_OBSERVATION` em `additional-financial-temporal/maven.log`.

## RC030-03 — P3 — versão contratual fora de int causa500 em vez de400

- **Localização:** `domain/onboarding/OnboardingCommand.java:21`.
- **Reprodução:** POST autenticado `/onboarding/prepare` com sessão/versão/UUID
  válidos, substituindo apenas `contractVersion:1` por `4294967297`.
- **Esperado:**400 INVALID_FIELD/INVALID_COMMAND, sem preparar nem aplicar.
- **Observado:**500 INTERNAL_ERROR; MockMvc registra `tools.jackson.databind.exc.JsonNodeException`.
  Jackson3 recusa `intValue()` fora da faixa; a exceção ocorre **fora** do catch
  de parsing. Não houve wrap para1: essa era uma hipótese do nome do probe,
  descartada pela execução. O defeito confirmado é a classificação500.
- **Critério violado:** schema fechado v1 e erros de entrada400, SPEC-001 §§4/5.
- **Impacto:** entrada inválida vira falha interna/resultado incerto para o cliente;
  não foi observado efeito financeiro ou acesso cruzado.
- **Encerramento objetivo:** comparar versão sem conversão estreita destrutiva
  ou validar faixa antes de `intValue`;400 para inteiros fora de faixa,
  fracionários, strings e versões diferentes de1 em prepare/complete.
- **Prova:** `oversizedContractVersionMustNotWrapToV1OnPrepare`, relatório
  `additional-financial-temporal`, expected400/actual500.

## Hipóteses descartadas e limitações

- ASSIGN de400 sobre fonte100 não é por si defeito: §5.1 permite declarar reserva
  existente deficitária. O caso entregue conserva déficit e capacidade0.
- Falhas iniciais do spy não são defeitos: instrumentação tentou passar pelo
  proxy MANDATORY sem transação; corrigida só no observador. Fonte original
  do probe e relatórios de erro preservados.
- Não há achado confirmado de corrida no protocolo de aplicação. A mutação
  isolada demonstra violação quando um writer real deixa de aderir; o candidato
  contém esse guard e passou o controle.
- Custo do legado com muitas evidências não foi benchmarkado. Há trabalho
  repetido visível no código (ver CUSTO), sem alegar timeout/OOM em produção.
- Não se certificam UI, adoção real, banco existente do usuário, ou ausência
  universal de deadlocks.
