# Oracles CF-016 — dados exclusivamente sintéticos

Fonte: [SPEC-004](../../../docs/sdd/specs/004-regras-financeiras.md), complementando
os expected CF-001 sem alterar seus arquivos. Seed `cf016-v1`; usuário A é dono
de todas as fontes da tabela. Usuário B mantém a sentinela independente 42.17 da
CF-001; nenhum evento de A pode modificá-la. IDs de persistência serão remapeados
por namespace de teste em CF-018–032. Não há chamadas HTTP, credenciais ou banco.
As colunas `accountA` e `accountB` deste CSV são duas contas do **usuário A**;
não são aliases de entidade do JSON CF-001. Em particular, a coluna `accountB`
não é a conta sentinela do usuário B. O adaptador de teste deve manter essa distinção.

## Como ler e reproduzir a tabela

[eventos.csv](eventos.csv) é a tabela canônica de 49 linhas, com expected literais
escritos a partir de contas sintéticas. `parent` identifica o estado de partida;
`OPEN` inicia um cenário independente, nunca uma transação de receita. Executar
somente a cadeia de predecessores de cada cenário, não as 49 linhas sobre a mesma
conta. `event` descreve a ação; as dez colunas de `accountA` até `freeA` são posição
**após** o evento. `cashIn` até `cardPurchases` são efeito **somente desse evento**;
`pendingIncome/pendingExpense` são previsões **restantes**. Não somar posições.

- `investmentValue` é avaliação; `investmentCost` é custo remanescente.
- `debt` é passivo confirmado, incluindo futuras parcelas; `cardCredit` é ativo
  de crédito a compensar/restituir. Nenhum dos dois tem sinal negativo.
- `reserveA/reserveInvestment` são intenções nominais; casos de perda de cobertura
  estão expressos. `freeA` é saldo menos reserva, podendo ser negativo; capacidade
  para **nova** alocação é max(0, livre), não esse valor assinado.
- `wealth` exclui reservas e custo: A + B + avaliação + crédito − dívida.
- `income` é receita realizada; `expense` é consumo/encargo líquido de estornos;
  `realizedGain` é ganho líquido de venda; `cardPurchases` já integra `expense`.
- `cashIn/cashOut` mostram pernas brutas **por conta**. E15 tem 200.00/200.00;
  apresentação consolidada elimina ambos. E16 consolida entrada 0.00/saída 2.00.
  Dividendos/vendas mostram crédito líquido efetivo; receita/taxa brutas ficam
  nas dimensões próprias. Não confundir essas duas apresentações.

Data-base padrão: 2026-09-07; eventos posteriores da cadeia ocorrem em 2026-09-08,
na ordem escrita, com referências explícitas entre operações. Consulta atual
sintética em 2026-09-21; nenhum teste usa o relógio real. Para E41, parcelas de
40.00 em setembro/outubro/novembro; a primeira liquidação E42 é em 2026-09-09.
E43: fatura setembro 200.00 já inclui parcela 50.00; futuras outubro/novembro/
dezembro 50.00 cada. Competências são entradas, não cálculos de fechamento.
Casos B06/B12 substituem essas datas para testar fronteiras anuais.

## Reconciliação manual de referência

| Cadeia/caso | Cálculo independente em centavos e interpretação |
|---|---|
| E01→E02 (F-OPEN) | 100000 + 50000 − 20000 = 130000; reserva 30000 deixa 70000 livres. Custo 40000 não entra no patrimônio. Diferença inicial de avaliação 10000 não é receita do período. |
| E03→E04→E05 | Previsão 25000, recebimentos 10000 e 15000: conta 125000; pendente 0; patrimônio 125000 + 50000 − 20000 = 155000. Receita total da cadeia 25000, não 125000. |
| E06/E07/E08/E09 | Pagar 20000 reduz simultaneamente caixa e dívida; pagar 8000 deixa 12000; rolar não altera nada; encargo 600 faz patrimônio 92000 + 50000 − 12600 = 129400. |
| E10/E11/E12/E13 | Reservas não afetam caixa/receita; avaliação 15000 com reserva nominal 20000 produz déficit 5000. P = 100000 + 15000 − 20000 = 95000. |
| E15/E16 | 80000 + 25000 = 105000; com taxa 200, 79800 + 25000 = 104800. Receita e consumo da transferência zero; somente taxa é despesa. |
| E18/E19 | Compra: 100000 − 20200 = 79800 em conta; avaliação 20000, custo 20200; P 99800. Avaliação sobe a 25000 sem caixa: P 104800, renda zero. |
| Compensação de E18 | Sem vendas posteriores: devolver bruto+taxa credita20200, zera posição/custo e volta a100000. Devolver só bruto credita20000 e deixa99800; perda realizada200 extingue diferença não realizada−200, sem alterar P novamente. |
| E26→E29 | Venda parcial: 4/10 × 20200 = 8080 de custo; 10000 − 100 = 9900 recebidos; ganho 1820. Restam custo 12120/valor 15000. Venda final 15000 gera ganho 2880. Ganhos das vendas 4700 = 24900 de recebimentos − 20200 de custo original. |
| E27→E28 | 1000 bruto − 100 taxa = 900 em conta; estorno com taxa devolvida retira 900, receita −1000/encargo −100. P retorna exatamente a E26; custo/quantidade não mudam. |
| E30 | Venda bruta 25000/taxa 25000: líquido zero, custo baixado 20200, perda realizada 20200; extinguir valor 25000 reduz patrimônio de 104800 para 79800. Não fabricar crédito de zero. |
| E20/E21/E22 | Saldo negativo −12545 é patrimônio −12545, sem outra dívida. Zero conhecido é zero. 10 + 20 = 30 centavos exatos. |
| E23/E24/E25 | Compra real reduz conta e reserva em 12000; livre permanece 70000. Arquivar meta libera 18000 sem reembolsar compra. Reembolso explícito repõe 12000 de caixa, não recria reserva por conta própria. |
| E31/E32 | Desfazer pagamento repõe 20000 em caixa e obrigação; replay não muda os valores de E06. Não há renda/despesa. |
| E33/E34/E35 | Despesa 10000; reembolsos 4000 + 6000; despesa líquida zero e conta inicial 100000 restaurada. Terceiro reembolso é inválido, não nova renda. |
| E36/E37/E38 | Débito real 80000 mantém reserva 30000 sobre conta 20000: livre −10000. Liberação de 10000 resolve déficit. Mover destinação entre conta/investimento conserva reserva total e patrimônio. |
| E41/E42/E45 | Compra 12000 eleva dívida 20000→32000 e reduz P 130000→118000. Pagar 4000 conserva P; cancelar compra ainda não paga no ramo E45 restaura P 130000, sem caixa. |
| E43/E44 | 20000 + 3 × 5000 = 35000; P inicial 100000 + 50000 − 35000 = 115000; pagar 20000 deixa caixa 80000/dívida 15000/P 115000. |
| E46→E49 | Compra e pagamento deixam caixa 90000/dívida zero. Reembolso cria crédito de cartão 10000/P 100000; restituição substitui crédito por caixa. Receita permanece zero em todos os eventos. |

## Bordas contratuais e cenários a implementar

Estes expected são normativos. O verificador documental não executa rejeições,
locks, consultas nem APIs; a coluna final atribui testes reais às tarefas donas.

| ID | Entrada/ação sintética | Resultado esperado independente | Teste futuro / dono |
|---|---|---|---|
| B01 | 100.00 em 3 parcelas; 0.05 em 2; 0.02 em 3 | 33.33/33.33/33.34; 0.02/0.03; último caso rejeitado por parcela <0.01. 0/fração/negativo como quantidade de parcelas é inválido. | Unitário + PostgreSQL; CF-019 |
| B02 | Dinheiro informado 1.005; quantidade 0.000000001; preço negativo; taxa −0.01; valor com 13 dígitos inteiros | Rejeitar campo/escala/limite, sem escrita parcial ou arredondar silenciosamente. Nos novos contratos 1e3, 1,00 e number não substituem string decimal. | Contrato + domínio; CF-018/019/020 |
| B03 | Produto 1×1.005; 1×1.004; 0.125×10.04; custo 1.00/3 unidades vendidas uma a uma | Brutos 1.01; 1.00; 1.26. Custos baixados 0.33/0.34/0.33; remanescente zero; estorno do primeiro bruto usa 1.01 original. | Unitário + PostgreSQL; CF-020 |
| B04 | Sobre E10 reservar +0.01; sobre E20 reservar 0.01; reduzir fonte de rascunho 1000.00→250.00 com reserva 300.00 | Rejeitar primeira/segunda alocação sem mutação; rascunho permanece editável mas conclusão impedida até corrigir déficit 50.00. | Domínio + integração; CF-020/028/030 |
| B05 | E13: reserva investimento 200.00 e avaliação 150.00; pedir nova alocação 0.01 | Preservar avaliação real/reserva existente e exibir déficit 50.00; negar aumento. Falha de cotação mantém última avaliação datada; sem nenhuma avaliação, valor e patrimônio completo indisponíveis. | Domínio + double apenas de cotação + componente; CF-020/021 |
| B06 | Compra 120.00 em 2026-12-20; parcelas explícitas dezembro/2026 e janeiro/fevereiro/2027; pagar 40.00 em 2027-01-02 | Consumo 2026 = 120.00, 2027 = 0.00; saída de caixa 2027 = 40.00; dívida remanescente 80.00. Parcela futura não reaparece como nova compra anual. | Queries reais + contrato + E2E; CF-019/021/032 |
| B07 | E35: pedir novo reembolso 0.01; E26: excluir compra que originou posição após venda parcial | Rejeitar excedente e exclusão simples respectivamente; caixa/custo inalterados, sem clamp para zero. Replay de reembolso anterior retorna o mesmo recibo sem crédito. | Domínio + PostgreSQL; CF-018/020/024 |
| B08 | Posição renda fixa custo 1000.00/valor 1100.00; resgate 220.00 sem taxa; venda com taxa maior que bruto | Custo baixado 200.00, ganho 20.00, custo 800.00/valor 880.00 restantes. Taxa superior ao bruto rejeitada; taxa igual é E30. | Domínio + PostgreSQL; CF-020 |
| B09 | Limite 1000.00 e abertura E43; após E44; depois reduzir limite contratado para 100.00 | Comprometido/disponível 350.00/650.00; 150.00/850.00; 150.00/−50.00 com alerta. Encargo 6.00 sobre principal 120.00 e pagamento 80.00 deixa principal 46.00 e libera 74.00. | Domínio + contrato; CF-019 |
| B10 | Transferência E15 falha no crédito; duas alocações concorrentes de 700.00 sobre 1000.00; dois pagamentos da dívida E06 | Falha mantém A1000.00/B50.00; no máximo uma alocação confirma e livre 300.00; no máximo um débito de 200.00 e dívida zero. Sem lost update nem sucesso da transação revertida. | PostgreSQL com barreiras/conexões distintas; CF-018/020/024 |
| B11 | Selecionar 2025 com abertura apenas 2026-09-07; consulta em 2026-09-21 | Posição histórica null + “Histórico insuficiente”; seção atual pode mostrar 1300.00 datado 21/09/2026. Cobertura de fluxo anterior desconhecida; não afirmar zero nem crescimento 0%. E21 continua zero conhecido. | Contrato + queries + componente; CF-021 |
| B12 | Previsão de receita 250.00 vencendo 2026-12-31; liquidar 2027-01-02; registrar em 2027-01-03; executar em São Paulo/UTC/UTC+14 | Vencimento em 2026; caixa e receita 250.00 em 2027, dia 02; auditoria dia 03; nenhum fuso move o dia informado. | Contrato + PostgreSQL + E2E; CF-018/021/032 |
| B13 | Usuário B tenta usar conta/cartão/investimento/meta de A por UUID válido; categoria ou destino de update também de A | Nenhuma leitura de valores de A, nenhum efeito em A ou sentinela B=42.17; resposta de referência inacessível segundo política CF-023, sem vazar existência. | Contrato autenticado + PostgreSQL; CF-018/019/020/023 |
| B14 | Reembolso 120.00 de compra com 20.00 ainda devidos; usar crédito numa nova compra 150.00 | Reembolso baixa dívida 20.00 e cria crédito 100.00, despesa −120.00; nova compra consome crédito 100.00 e cria dívida 50.00, despesa 150.00. Caixa zero nas duas operações. | Domínio + PostgreSQL; CF-019 |
| B15 | Cancelar compra parcelada 100.00 em 33.33/33.33/33.34, ainda não paga, parcialmente em 40.00 | Abater 33.34 da última e 6.66 da penúltima; agenda restante 33.33/26.67/0.00, dívida 60.00, consumo líquido 60.00. Zero aqui é parcela cancelada, não nova parcela emitida. | Domínio + PostgreSQL; CF-019 |
| B16 | Arquivar conta com 100.00; arquivar meta financiada por investimento de 500.00 | Posição continua incluindo conta 100.00; investimento permanece 500.00 e caixa não aumenta. Nova movimentação em conta arquivada exige reativação; histórico e total não desaparecem. | Domínio + relatório; CF-018/020/021 |
| B17 | Conta bancária 50.00 registra pagamento efetivo de dívida 80.00; carteira CASH 50.00 tenta gasto voluntário 80.00 | Banco −30.00/dívida reduzida 80.00, patrimônio conservado; carteira rejeita gasto e permanece 50.00. Abertura negativa continua admissível e não vira dívida duplicada. | Domínio + contrato; CF-018/019 |
| B18 | Sobre E04 desfazer recebimento parcial 100.00, mantendo previsão original; depois cancelar toda previsão | Caixa volta a 1000.00/receita −100.00/pendente 250.00. Cancelamento posterior deixa pendente zero sem novo efeito de caixa. | Domínio + PostgreSQL; CF-018 |

## Força e limites do verificador

`node tasks/evidencias/CF-016/verify.mjs` lê a tabela, checa formato, identidade
patrimonial, livre, ponte de caixa e reconciliação de resultado/avaliação. Usa
BigInt em centavos e apenas arquivos documentais; não importa helper nem serviço
de produção. Verifica também as contas de precisão literais, referências locais
e correspondência F-OPEN/F-PENDING/F-PAY/F-NEGATIVE com os oracles CF-001.

Para cada evento não OPEN, a ponte de patrimônio é:
`ΔP = receita − despesa + ganho realizado + Δ(valor investido − custo investido)`.
Nesta tabela não há aporte externo não classificado, ajuste de abertura nem
outros ativos/passivos. Não generalizar essa equação a um universo maior sem
adicionar os termos faltantes. E18 inclui −2.00 de diferença de avaliação; E26
realiza ganho anterior sem duplicá-lo. Para OPEN somente a identidade de estoque
é aplicável; diferença de avaliação preexistente não entra no período.

O modo `--adversarial` altera **cópias em memória**: abertura como renda, pendente
como realizado, meta como ativo, pagamento como consumo, bruto de venda como
ganho e distribuição de centavos na primeira parcela. As seis alterações devem
falhar por assertions financeiras/documentais, não import/ambiente. Não altera
arquivos, código de produto nem expected canônicos. Isso testa a consistência do
material e a capacidade do verificador documental, **não a aplicação**. Implementações
futuras têm de demonstrar vermelho causal próprio conforme a política de testes.
