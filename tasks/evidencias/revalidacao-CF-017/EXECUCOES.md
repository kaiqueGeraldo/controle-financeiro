# Execuções independentes — 15/10/2026

Código bcec50c exportado por git archive, sem mudar checkout. JDK21 do arquivo
`../revisao-CF-025-CF-027-RV24/runtime-path.txt`; Maven wrapper3.9.12,
PostgreSQL16.15/Testcontainers. Caminho da cópia em isolated-path.txt.

Preparação: git status/branch/rev-parse/diffcached; merge-base --is-ancestor
4206d88 HEAD; log4206d88..HEAD; diffbcec50c HEAD vazio. Diff de migrações,
configuração e pom no intervalo vazio. Hash inicial/final do README preservado.
Aceites9fa4fae/a7bc256 ancestrais; deltas de segurança e SPEC inspecionados.

Na cópia isolada, pasta controle-financeiro-backend:

```powershell
$env:JAVA_HOME='<JDK21 local>'
$env:PATH=$env:JAVA_HOME+'/bin;'+$env:PATH
./mvnw.cmd --batch-mode '-Duser.timezone=UTC' `
  '-Dmaven.repo.local=C:/Users/Aluga.com/.m2/repository' `
  '-Dtest=Cf017ManifestTest,Cf017OriginalFindingsTest,Cf017PreflightTest,Cf017RestoreTest,EmptyDatabaseMigrationIntegrationTest,LegacyDatabaseMigrationIntegrationTest,GoalHistoryUpgradeTest,TemporalCompatibilityIntegrationTest' verify
# Copiar Cf017IndependentReviewTest.java desta evidência para src/test/java/com/controlefinanceiro/api/migration/ somente na cópia.
./mvnw.cmd --batch-mode '-Duser.timezone=UTC' `
  '-Dmaven.repo.local=C:/Users/Aluga.com/.m2/repository' `
  '-Dtest=Cf017IndependentReviewTest' test
```

| Execução | Resultado |
|---|---|
| verify.log | exit0;71testes,0falhas/erros/skips;3min45s locais |
| independent-probes.log | exit0;4testes,0falhas/erros/skips;33,960s locais |
| check-manifest.ps1, da raiz |19tabelas/158colunas/49constraints/11índices iguais ao DDL;exit0 |
| original-preservation.json |18/18 hashes históricos iguais |
| preservation.json | V1–V14 e YAML preservados |
| snapshot-hashes.json |34/34 pares before/final iguais após contraprova |

Não extrapolar tempos/volumes locais. Logs preservam warnings, falha Flyway
deliberada e rollback. Restore deliberadamente falho: `CF017_RESTORE_FAILURE
exit=1 targetUnchanged=true`. Probe de aprovação antiga consulta a ausência de FK
após baseline deliberadamente sem gate; não representa aceite do preflight atual.
Todos os recursos são criados pelo Testcontainers, bancos cf_test_* e schemas
exclusivos. Nenhum serviço real configurável da aplicação foi usado.

Primeiras tentativas de ambiente, não contadas como testes: Docker pipe negado no
sandbox; TEMP virtualizado não acessível ao comando escalado, que não encontrou
mvnw. Exportação refeita no segundo root gravável, com ErrorActionPreference Stop
e Test-Path. Acesso a Docker/cache aprovado; execuções válidas acima exit0. Não
houve rejeição de aprovação automática nem relaxamento do guard descartável.

O parser independente de DDL teve falha inicial de apresentação, transcrita da
saída da ferramenta em manifest-format-first.log: PostgreSQL apresenta REFERENCES users(id), enquanto
V1 escreve REFERENCES users (id). Ajustada somente a remoção desse espaço sintático
no parser da revisão; nenhuma expectativa de coluna/alvo/ação retirada. Não usa
catálogo produtivo, fixture ou expected gerado do resultado. Erro do harness não
classificado como defeito do candidato.

Snapshots duráveis copiados do output atual; fonte do probe arquivada aqui, fora
do source set produtivo. Nenhuma mutação de produto na árvore principal. Cópia
isolada mantida para reprodução; não é worktree/branch adicional. Commit de provas
separado do parecer/estados, staging explícito e diff staged inspecionado.

Commit de provas: `45c8c0086ee4884479c1d6806ab71505aa193561`. O commit documental
seguinte contém parecer/matriz/achados e atualização de CF-017/P01/P02/CF-029.
Ambos descendem diretamente de bcec50c, sem mudança de código/migrações testados.
