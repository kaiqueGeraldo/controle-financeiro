# Correção demonstrada de fixture nova, antes de alterá-la

components.log:148 passam/1 falha, somente caso complementar novo de arredondamento.
A entrada literal333333333333.33166 não representa esse decimal em JavaScript:
Number.toString e JSON.stringify devolvem333333333333.33167, igual à entrada
do caso negativo. Portanto3×preço serializado é999999999999.99501 e excede o
teto depois do HALF_UP; o produto rejeitou corretamente a fixture supostamente positiva.

Manter o propósito e o expected999999999999.99: trocar somente a entrada positiva
por333333333333.3316, representável na serialização decimal. Produto exato
999999999999.9948, que arredonda para o teto. Negativo permanece33167 no final.
Não alterar nenhum dos25 testes independentes, nem assertion/expected deles.
Sem mudança de produto para acomodar Number, sem tolerância ou retry.

Conferência adicional de formato antes da entrega: DecimalStringDeserializer do
contrato de amount exige decimal canônico, sem zeros à esquerda. A fixture nova
que tratava esse formato como positivo foi substituída por inteiro canônico
válido; o formato com zeros permanece agora como caso negativo separado, junto
de newline. O parser foi alinhado ao formato já existente; isso não muda HTTP.
Os25 probes independentes continuam byte a byte intactos. Integração anterior
desta rodada usa BUY sem amount, não depende dessa restrição de formato.
