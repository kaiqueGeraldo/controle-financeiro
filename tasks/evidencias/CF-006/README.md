# Evidência CF-006

- Estado real e data: concluída em 08/09/2026.
- Modelo/esforço usados: Codex; o identificador exato do modelo e o esforço efetivamente ativos não são expostos pelo runtime desta sessão.
- Commit/base e identificação do diff local testado: `main`, HEAD `169d7be4c7d3db97d4c318ff3f99d9de3a808067`, sobre o patch local não commitado das CF-001–005. O `git status --short` inicial já continha alterações no backend, frontend, CI, documentação e tarefas; elas foram preservadas. Esta execução acrescentou o relógio de produto, validação/serialização temporal estrita, aplicação nos serviços e crons, testes temporais e esta evidência.
- Runtime, sistema, navegador, viewport, timezone e seed: Windows/PowerShell; Eclipse Temurin `21.0.12.1`; Maven Wrapper; Spring Boot `4.0.2`; JVM de validação forçada para `UTC`; Docker Desktop `29.6.2`; Testcontainers `2.0.3`; PostgreSQL descartável `postgres:16-alpine`, banco aleatório `cf_test_<uuid>`. Instantes, UUIDs e entidades de negócio dos testes são sintéticos. Navegador e viewport não se aplicam a esta tarefa de backend.
- Dependências integradas: CF-002 e CF-004 concluídas na mesma base local; contrato normativo em [SPEC-002](../../../docs/sdd/specs/002-datas.md). A CF-005 também está concluída, permitindo liberar a CF-007 com esta entrega.

## Critérios e resultado esperado independente

| Critério | Oracle/regra | Teste/comando | Resultado |
|---|---|---|---|
| Calendário do produto independe do fuso da JVM | O calendário civil do produto usa `America/Sao_Paulo`; o mesmo instante deve produzir o mesmo dia em JVM UTC, São Paulo ou Kiritimati. | `TemporalConfigTest`; `TemporalJsonContractTest`; gate com `-Duser.timezone=UTC` | A transição `2026-09-08T03:00:00Z` ocorre de 07 para 08/09 em São Paulo em todos os fusos default testados. |
| Contrato civil e horário fornecido | Data aceita somente `YYYY-MM-DD` canônico e válido; horário aceita `HH:mm` ou `HH:mm:ss`; valor informado não pode ser trocado pela hora do servidor. Ausência continua sujeita à obrigatoriedade do DTO, não a coerção silenciosa. | `TemporalJsonContractTest`, `DateUtilTest`, `TransactionServiceTemporalTest` | Round trip preservou `2024-02-29` e `23:30:45`; datas impossíveis, não canônicas, timestamp e ano zero foram rejeitados; data obrigatória ausente gerou violação e horário opcional ausente permaneceu `null`. |
| Uma operação usa uma única leitura temporal | Datas, horas, eventos e históricos derivados da mesma ação devem vir do mesmo instante capturado no relógio do produto; data civil explícita do usuário tem precedência. | `InvestmentServiceTemporalTest`, `HabitServiceTemporalTest`, `TransactionServiceTemporalTest` | A data explícita propagou para transação bancária e log de hábito; hora e histórico usaram o instante fixo sem sobrescrever o dia informado. |
| Fronteiras de calendário e credenciais | Meia-noite de São Paulo, fevereiro bissexto, fechamento nominal em mês curto e expiração exata devem ser determinísticos. Credencial é inválida quando `agora >= expiração`. | `FutureInProductZoneValidatorTest`, `ScheduledCalendarClockTest`, `CredentialExpiryClockTest` | Foram aprovados virada do dia, 29/02/2024, fechamento com dia nominal 31, competência janeiro/dezembro, hábitos/notificações e limites exatos de 10 minutos/24 horas. |
| Persistência e schema real | Datas civis devem sobreviver como `date`; timestamps legados devem manter o tipo existente até haver proveniência e migração aprovadas. | `PostgreSqlTemporalRoundTripTests` em PostgreSQL descartável | Persistência, `flush/clear`, reload e JSON preservaram os valores; `information_schema` confirmou os tipos abaixo. Nenhuma migração foi criada. |
| Capacidade de detectar regressão | Remover parsing estrito, voltar ao relógio default ou aceitar o instante exato de expiração precisa quebrar os testes. | Baseline e três mutações temporárias em cópia isolada | O baseline falhou no horário inválido; as mutações produziram quatro falhas causais e não tocaram o checkout testado. |

Os valores esperados são literais derivados da SPEC-002. Nenhum teste calcula o oracle chamando a implementação sob teste.

## Falha anterior

Antes da correção, foi adicionado um teste de caracterização para `DateUtil` e executado com:

```powershell
cmd /c "set JAVA_HOME=C:\Program Files\Java\jdk-25.0.4&& set MAVEN_USER_HOME=C:\Users\Aluga.com\.m2&& mvnw.cmd --batch-mode -Dmaven.repo.local=C:\Users\Aluga.com\.m2\repository -Denforcer.skip=true -Dtest=DateUtilTest test"
```

Resultado: 2 testes, 1 falha, exit code 1. `24:00` deveria lançar erro, mas a implementação anterior devolvia a hora corrente; campo ausente e entrada inválida eram indistinguíveis e ambos dependiam do relógio global da JVM. O JDK 25 foi usado apenas nessa reprodução diagnóstica, com o Enforcer explicitamente ignorado; o gate válido da tarefa foi executado em JDK 21 sem ignorar regras.

Na primeira composição da suíte Jackson, os 18 casos nem chegaram ao corpo do teste porque o slice `@JsonTest` herdou `@EnableCaching` sem um `CacheManager`. Foi acrescentado somente um double de infraestrutura no contexto, sem mudar assertions. Com o harness funcional, duas falhas reais permaneceram: Jackson aceitava ano zero e timestamp como `LocalDate`. O desserializador estrito foi então registrado globalmente e os mesmos casos passaram.

## Correção e validação

- [TemporalConfig.java](../../../controle-financeiro-backend/src/main/java/com/controlefinanceiro/api/utils/TemporalConfig.java) expõe `ZoneId` e `Clock` únicos, configurados por `app.temporal.product-zone`, com default explícito `America/Sao_Paulo`, além do módulo Jackson temporal estrito.
- [StrictLocalDateDeserializer.java](../../../controle-financeiro-backend/src/main/java/com/controlefinanceiro/api/utils/StrictLocalDateDeserializer.java) rejeita coerções e formatos diferentes de `YYYY-MM-DD`, incluindo datas impossíveis, timestamps e ano zero.
- [DateUtil.java](../../../controle-financeiro-backend/src/main/java/com/controlefinanceiro/api/utils/DateUtil.java) diferencia ausência de erro: o fallback precisa ser fornecido pelo chamador; valores presentes são validados estritamente como `HH:mm` ou `HH:mm:ss`.
- As validações `@WallTime` e `@FutureInProductZone` mantêm DTOs compatíveis (`String` para horário e `LocalDate` para prazo), mas removem dependência do timezone default. O prazo continua estritamente futuro, preservando o contrato vigente; eventual aceitação de “hoje” pertence à CF-020.
- Serviços de contas, transações, cartões/faturas, metas, investimentos, hábitos, dashboard, resumo e autenticação capturam um único instante do `Clock` por operação relevante. Os três crons usam a mesma zona tanto no agendamento quanto no cálculo de datas. O evento interno de pagamento de fatura transporta `LocalTime`, evitando serialização intermediária incompatível com frações de segundo.
- [TokenService.java](../../../controle-financeiro-backend/src/main/java/com/controlefinanceiro/api/infra/security/TokenService.java) foi a única exceção necessária à lista nominal de caminhos: expiração JWT é parte direta do aceite. O token usa `Instant` do `Clock`, TTL de 24 horas e valida assinatura HMAC, emissor, subject e expiração, rejeitando o limite exato.

Comando final reproduzível, executado a partir de `controle-financeiro-backend`:

```powershell
cmd /c "set JAVA_HOME=C:\Users\Aluga.com\AppData\Local\Temp\cf006-jdk21\jdk-21.0.12.1+1&& set MAVEN_USER_HOME=C:\Users\Aluga.com\.m2&& mvnw.cmd --batch-mode -Dmaven.repo.local=C:\Users\Aluga.com\.m2\repository -Duser.timezone=UTC clean verify"
```

Resultado final: exit code 0, `BUILD SUCCESS`, 45 testes executados, 0 falhas, 0 erros, 0 ignorados; compilação de 154 fontes principais e 17 fontes de teste; JAR repacotado em `target/api-0.0.1.jar`. A suíte inclui teste de contexto, unidade, validação, serviço e integração real com PostgreSQL descartável. Não houve fallback para banco externo.

`git diff --check` retornou exit code 0; os avisos vistos são somente a política de conversão LF/CRLF do checkout. A busca estática por `LocalDate.now()`, `LocalDateTime.now()` e `Instant.now()` sem relógio não encontrou ocorrências nos diretórios de `utils`, `service` e `domain`, nem no `TokenService`.

### Mapa do schema temporal afetado

| Tabela.coluna | Tipo confirmado em PostgreSQL | Decisão nesta tarefa |
|---|---|---|
| `transactions.date` | `date` | Data civil mantida. |
| `card_transactions.date` | `date` | Data civil mantida. |
| `transactions.created_at` | `timestamp without time zone` | Legado mantido; origem não convertida em massa. |
| `card_transactions.created_at` | `timestamp without time zone` | Legado mantido; novos valores usam hora do produto. |
| `goal_history.date` | `timestamp without time zone` | Legado mantido; novos históricos relevantes usam o relógio injetado. |
| `invest_transactions.date` | `timestamp without time zone` | Legado mantido; dia explícito da operação é preservado. |
| `users.recovery_token_expiry` | `timestamp without time zone` | Limite calculado no relógio do produto, sem troca de tipo. |

Não houve troca de tipo, portanto criar migração agora inventaria proveniência e violaria o fora de escopo. O mapa fica como entrada para a CF-017.

Em complexidade, parsing, validação e cálculos de calendário continuam O(1). Cada operação passou a capturar o relógio uma vez, também O(1), evitando divergência intraoperação. Nenhuma consulta, relacionamento JPA ou cardinalidade foi adicionada; assim, esta mudança não introduz N+1. Os padrões de consulta e o custo de varredura já existentes nos crons não foram redesenhados e permanecem sob CF-025/CF-024.

## Verificação adversarial

Foi criada uma cópia temporária isolada do backend, nunca o checkout, e aplicadas em conjunto três regressões deliberadas:

1. remoção do desserializador estrito de `LocalDate`;
2. troca de `LocalDate.now(clock)` por `LocalDate.now()` no fechamento de faturas;
3. troca do limite de recuperação `!expiry.isAfter(now)` por `expiry.isBefore(now)`.

Comando da cópia, em JDK 21 e JVM UTC:

```powershell
mvnw.cmd --batch-mode -Duser.timezone=UTC -Dtest=TemporalJsonContractTest,CredentialExpiryClockTest,ScheduledCalendarClockTest test
```

Resultado: exit code 1; 24 testes, 4 falhas causais. Jackson voltou a aceitar ano zero e timestamp, a recuperação passou a aceitar o instante exato de expiração e a fatura fechou antes da meia-noite de São Paulo. A cópia temporária foi removida depois da execução e `Test-Path` confirmou ausência. O código real permaneceu íntegro e passou no `clean verify` posterior.

Nenhuma assertion, timeout, snapshot ou regra foi relaxada. As únicas mudanças de harness foram fornecer infraestrutura exigida pelo contexto e um `Clock` fixo; os resultados esperados permaneceram independentes.

Na auditoria posterior ao primeiro gate verde, foi identificado que o evento interno de pagamento convertia a hora para `String`; um relógio real com nanos produziria formato fora de `HH:mm:ss`. O evento passou a carregar `LocalTime` e `InvoiceBankOperationListenerTemporalTest` comprova a preservação de `23:30:45.123456`. O teste direcionado e o `clean verify` completo posterior passaram; por isso, somente o gate de 45 testes é considerado final.

## Revisão e pendências

- Controllers e envelope de erro não foram alterados. Restam `LocalDate.now()` no default de ano de `AnnualSummaryController` e `Instant.now()` em `ResourceExceptionHandler`; defaults HTTP, status/envelopes e testes web pertencem explicitamente à CF-008.
- Campos legados `LocalDateTime`/`timestamp without time zone` e anotações automáticas de criação/atualização não possuem proveniência suficiente para conversão segura. A CF-017 deve decidir migração a partir do mapa acima; esta tarefa não fingiu UTC nem alterou produção.
- O horário opcional continua armazenado no `created_at` legado `NOT NULL`; quando ausente, os serviços capturam a hora do produto. Separar “hora não informada” de “hora gerada” exigiria mudança de contrato/schema e não foi feita.
- Regras financeiras completas de fechamento/vencimento em mês curto pertencem à CF-019; semântica de prazo de metas, à CF-020; semana/streak/idempotência dos hábitos, à CF-022. Aqui foi estabilizado o relógio usado pelas regras atuais, sem antecipar decisões desses domínios.
- A validação não incluiu endpoint HTTP real, frontend, navegador, deploy, banco de produção, Railway, e-mail ou APIs externas. O fluxo navegador → API → PostgreSQL fica para a CF-007; contratos de erro HTTP ficam para a CF-008.
- O build exibe avisos não bloqueantes já conhecidos: dialect PostgreSQL explícito e autoanexação do Mockito. Nenhum warning foi suprimido para aprovar a tarefa.
- Não houve revisão independente. A conclusão é limitada aos critérios da CF-006 e não implica ausência absoluta de bugs.

Dependências: a CF-007 fica integralmente liberada, pois CF-002, CF-003, CF-005 e CF-006 estão concluídas. CF-019 passa a ter CF-006 satisfeita, mas ainda aguarda CF-016, CF-017 e CF-018. CF-022 passa a ter CF-006 satisfeita, mas ainda aguarda CF-017. Nenhuma tarefa seguinte foi iniciada ou teve seu estado alterado.
