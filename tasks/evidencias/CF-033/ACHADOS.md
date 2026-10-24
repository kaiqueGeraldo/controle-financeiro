# Achados e saneamento delimitado

Base `bfb6c61`. Revisão iniciada em23/10 e concluída em24/10/2026.
Nenhuma correção de produto nesta revisão. CF-032 conserva sua conclusão local.

## CF033-01 — P2 — contrato de progresso entre contas não acompanha o guard por owner

**Confirmado:** uma entrada na conta B do mesmo usuário aguarda o BUY na conta A,
mesmo sem disputa de conta/ativo. **Classificação:** incompatibilidade entre
garantia histórica e comportamento deliberadamente serializado; não perda de
dinheiro, quebra de ownership ou nova alegação de defeito na certificação CF032.

**Localização:** `InvestmentService.java:134` toma snapshot exclusivo para BUY;
`TransactionService.java:95` toma writer compartilhado;
`FinancialInventoryGuard.java:19`/`:22` usam a mesma chave por owner.
O teste histórico `Cf024ConcurrencyCacheIntegrationTest.java:161` exige que a
entrada independente termine antes de liberar a transação de BUY.

**Norma e critério:** [DEC-10/CF024, §locks](../CF-024/CONTRATO.md) exige
“Contas distintas devem continuar independentes”. CF033 trabalho1/C1 confrontam
contrato, código e testes; AC-FIN-010 inclui os limites da concorrência.
O [parecer CF032](../revalidacao-CF-032/README.md) e seu
[inventário](../revalidacao-CF-032/INVENTARIO.md) reconhecem maior serialização
por usuário, necessária à estabilidade do token completo. Essa ressalva técnica
não foi refletida na regra irrestrita DEC-10 nem no teste histórico. Não escolhemos
silenciosamente qual contrato prevalece, nem alteramos a assertion antiga.

**Reprodução original:** `integrated-controls`, seleção74:73 aprovados/1 erro
TimeoutException em `unrelatedAccountCanCommitWhileTheFirstSourceIsHeld`.
O timeout dessa rodada isoladamente não bastava para atribuir causa.

**Prova causal nova:** `Cf033ProgressIndependenceProbeTest`, em
`progress-investigation`. BUY real escreve na transação aberta; barreira segura
seu commit. Outra conexão inicia INCOME25 numa segunda conta do mesmo owner;
terceiro owner executa INCOME42,17. A consulta independente mostra:

- PID62 mantém ExclusiveLock; PID63 aguarda ShareLock, ambos na mesma chave advisory.
- `pg_blocking_pids(63)={62}`, `wait_event_type=Lock`, `wait_event=advisory`.
- Outro owner comita42,17 enquanto o primeiro continua retido.
- Liberando o commit, fonte1000→800 e segunda conta0→25, sem perda/duplicação.
- O probe termina com **1 assertion falha, zero erros/skips**, pois esperava
  `sameOwnerBlocked=false` e observou true. Não é novo timeout ou falha ambiental.

[Locks e saldos](progress-investigation/progress-locks.json) ·
[Assertion e localização](progress-investigation/reports/com.controlefinanceiro.api.domain.onboarding.Cf033ProgressIndependenceProbeTest.txt).
O [observador final](progress-observer-final/progress-locks.json), corrigido para
aceitar também conclusão imediata correta, confirma a mesma causa e falha na
assertion normativa, com1 falha/zero erros. Fonte final do probe:linha82.
Não se mediu latência de produção nem se reproduziu indisponibilidade geral.

**Impacto demonstrado:** a garantia de progresso independente entre fontes do
mesmo owner deixa de valer durante operações que exigem snapshot exclusivo.
Espera/conflito é possível; o limite de5s é configuração, não duração medida em
produção. Dados/atomicidade nos controles examinados continuam corretos. P2 pela
incompatibilidade concreta de garantia e teste; não há evidência para P0/P1.

**Condição objetiva de encerramento:** decisão explícita e revisada reconciliando
DEC-10, teste histórico e alcance do guard. Alternativas delimitadas:

1. Ratificar a exceção de serialização para BUY/reserva/onboarding por owner,
   preservando token/capacidade e documentando que independência vale fora dessas
   janelas. Só então atualizar o teste de progresso, mantendo esta prova original
   e controles de commit/rollback/outro owner. Benefício: conserva garantias já
   provadas; custo: capacidade concorrente menor por usuário.
2. Preservar a exigência irrestrita e redesenhar coordenação/tokens por fonte com
   prova de todas as incidências legadas e alterações de inventário. Benefício:
   maior paralelismo; custo/risco: invalidação global, fontes novas e confirmações
   podem escapar do snapshot. Retirar só o guard não é saneamento aceitável.

Até essa decisão, o teste vermelho e a ressalva de aceite ficam visíveis.
Próximo trabalho restrito a CF033-01; não reabre integralmente CF024/032 e não
autoriza CF034. Não foi executada nenhuma das alternativas.

## Limitações sem defeito novo confirmado

- Zoom nativo200% CF010/015: prova faltante; não validado por viewport, DPR ou CSS.
- Adoção real CF017/P01/P02: banco remoto/proveniência/restore ainda têm gates.
- Produção: sem SLA, carga, cauda de latência, heap, garantia universal de corrida
  ou deadlock. Serialização conhecida não é benchmark de indisponibilidade.
- Ocorrências históricas inconclusivas permanecem nos pareceres próprios; não
  atribuímos este bloqueio causal a seus timeouts sem evidência.
- Não houve nova auditoria visual integral, expiração de sessão em todos os
  consumidores, teste físico de perda TCP nem execução de pipeline CF034.

Defeitos confirmados nesta revisão: P0=0, P1=0, P2=1, P3=0. Falhas de fixtures
novas estão em EXECUCOES.md, não são achados do produto.
