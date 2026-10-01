# Oracles independentes — 30/09/2026

Fontes: DEC-10, FIN-01/02/05/07, AC-FIN-003/005/010, AC-UI-005,
CONTRATO CF-024 e política de testes. Registrados antes dos novos probes.

- Conta1000: criar receita25 com chave duas vezes deixa1025, um fato e um
  recibo; duas chaves legítimas iguais deixam1050, dois fatos/recibos.
- Snapshot da criação permanece recuperável após excluir o fato; recuperação
  e replay não recriam o dinheiro nem a linha excluída.
- Posição10/custo1000: SELL2×100 deixa conta1200/posição8/custo800;
  DIVIDEND e INTEREST, bruto100/retenção10, deixam1090/posição10/custo1000,
  dois fatos vinculados e um recibo, mesmo após replay.
- Resgate monetário200 de renda fixa com posição10/valor1000/custo1000 deixa
  conta1200/posição8/custo800/valor800; replay não recalcula a quantidade.
- Alterar fonte, destino, tipo, data, descrição, hora, valor, taxa ou ativo
  na mesma intenção retorna409, preservando saldos/posição/recibo.
- Normalização: decimais numericamente iguais, isPaid omitido/null/true,
  time omitido/null e fee omitida/null/zero na criação devem coincidir.
- Primeiro comando retido e depois revertido enquanto segundo aguarda: GET
  pode retornar404 durante execução; depois somente segundo comita um efeito.
  PIDs diferentes e pg_blocking_pids comprovam espera, sem sleep.
- Falha real de serialização dentro de complete deve abortar toda a transação,
  sem fato/recibo/cache invalidado; retry da mesma chave em nova transação funciona.
- Correção de previsão entre2026/2027 e fontes distintas invalida ambos os
  anos somente no commit; rollback preserva tudo.
- Falha do callback após commit não desfaz saldo/recibo nem repete o comando.
- Exclusão com vínculos deve ser confrontada com sua promessa de limpeza;
  se falhar, verificar rollback/cache e registrar defeito herdado separadamente.
- Recibos herdados de baixa/estorno/realização e compensação não devem executar
  novamente dinheiro; snapshot imutável novo não será atribuído a eles sem prova.

Probes em cópia isolada; assertions de produto serão separadas de observações
de limitações/defeitos herdados. Não calculam expected com helpers de produção.

Complemento antes do probe de reservas: conta1000/reserva700, pagamento200
obtém a fonte antes do aporte200. Depois de ambos: conta800/reserva700,
posição10, dívida0, uma alocação de pagamento200 vinculada ao débito200;
aporte recusado por livre100, sem fato/recibo de investimento.
