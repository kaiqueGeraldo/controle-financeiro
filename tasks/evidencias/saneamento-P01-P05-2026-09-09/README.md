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

## P01/P02 — contrato, candidato de armazenamento e leitura segura (13/09)

[Inventário e decisão anteriores ao código](P01-P02-inventario.md). Vermelho causal:
histórico legado retornava `2026-09-07` como civil sem prova; criação não tinha
recordedAt; extrato mostrava 23:30 derivado de createdAt e detalhe preenchia hora
artificial. [Backend](P01-P02-red.log), [frontend](P02-frontend-red.log).
Tokens sintéticos de falhas MockMvc foram redigidos; valores temporais preservados.

O candidato mantém colunas/alias antigos e acrescenta metadados nullable, sem
backfill. Writers de transação, compra/pagamento de cartão, conta, metas e efeito
bancário de investimento capturam auditoria real uma vez, independente do dia da
operação. Hora ausente é null/NOT_PROVIDED; 00:00 explícito é USER_INPUT. Investimento
manual armazena civil/USER_INPUT; ajuste automático usa dia de produto e origem
PRODUCT_CALENDAR. Origem histórica null significa UNKNOWN, independentemente de
tipo/descrição/meia-noite/fuso do servidor. GoalHistory não recebeu esse conversor.

PUT distingue hora omitida/null; date null é erro; todos os requests financeiros
afetados rejeitam metadados exclusivos da resposta com identificação do campo.
Edição preserva bruto e recordedAt (protegido pelo ORM, sem setter). Linhas antigas
continuam sem auditoria. Na resposta, createdAt permanece explicitamente misto.
Instante conhecido exige offset no adaptador; leitura antiga não é promovida a
auditoria. Detalhes conservam bruto/Fuso desconhecido; listagem e Excel usam hora
informada ou —; histórico sem civil comprovada tem Data indisponível acessível.
Formulários permitem limpar hora sem enviar string vazia. Cancelar edição restaura
o valor persistido. A ordenação paginada/Excel do extrato usa civil, hora conhecida
e ID; cliente usa a mesma regra, sem epoch artificial. Não basta ordenar uma página.

Achado adicional durante a regressão de cartão: PATCH persistia e falhava 500 ao
serializar entidade fora da sessão. [Vermelho](P02-card-serialization-red.log).
Resposta substituída por CardTransactionDTO dentro do serviço transacional;
descrição/categoria continuam os únicos campos editáveis, metadados preservados.
No primeiro teste do guard de auditoria, 400 veio com `_request`; corrigido para
campo específico via exceção tipada. Nenhuma assertion foi removida.

Validação direcionada: **9 testes backend, zero falhas/erros/skips**, API e banco
reais. Inclui criação/edição/reload, origem conhecida/desconhecida, meia-noite/hora
ausente, rejeição de auditoria, cartão, paginação de tamanho 1, Excel e upgrade
aditivo em schema privado com rollback por savepoint. A versão reforçada avança
Clock de 03:10 para 03:20 entre criação/edição e conserva auditoria 03:10; passou
na execução combinada com a primeira tentativa E2E. Frontend: **9/9 nos três
fusos**; normalização, desconhecimento, segundos, payload de edição e ordenação.
Após ajuste da apresentação compacta, **13/13** incluindo a suíte de apresentação.

Fixtures existentes de apresentação/PagedModel passaram a declarar metadados
canônicos explícitos; expected civil e assertions de igualdade foram preservados.
O teste antigo de prazo local executado indevidamente em UTC+14 falhou por usar
oracle de São Paulo; isso não foi contado como defeito P01/P02. Sua suíte regular
permanece em São Paulo; os testes P01/P02 têm matriz própria. O tipo do parâmetro
do teste de preload P04 foi explicitado para passar tsc, sem alterar cenários.

Limites e trade-offs: a base temporal compartilhada elimina duplicação entre
entidades, mas exige adoção conjunta de armazenamento e writers. DTO evita carregar
grafo JPA; consultas de lista/export mantêm fetch join, sem novo N+1 por linha.
Ordenação pode exigir O(N log N) sem índice adequado; paginação por offset e
exportação durante escritas concorrentes continuam na CF-024. O lock de P03
serializa seu endpoint, não todo o domínio. Não houve benchmark nem carga remota.

**P01/P02 continuam abertos na adoção do banco existente/proveniência.**
[Tarefa derivada CF-017](../../03-integridade/CF-017-P01-P02-adocao-temporal.md)
lista colunas, rollout, inventário, migrador, backup/restore, reversão e índices.
O SQL em test/resources é candidato sintético, não migração produtiva nem baseline
completo. CF-017 permanece proposta. Backend candidato não deve ser publicado
antes das colunas; writers de versões antigas/novas não podem coexistir sem
coordenação. Nada foi alterado no banco real e nenhuma auditoria histórica criada.

## Validação conjunta — registro progressivo

- Backend `mvnw.cmd --batch-mode -Duser.timezone=UTC -Dmaven.repo.local=... verify`
  com JDK 21: **97/97, zero skips, BUILD SUCCESS**; [extrato](backend-verify-final.log).
  Runtime final; depois foi reforçado somente o teste de imutabilidade do Clock.
- Frontend Vitest completo em São Paulo: **80/80**; [extrato](frontend-component-final.log).
  Depois, apresentação compacta corrigida com gate direcionado **13/13**
  ([extrato](frontend-detail-final.log)); nenhum outro runtime foi alterado.
- `node scripts/test.mjs`: **18/18** em três fusos; [extrato](frontend-unit-final.log).
- ESLint: **exit 1, 42 erros e 29 avisos**; [inventário](lint-final.json).
  Regras não foram desativadas. Esse gate permanece aberto; não há aprovação total.
- Primeira integração após P01/P02, `cf007-be499078`: P03 passou nos dois browsers;
  fluxo financeiro falhou porque detalhe exibia 23:30:00 em vez do compacto 23:30.
  [Extrato](integration-attempt-1.log). Formato compacto corrigido preservando a
  assertion antiga e segundos não zero; nova execução registrada abaixo ao terminar.

## Fechamento desta execução — 13/09/2026

Integração final `cf007-e94d07fe`: **4/4 fluxos Playwright** e **1/1 teste Java**,
zero skips, BUILD SUCCESS. Navegador/BFF/Spring/PostgreSQL descartável reais,
São Paulo e Kiritimati; mocks somente integrações externas de e-mail/cotação.
P03: edição UI, PUT, reload, GET e SQL concluídos. Fluxos financeiros mantêm
as assertions civis anteriores e acrescentam hora/origem/auditoria/bruto em HTTP
e SQL; exportações XLSX também verificadas. [Extrato](integration-final.log).

`tsc --noEmit`: **exit 0** ([log](frontend-typecheck-final.log)); `next build`:
**exit 0**, incluindo TypeScript e geração de páginas ([log](frontend-build-final.log)).
Aviso de convenção middleware→proxy permanece, sem alteração dessa infraestrutura.
Smoke regular: **6/6** em 360×800, 768×1024, 1440×900, com servidor encerrado e porta
liberada ([log](frontend-smoke-final.log)). Esse smoke cobre autenticação/relógio;
não é prova de todos os fluxos financeiros em mobile. Os fluxos integrados completos
foram desktop nos dois fusos. Não houve benchmark, teste de carga, banco remoto,
migração produtiva, backfill, validação de backup real ou certificação de outros
consumidores externos. Não se desabilitou regra, TTL, assertion nem teste para passar.

### Situação individual

| Pendência | Resultado desta execução | Aceite restante |
|---|---|---|
| P01 | Origem explícita para novas datas; legado desconhecido preservado e UI neutra; autotestes verdes | Aberta: inventário/proveniência real e adoção CF-017 |
| P02 | Hora opcional separada de auditoria; criação/edição/reload, bruto e proteção de request verificados | Aberta: migração/rollout do armazenamento no banco existente |
| P03 | Contrato PUT implementado, validação/rollback/persistência e percurso real verdes | Revisão independente da correção |
| P04 | Relógios separados apenas no harness; token válido/expirado e integração após expiração antiga verdes | Revisão independente do mecanismo de teste |
| P05 | Dia de produto coerente na lista/detalhe/payload/janela; virada/foco/visibilidade verdes | Revisão independente; CF-022 não foi redefinida |

CF-005/006/007/008 permanecem **em_revisao**. O lint continua vermelho (42 erros,
29 avisos). **O bloco CF-001–009 não está integralmente aprovado.** Isso é entrega
de implementação e autotestes para revisão independente, não autoaprovação.

### Commits e preservação

- `9a380ae` — P05, calendário de produto e regressão promovida, CF-005/007.
- `9bdb98b` — P03, contrato de edição de planejamento e testes, CF-008/007.
- `171a5c3` — P04, relógio do harness; ajuste do detalhe P03, CF-007.
- `ac87873` — candidato P01/P02, armazenamento/DTO/adaptadores/regressões e derivada
  CF-017; inclui correção de tipagem do teste P04 sem mudar cenários.
- O commit documental de fechamento contém este registro e o manifest; seu hash
  consta no git log e na entrega, evitando referência circular no próprio commit.

[Manifest do código validado](codigo-validado.json): HEAD de runtime, árvores Git,
blobs alterados, comandos/resultados e sete commits originais preservados como
ancestrais. Gates são atribuídos às versões descritas; não se declara cada commit
intermediário isoladamente testado. Diff staged conferido antes de cada commit.
README geral continua fora dos commits e com o SHA-256 original; caches/builds/
traces/logs integrais permanecem ignorados. Nenhum push, deploy, reset, clean,
amend, rebase ou alteração de banco real foi feito.

### Escopo do próximo revisor e CF-010

Revisar o delta `8dad1c1..ac87873` e o fechamento documental: confrontar SPEC-002,
os vermelhos preservados e os testes verdes, verificar os três fixes P03/P04/P05,
revisar metadados e todos os writers/adaptadores P01/P02, omissão/null/00:00,
proteção e imutabilidade de auditoria, preservação do bruto, ordenação global e
Excel. Verificar especificamente PATCH de cartão retornando DTO e isolamento
dos relógios de credenciais. Reexecutar os gates pertinentes sobre os blobs do
manifest. Não encerrar P01/P02 ou CF-017 sem cumprir a derivada de adoção real;
não reinterpretar o SQL sintético como migração pronta para produção.

**CF-010 pode avançar isoladamente**, pois sua dependência declarada é CF-003,
nos limites já revisados do harness. Isso permite trabalho em componentes comuns,
sem assumir contratos temporais/migração aprovados nem publicar o backend candidato.
CF-010 não foi iniciada, seu arquivo/estado não foi alterado e não é liberação
integral do bloco nem das demais tarefas dependentes.
