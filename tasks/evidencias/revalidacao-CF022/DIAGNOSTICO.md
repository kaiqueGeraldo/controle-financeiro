# Parecer por achado

## RJ-022-01

**A — Causa da distorção atual confirmada: harness.** O browser.cjs compartilhado
em `controle-financeiro-backend/src/test/java/com/controlefinanceiro/api/domain/habit/`
linha28 chama page.clock.setFixedTime antes da primeira navegação. Apesar do nome,
na instalação usada também substitui timers/performance/requestAnimationFrame;
a timeline de animações permanece nativa e reinicia em navegações completas.
Nos snapshots do produto, o modo completo apresenta drift7452/24366/1557/9224ms
e duas animações negativas em cada captura before. O Date-only tem7–16ms e zero
animação negativa. Modal invisível tem pointer-events auto; o hit-test registrado
é do cartão diário. A captura semanal before não contém ainda o cartão semanal.
Não confundir a imagem invisível com prova do hit-test do alvo semanal.

Contraprova independente `clock-probe.cjs`: página HTTP local mínima, animação
WAAPI com início em performance.now, quatro navegações por modo/fuso. No último
documento, drift551,5/504,134ms e current negativos no completo; Date-only1,6/1,5ms,
current positivos. Inspeção das funções confirma timers/performance/rAF nativos
somente no Date-only. A animação sintética torna o mecanismo explícito, mas não
é implementação de Framer Motion nem reprodução E2E do timeout. A observação do
produto vem dos JSON/imagens versionados, conferidos separadamente.

Date-only mantém instante2027-01-05T02:59:59Z e diaProduto04/01 nos dois fusos,
preserva argumentos explícitos do construtor e não altera produto. Não avança
automaticamente o dia: testes de virada precisam controle deliberado, não sleeps.
As assertions financeiras/calendário/reload do browser e SQL do Java não foram
relaxadas no candidato. API real prepara autenticação/meta; criação e toggle do
hábito continuam via UI/BFF/backend/PG. Nenhum sucesso HTTP é interceptado.

**B — Compatível com a história, sem equivalência demonstrada.** A falha original
em9ff1aec teve30s/zeroPOST registrado; não há calllog terminal, trace nem SQL final.
O candidato usa produto posterior, autenticaçãoAPI, no-preference (histórico
reduce), observador suplementar e captura de promises. Essas diferenças impedem
chamar a execução de réplica integral. O delay25,47s entre cliques inclui refresh,
observação e espera; não é duração exclusiva do backend nem prova do timeout.

**C — Causa do timeout original inconclusiva.** Não houve reprodução30s/zeroPOST.
Não foi refutado um defeito histórico de produto; também não há evidência para
afirmá-lo. Oito verdes não encerram a ocorrência; aceites RVA03/CF014 não são prova
emprestada. Falhas atuais de preparação/auth ocorreram nos dois relógios, logo
trocar relógio não foi solução suficiente daquele impedimento ambiental distinto.

**Correção necessária: harness compartilhado, sem produto.** Substituir no
browser.cjs de hábitos a instalação completa por Date-only antes da navegação,
preservando o instante, construtores e todos os asserts. Risco: interferir em
consumidores que deliberadamente precisam avançar timers; manter a mudança no
fluxo de hábitos e validar seu contrato, sem substituição global indiscriminada.
Benefício: calendário determinístico com tempo de animação nativo. Revalidar as
quatro jornadas diário/semanal SP/Kiritimati, reload/SQL0→1→0 e contraprova de
navegação/WAAPI; recolher calllog/rede/SQL na primeira falha. Sem animações desligadas,
click forçado ou prazo maior. O saneamento não foi implementado nesta revisão.

Ocorrência antiga pode ser não bloqueante depois desse saneamento: garantias
funcionais têm provas próprias e o mecanismo atual terá sido removido. Manter ID,
limites e reabrir se Date-only ainda produzir click bloqueado/zeroPOST, ou se houver
POST com efeito incorreto. Não condicionar o fechamento a fabricar30s de atraso.

## H24-01

**Confirmado: isolamento insuficiente das fixtures, não timeout causal.** O setup
de HabitIntegrityIntegrationTest cria usuário por método sem retirar hábitos
anteriores; o cron consulta IDs de todos os owners. O teste de keyset insere501.
Schema separado protege contra outras classes create-drop, mas não isola métodos.
Na ocorrência original a classe hábitos é a primeira no log; não há prova da
ordem interna, inventário ou duração individual do callback. O dump mostra espera
JDBC/CollectionLoader durante findForUpdate, não comprova lock bloqueador/N+1/pool
saturado como causa da Future expirada. Não atribuir501 àquela execução como fato.

Quatro combinações do candidato conferidas: LAZY fresca479ms/2, residual9890ms/1006;
EAGER fresca598ms/2, residual11053ms/1006. Cada modo roda em processo/container novo;
a fixture residual é501 somados ao1 anterior, mais1 criado pelo caso:503. Mesma
assertion10s por Future; duração do caso inclui recusa e duas execuções. Nenhum
dos totais acima comprova violação do10s. Datasets sintéticos são comparáveis em
conteúdo/volume, mas processos/aquecimento não controlam latência como benchmark.

Novo teste independente mantém a implementação LAZY e o caso original. Fresca:
0 antes/1 após,2 locks,551ms. Residual:502 antes/503 após,1006 locks,11149ms.
Isolada: remove somente hábitos/logs do owner sintético deste container,0 antes/1
após,2 locks,50ms. Todos passaram; FAILED1/503/1 e GoalHistory0 final. A retirada
de fixtures faz o trabalho voltar a2, independentemente da melhora de latência
por aquecimento. Não se afirma que50ms seja ganho causal de performance.

ObservadorPG250ms:5/47/3 amostras, nenhum blocker/lock não concedido/waiter do pool.
A observação não prova ausência de esperas entre amostras; falha de observador
agendado pode interromper amostragem (limite do probe herdado). Há amostras inicial
e final e contagens do advice; não certificamos ausência universal de concorrência.
Novo container/schema e seleção de um único método impedem interferência de outros
testes no banco; cron periódico permanece registrado e não foi desativado. Não
houve inventário global de carga concorrente do host nem conclusão sobre ela.

**Produto:** transação por hábito, lock pessimista e retry; paginação keyset500.
Custo inclui consultas/transações O(H) mais históricos lidos; cálculo diário O(L),
semanal O(L log W), memória O(L+W) por hábito. Contador findForUpdate não é contador
de SELECT total. EAGER pode acrescentar consultas de coleção desnecessárias; LAZY
já tem aceite CF025. Não há medição suficiente para diagnosticar gargalo, propor
índice, ampliar timeout ou refatorar job. Crescimento de trabalho é esperado e
risco de escala conhecido, não regressão de produto demonstrada. Cron não gera
contribuição; as provas de atomicidade/ownership anteriores continuam válidas.

**Correção necessária: fixtures do teste compartilhado.** Dar a cada método de
cron dataset/schema exclusivo ou limpeza referencial restrita ao banco descartável
após workers terminarem. Não filtrar o cron por owner para fazê-lo passar: isso
mudaria o contrato global. UUID novo de usuário sozinho não resolve. Trade-off:
schema por caso aumenta startup; limpeza é mais rápida, mas precisa respeitar FKs,
workers e dados de controles. Preservar teste501 e verificação multipágina; testar
ordem volume→callback e inversa, com inventário antes/depois e mesmos10s/asserts.
Não usar @Transactional rollback do thread principal como isolamento de commits
feitos pelo worker. Nenhuma limpeza no runtime histórico .cf22 ou target foi feita.

Histórico H24 continua inconclusivo, sem corrupção confirmada. EAGER+501 não foi
condição suficiente nas provas; LAZY não foi demonstrado como sua solução. Após
isolamento comprovado, a ocorrência pode permanecer não bloqueante, reaberta se
callback com fixture conhecida expirar, falhar retry ou duplicar efeito. Nesse
caso o experimento útil é capturar início/fim do callback, SQL/PIDs/pg_locks/pool e
thread dump na primeira expiração. Repetir suíte antiga até falhar/passar não é
condição de aceite; tampouco exigir medição retroativa indisponível.
