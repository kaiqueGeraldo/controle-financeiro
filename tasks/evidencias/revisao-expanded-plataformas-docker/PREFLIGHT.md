# Preflight mínimo e cleanup

Execução identificada cf-review-20261103-01; provas privadas no runtime revisao-plataformas-docker-20261103-01. InfraProbe.java foi compilado com JDK21 e dependências da mesma versão usadas pela suíte. O guard foi copiado sem alteração e seu SHA-256 conferido. Nenhum compilado da aplicação foi usado para substituir a consulta.

| Etapa | Linux sibling original | JVM Windows alternativa |
|---|---|---|
| A — daemon correto | PASS: socket, ID igual ao Desktop | PASS: named pipe, mesmo ID |
| B — container descartável identificado | PASS: TCP próprio com label da execução | PASS: mesmo recurso identificado para comparação |
| C — descoberta/acesso pela JVM | PASS: token exato via host.docker.internal:53066 | PASS: token exato via127.0.0.1:53066 |
| D — Testcontainers/Ryuk | PASS: init e handshake ativo | PASS: init e handshake ativo |
| E — PostgreSQL descartável | PASS: PG16 próprio, porta53070 | PASS: PG16 próprio, porta63585 |
| F — guard original | **FAIL:** host não é loopback literal | PASS: nome cf_test_ exato + negativos de host/nome |
| G — JDBC/consulta sintética | Não executada após F | PASS: banco esperado e1+1=2 |
| H — encerramento/cleanup | PASS | PASS |

O início de PG pelo Testcontainers inclui seu readiness normal; isso não foi usado para afirmar que o consumidor passou pelo guard. O probe para em F e não prossegue a G no Linux. Não foram adicionados retries nem alterados timeouts/guard/Ryuk para obter um verde.

Suplemento dirigido autorizado: nova cópia física das860 fontes, Maven offline/JDK21 no Windows, apenas DisposablePostgresGuardTest4 e CF015PlanningOwnershipTest5. Resultado9/9, zero falhas/erros/skips. Contexto Spring, JDBC e inicializador reais passaram; não houve RF15/E2E financeiro/verify/package.

## Recursos

O container TCP e executores usam cf.review=cf-review-20261103-01; PG/Ryuk são correlacionados também por ID/session do Testcontainers. Remoção somente por IDs/labels conferidos. Nenhuma rede ou volume próprio persistente foi necessário. Os oito containers históricos existentes permaneceram com seus IDs; conjuntos de redes/volumes finais são iguais aos iniciais.

A primeira fotografia geral de cleanup ainda continha transitoriamente o Ryuk Windows, embora a consulta por session já estivesse vazia, pois o reaper não é coberto por esse filtro da mesma forma que o PG. A verificação posterior por ID e o snapshot final de todos os recursos confirmam sua remoção automática. Não se usou só ausência de label para declarar limpeza.

cleanup-final.json e PREFLIGHT.json registram o fechamento final; REFERENCIAS.json guarda os hashes. As JVMs e helpers desta execução encerraram. A unidade SUBST própria também foi removida, sem remover arquivos. Não houve prune, limpeza de target/.next, remoção genérica, reinício de serviço ou alteração de recursos alheios.

## Limites de autorização

A topologia alternativa não exige mudança persistente. Mantê-la é o próximo passo mais simples; o risco é a capacidade restante das jornadas históricas no Windows, a ser verificada pela rodada integral. Se for obrigatório manter o executor Linux, o próximo experimento precisa de um ambiente Linux com acesso real em loopback aos serviços criados pelo mesmo daemon, inclusive Ryuk. Habilitar integração/host networking, instalar ferramentas no WSL ou provisionar outro daemon é uma proposta operacional separada: deve conter janela, impacto, valores anteriores, reversão e autorização específica antes de qualquer mudança/reinício. Essa alternativa não foi executada por associação nesta revisão.
