# Execuções — 14–15/10/2026

Todos os bancos foram criados pelo Testcontainers, PostgreSQL16.15. Não existe
fallback externo no harness. JDK Temurin21.0.12.1+1; Maven3.9.12; Spring Boot4.0.2;
Flyway11.14.1; Testcontainers2.0.3; Docker Engine29.6.2/Desktop4.83.0.
Imagem `postgres:16-alpine`, digest consultado após retomada:
`sha256:cf78e76683b9ca8c5733cbbdce6c9262b45b6767934dd0a95e671f9a0fc20685`.

## Sequência e resultados preservados

| Log | Resultado | Interpretação |
|---|---|---|
| original-red.log | 3 testes, 2 falhas, 0 erros/skips | Fixture compatível passou; FK removida aceita; alteração de1µs no bruto não mudava fingerprint. Vermelho causal antes de alterar os helpers |
| manifest-generation.log | 1 teste passou | Projeção inicial da V1 imutável em PostgreSQL descartável; gerador temporário foi convertido em teste de confronto exato com o inventário versionado |
| preflight-first.log | 26 testes passaram | Primeira matriz adversarial e confronto da V1 |
| restore-first.log | 28 testes, 14 falhas, 0 erros/skips | Restauração executou, comparação recusou representação distinta dos casts dos CHECKs; não foi ignorada |
| restore-diagnostic.log | 1 teste, 1 falha | Preservou catálogo antes/depois para explicar a diferença; mesmos literais, cast de array distribuído pelo PostgreSQL |
| verification-second.log | 50 testes passaram | Normalização semântica estreita e contraprovas materiais passaram |
| final-verify.log | 70 testes passaram; verify/repackage aprovado | Inclui testes de migração vazia/legada, Hibernate, V13→V14 e consumidores temporais |
| resume-compilation-failure.log | Falha de compilação, nenhum teste executado | Complemento de prova de restore parcial importou Transferable no pacote errado; corrigido pelo JAR instalado, sem alterar assertions |
| final-complete-verify.log | 71 testes passaram; verify/repackage aprovado | Fonte primária do resultado final; inclui rollback de DDL parcial, checksums e snapshots preservados |
| cli-build.log / cli-compare.log | Build e CLI exit0, RESTORE=EQUIVALENT | Comando operacional do runbook conferido, comparação dos34 arquivos preservados sem conexão a DB |

`final-verify.log` corresponde ao estado anterior aos últimos complementos de
evidência/erro de restore; não é apresentado como execução desses complementos.
A interrupção por limite de uso ocorreu após aquela execução terminar. Uma consulta
escalada de versões foi impedida porque o revisor automático não pôde rodar, não
por decisão de risco. Após autorização de continuação do usuário, o acesso voltou;
consulta de versões/hash e nova validação foram executadas normalmente.

## Comandos

Pasta de execução: `controle-financeiro-backend`. JDK21 existente localizado pela
referência `tasks/evidencias/revisao-CF-025-CF-027-RV24/runtime-path.txt` (caminho local
do executor; outros operadores devem fornecer seu próprio JAVA_HOME).

```powershell
$env:JAVA_HOME=(Get-Content ../tasks/evidencias/revisao-CF-025-CF-027-RV24/runtime-path.txt -Raw).Trim()
$env:PATH=$env:JAVA_HOME+'/bin;'+$env:PATH
./mvnw.cmd --batch-mode '-Duser.timezone=UTC' `
  '-Dmaven.repo.local=C:/Users/Aluga.com/.m2/repository' `
  '-Dtest=Cf017ManifestTest,Cf017OriginalFindingsTest,Cf017PreflightTest,Cf017RestoreTest,EmptyDatabaseMigrationIntegrationTest,LegacyDatabaseMigrationIntegrationTest,GoalHistoryUpgradeTest,TemporalCompatibilityIntegrationTest' verify
```

O primeiro vermelho usou somente `-Dtest=Cf017OriginalFindingsTest test`, sem o
override de timezone. Rodadas intermediárias estão identificadas por classe/log.
Sem clean. O sandbox inicialmente impediu lock de ref Git e pipe Docker; operações
autorizadas foram executadas com aprovação de acesso, sem afrouxar guards do banco.

Comandos reais do ciclo, chamados dentro do contêiner pela API Testcontainers:

```text
pg_dump -U <synthetic-user> -d <owned-disposable-db> --schema=<fixture-schema> --format=custom --snapshot=<live-exported-snapshot> --file=/tmp/<fixture-schema>.dump
sha256sum /tmp/<fixture-schema>.dump
stat -c %s /tmp/<fixture-schema>.dump
pg_restore -U <synthetic-user> -d <new-owned-disposable-db> --exit-on-error --single-transaction --no-owner --no-privileges /tmp/<fixture-schema>.dump
```

Cada chamada tem exit code verificado; dumps/restores íntegros exigem stderr vazio.
Na contraprova de falha, um TOC sintético omite apenas CREATE SCHEMA; destino contém
uma tabela users conflitante, encontrada depois de DDLs anteriores. Exit não zero
é exigido e snapshots provam que toda a criação parcial foi revertida.
Esse TOC é exclusivo da contraprova, não substitui o dump completo nas comparações.

## Inspeção/preservação

`git diff --check`; diff staged inspecionado antes de cada commit; staging explícito.
`git merge-base --is-ancestor 4206d88 HEAD` comprovou base, sem buscar main remota.
Migrações V1–V14, configuração Flyway/Hibernate, pom e fixture original sem diff.
Hashes de evidências originais mantidos em original-hashes.txt. README raiz somente
reconferido por SHA-256; nunca editado ou staged nesta execução.

Logs Flyway incluem falha deliberada de V2 seguida de rollback/recuperação. Warnings
existentes de Mockito self-attach e Hibernate dialect não foram ocultados. Não foi
executada suíte integral financeira/UI, benchmark ou nova revisão de03-integridade.

Os snapshots preservados e manifesto de hashes da prova final pertencem a dados
sintéticos; dumps binários permanecem somente no contêiner descartável e são
reproduzíveis pelos testes. A igualdade dos dados é independente dos bytes do dump.
`.gitattributes` restrito a esta pasta preserva bytes de logs/capturas/snapshots em
checkout e não remove os espaços originais do Maven nem a linha vazia que representa
ausência de sequences. Exceções de whitespace se limitam a essas evidências brutas;
código, SQL e documentação continuam sujeitos ao diff check normal.
