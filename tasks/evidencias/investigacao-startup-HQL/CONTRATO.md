# Contrato de startup e observador

O limite40s surgiu em `8605ea425706c82328ceb6e0283644b8dbe976a2`, em
`AdoptionRuntimeTest.App.awaitStatus`. O código original foi lido via git show,
o atual e os observadores anteriores foram confrontados. Não foi localizado
SLO operacional de40s em docs/sdd, CF017/P01/P02, CF034 ou plano de adoção.
É orçamento do harness: permanece obrigatório nesta investigação. Propor sua
revisão exige decisão e dados de ambiente operacional; não se usou prazo do
provedor,90s de diagnóstico, retry ou readiness antecipada como aprovação.

## Fronteiras

| Marco | Significado e medição |
|---|---|
| t0 criação | nanoTime imediatamente antes de ProcessBuilder.start; Instant correspondente para correlação com logs |
| Retorno de start | Process criado; inclui custo local de criar JVM/cliente Docker, não prova Spring iniciado |
| JVM/Spring | Primeiro log e, nas instrumentadas, premain; não há medição exata do instante de criação da JVM1 no container |
| Gate original | Deadline nanoTime +40s **na entrada de awaitStatus**, após construção do App |
| Porta | Tomcat anuncia porta efetiva; descoberta pelo próprio log UUID; Docker resolve127.0.0.1::8080 pelo daemon, teto5s |
| Liveness | GET /ops/health/liveness200: ApplicationAvailability LivenessState.CORRECT |
| Readiness | GET /ops/health/readiness200: writers=true, ACCEPTING_TRAFFIC, pool/connection.isValid(1) |
| Funcional | Nesta rodada somente GET /accounts sem token401; não é prova de jornada financeira/autorizada |

O sucesso do gate é HTTP esperado, sem considerar porta aberta como readiness.
HttpClient connect1s/request8s, polling100ms; App e endpoint reais. O loop verifica
deadline antes da chamada, não depois: uma chamada iniciada no budget pode
retornar além dele. Nenhuma amostra nova fez isso, e não há prova de sucesso
histórico ignorado. Registrar os dois relógios não corrige nem troca o observador.
Diferenças criação→gate foram11–45ms nesta rodada; logs de fase têm resolução
milissegundo e correlação de wall clock, não tempo exclusivo monotônico de bean.

## Preparação fora e trabalho obrigatório dentro

Fora: ferramentas/probe compilados, PostgreSQL Testcontainers17-alpine iniciado,
readiness do banco e SQL confirmados, schema UUID criado e V1–V16 aplicadas. Esse
é o perfil adoption aprovado: Flyway é job operacional separado, não trabalho
adiado para esconder custo. Na API: Flywayfalse, SQL initnever, generateDDLfalse,
hibernatevalidate, guard de configuração, criação de EMF, todos os repositories/
queries, web/security e estado de disponibilidade permanecem dentro do startup.

Flags dos quatro processos: adoption, writers=true/jobs=false, JDBC
connectTimeout=2/socketTimeout=2; pool connection3s/validation1s. Secrets sintéticos
e banco descartável; sem .env carregado. O App remove SPRING_*/DB_*/FLYWAY_* e
JAVA_TOOL_OPTIONS herdados antes de instalar config sintética. JDK_JAVA_OPTIONS e
_JAVA_OPTIONS não foram removidos adicionalmente: fonte preservada, sem nova
promessa de hermeticidade absoluta. Não se alterou nenhuma validação/segurança.

## Timeout e cleanup

Falha original é preservada separadamente; o probe permite somente observação
diagnóstica até90s desde criação. Thread.print ocorreria apenas depois da falha,
nunca convertendo sucesso tardio em aprovação. Não foi necessário nesta rodada.
JFR.dump ocorreu após readiness e antes de close nas duas instrumentadas;
seu tempo fica fora da medição de sucesso. A gravação nativa antiga0B continua
preservada e não é reclassificada como válida.

App.close canônico e byte idêntico ao aceito: Windows/porta conhecida usa término
e confirmação TCP dentro dos budgets10s/5s; erro de inspeção bloqueia. Docker usa
stop com orçamento anterior e espera pelo cliente. Falhas pré-bind/porta0 mantêm
seu ramo anterior. Nenhum kill por porta/nome, recurso desconhecido ou retry de bind.
Todos os4 closes confirmaram cleanup; exit1 nativo ocorreu após destroy e não é
falha espontânea de startup. Não se repetiram provas TCP/RVPLA não afetadas.
