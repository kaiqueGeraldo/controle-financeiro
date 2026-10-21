# Análise independente do delta

Base 251d6c70492e4ad57dc9ca1313dce17afab62464; candidato
c13aecd032ca8a08276226e55a37864aa18b4873. Normas relidas: SPEC-004 FIN-03,
SPEC-001 §§3–6 e SPEC-002 representação civil. Escopo restrito ao saneamento.

## RC030-01 — distribuição

CardPaymentDistribution.plan recebe somente linhas com saldo positivo. O chamador
valida pagamento positivo em centavos e não superior à soma elegível. A primeira
passagem aloca min(encargos identificados remanescentes, pagamento restante).
A segunda consome o residual na ordem já recebida. remainingPrincipal de OPENING
conhecida é min(principal original, saldo remanescente): pagamentos anteriores de
encargos reduzem corretamente os encargos ainda prioritários, sem modificar os
componentes originais. PURCHASE tem principal igual ao saldo, portanto encargos
identificados zero. UNKNOWN não recebe composição inventada; continua elegível
como dívida na segunda passagem e desconhecida nos leitores enquanto pendente.

findOutstandingUpTo faz JOIN FETCH de Invoice e ORDER BY ano, mês,
COALESCE(parcela,0), ID. Seleciona a competência pedida e as anteriores ROLLED
quando includeRolled autoriza; não antecipa arbitrariamente todas as futuras.
Uma alocação por linha combina as duas passagens, sem duplicar o par persistido.
O total distribuído precisa igualar o pagamento; qualquer falta provoca rollback.

Os controles persistidos abrangem encargos 15 e pagamentos 5/15/35/129,
principal antigo entre faturas, duas linhas na mesma competência, excesso 129,01,
UNKNOWN, quitação, alocações exatas, componentes originais, caixa, dívida,
comprometido, disponível, recibo/replay e trigger de falha de alocação.
CF019 cobre também pagamentos sem encargos, adiantamento, estorno e crédito.

O mapa remainingByInvoice inclui todas as linhas ainda devidas das faturas
selecionadas; para uma fatura ROLLED anterior incluída, não exclui linhas pendentes
da mesma fatura. Substitui SUM individual na baixa sem considerar fatura paga
quando ainda resta obrigação. Eventos e atualizações de planejamento continuam.

### Custo e concorrência

Para N linhas elegíveis e F faturas, planner O(N) tempo/espaço; agregação O(N)
tempo e O(F) memória. A alegação é válida para essas etapas. A ordenação ocorre
na consulta, não em Java: seu custo depende do plano e pode exigir O(N log N),
além do carregamento. Não há medição EXPLAIN/carga nova, nem alegação de tempo
linear para a operação inteira. JOIN FETCH evita SELECT por Invoice no planner;
há O(N) alocações/escritas e operações/eventos por fatura, não SQL total constante.

O delta preserva @Transactional, advisory da intenção, guard compartilhado do
owner, lock do cartão e débito da conta pelo listener síncrono. Recibo e
fingerprint continuam duráveis. Não amplia o conjunto de writers nem muda sua
ordem de locks; reaproveita-se a matriz anterior e reexecutam-se CF024 e os oito
probes de concorrência, sem repetir uma auditoria geral ou certificar ausência
universal de deadlock. Benefício do planner separado: política visível e sem
consultas; custo: vetor/cópia de slices O(N) dentro da transação.

## RC030-02 — datas derivadas e binding

OnboardingProjection valida INITIALIZE_EMPTY depois de resolver ownership e
pristina, com closing_day/due_day do inventário. CREATE usa a mesma regra.
openingIssues cobre corrente e futuras; openingCycle valida fechamento e
vencimento em 0001–9999. Override válido não torna um vencimento base inválido
aceitável. A escrita usa novamente openingCycle. Revalidação sob guard e
fingerprint conservam SOURCE_CHANGED para configuração alterada após preparar.

Invoice tem LocalDate nas três propriedades, PostgreSQL DATE e agora
@JdbcType(LocalDateJdbcType.class). A fonte instalada Hibernate 7.2.1.Final
(hibernate-core-7.2.1.Final-sources.jar) confirma que LocalDateJavaType, no caminho
indireto, converte para java.sql.Date.valueOf; o descritor direto usa
SetObjectBinder/GetObjectExtractor com LocalDate e mantém DDL SqlTypes.DATE.
O caminho indireto passa pela representação/calendário de java.sql.Date,
incompatível com o literal gregoriano em datas antigas; a contraprova distingue
esse efeito da validação de faixa. A correção não transforma datas em instantes.

Na contraprova independente do binding, 6 de 21 casos falham por assertion,
zero erros: em cada um dos três fusos, 0001-01-01 vira 0001-12-30 BC no
fechamento e 1582-10-04 vira 1582-10-14. As 15 outras combinações passam.
Esse resultado confirma sensibilidade a calendário, não apenas a um fuso
específico ou ao tratamento de ano10000. No candidato, todas21 preservam o literal.

Impacto abrange persist/merge/leitura de Invoice, consultas pelos campos e DTOs
de fatura; getDueDate prefere override, por isso o probe SQL confere separadamente
due_date, closing_date e due_date_override, sem deixar o getter ocultar uma
coluna. Provas novas exercitam também predicado JPQL, SQL independente, releitura
em outra transação, update de status e serialização do DTO do serviço.

Sete bordas em três fusos efetivos: fechamento 0001-01-01/vencimento 0001-01-02;
1582-10-04/05 e 1582-10-15/16; 1900-02-28/03-01; 2000-02-29/03-01;
2026-10-21/22; 9999-12-30/31. Override igual ao vencimento. Os controles entregues
complementam fevereiro nominal 31, virada de ano, CREATE/INITIALIZE e parcelas.
A zona padrão é alterada e conferida depois do startup, restaurada em finally.

### Compatibilidade histórica

Não muda coluna, constraint ou migração. Datas inseridas como DATE literais via
SQL são lidas e regravadas sem alteração no candidato; isso sustenta compatibilidade
estrutural e semântica com o valor armazenado. Não significa reparar datas que
o binding antigo já gravou deslocadas. Nesses registros, a nova leitura passa
a representar o DATE realmente armazenado, podendo expor diferença antes mascarada
pela conversão inversa. Restaurar o dia originalmente pretendido exigiria evidência
de proveniência e saneamento separado; não há migração automática segura inferível
apenas do valor da coluna. Adoção real CF017/P01/P02 permanece fora deste aceite.

Trade-off: anotação específica de Hibernate, restrita às três propriedades, evita
mudar globalmente outras entidades. Não certifica datas históricas de outras tabelas.

## RC030-03 — versão e erros

A condição exige isIntegralNumber e canConvertToInt antes de intValue e da
comparação com 1. Short-circuit impede a exceção Jackson para 4294967297; não
introduz catch genérico. O envelope continua fechado. Prepare e complete são
exercitados por MockMvc autenticado, atravessando controller, parser, serviço e
persistência reais: inválidos retornam400 INVALID_FIELD, campo contractVersion,
código INVALID_COMMAND, sem recibo/aplicação. expectedVersion tem seu contrato
Revision separado (REVISION_INVALID400 e VERSION_CONFLICT409). Falha real de
persistência induzida mantém500 INTERNAL_ERROR sanitizado.

## Observador adaptado

O diff modifica somente initializedInvoiceCannotPersistYear10000BehindACompletedReceipt.
Antes, prepare/complete eram pré-condições incondicionais para consultar o ano
persistido. A correção passou a rejeitar no prepare, gerando o DraftProblem
preservado em after-original-four-unmodified, e impedindo legitimamente a consulta.
O novo catch exige400/DATE_INVALID, nenhuma fatura/batch/preparação/recibo e
IN_PROGRESS; o ramo de sucesso mantém a assertion original ano≤9999.

Aceite semântico do ajuste: a finalidade era impedir um recibo concluído sobre
data inválida; a rejeição antecipada específica cumpre isso. O teste isolado não
prova toda a política de rejeição (o ramo original toleraria uma data ajustada),
mas o probe irmão exige rejeição no prepare, e a nova prova HTTP independente
exige400 e versão preservada. Não se substitui o conjunto por uma prova mais fraca.
A mutação que restaura a aceitação indevida deve falhar nos dois probes originais,
incluindo o adaptado, por ano10000. Original preservado é o mesmo blob Git de
251d6c7; os outros82 arquivos independentes auditados permanecem iguais.
