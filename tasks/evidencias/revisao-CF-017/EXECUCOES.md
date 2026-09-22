# Execuções da revisão CF-017

Data: 22/09/2026. JDK dirigido: Eclipse Temurin 21.0.12.1. PostgreSQL:
`postgres:16-alpine` descartável via Testcontainers 2.0.3/Docker 29.6.2.

## Estado e diff

```text
git status --short --branch
## main...origin/main [ahead 33]
 M README.md

git rev-parse HEAD
d3fcb35b99780d4efbe7c0bcff023a3eb971b16c

git diff --check 2269b22..d3fcb35
exit 0
```

O staging estava vazio. O primeiro Maven no sandbox não foi contado como teste:
falhou ao acessar o repositório local (`C:\.m2`); a segunda tentativa compilou até
o sandbox impedir leitura/fechamento de recurso do cache. O comando válido foi
repetido fora do sandbox, com JDK/repositório explícitos e banco descartável.

## Migrações e compatibilidade

```powershell
$env:JAVA_HOME='C:/Users/Aluga.com/AppData/Local/Temp/cf006-jdk21/jdk-21.0.12.1+1'
./mvnw.cmd --batch-mode '-Duser.timezone=UTC' `
  '-Dmaven.repo.local=C:/Users/Aluga.com/.m2/repository' `
  '-Dtest=EmptyDatabaseMigrationIntegrationTest,LegacyDatabaseMigrationIntegrationTest,TemporalCompatibilityIntegrationTest' test
```

Resultado: **16 testes, zero falhas/erros/skips, BUILD SUCCESS**.

- banco vazio: 5 testes;
- legado/backup-restore: 2 testes;
- compatibilidade temporal/writers: 9 testes;
- V2 mutante falhou e o log do Flyway confirmou rollback;
- plano sintético usou `idx_transactions_user_temporal_order` para 20 mil linhas.

Esses números não certificam produção nem desempenho.

## Probe adversarial do preflight

Foi criado temporariamente `Cf017PreflightReviewProbeTest` e removido depois da
execução. Cenário: fixture V1 → remover `accounts_user_id_fkey` → executar preflight
→ baseline V1 → migrate V2.

```powershell
./mvnw.cmd --batch-mode '-Duser.timezone=UTC' `
  '-Dmaven.repo.local=C:/Users/Aluga.com/.m2/repository' `
  '-Dtest=Cf017PreflightReviewProbeTest' test
```

Resultado: **1 teste verde**, confirmando o falso negativo: preflight aceitou a
FK ausente, baseline foi criada e V2 aplicada. O teste afirmava explicitamente
que nenhuma exceção ocorria e que `successfullyBaselined=true`/uma migração era
executada; portanto o verde comprova o defeito, não o comportamento desejado.

Após remover o probe, `git status --short` voltou a mostrar somente o README
preexistente antes da criação dos documentos desta revisão.

## Correções documentais temporais

```powershell
foreach ($zone in @('America/Sao_Paulo','UTC','Pacific/Kiritimati')) {
  $env:TZ=$zone
  node controle-financeiro-frontend/src/types/temporal-contract/validate.mjs
}
```

Resultado em cada fuso: **exit 0**, 22 grupos, 21 exemplos, 43 campos Java,
16 campos TypeScript e 12 links locais. Confirma D16-T01 e a referência literal a
`Transaction.time`; o próprio verificador declara que não executa aplicação/DB.
