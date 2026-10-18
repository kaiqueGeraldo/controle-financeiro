# Falhas intermediárias e limites da atribuição

## Timeout residual durante o saneamento

Fonte: saneamento-CF022/before-scheduler/maven.log, residual501-result.txt e
amostrasPG. A fixture fresca passou com duas leituras. O caso residual tinha
503 hábitos e expirou na linha268, primeira execução efetiva após a recusa de
ShedLock. Foram observadas446 chamadas findForUpdate e445 logsFAILED no snapshot
terminal. Houve processamento e persistência parcial por transações de hábito;
não é ausência de request de navegador. O total10026ms corresponde ao caso que
expirou, não mede duração de todos os registros nem demonstra perda de atomicidade.

Esse experimento injeta resíduos deliberadamente dentro de um único método.
Recriar contexto entre métodos não elimina esse volume interno. Portanto o verde
posterior2→1006→2 NÃO prova que a correção de contexto resolveu aquele timeout.
A prova causal do isolamento é distinta: a mesma ordem501→callback herda501 quando
o contexto é retido, e começa vazia quando cada método recebe contexto/schema novo.
Os27 originais e quatro casos não precisam compartilhar os501 registros para
verificar seus contratos; o caso de paginação mantém seu próprio volume501.

O snapshot sem bloqueadores não exclui contenção transitória ou custo de host.
Não há medição suficiente para concluir causa do timeout antigo H24-01, problema
de índice, N+1 como causa, pool saturado ou benefício de trocar LAZY/EAGER.
Não se extrapola o tempo de casos sintéticos para produção. O contador mede
operações com lock, não o total de queries. Nenhum prazo foi ampliado.

## Compilação fria da home

Fonte: saneamento-CF022/corrected-browser/{playwright.log,next.log,sql-terminal.txt}.
Cadastro e login retornaram200. A assertion de URL de5s venceu ainda em/auth,
enquanto Next registrava compilação de/. Há GETs de listagem (inclusive hábitos/
metas) do carregamento da home, mas nenhum POST de criação/toggle de hábito.
SQL final: habits=[], logs=[], goals=[], history=0. Usuário de autenticação foi
criado; não confundir ausência de hábitos com ausência de toda persistência.

O controle aquecido registra GET/200 em9,8s, dos quais9,2s de compilação. Isso
sustenta preparação do servidor dev, mas não reconstrói a duração exata da home
que foi encerrada na tentativa fria. Não atribuímos o timeout de scheduler acima
à compilação: são processos, etapas e evidências diferentes.

warm-browser.cjs prepara a home por request API autenticado com usuário sintético
de sufixo-warm. Seu APIRequestContext é descartado antes de require('./browser.cjs').
Não cria hábito/meta nem clica na ação avaliada. O browser real inicia novos
contextos, cadastra/loga outros usuários e mantém a assertion5s original. Usuário
warm não recebe dados das jornadas; SQL final e assertions não são substituídos.
O launcher Java é o único adaptador temporário na cópia; browser/helper permanecem
idênticos ao candidato. O runner restaura bytes do launcher em finally e registra
seu hash. Nenhum preload de resultado, interceptação de sucesso ou bypass do login
UI ocorre no trecho funcional.

O critério4 exige prova confiável do caminho de hábitos, não SLA de compilação
fria do servidor Next dev. A preparação é aceitável nesse escopo e reproduzível
pelos scripts versionados, mas as jornadas aprovadas não certificam startup frio,
autenticação sob carga ou build de produção. O harness original sem preparação
permanece suscetível a compilação fria: limite explícito do ambiente de execução,
não uma correção de produto ocultada nem uma garantia de qualquer máquina.

## Recursos e escopo

Datasource Hikari, Hibernate, Flyway e JdbcTemplate/ShedLock apontam ao schema
UUID do contexto. Novo schema não limpa ou reescreve os antigos. DirtiesContext
fecha o contexto ao fim de cada método; contexto seguinte executa novamente o
initializer. Regressões são executadas sequencialmente; Isolated declara restrição
de paralelismo da classe, não capacidade de compartilhar Clock entre métodos.
Processos Testcontainers distintos geram bancos/containers independentes. Não
foi executado benchmark de várias JVMs concorrentes.

Contexto por método custa inicialização/migrações/pool/scheduler; storage dos
schemas cresce com número de métodos até descarte do container. Benefício:
isolamento de commits de worker sem truncamento amplo nem rollback fictício do
thread principal. Não se propõe otimização sem medição. Custo do cron permanece
proporcional aos hábitos e seus históricos; nenhuma regra de produto foi alterada.
