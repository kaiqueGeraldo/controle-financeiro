# Diagnóstico independente dos dois mecanismos

## RJ-022-01: correção temporal

Delta efetivo: browser.cjs importa ./civil-date-clock.cjs, cria uma página e
instala o init script antes do primeiro goto. Não há wrapper substituindo esse
helper no caminho integrado. Somente Date é interceptado: chamada/construção sem
argumentos usam o instante fixo; argumentos explícitos continuam nativos; Date.now
retorna o mesmo instante. Nenhuma função de timer/performance/rAF é substituída.
O init script reaplica em documentos novos/reload; contextos SP/Kiritimati são
criados e fechados separadamente. Uso intencional de page.clock em outros testes
não foi alterado; busca de consumidores encontra apenas browser e testeCJS novos.

Teste candidato executado independentemente com instalação antiga e nova:
vermelho causal por clocks não nativos no antigo; verde no helper real, mantendo
04/01/2027 como diaProduto nos dois fusos, navegação/reload, animação com tempo
não negativo e interação. Contexto novo conserva Date nativo. O cancelamento de
animação da página sintética ocorre após a medição, não desativa animações de
produto. No caminho real, reducedMotion passou de reduce para no-preference;
nenhum CSS/force remove a evidência. Assertions novas exigem modal removido,
opacidade acumulada e hit-test do botão; não substituem as financeiras existentes.

Não há enfraquecimento do contrato: assertions de payload04/01, configuração
semanal2, streak diário1/semanal0, meta1 após reload e meta0/logPENDING após
desfazer permanecem. Os novos registros são observações adicionais. Timers reais
com Date fixo não simulam avanço de calendário; testes de virada não são
substituídos por estas jornadas. Critérios1–3 conservam as provas anteriores.

O problema atual demonstrado é de harness e a correção é proporcional. Nenhuma
mudança de produto ou aceite de RVA03/CF014 é usado para justificar essa conclusão.
O timeout original30s/zeroPOST não foi reconstituído: não há calllog/SQL terminal
histórico suficiente. Correção do mecanismo atual não é atribuição retroativa.

## H24-01: isolamento e ciclo de vida

Antes: SCHEMA estático reutilizado, usuários distintos mas dataset do cron global
compartilhado. Depois: UUID local por inicialização, CREATE SCHEMA sem if-not-exists,
propriedades de Flyway/Hibernate/Hikari apontadas ao mesmo nome. Colisão não é
silenciosamente aceita. Container/banco têm UUID por JVM e guard descartável;
DriverManager de preparação fecha conexão/statement via try-with-resources.

DirtiesContext AFTER_EACH_TEST_METHOD invalida o cache e fecha recursos; a
instância seguinte roda o initializer novamente. Isolated explicita que Clock
mutável/contexto não podem ser compartilhados por casos concorrentes. Não houve
alteração das threads/transações internas dos testes de concorrência, filtros
de owner no produto, truncamento de banco ou rollback artificial do teste.

Nos quatro casos reexecutados, schemas distintos e conexão JDBC coincidente;
advice no repositório confirma current_schema durante findForUpdate no worker
scheduling-1 dos callbacks. São duas leituras e umFAILED sem duplicidade, inclusive
após expiração do lock. Casos501 continuam reais e verificam1002 leituras/501FAILED.
Antes do próximo caso, o probe confirma contexto inativo, Hikari fechado e executor
de scheduling terminado; verifica também o último encerramento em AfterAll.
Zero GoalHistory nos quatro casos. Não é apenas inferência a partir de rollback.

Subclasse mutante AFTER_CLASS: primeiro caso501 passa; segundo falha no setup
vazio (observado501), antes do callback. O candidato não foi editado para essa
contraprova. A guarda de precondição detecta a contaminação em vez de escondê-la.
Os27 métodos originais foram executados novamente porque o setup mudou em todos;
passaram sem alteração de expected. O consumidor adicional do initializer é o
browser, verificado nas jornadas integradas e SQL.

2→1006→2 do probe anterior tem base matemática específica: primeira chamada cria1,
adiciona501 e a próxima cria1 (503×2); limpeza sintética deixa0 e a última cria1.
Seus registros finaisFAILED1/503/1 e GoalHistory0 foram conferidos. Não é requisito
universal de consultas. Não precisamos repetir essa carga deliberada para provar
o novo isolamento, cuja sensibilidade está demonstrada pela mutação de contexto.

Trade-off: contexto/schema por método custa inicialização, migrações e storage
temporário; elimina dependência de ordem sem limpeza referencial frágil. Não há
vazamento de pools/scheduler observado nos quatro ciclos testados. Schemas são
retidos até o fim do container, não prometemos limpeza sob encerramento forçado
do host nem benchmark de JVMs paralelas. Não alteramos LAZY/EAGER, queries, índices,
ShedLock ou timeout10s. A escala do cron e a causa histórica permanecem limites
distintos, discutidos em [Falhas e limites](FALHAS-E-LIMITES.md).
