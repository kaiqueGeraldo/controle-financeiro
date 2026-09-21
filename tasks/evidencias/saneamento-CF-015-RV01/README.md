# CF-015 — rodada dirigida R03/RV01 e R10

21/09/2026. Base `f550b9e240f32220291ac0a3819d035df679b2b3`.
CF-015 permanece **em_revisao**; este registro é do implementador e requer
confirmação independente. CF-016 não iniciada.

Referências preservadas: [revalidação](../revalidacao-CF-015/README.md),
[RV01](../revalidacao-CF-015/ACHADOS.md),
[saneamento anterior](../saneamento-CF-015/README.md).
Nenhum achado encerrado foi reaberto nesta rodada.

## R03/RV01 — causa e contrato

AC-UI-006/011 e CF-013 exigem separar confirmação do pagamento de atualização
confirmada. `useCards.refreshAll` aguardava o lote, mas absorvia sua rejeição
quando outra geração o substituía. O modal tinha um coordenador próprio ainda
válido: recebia uma Promise resolvida, apagava a pendência e fechava.

Cada chamada agora acompanha exclusivamente sua própria Promise e geração:

| Resultado | Contrato observável pelo chamador |
|---|---|
| Sucesso | Todas as leituras concluíram e a geração do lote continua atual; Promise resolve. |
| Falha | Lote atual com alguma leitura recusada: rejeita com o erro original. |
| Cancelamento/substituição | Geração invalidada por outra chamada, seleção, sessão ou desmontagem: rejeita `ReconciliationCancelledError`, conservando a causa quando disponível. Nunca resolve como sucesso. |

O modal diferencia a mensagem de cancelamento da falha de atualização e
conserva pagamento confirmado, marcador por usuário/fatura e bloqueio de novo
POST. O retry inicia outro lote somente de leituras. Não se adotou booleano
global, timeout ou inferência financeira a partir de saldo/fatura.

Decisão de contrato: uma atualização de fundo bem-sucedida **não transfere**
automaticamente seu resultado para a operação de pagamento anterior. O modal
mantém a pendência e oferece recuperação explícita. Isso custa uma releitura
adicional nesse caso, mas evita vincular o pagamento a uma Promise de seleção
ou sessão diferente e mantém a propagação de todas as falhas. Não é um recibo
durável de operação; CF-024 conserva seu escopo.

`allSettled` continua aguardando todas as fontes (cartões, fatura, contas e
consumidores financeiros montados); guards existentes impedem estado/cache
obsoletos. Custo O(n) no número de leituras do lote, comparação de geração O(1).
Nenhuma query, cálculo, lock ou regra backend foi alterada. Não há novo N+1.
As fontes podem terminar em instantes diferentes: não se promete snapshot
transacional global; apenas ausência de conclusão falsa do lote.

O chamador de notificação de nova compra em `cardsScreen` não observa Promises;
foi adaptado para consumir explicitamente a rejeição da atualização de fundo,
como os outros callbacks de retry/evento. Os erros de leitura continuam nos
respectivos consumidores. O caminho de pagamento continua retornando e
aguardando `refreshAll` integralmente; não absorve essa rejeição.

## Reprodução e testes

Antes de editar produto, o teste original do revisor falhou por `onClose`
chamado uma vez: [antes.log](antes.log). O mesmo arquivo permanece intacto e
passou depois: [depois-componentes.log](depois-componentes.log).

`cf015-reconciliation-lifecycle.test.tsx` controla Promises e entrega:

- primeira substituída e segunda falhando;
- primeira substituída e segunda concluída;
- sucesso e erro antigos entregues depois do resultado novo;
- recuperação posterior com um único POST e limpeza do marcador somente após sucesso;
- cancelamento por sessão/desmontagem mesmo com todas as leituras resolvidas;
- falha de lote atual propagada como o erro original.

O teste anterior `async-state.test.tsx` conserva todas as assertions de seleção,
fatura e abort. Seu `await refreshPromise` agora exige a rejeição tipada de A
abandonada. É correção de contrato explicitamente pedida nesta rodada: ignorar
a escrita antiga permanece obrigatório, mas seu chamador não recebe sucesso.
Nenhum expected financeiro foi relaxado, nenhum teste do revisor foi alterado.

Mocks dos componentes são fronteiras de serviços; provam coordenação/estado,
não persistência PostgreSQL. A jornada integrada usa pagamentos reais em banco
descartável, incluindo 503 após confirmação e resposta perdida, sem fabricar
sucesso financeiro. Foi acrescentado também modo `overlap` ao E2E: retém a
primeira leitura após POST real, dispara `refreshCards`, recusa a segunda,
libera a primeira e recupera por GET. Os oráculos existentes de conta 900,
dívida 0, fatura/plano PAID, um débito e reload também se aplicam a esse modo.

## Preservação

Staging inicial vazio; única alteração preexistente: README da raiz, SHA-256
`6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA`.
Esse arquivo não integra os commits desta rodada. Relatórios anteriores não
foram sobrescritos. Não houve push, deploy, reescrita de histórico ou banco real.

Zoom: [pendência, tentativa e roteiro manual](ZOOM.md).
Resultados e intervalo Git: [EXECUCOES.md](EXECUCOES.md).

Resultado final: 41 componentes, dois testes Java de proteção de pagamento,
nove E2E e oráculos Java/SQL/Excel aprovados; TypeScript e build aprovados.
R03/RV01 corrigido e verificado pelo executor, aguardando confirmação
independente. R10 permanece aberto para comprovação nativa de 200%; o marco
não foi aprovado por esta rodada.
