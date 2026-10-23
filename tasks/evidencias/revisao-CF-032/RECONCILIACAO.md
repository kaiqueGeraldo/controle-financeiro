# Reconciliação independente e inspeção OOXML

Fontes normativas: SPEC001 E01/NG-01, FIN01–08 e SPEC002. O script `audit.py`
usa Decimal da biblioteca padrão, lê linhas persistidas e OOXML por zip/XML;
não importa helpers de produto nem a reconciliação do executor. `historical-audit.json`
reconfere run10; `current-audit.json` repete a conta sobre a nova run01.

## Checkpoints BRL

| Momento | Contas | Investimentos | Dívida | Patrimônio | Reserva contas | Livre contas |
|---|---:|---:|---:|---:|---:|---:|
| Aplicação E01 |1300.00|501.00|350.00|1451.00|350.00|950.00|
| +250.10 receita −40.20 despesa −2 taxa; transferência100 interna |1507.90|501.00|350.00|1658.90|350.00|1157.90|
| Compra120 em3×40 |1507.90|501.00|470.00|1538.90|350.00|1157.90|
| Pagamento200 |1307.90|501.00|270.00|1538.90|350.00|957.90|
| Compra2 ações×10 +taxa1 |1286.90|501.67|270.00|1518.57|350.00|936.90|
| Destinação100 adicional |1286.90|501.67|270.00|1518.57|450.00|836.90|

Transferência reduz corrente102 e aumenta poupança100; somente taxa2 reduz
patrimônio. Carteira100/poupança300/corrente886.90 no final. Reserva de investimento
200 permanece constante e não entra de novo em patrimônio nem em caixa livre.

Dívida inicial200+3×50=350; principal194+150=344, encargos6 já na abertura.
Compra acrescenta120; pagamento200 consome encargos6 antes de principal194,
deixando principal/dívida270. Caixa e dívida diminuem juntos no pagamento:
patrimônio inalterado. Não contar o pagamento como consumo novo.

Ação:3 unidades, custo0.60, avaliação TOTAL1.00 em09/10. Compra2 a10 com taxa1
leva quantidade5 e custo21.60; referência de avaliação1/3 mantém valor total
arredondado1.67. Preço de execução não reavalia toda posição para50.00.
Renda fixa500 MONETARY conserva quantidade/custo/aquisição/proveniência histórica
desconhecidos. Patrimônio conhecido não prova custo/rentabilidade conhecidos.

B/C têm owners independentes; B faz ações de uso diário pela UI; C prepara parte
das operações pelo browser/BFF e paga pela UI. Ambos têm os mesmos oito checkpoints
SQL combinados (cash/purchase/payment/final por owner), recalculados pelas linhas
de contas/cartão/investimentos/alocações. B-final e B-new-session são iguais.
O checkpoint posterior ao aporte de ação mas anterior à reserva está derivado das
operações; não há snapshot SQL dedicado entre essas duas ações no harness original.
Não declarar esse momento como observação SQL separada.

## Relatório e exportações

Receita realizada250.10. Consumo/encargos162.20=despesa40.20+taxa2+compra120.
Os6 de encargos da abertura não viram despesa nova do período ao pagar. Resultado
87.90=250.10−162.20. Caixa−13.10=250.10−40.20−2−200−21; não é resultado gerencial.
Previsão80 pendente não entra nesses realizados. Aquisição21 capitaliza custo e
não é despesa repetida. Parcelas40×3 detalham a única compra120, não três compras120.

API anual/SQL/colunas monetárias do XLSX conciliam nos escopos testados. Cobertura
PARTIAL é correta: posição-base09/10 não comprova fluxos anteriores do mês/ano.
Coluna C preserva subtotal exato, total completo indisponível, não0. Consultar2025
conserva seção atual de investimentos datada22/10, sem inventar fechamento2025.
ValuationDate do ativo09/10 e valuationAsOf da consulta22/10 têm sentidos distintos.
Recibo de aplicação congelado não muda com movimentos posteriores.

OOXML lido integralmente: quatro arquivos históricos C/F/H-A/H-B e três novos
C/H-A/H-B; hashes, células/tipos/estilos/XML em `*-audit.json`. O teste H verifica
presença do movimento próprio e ausência de nomes alheios nos dois arquivos;
montantes SQL A1010/B2280. F histórico registra baixas30/50, contas1330/1380,
sem alterar vencimento05/11 e com dívida350 constante. Não repetir F não transforma
essa evidência histórica em nova execução.

### Precisão temporal

Ambos C-october.xlsx: `xl/worksheets/sheet1.xml`, B9,
`<c r="B9" t="inlineStr"><is><t>12:34</t></is></c>`.
Style0, numFmtId0: texto literal, sem formato numérico que esconda segundos.
Banco C-final:12:34:56. O novo probe R3 compara explicitamente entrada, resposta,
GET de transações, SQL e download; arquivos em run-04-api-time.

CF032-04 corresponde à alternativa B: conversão para texto sem segundos durante
exportação. A truncagem ocorre no formatter HH:mm do exportador, não na persistência.
Saída canônica HH:mm:ss e conservação semântica justificam P3 conforme ACHADOS.
Nenhum arquivo foi alterado para esconder a falha. Não foi executado Excel nativo;
para distinguir valor armazenado de apresentação, OOXML e POI são suficientes.

## Falha/replay e isolamento

G:1 POST UI inicial retorna no servidor e grava pagamento200/transação de débito;
observador SQL confirma contas1100/dívida150 antes de abortar resposta. UI entra em
resultado desconhecido e desabilita confirmar; recuperação GET não cria intenção.
POST2 é replay idêntico, retorna mesmo recibo/operationId/bankTransactionId/recordedAt;
POST3 mantém chave e altera amount201, recebe409. Um pagamento e um débito após
reload; patrimônio1451, principal150/disponível850, reserva contas350/livre750.
Total de reservas550 inclui200 no investimento; não subtrair550 de caixa1100.

H: dois contextos/cookies distintos; A receita10 sobre1000, B despesa20 sobre2300.
Tentativas de alterar conta B, transferir para B, ler fatura/recibo B recebem404
para A; recibo próprio B retorna200. SQL observado B igual antes/depois das tentativas,
UI e arquivos sem nomes do outro owner, troca B→A confirmada. O snapshot não inclui
cadastro de cartões e não é um dump completo; a criação legítima do cartão B entre
snapshots não é ocultada como “nenhum dado do banco mudou”.
