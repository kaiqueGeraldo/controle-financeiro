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

## P04 — relógios do harness (13/09)

Reprodução causal: a configuração E2E antiga emitiu expiração `2027-02-01T05:00Z`
quando o teste exigia emissão no relógio de autenticação posterior, com vencimento
`2027-02-03T05:00Z`: `P04-red.log`, uma falha por valor, sem erro de ambiente.
O middleware produtivo compara Date.now; um token com a primeira expiração já é
recusado no instante de autenticação `2027-02-02T05:00Z`.

Correção exclusivamente em testes: negócio/browser permanecem em 31/01; autenticação
Spring e processo/worker Next compartilham 02/02, definido como negócio + 48 h.
Não se troca o ano por outro futuro nem se depende da data real do host. Preload
explícito somente no comando integrado, com opt-in/loopback e bloqueio em produção.
Clock injetado nas credenciais somente pela TestConfiguration importada pelo E2E.
Assinatura, TTL 24 h, expiração no limite e recuperação 10 min continuam ativos.
Trade-off: congelar Date no processo Next de teste também afeta timestamps internos;
timers continuam reais. O produto/build não carrega esse mecanismo.

Maven `-Dtest=HarnessCredentialClockTest,CredentialExpiryClockTest test`: **3/3**;
Vitest `harness-credential-clock middleware-expiry-review`: **7/7**; zero skips.
Cobrem token válido, fronteira exata, instante após expiração antiga e recusa de
preload fora do harness. Logs `P04-green.log` e `P04-frontend-green.log`.
Primeira execução do teste novo frontend falhou por resolução file URL no jsdom
(`P04-frontend-path-error.log`); corrigida para caminho do workspace. Essa falha
**não** foi contada como detecção de P04. Integração real ainda será registrada.

Primeira tentativa integrada não iniciou Next: preload duplicado em CLI e
NODE_OPTIONS fez o worker concatenar caminhos. Removida duplicação, mantendo
NODE_OPTIONS exclusivo do harness; artefato ignorado `saneamento-integration-P04-preload-error.log`.
Tentativa seguinte (`cf007-defa8062`): **2 fluxos financeiros passaram nos dois fusos**,
**2 percursos P03 falharam** no detalhe sem ano (`29/01`, exigido `29/01/2027`).
PUT e retorno à tela editada ocorreram, mas não se conta o percurso todo como verde.
Detalhe corrigido para formato civil completo da SPEC-002 e adicionada regressão
de componente; assertion E2E preservada. O último GET/SQL do P03 aguarda nova execução.
Esse ajuste é registrado com P04 porque apareceu na validação conjunta; não é
alteração da regra de competência nem evidência de revisão independente.
