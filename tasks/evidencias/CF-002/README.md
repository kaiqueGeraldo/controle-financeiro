# Evidência CF-002

- Estado real e data: concluída em 07/09/2026.
- Modelo/esforço usados: Codex da sessão, esforço high.
- Commit/base e identificação do diff local testado: `main` em `169d7be4c7d3db97d4c318ff3f99d9de3a808067`, com o diff local da CF-002 e o patch anterior do usuário preservado.
- Runtime: Windows 11; Eclipse Temurin 21.0.12.1 temporário; Maven Wrapper 3.9.12; Spring Boot 4.0.2; Docker Desktop 4.83.0, Engine 29.6.2; Testcontainers 2.0.3; `postgres:16-alpine`; timezone America/Sao_Paulo.
- Dados: nomes, e-mails e valores exclusivamente sintéticos (`Usuario A/B`, `example.test`, 10,00; 123,45; 999,99).
- Dependências integradas: nenhuma; CF-002 não possui dependências.

## Critérios e resultado esperado independente

| Critério | Oracle/regra | Teste/comando | Resultado |
|---|---|---|---|
| Persistência PostgreSQL e rollback | Entidade salva deve sobreviver a `flush/clear` dentro da transação; depois de `setRollbackOnly`, nova leitura não encontra a fixture | `PostgreSqlPersistenceTests.persistsAndReloadsUsingPostgresThenRollsBack`; `mvnw.cmd --batch-mode clean verify` | Aprovado em PostgreSQL 16 real e descartável |
| Isolamento A/B | Consulta e soma por `userId=A` retornam apenas `Somente A=10.00`, nunca a conta B=999.99 | `PostgreSqlPersistenceTests.queryForUserADoesNotExposeUserBFixture` | Aprovado; ambas as fixtures ausentes após rollback |
| Sem comunicação externa | Beans de `EmailService` e `MarketDataService` precisam ser mocks e receber zero chamadas no cenário A/B | `contextLoads` e `verifyNoInteractions(emailService, marketDataService)` | Aprovado; nenhuma API de e-mail/cotação real foi criada ou chamada |
| Banco seguro | Somente PostgreSQL loopback com nome efêmero exato `cf_test_*` é aceito; produção, `financas_db` e H2 são recusados | `DisposablePostgresGuardTest` (4 casos) | 4 aprovados |
| Ambiente indisponível | Ausência de Docker deve falhar com diagnóstico acionável, sem tentar DB configurado externamente | `mvnw.cmd test` com daemon desligado | Falhou como esperado: `PostgreSQL descartavel indisponivel... nenhum banco externo sera usado como fallback` |
| Java 21 | Build em 21 aprova; Java 25 deve ser rejeitado antes dos testes | `mvnw.cmd -DskipTests validate` em Java 25 e `mvnw.cmd --batch-mode clean verify` em Java 21 | Java 25 rejeitado; regra aprovada em Java 21 |
| Wrapper Windows | Diretório `.m2` normal tem `Target` nulo e não pode ser indexado | `cmd /c mvnw.cmd -v` antes/depois | Antes: `Não é possível indexar em uma matriz nula`; depois: Maven 3.9.12 iniciou |
| Caminho CI | Checkout do GitHub com Java 21 e Docker disponível deve executar a mesma verificação, sem `skipTests` | `.github/workflows/ci-backend.yml`: `./mvnw --batch-mode clean verify` | Workflow atualizado; execução equivalente aprovada localmente |

## Falha anterior

O baseline tinha apenas `contextLoads`, dependia das variáveis normais de banco e o CI executava `clean package -DskipTests`. No Windows, `mvnw.cmd -v` falhou antes do Maven em `(Get-Item $MAVEN_M2_PATH).Target[0]`, pois `Target` era nulo para uma pasta comum. Docker inicialmente estava desligado.

A primeira execução da nova suíte encontrou `NoClassDefFoundError: org/apache/commons/lang3/exception/ExceptionUtils`; isso era falha de classpath, não evidência de indisponibilidade PostgreSQL. `commons-lang3` foi então declarado apenas no escopo de teste. A repetição com Docker desligado chegou ao Testcontainers e falhou pela causa correta, com a mensagem própria da infraestrutura.

## Correção e validação

- Correção mínima do wrapper: lê o primeiro alvo de link de modo null-safe e preserva o restante do script gerado.
- `pom.xml`: `maven.compiler.release=21`, Maven Enforcer `[21,22)`, Testcontainers PostgreSQL e `commons-lang3` somente em teste.
- `application-test.yml`: credenciais sintéticas, URL sentinela inválida e `ddl-auto=create-drop` somente para schema efêmero.
- Inicializador inicia um PostgreSQL de nome aleatório, valida URL/nome/loopback antes de publicar propriedades e nunca aceita fallback externo.
- Classe-base substitui as duas fronteiras externas solicitadas por `@MockitoBean`.
- CI backend deixou de ignorar testes e usa o mesmo `clean verify`.

Comandos finais:

```powershell
$env:JAVA_HOME = '<JDK 21>'
$env:Path = "$env:JAVA_HOME\bin;<Docker CLI>;$env:Path"
cmd /c mvnw.cmd --batch-mode clean verify
```

Resultado final: 7 testes, 0 falhas, 0 erros e 0 ignorados; código de saída 0; `api-0.0.1.jar` produzido. Distribuição: 1 teste de contexto, 2 de persistência/isolamento e 4 do guard. Uma segunda execução também terminou com código 0. O `docker ps --filter label=org.testcontainers=true` após a execução retornou vazio, evidenciando limpeza dos recursos efêmeros.

## Verificação adversarial

- `production.example.com/.../cf_test_*`: recusado.
- `localhost:5432/financas_db`: recusado.
- `jdbc:h2:mem:*`: recusado; H2 não foi adicionado.
- Nome esperado sem prefixo `cf_test_`: recusado pela implementação.
- Java 25.0.4: rejeitado pelo Enforcer com instrução para configurar `JAVA_HOME` em Java 21.
- Docker desligado: suíte vermelha por ambiente indisponível, não por import/sintaxe; depois de o usuário iniciar Docker, a mesma suíte ficou verde.
- Fixture B com saldo 999,99: não aparece na lista nem na soma de A; os dois registros somem após rollback.
- Doubles de e-mail e cotação: `verifyNoInteractions` aprovado no cenário multiusuário.

Nenhuma assertion foi removida, nenhum teste recebeu `skip/only`, timeout ou tolerância aumentada, e não houve snapshot. A correção de classpath preservou o resultado esperado e apenas permitiu atingir a causa real.

## Revisão e pendências

- A execução do workflow no GitHub não ocorreu porque não houve push; o comando exato do workflow foi aprovado localmente no mesmo sistema de build.
- O checkout estava propositalmente sujo com o patch anterior do usuário. A validação usou somente arquivos backend/CI da CF-002; nenhuma mudança anterior foi descartada ou alterada.
- A conferência por SHA-256 contra o manifesto inicial da CF-001 verificou 174 arquivos protegidos do frontend, README raiz e CI frontend: 174 inalterados, 0 divergências inesperadas.
- O JDK 21 usado foi temporário para verificação; o Java padrão do host continua 25 e será recusado até `JAVA_HOME` apontar para um JDK 21.
- O schema criado pelo Hibernate é infraestrutura efêmera, não migração nem prova de compatibilidade com Railway. CF-017 continua responsável por baseline, inventário, backup e migração do banco legado.
- Há aviso não bloqueante do Mockito sobre autoanexação futura do agent e aviso do Hibernate sobre dialect explícito herdado da configuração principal; ambos devem ser reavaliados em upgrade de runtime/dependências, sem impacto no JDK 21 validado.
- Revisão independente pelo modelo sugerido não foi executada nesta sessão. A conclusão se limita à infraestrutura e aos critérios da CF-002; não certifica regras financeiras, autorização por usuário em outros repositórios ou ausência geral de bugs.
- A alteração do workflow fica fora da lista inicial de caminhos, mas é necessária para cumprir o caminho CI explicitamente exigido; nenhum outro arquivo compartilhado fora do escopo foi modificado.

Dependências liberadas: nenhuma nova tarefa ficou totalmente pronta somente com a CF-002. CF-006 aguarda CF-004; CF-008 aguarda CF-003/004; CF-017 aguarda CF-016; CF-007 e CF-023 ainda têm outras dependências. CF-003 permanece pronta e CF-004 já estava liberada pela CF-001.
