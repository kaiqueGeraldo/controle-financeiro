# Investigação delimitada RI031-T01/T02

As ocorrências originais e seus snapshots permanecem em
`../revisao-CF-031/e2e/` e `../revisao-CF-031/e2e-serial/`. São pontos distintos
da mesma jornada de draft, não demonstração de uma causa comum.

## Reconstrução sustentada pelas provas antigas

T01: desktop1440/Kiritimati, primeiro acesso depois de registrar/logar o owner
sintético, antes de editar o draft. Sidebar já mostra o usuário. Snapshot da
assertion de12s contém “Carregando entrevista e cadastros existentes…”, não
“Carregando sua sessão…”. Uma captura posterior mostra o contexto. No código,
OwnerInterview só adota a sessão depois de Promise.allSettled(GET onboarding,
cinco listas); uma leitura pendente pode conservar esse loading. Não há timings
de requests suficientes na prova antiga para dizer qual aguardou, nem se a
pintura atrasou depois da resposta. Probe de outro contexto coexistiu no servidor
nessa rodada; isso não comprova interferência de cookie/owner.

T02: tablet768/UTC, após save realmente persistido com resposta503, expiração por
remoção de cookie, diálogo e novo login do mesmo owner. Assertion de releitura
do nome falha em12s; DOM contém sessão encerrada e toast de falha de conexão.
UserProvider começa user=null/loading=true e libera loading após a requisição
de perfil; um erro de transporte pode deixar user=null com esse aviso. Porém o
snapshot antigo não associa o toast a um request/status específico. Não é prova
de perda do draft nem permite atribuir a falha ao BFF, backend ou browser.
Essa rodada não tinha probe concorrente, logo a presença de outro probe não é
condição necessária para a ocorrência T02.

## Instrumentação e experimentos

Config suplementar importa as quatro jornadas originais sem alterar assertions,
timeout12s/90s, retry0 ou relógios. before/afterEach registra método/path/status,
falha de transporte, navegação e transições observáveis do DOM. Somente nomes
de cookies, nunca valores, headers, corpo financeiro ou JWT. Arquivos
`e2e-after/*-diagnostics.json` correlacionam projeto/testId/tempo monotônico.
Não é instrumentação de estado interno React: estados são inferidos do DOM e
confrontados com UserProvider/useOnboarding/flow, sem alegar captura de Fiber.

Dois experimentos acrescentados ao cenário E01, uma variável por vez:

1. Segurar somente GET categories até observar o loading da entrevista;
   liberar por promessa/evento, sem sleep. A sessão e o recibo continuam válidos;
   depois da liberação a conclusão reaparece. Demonstra que o loading observado
   em T01 pode representar carga de catálogo ainda não resolvida. Não identifica
   o request/latência original.
2. Abortar somente GET auth/user num reload, preservando o cookie e o banco.
   Surge a mesma combinação de sessão encerrada/aviso de conexão. GET direto
   autenticado continua devolvendo exatamente o recibo; restaurar transporte e
   recarregar recupera a conclusão. Demonstra sensibilidade da UI à falha de
   perfil, sem confundir perda de representação com perda persistida. Não prova
   que esse foi o request que falhou originalmente em T02.

Essas injeções têm contracontrole explícito: liberar o catálogo/restaurar o
transporte recupera o mesmo recibo; não se remove timeout, desabilita animação
ou repete uma suíte até passar. A configuração herda reducedMotion já existente
no harness original, sem acrescentar desativação de animações. Date-only e
relógios nativos permanecem como antes. Nenhuma correção de produto/sessão ou
mudança de fixture foi justificada por esses experimentos.

## Conclusão e próximo experimento

**Origem histórica permanece inconclusiva.** As evidências distinguem dois
estados/locais; uma passagem verde posterior não encerra as ocorrências antigas.
Não foi demonstrada mistura de owners, perda financeira, expiração indevida por
fuso, falha de cleanup de timer ou necessidade de aumentar timeout. Ausência
dessa demonstração não elimina todas essas hipóteses como causas possíveis.
Em especial, não atribuímos causalidade às três falhas amplas já classificadas;
elas não foram reabertas nem corrigidas neste lote.

Próximo experimento útil se o timeout reaparecer: correlacionar o request
pendente/falho do novo timeline com a duração do BFF e do endpoint Spring sob o
mesmo identificador, sem tokens; separar latência de compilação, transporte e
settlement/paint. Na prova antiga faltam esses dados, portanto não é possível
reconstruí-los retroativamente. A investigação não impede a correção dos dois
P2 confirmados nem concede aceite integral da matriz real.
