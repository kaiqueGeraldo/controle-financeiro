# Contrato de cancelamento local e mecanismo

CF034 aceite2 exige finalizar processos/banco; PROP-CF034-01/A.3 e DEC-CI-04 autorizam provas locais descartáveis. Nenhum desses documentos prometia que finally sobreviveria a kill irrecuperável ou que matar apenas o PID do runner encerraria toda a árvore. A leitura anterior à correção distinguiu essas condições; não se alterou DEC-CI-04 nem se dispensou o critério integral. A prova desta entrega cobre processos e porta sintéticos; descarte do daemon Docker em cancelamento ainda não foi certificado.

Procedimento local suportado, com o diretório de saída de uma execução nova:

```text
node .github/scripts/cancel.mjs <diretorio-de-saida>
```

control.json contém UUID novo, PID informativo, plataforma e início. O pedido carrega o UUID, sem encerrar um PID pesquisado. O runner observa o pedido a cada25ms e antes/depois de comandos/fases. Pedido aceito é monotônico/idempotente: fecha a pipe do supervisor ativo, impede novos gates, invalida recibos, remove elegibilidade de artifact/manifesto parcial, preserva brutos e grava result cancelled/exit130. Pedido antes/durante inicialização é observado antes de avançar. Após resultado terminal confirmado, o helper informa já terminado e não altera esse resultado. SIGINT/SIGTERM que de fato chegam ao handler usam o mesmo cancelamento; entrega real de Ctrl+C pelo host é categoria distinta abaixo.

No Windows, cada comando usa supervisor Windows PowerShell5.1/.NET Framework e APIs kernel32. Antes de iniciar filho, ele cria Job Object anônimo KILL_ON_JOB_CLOSE e atribui a si próprio; descendentes herdam a associação. O único handle fica no supervisor, não nos filhos. Falha de criação/atribuição reprova, sem fallback não supervisionado. Os argumentos atravessam JSON/base64 e quoting Windows, testados com espaços/aspas/barra final. Ambiente permanece o construído pelo runner; stdin do comando é fechado (gates são não interativos).

Runner mantém a escrita de uma pipe privada. Cancelamento fecha essa ponta; morte abrupta do runner também produz EOF. O supervisor sai130; fechamento do handle pelo kernel encerra os membros do Job. No término normal, propaga o exit do comando e fecha o Job, encerrando descendentes remanescentes. Não enumera nem mata globalmente node/java/Docker; não há dependência de PID reutilizável para cancelar. Não permite breakaway. Handles abertos pelos observadores de teste distinguem término real de simples ausência momentânea de PID. No Windows os membros encerrados por fechamento do Job podem ter exit0: a aprovação é bloqueada pelo estado/exit130 do runner e pela coordenação anterior ao timeout natural, não pelo exit isolado desses membros.

| Mecanismo | Evidência / limite |
|---|---|
| Pedido cooperativo UUID | Filho e descendente prontos, handles abertos, término real antes de20s, porta liberada; nenhum próximo gate; processo alheio preservado; repetição e inicialização testadas |
| Filho falha/termina normalmente | Exit23/17 preservados; relatório obrigatório ausente reprova; cancelamento após conclusão é no-op; descendente de comando encerrado observado por handle |
| Ctrl+C nativo | Handlers registrados; evento real de console/host não foi injetado nem certificado nesta entrega |
| Somente pai morto abruptamente | Probe independente original preservado: antes heartbeat >1,5s, sem result; depois filho não continua. Pai morto continua incapaz de escrever result final; diagnóstico é incompleto, nunca sucesso implícito |
| Árvore forçadamente encerrada | Job Object protege membros quando seu supervisor morre; não foi realizada contraprova específica de taskkill /T /F nesta entrega |
| Actions/Linux | Há grupo POSIX no adaptador, mas sinais/timeout/runner/permissões reais permanecem sem execução; a prova Windows não os certifica |
| Container/schema Docker externo | Não é processo membro do Job. Cleanup histórico normal/Testcontainers permanece sustentado; descarte após cancelamento não foi ensaiado com banco nesta tarefa sintética e continua exigência aberta |

Remover apenas KILL_ON_JOB_CLOSE, em cópia, deixa filho e descendente vivos (WaitForSingleObject=258 / STILL_ACTIVE=259), embora o runner registre cancelamento. Ambos chegam ao limite natural, distinguindo a falha do mecanismo de uma inspeção rápida de PID. Restauração exata do PS1 e controle corrigido encerram ambos antes do limite, sem natural marker. A cópia principal nunca recebe a mutação.

Trade-off: Job Object e pipe protegem a vida dos processos mesmo sem finally do pai e evitam corridas de identidade por PID; o custo é supervisor/compilação C# por comando (cerca de3s nestas fixtures Windows) e manutenção de interop nativo. Nenhuma dependência externa foi instalada. Garantia não alcança processos deliberadamente destacados fora do Job, serviços preexistentes ou recursos do daemon; não há limpeza ampla desses recursos. Critério integral permanece aberto, sem redefinir a promessa para fazê-lo passar.
