# Oracles independentes — 01/10/2026

Base candidata5d0649a, funcional30211b8..805f588. Não alterar produto/migrações.
Os contratos RV24/DEC-10/CF-026 exigem:

- Despesa25 perdida após commit: conta975, um fato/recibo; replay não altera;
  nova intenção legítima25 deixa950 e dois recibos. BUY200 em posição10/custo1000:
  conta800/posição12; replay igual; nova intenção deixa600/posição14.
- GET404, outage e snapshot inválido não comprovam sucesso. Envelope e trava
  permanecem. Um objeto vazio não satisfaz o DTO de resultado financeiro.
- Resposta de POST incompatível com o resultado contratado mantém reconciliação,
  não autoriza emitir outra identidade. Testes de transporte são componentes,
  separados das provas de dinheiro no PostgreSQL.
- Unmount/troca de owner invalida callbacks da operação anterior, inclusive
  onReconcile, não somente onSuccess. Nenhuma resposta de A atualiza consumidor B.
- Storage indisponível antes de POST impede envio; falha de remoção mantém
  identidade original, permitindo recuperar novamente sem outra chave.
- Exclusão remove grafo do owner por transação real, preservando todas as linhas
  de outro owner. Compra deve sobreviver à exclusão da meta e desaparecer somente
  na exclusão integral autorizada. Transferências, baixas/estornos/realizações,
  avaliações/compensações/revisões e recibos fazem parte do inventário.
- Falha intermediária mantém snapshot/cache e zero emails; depois do commit,
  nova conexão confirma ausência do owner no momento em que o double é chamado.
- Escrita concorrente à exclusão deve comitar antes e ser removida, ou falhar
  inteira; não pode deixar saldo/fato/recibo órfão. Locks são observados via
  PostgreSQL/barreiras, sem sleep. Deadlock recuperável não é corrupção.

Não usar verde posterior para encerrar RVA-03/RJ-022-01/H24-01. Prontidão CF-027
depende de fronteira concreta, não do rótulo isolado das dependências.
