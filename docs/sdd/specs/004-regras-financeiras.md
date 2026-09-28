# SPEC-004 — Abertura, caixa, consumo, dívida e destinação

Contrato de produto definido pela **CF-016 em 21–22/09/2026**, sobre `45e156c`.
Resolve DEC-04 e a parte financeira de DEC-07 da [SPEC-003](003-criterios-oracles.md).
É especificação normativa para implementações futuras, não certificação do código.
Fontes: [SPEC-001](001-onboarding.md), [SPEC-002](002-datas.md),
[ADR-002/004](../arquitetura.md) e [política de testes](../../../tasks/POLITICA-DE-TESTES.md).
Os valores são sintéticos, em BRL, sem importação de dados pessoais.

CF-001 e CF-004 estão concluídas/integradas. CF-015 permanece em_revisao pelo
zoom nativo 200%; R03/RV01 já foi encerrado em `45e156c`. Esta especificação não
encerra esse gate nem inicia CF-017. [Evidências CF-016](../../../tasks/evidencias/CF-016/README.md).

## DEC-04 — Dimensões que os relatórios devem distinguir

| Dimensão / rótulo | Reconhecimento e exclusões |
|---|---|
| Posição de abertura em DD/MM/AAAA | Estoque conhecido na data-base: saldos assinados das contas, valor/custo dos investimentos, crédito e dívida de cartão. Não é entrada, receita, compra, aporte ou rendimento do período. |
| Entradas / saídas de caixa realizadas | Movimentos efetivos nas contas por data civil de liquidação. Compra de investimento e pagamento de fatura saem do caixa; resgate entra. Transferência aparece por conta, mas suas pernas se eliminam no fluxo consolidado, preservando taxa separada. Abertura e previsão ficam fora. |
| Receitas realizadas | Renda externa recebida, inclusive provento bruto recebido; não inclui abertura, transferência, principal de resgate, crédito de estorno ou liberação de reserva. Ganho de venda fica na linha própria de investimentos. |
| Despesas de consumo e encargos | Despesa direta quando paga; compra no cartão pelo valor integral e data da compra, mesmo parcelada. Taxas bancárias/cartão explícitas entram uma vez, ao débito ou constituição da dívida. Pagamento da fatura não é nova despesa; aporte e reserva não são consumo. |
| Resultado realizado de investimentos | Na venda: líquido recebido menos custo baixado. Proventos ficam em receitas, com retenções/taxas separadas como encargos. Não adicionar proventos novamente ao somar resultados. |
| Variação de avaliação não realizada | Mudança do valor da posição sem recebimento. Não é receita realizada. Exibir data/origem de avaliação e separar valorização anterior à abertura. |
| Previsões / compromissos | Receitas e despesas ainda não liquidadas, por vencimento/competência. Previsão comum não altera caixa, renda ou patrimônio. Dívida confirmada do cartão é obrigação efetiva, incluindo parcelas futuras; a agenda de vencimentos é outra visão da mesma dívida. |
| Destinado a metas / livre por fonte | Informação sobre uso pretendido dos ativos existentes. Não é ativo adicional, receita ou despesa. Montante reservado em investimento não é caixa disponível. |

DEC-04 escolhe um relatório gerencial com **visões separadas**; não declara um
regime contábil/fiscal universal. A compra de cartão é reconhecida integralmente
porque a obrigação já existe; a agenda de parcelas serve ao orçamento. A previsão
de uma despesa comum é somente intenção. Se houver obrigação real fora de cartão,
ela exige tipo próprio antes de entrar no passivo; não converter todo pendente em dívida.

Não chamar `receitas − despesas` de saldo bancário ou patrimônio. Mostrar o regime,
período e filtros no dashboard, resumo anual, extrato e XLSX. `cardPurchases` é um
detalhamento das despesas, nunca uma segunda parcela a somar. O fluxo consolidado
elimina apenas as pernas de transferências entre contas do próprio usuário;
investimento permanece como entrada/saída de caixa classificada separadamente.

## FIN-01 — Posição, abertura e identidade patrimonial

`P = soma dos saldos assinados das contas + valor dos investimentos + créditos de cartão − dívida de cartão`.
Contas negativas já estão na primeira parcela: não subtrair o mesmo descoberto
novamente como dívida. Metas, custo investido, limite de cartão e previsões não
são somados ao patrimônio. Custo é uma medida de base de investimento, não outro ativo.
Se uma fonte necessária não possui valor conhecido, o total completo é indisponível;
um subtotal conhecido deve ter esse rótulo.

Abertura fixa data-base, proprietário, fonte, montante e proveniência explícitos.
Inclui todas as parcelas ainda devidas, sem repetir a parcela corrente na fatura.
Receber apenas custo não permite inventar valor atual. Data-base significa posição
imediatamente anterior aos eventos posteriores declarados naquele dia: se o saldo
informado já inclui um evento, ele não pode ser reaplicado. O onboarding deve
reconciliar essa fronteira na revisão (CF-028/030).

Saldo positivo, zero e negativo são admissíveis na abertura, inclusive para preservar
posição informada de carteira; negativo exige indicação de déficit, nunca normalização
para zero. Débito ordinário em conta bancária pode ficar negativo; gasto voluntário
em dinheiro físico não pode exceder saldo. Investimento novo exige recursos livres;
não cria financiamento implícito. Registro de liquidação bancária já ocorrida,
inclusive pagamento de fatura, deve conservar o fato e eventual saldo negativo.
Regras de autorização bancária externa não são simuladas pelo app.

Arquivar uma conta/ativo oculta operações na lista de uso, mas não apaga seu saldo,
passivo nem história dos totais. Remoção econômica requer saldo zero ou transferência/
compensação explícita; arquivar não pode fazer patrimônio desaparecer.

Não reclassificar legado pela descrição “Saldo Inicial”, categoria, flag
`isSystemManaged` ou tipo `INTEREST`. Origem desconhecida permanece identificada;
relatório não atesta completude até reconciliação. Ajuste de abertura tem trilha,
motivo e diferença patrimonial em linha própria, sem receita fictícia.

## FIN-02 — Realizado, pendente, transferência e datas

Cada evento distingue natureza, fonte/destino, valor positivo, estado, identidade
da operação e referência à origem. Sinais são efeitos do tipo; entrada negativa
não é forma genérica de contornar validação. Abertura/posição podem ser assinadas.

Previsão de 250.00 mantém saldo 1000.00; liquidar 250.00 em outra data cria um único
recebimento e baixa a previsão. Liquidar 100.00 deixa 150.00 pendente, sem duplicar
o compromisso. Cancelar previsão remove somente a previsão. Desfazer pagamento
reativa o pendente somente quando a obrigação ainda existe; cancelamento da
obrigação e estorno de liquidação são comandos distintos. `isPaid` sozinho não
representa pagamento parcial nem é proveniência financeira.

Transferir 200.00 de A=1000.00 para B=50.00 deixa A=800.00/B=250.00;
patrimônio 1050.00, receita/despesa zero. Com taxa 2.00, A=798.00/B=250.00,
patrimônio 1048.00 e despesa 2.00. Origem e destino devem ser distintos e do mesmo
proprietário. Duas pernas vinculadas, taxa e atualização de reservas são atômicas:
erro no destino desfaz tudo. Transferência futura é pendente em ambos os lados.
Editar o campo conta de uma transação não é uma transferência entre contas.

Datas civis não convertem fuso. Liquidação usa a data efetiva informada; vencimento,
data de compra e competência de fatura permanecem distintos. Registrar em janeiro
um pagamento ocorrido em dezembro o inclui em dezembro, com auditoria de janeiro.
Uma previsão de 2026-12-31 recebida em 2027-01-02 aparece no caixa/receita de 2027,
sem alterar sua data de vencimento. Auditoria segue SPEC-002 e não define período
financeiro. Abertura em 2026-09-07 não autoriza reconstrução anterior a essa data.

## FIN-03 — Compra, dívida, pagamento, rolagem e limite

Compra confirmada de 120.00 em três parcelas aumenta dívida e despesa de consumo
em 120.00 na data da compra; caixa não muda. As parcelas 40.00/40.00/40.00 apenas
distribuem vencimentos. Pagar 40.00 reduz caixa e dívida em 40.00; despesa nova zero.
Fatura de abertura 200.00 paga depois: caixa −200.00, dívida −200.00, patrimônio
constante e nenhuma compra histórica fabricada.

Pagamento parcial de 80.00 numa dívida 200.00 deixa 120.00; fechamento/rolagem move
esses 120.00 de competência, não cria dívida nem compra. Taxa de rolagem 6.00
explicitamente informada aumenta dívida para 126.00 e despesa em 6.00. Não supor
juros, multas ou tabela de banco. Estado deve distinguir liquidada de encerrada
com saldo transferido; `PAID` não pode esconder obrigação remanescente.

Adiantamento liquida dívida confirmada, sem desfazer despesas por compra. Nesta
versão, pagamento zero/negativo ou acima da dívida é rejeitado atomicamente.
Reembolso acima da dívida pode criar **crédito no cartão**: ativo separado, sem
dívida negativa silenciosa. Crédito usado numa nova compra reduz primeiro esse
ativo; só o restante vira dívida. Restituição desse crédito à conta move ativo,
não gera receita. Nunca registrar crédito e redução de dívida pelo valor integral
ao mesmo tempo.

Limite interno gerencial: `comprometido = principal de compras ainda não liquidado`,
incluindo parcelas futuras; rolagem do mesmo principal não duplica comprometimento.
Pagamento de principal e estorno liberam esse montante. Encargos não viram novas
compras nem consomem esse limite gerencial; crédito não aumenta o limite contratado.
`disponível = limite contratado − comprometido`, podendo ser negativo se o limite
for reduzido ou houver posição importada excedente. Não bloquear registro de compra
já ocorrida só por esse cálculo; mostrar excesso. Não alegar disponibilidade
autorizada pelo banco. Pagamento com encargos identificados quita primeiro encargos,
depois principal mais antigo (competência, parcela, ID estável); mostrar a distribuição.

Exemplo de abertura CF-001: limite 1000.00, fatura 200.00 **já incluindo** a parcela
corrente 50.00, futuras 50.00/50.00/50.00 → dívida e comprometimento 350.00,
limite disponível 650.00. Pagar 200.00 deixa 150.00/850.00. Se dívida inclui 6.00
de encargos mais 120.00 de principal, pagar 80.00 baixa encargos 6.00 e principal
74.00: dívida/principal 46.00; libera limite 74.00.

DEC-03 — política **gerencial** escolhida explicitamente para CF-019: fechamento
nominal 29–31 cai no último dia válido do mês curto. Compra anterior ao dia efetivo
de fechamento entra na competência daquele mês; compra no dia efetivo ou posterior
entra na competência seguinte. O vencimento é o primeiro dia nominal válido,
ajustado ao último dia do mês se necessário, estritamente posterior ao fechamento.
Não há deslocamento por dia útil, feriado nem inferência da regra real do emissor.
Exemplo com fechamento 31 e vencimento 30: compra em 2027-02-27 → competência
2027-02, fechamento 2027-02-28 e vencimento 2027-03-30; compras em 2027-02-28
e 2027-03-01 → competência 2027-03, fechamento 2027-03-31 e vencimento
2027-04-30. Com vencimento nominal 31 após fechamento 20, fevereiro de 2027
vence em 2027-02-28. Parcelas seguintes avançam por `YearMonth`, sem arrastar
o dia reduzido de fevereiro para março. Esta escolha não altera os efeitos
monetários e não representa promessa do emissor.

## FIN-04 — Investimento: custo, avaliação, compra, venda e taxas

Abertura informa quantidade, custo total e avaliação com data/origem. Custo 400.00,
valor 500.00 → diferença inicial 100.00, receita do período zero. Custo desconhecido
permite posição conhecida, mas ganho de venda fica indisponível até comprovação.
Preço médio é derivado do custo e quantidade; não deve ser a única fonte de custo.

Compra/aporte: debitar bruto + taxa, aumentar quantidade e custo pelo total.
Taxa de aquisição é capitalizada no custo; não repetir como despesa de consumo.
Avaliação independente pelo preço 20.00 de dez unidades: valor 200.00, custo
202.00 com taxa 2.00, caixa −202.00, patrimônio −2.00 e diferença valor−custo −2.00.
Preço de execução não substitui automaticamente a avaliação de toda a posição.

Venda/resgate: crédito líquido = bruto − taxa; baixar custo proporcional à quantidade
vendida pelo custo médio ponderado. Na última venda, baixar todo custo residual,
eliminando centavos remanescentes. Ganho realizado = líquido − custo baixado;
principal recuperado não é receita. Não lançar taxa de venda de novo em despesas
se já integra esse ganho líquido. Quantidade vendida não excede a detida;
taxa negativa ou superior ao bruto é inválida. Taxa igual ao bruto é admissível:
liquidação zero sem chamada artificial de crédito positivo e perda igual ao custo baixado.

Exemplo independente: 10 unidades, custo 202.00, avaliação 25.00/unidade, valor
250.00. Venda de 4 por 25.00 com taxa 1.00 → crédito 99.00, custo baixado 80.80,
ganho realizado 18.20; restam 6 unidades, custo 121.20 e valor 150.00. Diferença
não realizada passa de 48.00 para 28.80 (−19.20); 18.20 − 19.20 = −1.00 de
patrimônio, correspondente à taxa, sem confundir realização com criação de riqueza.

Provento bruto 10.00 com retenção/taxa 1.00: caixa +9.00, receita +10.00,
encargos +1.00; quantidade/custo inalterados. Avaliação, se mudar por outra razão,
é evento separado. Reinvestir usa dois eventos vinculados (recebimento e compra),
sem eliminar a receita nem duplicar caixa. Rendimento incorporado ao saldo de renda
fixa sem saque é avaliação não realizada, não recebimento. Resgate parcial baixa
custo proporcional ao valor resgatado da posição avaliada; ex.: custo 1000.00,
valor 1100.00, resgate 220.00 → custo baixado 200.00, ganho 20.00, valor restante
880.00 e custo 800.00. Aporte posterior aumenta custo pelo dinheiro efetivamente aplicado.

Cotação ausente/falha preserva última avaliação com rótulo/data de desatualização;
sem avaliação anterior, valor é indisponível, não zero/custo fingido como valor atual.
Preço zero só é aceito como avaliação explícita válida com proveniência, nunca
fallback de rede. Ajuste manual exige motivo/data e distingue correção de posição
de variação de mercado. Não converter redução de saldo automaticamente em retirada.

## FIN-05 — Metas são destinação, não custódia

Alocação vincula proprietário, meta, fonte (conta ou investimento) e valor nominal
BRL. Uma fonte pode financiar várias metas; uma meta pode ter várias fontes.
Criar/aumentar reserva exige montante >0 e soma por fonte ≤ max(0, valor conhecido
da fonte). Reserva zero equivale a ausência/liberação; conta negativa não tem
capacidade de alocação. Não usar limite de crédito para financiar reserva.

Conta 1000.00 e reserva 300.00 → conta 1000.00, livre 700.00. Mais 700.00 é válido;
mais 0.01 falha sem efeito. Investimento 500.00 com reserva 200.00 mantém valor
500.00; 300.00 não destinado continua ativo. O progresso monetário é a soma das
destinações, exibindo cobertura insuficiente quando aplicável; progresso numérico
não participa de nenhuma soma monetária.

Liberar/excluir meta remove somente destinação; não credita conta nem vende ativo.
Mover reserva entre fontes exige capacidade no destino e atualização atômica.
Mover dinheiro é transferência/aporte separado. Nunca “estornar” histórico de
vínculo com investimento creditando caixa sem venda ou liquidação correspondente.

Reservas são planejamento, não bloqueio bancário. Um débito efetivamente ocorrido
é registrado mesmo se reduzir cobertura; mostrar déficit e impedir nova alocação
enquanto a fonte estiver insuficiente. Transferência/aporte voluntário usando
recursos destinados exige liberação ou realocação explícita no mesmo comando.
Valorização não aumenta reserva nominal. Queda de investimento 500.00→150.00 com
reserva 200.00 conserva a intenção 200.00, informa déficit 50.00 e disponibilidade
para nova alocação zero; não rejeitar cotação nem prometer 200.00 cobertos.

Compra para checklist financiada pela reserva: consumir 120.00 da fonte real e
liberar/consumir 120.00 da destinação no mesmo caso de uso. Conta 1000.00/reserva
300.00 torna-se 880.00/180.00; livre continua 700.00 e despesa 120.00. Compra no
cartão aumenta dívida e consumo; reserva só muda por decisão explícita, não cria
“saldo da meta”. Bem de consumo comprado não é novo ativo neste escopo. Separar
itens adquiridos/progresso de checklist de dinheiro ainda reservado.

## FIN-06 — Precisão e arredondamento (DEC-07)

Decisão de produto BRL: dinheiro em centavos, **HALF_UP** no resultado monetário
calculado; quantidade e preço unitário aceitam até oito casas decimais. Dinheiro
informado aceita até duas casas e sai canônico com duas. Novos contratos usam
strings decimais, sem expoente, separador de milhar ou vírgula. `1.005` como dinheiro
informado é rejeitado; `1.00500000` como preço é válido. Nada de truncar entrada
silenciosamente. Valores de operação positivos; taxas ≥0; escalas/limites validados
antes de escrita. Teto de contrato: 12 dígitos inteiros para dinheiro, quantidade
e preço; produto/agregado deve caber no limite monetário, senão rejeitar operação
ou informar agregado fora de faixa, nunca overflow/normalização. Schema será CF-017.

BigDecimal no domínio e decimal exato no contrato. `double`, epsilon e arredondamento
de cada parcela intermediária não definem resultado. Multiplicar quantidade por
preço com precisão exata; arredondar bruto uma vez a centavos e só então aplicar
taxa monetária. Valor da posição = quantidade × preço de avaliação, arredondado
uma vez por posição; somar essas posições exibíveis. Custo baixado proporcional
arredonda uma vez a centavos; custo remanescente = custo anterior − custo baixado.
Preço médio exibido pode arredondar a oito casas, sem recompor custo a partir dele.

Exemplos: 0.10 + 0.20 = 0.30; 1 × 1.005 = 1.01; 1 × 1.004 = 1.00;
0.125 × 10.04 = 1.255 → 1.26. Custo 1.00 para três unidades: baixas sucessivas
0.33/0.34/0.33, respeitando custo e quantidade remanescentes. Estorno usa o valor
persistido da operação original (−1.01), não recalcula com cotação/arredondamento novo.

Parcelas: centavos inteiros divididos por N, base truncada; **todo resto na última
parcela**, como previsto pela SPEC-001. 100.00/3 = 33.33/33.33/33.34;
0.05/2 = 0.02/0.03. Número inteiro positivo; cada parcela deve ser ≥0.01:
0.02/3 é rejeitado. Agenda explícita do emissor pode ser preservada se todas as
parcelas forem positivas e somarem exatamente a compra; não redistribuir legado.
Estorno parcial sobre compra parcelada abate parcelas ainda devidas da última
para a primeira; excedente já pago vira crédito no cartão. CF-019 registra esse
vínculo sem reescrever o histórico pago.

## FIN-07 — Estorno, exclusão e repetição (DEC-07)

Compensação referencia operação original, montante já compensado, data efetiva,
motivo e fonte/destino. Soma de estornos não supera valor elegível original;
repetição não produz novo efeito. Fonte deve pertencer ao mesmo usuário. Não
deletar fatos realizados para simular retorno do dinheiro. Excluir intenção não
movimenta dinheiro; arquivar item/meta não cancela compra nem ressuscita caixa.

| Caso | Efeito esperado |
|---|---|
| Estorno de despesa direta 100.00, parcial 40.00 | Caixa +40.00, despesa −40.00 na data do reembolso; não receita. Restam 60.00 elegíveis. |
| Cancelar compra cartão 120.00 ainda não paga | Dívida −120.00, despesa −120.00, caixa zero; liberar principal comprometido. |
| Reembolso de compra 120.00 com apenas 20.00 de dívida restante | Dívida −20.00, crédito no cartão +100.00, despesa −120.00, caixa zero. |
| Reembolso de compra já paga 100.00 | Crédito no cartão +100.00, despesa −100.00. Restituir à conta depois: crédito −100.00/caixa +100.00, receita zero. |
| Desfazer pagamento de dívida de abertura 200.00 | Caixa +200.00, dívida +200.00, despesa/receita zero. A dívida volta; a compra não é cancelada. |
| Desfazer alocação 300.00 | Reserva −300.00, livre +300.00; conta, dívida e patrimônio iguais. |
| Estorno de provento 10.00 integral com taxa devolvida 1.00 | Caixa −9.00, receita −10.00, encargos −1.00; sem mudar quantidade/custo. |

Correção de investimento depende da cadeia de custo: cancelar compra ainda sem
vendas posteriores restaura quantidade/custo e compensa o caixa; taxas só retornam
se explicitamente devolvidas. Em E18, cancelar a aquisição inteira com devolução
da taxa credita 202.00 e zera custo/posição, retornando à conta 1000.00. Se somente
o bruto for devolvido, credita 200.00, zera custo/posição e deixa conta/patrimônio
998.00; os 2.00 irrecuperáveis viram perda realizada de investimento (a diferença
não realizada −2.00 é extinta), sem segunda despesa. Com vendas dependentes, bloquear exclusão simples
e exigir correção rastreável com recálculo dos custos afetados. Nunca limitar
quantidade negativa a zero para esconder inconsistência. Reembolso mercantil em
outra data não apaga o período da compra; relatórios mostram despesa líquida
negativa no período do reembolso quando aplicável. Correção de erro de cadastro
retroativo deve ser explicitamente identificada e revalidar períodos afetados.

Garantia de domínio: efeito único de pagamento, transferência, alocação e estorno,
inclusive sob concorrência. Destino de contrato: mesma chave/mesmo conteúdo devolve
o recibo original; mesma chave/conteúdo diferente conflita. Outra chave disputando
saldo já liquidado conflita sem efeito. CF-024 define transporte/recibo durável,
retenção e recuperação; contratos HTTP existentes **não são declarados idempotentes**.
CF-015 protege fechamento PAID com lock, mas não resolve replay durável de adiantamento.
Resultado desconhecido exige consulta, nunca repetição cega. Falha intermediária
desfaz todas as pernas; invalidação de cache ocorre após commit e cobre anos/fonte
antigos e novos. Essas garantias exigem testes PostgreSQL de CF-018/019/020/024.

## FIN-08 — Ano, posição atual e indisponibilidade (DEC-04)

Escolha para CF-021: relatório anual de **fluxos do ano selecionado**, com seção
separada **“Posição atual em DD/MM/AAAA”**. Custo investido, valor avaliado, dívida,
crédito e destinações têm rótulos próprios. A data de consulta não substitui data
de avaliação de cada ativo. Não apresentar seção atual como encerramento do ano.
Essa opção entrega informação útil sem prometer snapshots históricos inexistentes;
custa explicitar duas referências temporais na interface/API/exportação.

Fechamento histórico só pode ser mostrado com abertura, todos os movimentos,
dívidas/créditos e avaliações na data de corte comprovados. Se insuficientes,
campo histórico null/estado indisponível e motivo **“Histórico insuficiente”**;
não preencher com posição atual nem zero. Consultar 2025 com abertura 2026-09-07:
histórico 2025 indisponível; seção atual sintética pode mostrar 1300.00, datada
2026-09-21, sem pertencer a 2025. Não reconstruir gráfico de patrimônio revertendo
somente INCOME/EXPENSE a partir da posição atual: omite valorização, dívida e origem.

Ausência de registros em período anterior ao início conhecido também não comprova
fluxo zero. Exibir cobertura a partir da data-base; comparação anual exige escopos
comparáveis e cobertura conhecida. Denominador zero/ausente não produz crescimento
0% fictício; indicar comparação indisponível. Zero conhecido (perfil sem bens,
período coberto sem movimentos) continua 0.00.

## Oracles independentes e plano de aceite

A [tabela canônica CSV](../../../tasks/evidencias/CF-016/eventos.csv) contém estados
literais após cada evento, referência ao estado anterior e efeitos do evento nos
relatórios. Cada ramo recomeça no predecessor indicado; não compartilhar saldo
mutável entre cenários. O [guia](../../../tasks/evidencias/CF-016/ORACLES.md) dá
equações manuais, bordas e responsabilidades. Verificador documental em centavos
confere reconciliação; não calcula expected com código de produção.

| Critério herdado | Extensão desta especificação | Casos / dona da implementação e teste |
|---|---|---|
| AC-FIN-001/002 | FIN-01/02; abertura, previsão, liquidação parcial e total | E01–E05, E20–E22, E39–E42; CF-018/021/030 |
| AC-FIN-003/010 | FIN-03/07; pagamento, estorno e efeito único | E06–E09, E31–E32, E45–E49, B14/B15; CF-019/024 |
| AC-FIN-004; AC-UI-012 | FIN-08; cobertura/posição atual | B11/B12; CF-021 |
| AC-FIN-008 | FIN-05; duas fontes, capacidade e déficit | E10–E13, E23–E25, E36–E38; B04/B05; CF-020 |
| AC-FIN-009 | FIN-01/04/06/07; saldo negativo, taxas, custo e centavos | E14–E22, E26–E30, E33–E35; B01–B03/B07/B08; CF-018/020 |
| AC-FIN-014 | FIN-03/06; dívida inicial, parcelas e limite | E43/E44; B06/B09; CF-019/030 |
| AC-FIN-005/007 | FIN-02/05/07; dono/rollback | B10/B13; CF-018/019/020/023/024/030 |

Produto: unitários verificam regras/precisão; contrato usa controller/serializador
real; integração usa PostgreSQL descartável, queries/constraints e duas conexões;
CF-032 E2E conecta browser→BFF→API→banco/reload, compara telas e exportação. Cada
correção deve demonstrar vermelho causal antes do verde, sem remover assertions
anteriores. Mutações sugeridas: incluir abertura/pendente em renda; somar meta ao
patrimônio; duplicar compra ao pagar; arredondar resto na primeira parcela; usar
custo como avaliação; repetir estorno; remover posse/controle de concorrência.
CF-016 verifica somente o contrato e registra o confronto estático.

## Implementação futura, custos e limites

Usar o monólito modular: accounts/transactions controla saldo e transferências;
cards controla obrigação/parcelas/pagamentos; investments controla custo/avaliação;
goals referencia fontes; reporting lê projeções. Origens tipadas, vínculo de
operação/compensação e alocações explícitas permitem reconciliação sem exigir
ledger completo, event sourcing, Kafka ou microsserviços. Menor custo operacional;
contrapartida: disciplina para manter projeções e trilha dentro da transação.

Reconciliação de n eventos custa O(n); ordenação histórica, quando necessária,
O(n log n). Somar alocações por fonte exige agregação em lote, sem query por meta;
locks/versões devem serializar validação e escrita para impedir duas reservas
de 700.00 na fonte de 1000.00. Ordenar aquisição de locks por identidade evita
inversão entre transferências; retry só com garantia de efeito único. Precisão e
atomicidade precedem cache. Medir SQL/EXPLAIN em CF-025: evitar N+1 e totais da
página, preferir intervalos de datas e projeções; não prometer O(1) nem índices
eficazes sem medição. Relatórios com várias leituras precisam snapshot coerente
ou versão/data que permita detectar composição inconsistente (CF-021/024).

Migração/proveniência são CF-017, preservação/homologação CF-035. Contratos de
onboarding permanecem CF-028–032; a política gerencial DEC-03 é da CF-019 e
protocolo HTTP/recibos detalhados permanece CF-024. Esses limites não deixam
indefinidos os efeitos econômicos acima. [Divergências e donos](../../../tasks/evidencias/CF-016/DIVERGENCIAS.md)
não são correções implementadas nem autorização de migração real.
