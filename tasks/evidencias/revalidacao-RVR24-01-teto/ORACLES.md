# Oráculos independentes antes dos probes — 04/10/2026

FIN-06: dinheiro positivo com até12 inteiros/2 casas, máximo inclusivo999999999999.99; próximo centavo1000000000000.00 rejeitado. Quantidade/preço informado até12 inteiros/8 casas, máximo999999999999.99999999. Produto exato arredonda HALF_UP uma vez a centavos e só então aplica taxa e compara teto. Dinheiro informado não é arredondado para caber. BUY inclui taxa na aquisição; demais modalidades líquido=bruto−taxa, inclusive zero. Custo/resultado são dinheiro do snapshot; não são patrimônio agregado nem valor atual.

NG-01: SELL amount canônico é autoritativo, não recomposto pela quantidade/preço derivados; preço derivado pode ser zero ou exceder teto de preço informado. Quantity máxima normativa continua válida. Uma posição com quantity999999999999.99999999, custo/avaliação1.00 e resgate integral amount1.00 é válida: custo1, resultado0, quantidade remanescente0, crédito1. A resposta deve poder confirmar e ser recuperada. Se o JSON bruto numérico de quantity virar1e12 antes do BigInt, a rejeição seria falso negativo, não prova de operação fora da faixa.

Incompatibilidade de quantidade: comando999999999999.0001, preço0.00000001, bruto10000; resposta quantity999999999999.00010001 é outro valor, embora também dentro da escala/limite. Esperado: não confirmar identidade/payload original por essa resposta. Será testada desserialização real de texto bruto, sem criar o literal já convertido em JS.

Controle monetário: centavos no domínio de12 inteiros distinguem vizinhos; testar lexemas brutos próximos do teto, quantidade×preço e amount string sem epsilon. Escala extra (ex. total999999999999.99001) está fora do domínio e não será usada isoladamente para reprovar precisão do dinheiro válido.

Provas originais: preservar os25 casos do arquivo anterior (quatro vermelhos+21 controles), SHA7b293c5a328231d950b456e95a847273e66439b22588f55026f8d1d5608bd255. Contraprova troca apenas creationResult.ts na cópia TEMP por1e9e932; restaurar bytes atuais. Integração principal mantém BUY200 real, adultera resposta/recibo para1e12 no harness, exige SQL800/uma operação/um recibo/um POST.
