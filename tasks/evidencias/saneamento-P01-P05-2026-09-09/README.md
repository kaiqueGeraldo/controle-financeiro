# Saneamento P01–P05 — 09/09/2026

Execução retomada em 13/09/2026 após interrupção de limite de uso.

Implementação e autotestes após a revisão independente CF-001–009. Este trabalho
não é revisão independente das próprias alterações. Base: `8dad1c1cef8e963ffe9003a9f3b788e85fd9b4c9`.
Os sete commits anteriores e o parecer histórico permanecem preservados.
README geral preexistente fora dos commits; hash em `readme-preservado.json`.

## P05 — calendário dos hábitos

Reproduzido **antes da edição** pelo `pending-probes.mjs` original em cópia isolada:
exit 1, AssertionError, esperado `2026-09-07`, recebido `2026-09-08` no payload.
[Log causal](P05-red-reproduzido.log), [resultado](P05-red-reproduzido.json).
O probe original em `revisao-CF-001-CF-009/probes` permanece preservado. O driver
agora prefere a regressão promovida para a suíte regular quando disponível.

Critério: SPEC-002 DEC-01. O provider existente mantém hojeNavegador e hojeProduto
separados, com um timer compartilhado, foco/visibilidade e estado inicial neutro.
Lista, detalhe, destaque, janela de 28 dias e payload usam o dia de São Paulo.
A busca do próximo limite IANA não pressupõe dia de 24 h (~27 comparações por
renovação global, sem timer por item). Semana segunda–domingo existente mantida;
nenhum aceite de recorrência/streak/perdão CF-022 foi acrescentado.

Validação: `node node_modules/vitest/vitest.mjs run --config tests/component/vitest.config.mts habit-product-day`
no frontend em `TZ=America/Sao_Paulo`, `UTC`, `Pacific/Kiritimati`: **5/5 em cada,
zero skips**, logs `P05-green-*.log`. `node node_modules/typescript/bin/tsc --noEmit`: exit 0.
Antes de Brasília virar o dia, em UTC+14, lista/detalhe/payload apontam 07/09;
após 1000 ms passam juntos a 08/09. Logs antigos permanecem no dia original.
Foco/visibilidade e limite histórico de 23 h também verificados.

Limite: teste de componente com relógio controlado; o fluxo integrado será
revalidado ao concluir os demais saneamentos. Commits e resultados finais serão
registrados após os respectivos gates, sem atribuir ao intermediário testes futuros.

## P03 — edição de planejamento (13/09)

Vermelho causal em `PlanningEditIntegrationTest#editPersistsAndReloadKeepsStatusOrderAndCompetence`:
esperado 200, recebido 500, `HttpRequestMethodNotSupportedException: PUT is not supported`.
Serviço/ORM/PostgreSQL e autenticação reais; mocks somente e-mail/cotação externos.
No consumidor, o teste recebeu `amount: "35.50"` em vez do número `35.5`.
Logs `P03-red.log` e `P03-frontend-red.log` (o filtro direcionado deixou dois testes
de componente não selecionados; não há skip no código nem no gate completo).

Contrato no `src/services/HTTP-CONTRACT.md`: edição parcial dos quatro campos do
formulário; categoria null remove, outros null rejeitam; competência original
preservada, sem pagamento nem movimento implícito. Campos administrados rejeitados.
Item/categoria inacessíveis retornam 404; fatura rejeita edição. O único vínculo
de gestão existente no modelo PlanItem é card; não foi inferido outro por texto.
Validação precede mutação e a transação faz rollback em falha. Consulta com lock
serializa edições deste endpoint (custo constante por item, possível contenção no
plano associado); não resolve concorrência de todos os demais writers da CF-024.

Autotestes após correção: Maven `-Dtest=PlanningEditIntegrationTest test` com JDK 21,
`-Duser.timezone=UTC`, cache Maven local e PostgreSQL descartável: **5/5, zero skips**.
Vitest `planning-edit`: **3/3, zero skips**, consumidor real com mock somente HTTP
nessa camada de componente. Logs `P03-green.log`/`P03-frontend-green.log`.
Percurso integrado adicionado com edição pela UI, PUT real, reload, GET e assert SQL;
a execução dele fica para a integração final após saneamento do relógio P04.
