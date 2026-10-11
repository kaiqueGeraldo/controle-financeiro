# RVA-03 — investigação separada, ainda inconclusiva

A ocorrência original pós-commit e a cópia que parou antes do envio não são o mesmo sintoma. Foram lidos o parecer de fechamento, os logs passivos anteriores e a cadeia R03/RV01. Corrigir RF15-04 não encerra RVA-03.

Foi executada **uma** sequência20→120, com os dois testes originais importados intactos em rf15-rva.integrated.spec.ts. Nenhum retry, aumento de timeout, reenvio de pagamento ou mudança de identidade após resultado desconhecido. Cada cenário tem seu próprio usuário/fixture desde o início, como no original. E-mail é fake; PostgreSQL Testcontainers descartável, Clock2027-01-15T12:00:00.123456Z em America/Sao_Paulo; UI fixa15jan. Namespace `closure-62b8079c`.

Observação adicional passiva: MutationObserver registra mudanças de texto/disabled/spinners dos diálogos; requests/responses/cliques continuam pelo probe original; log Spring e SELECTs no fim correlacionam o cardId/usuário e a transação bancária. `performance.now` da UI e Date.now do runner são relógios distintos: não subtrair diretamente os dois. A correlação é por entidade/ordem/request; não se alegam spans distribuídos inexistentes.

| Etapa | 20 | 120 |
|---|---|---|
| Clique Confirmar Pagamento | observado, performance13260 | observado, performance9242 |
| Envio | 1 POST/pay | 1 POST/pay |
| Resposta | HTTP200, 189ms no relógio do runner | HTTP200, 71ms no relógio do runner |
| Commit | pagamento20, débito vinculado, saldo980 no PG | pagamento120, débito vinculado, saldo880 no PG |
| Releitura/UI | diálogo fecha, saldo devido100 | diálogo fecha, saldo devido0; statusOPEN por adiantamento |
| Etapas restantes originais | exclusão/reembolso/reload e segunda recusa400 passaram | exclusão/reembolso/reload e segunda recusa400 passaram |

Arquivos: [resumo correlacionado](rva-summary.json), [log backend](rva-passive.log), [log browser](browser/rva-passive/playwright.log), [persistência](browser/rva-passive/persisted.txt), D-passive-20/120.json, rva-pending-20/120.json e D-after-payment-20/120.json no mesmo diretório. Dois testes passaram. SQL mostra um card_payment por caso e dois fatos bancários, sem duplicação.

Não houve clique bloqueado, falha de rede ou reconciliação residual nesta rodada. Isso não elimina a ocorrência original nem demonstra sua causa. R03/RV01 conserva o aceite anterior, sem inferir equivalência causal.

Próximo experimento, somente se o sintoma reaparecer: capturar passivamente identidade do diálogo e ciclo de montagem/cleanup, início/conclusão de cada refresh e recibo da mesma operação, correlacionados ao request original. Distinguir interceptação antes do envio, falha HTTP, commit com releitura pendente e desmontagem. Não criar novo pagamento para “resolver” a observação. Não foram iniciadas outras rodadas.
