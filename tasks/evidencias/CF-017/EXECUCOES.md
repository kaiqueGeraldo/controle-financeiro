# Execuções CF-017

Todos os bancos abaixo são PostgreSQL 16 descartáveis criados pelo Testcontainers.
O guard exige host loopback e nome `cf_test_*`; não existe fallback externo.
O código exercitado corresponde ao commit
`ae494c0be844dc1d7fa3d39073ab2acef2005533`; documentação/evidências ainda
estavam fora do commit e não alteram runtime.

## Sequência causal

1. Primeira compilação falhou porque o guard CF-002 era package-private; ele foi
   tornado público sem mudar suas assertions/regras, permitindo reuso pela CF-017.
2. Primeira integração falhou em `missing table [accounts]`: o URL Testcontainers
   já continha query string e `currentSchema` fora concatenado com segundo `?`.
   A composição passou a usar `&` quando necessário.
3. Hibernate validate então rejeitou `categories.is_system_reserved` NOT NULL,
   expondo diferença entre DDL manual e nulabilidade JPA. Um schema `create-drop`
   descartável foi inventariado e removido; V1/fixture foram corrigidas sem gerar
   a fixture a partir das entidades.
4. O teste de falha injeta `ALTER TABLE` seguido de divisão por zero. O log de erro
   é esperado; assertions confirmam rollback da coluna e ausência de V2 no history,
   seguida de recuperação com a V2 real.

## Comandos finais

```powershell
$env:JAVA_HOME='C:/Users/Aluga.com/AppData/Local/Temp/cf006-jdk21/jdk-21.0.12.1+1'
$env:MAVEN_USER_HOME='C:/Users/Aluga.com/.m2'
./mvnw.cmd --batch-mode -Duser.timezone=UTC -Dtest=EmptyDatabaseMigrationIntegrationTest,LegacyDatabaseMigrationIntegrationTest,TemporalCompatibilityIntegrationTest test
node controle-financeiro-frontend/src/types/temporal-contract/validate.mjs
./mvnw.cmd --batch-mode -Duser.timezone=UTC verify
```

Execução focada aprovada: 16 testes, zero falhas/erros/ignorados. Inclui banco
vazio, legado, versionado, checksum, falha/recuperação, pg_dump/restore,
Hibernate validate, HTTP temporal após upgrade e nove cenários temporais existentes.

Medição sintética observada nessa execução: 20.000 transações; Index Only Scan no
índice temporal; planning 0,401 ms, execution 0,080 ms; V1 146 ms, V2 20 ms. Não é
benchmark nem projeção de duração/lock em produção.

`verify` completo em JVM UTC: **111 testes**, zero falhas/erros/ignorados, JAR
reempacotado, `BUILD SUCCESS` em 1 min 05 s. O inventário documental passou em
America/Sao_Paulo, UTC e Pacific/Kiritimati: 22 grupos, 21 exemplos, 43 campos
Java, 16 TypeScript e 12 links. Logs: [backend](backend-verify.log),
[São Paulo](inventory-sao-paulo.log), [UTC](inventory-utc.log) e
[Kiritimati](inventory-kiritimati.log).

Warnings conhecidos: dialect PostgreSQL explícito e agente Mockito; nenhum foi
transformado em falha de migração. O erro de V2 exibido no log é o cenário
adversarial esperado e é seguido por assertions de rollback/recuperação verdes.
