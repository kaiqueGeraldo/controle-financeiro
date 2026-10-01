# CF-024 — contrato e oracles antes da implementação

Retomada local sobre `9fa4fae`, autorizada pelo parecer CF-022/023 e pelo usuário.
O relatório/preflight anteriores conservam o bloqueio histórico. Fontes:
AC-FIN-003/005/010, AC-UI-005, SPEC-004 FIN-05/07 e ADR-004/005.

DEC-10: uma intenção identificada tem no máximo um efeito econômico. Pagamento
e adiantamento conservam o protocolo/recibo da CF-019. Para criação de transação
(incluindo transferência) e operação de investimento, `operationId` opcional
identifica a intenção. Mesmo ID/conteúdo canônico/owner retorna o resultado
original, inclusive após perda de resposta; conteúdo diferente retorna409 sem
efeito adicional. Recuperação autenticada por ID não depende de sessionStorage.
Sem chave continua contrato legado; não oferece retry automático seguro.
Perder também o ID exige reconciliação pelo histórico, nunca enviar outra chave
automaticamente. Operações distintas iguais usam IDs distintos.

Recibos de criação/investimento compartilham namespace de intenção; pagamentos
conservam namespace próprio. Owner alheio não lê recibo (404); reuso de chave
alheia em escrita é conflito genérico409 sem dados do outro owner. Não se
introduz retenção/expiração de recibos. Resultado original é snapshot imutável,
sem recalcular valor/custo com a posição atual. Nenhum backfill legado.

Locks por intenção precedem fontes; transferências adquirem contas na ordem do
banco; investimentos usam conta→investimento. Contas distintas devem continuar
independentes. Contenção de linha/timeout/deadlock deve cancelar a transação e
retornar409 para releitura/recuperação com a mesma intenção; sem retry interno
cego. Um timeout não prova que outra requisição não comitou: reler o recibo.

Cache financeiro de leitura não está ativo. Não ativar Cacheable para comprovar
uma correção. Exercitar o CacheManager real com entradas sintéticas e eventos
dos writers: antes do commit conservar entrada; rollback conservar entrada;
commit invalidar apenas owner/ano; eventos fora de transação não invalidam.
Notas anuais seguem a mesma regra. Não afirmar prevenção de repopulação por
leitor antigo ou invalidação entre instâncias de um cache futuro.
Probe adicional encontrou CacheEvict direto na exclusão de usuário. Conservar
sua limpeza global anterior, executando somente após commit; rollback deve
preservar usuário/recibos/cache. E-mail é double externo, sem envio real; não
ampliar este probe para certificar a exclusão completa dos domínios financeiros.

| Cenário independente | Estado inicial | Estado após ambas / expected literal |
|---|---|---|
| Mesmo pagamento/chave, duas conexões | conta1000/dívida200 | conta800/dívida0/um débito/mesmo recibo |
| Mesmo adiantamento/chave | conta1000/dívida200, adiantar50 | conta950/dívida150/um débito/mesmo recibo |
| Dois pagamentos/cartões | conta1000, duas dívidas200 | conta600/duas dívidas0/dois débitos |
| Pagamento200+transferência300 | conta1000/destino0 | conta500/destino300/dívida0 |
| Pagamento200+aporte200 | conta1000/posição10/custo1000 | conta600/posição12/custo1200/dívida0 |
| Pagamento200+venda200 | conta1000/posição10/custo1000 | conta1000/posição8/custo800/dívida0 |
| Transferência300+aporte200 | conta1000/destino0/posição10 | conta500/destino300/posição12 |
| Transferência300+venda200 | conta1000/destino0/posição10 | conta900/destino300/posição8 |
| Aporte200+venda200 | conta1000/posição10/custo1000 | conta1000/posição10/custo1000 |
| Duas vendas7 de posição10 | conta1000/posição10 | uma aceita/uma400; conta1700/posição3/custo300 |
| Duas transferências700 | fonte1000/destinos0 | uma aceita/uma400; fonte300/soma destinos700 |
| Mesmo aporte/chave | conta1000/posição10 | conta800/posição12/uma operação/resultado original recuperável |
| Mesma transferência/chave | conta1000/destino0 | conta700/destino300/um par de lançamentos |
| Falha após escrever/publish | snapshot antes | todas as tabelas/recibos/saldos iguais ao antes; cache preservado |
| Deadlock imposto por writer externo | duas contas1000; locks invertidos/barreira | uma200/uma409; fonte vencedora700/outra1300/um recibo/duas pernas |

Sem fees nesses exemplos para isolar concorrência; centavos/taxas já têm
contratos/testes financeiros que serão reexecutados como consumidores.
Barreiras observam locks e pg_blocking_pids com conexões/PIDs distintos;
assertions SQL executadas após ambas terminarem. Mutações são isoladas, nunca
no runtime compartilhado. Logs vermelhos causais e falhas de harness separados.
