# Rodada direcionada CF-016–CF-021

Base: e927aea. Staging inicial vazio; apenas README raiz alheio modificado.

RVA-01/02: as duas provas independentes foram repetidas antes da correção e falharam por assertion (0,34 versus 0,33; custo residual null versus zero). Log rva01-rva02-antes.log preservado.

RVA-03: rede histórica após POST200 terminou nove leituras200 em menos de meio segundo; modal permaneceu carregando. Uma repetição aprovada não isolou causa. Investigar término das promises e cancelamento das lanes, sem mudar timeout ou expected.

A primeira tentativa local de executar Maven não iniciou por caminho de log ausente; a tentativa seguinte executou os dois vermelhos causais. Nenhum desses erros de ambiente é contado como detector financeiro.

Sem push/deploy/banco real; marco aguardando revisão independente.
