# CF-030 — execuções locais e investigação causal

Todas as execuções usam JDK21, Maven Wrapper e PostgreSQL16 criado pelo
Testcontainers. O perfil de teste parte de URL sentinela inválida e não admite
fallback externo. Email e consulta de mercado são doubles. Flyway+`validate` é
obrigatório nos testes de aplicação, migração, intenção e revisão de inventário.
Relatórios de execuções sobrepostas não representam casos únicos adicionais.

## Histórico preservado

| Pasta/log | Casos | Resultado | Investigação / correção |
|---|---:|---|---|
| compile-initial.log | compilação | falha | Jackson3 devolvia tipo base no deepCopy; cast explícito para ObjectNode |
| integration-initial | 10 | passou | primeira aplicação E01, atomicidade, replay e duas confirmações |
| regression-core | 190 | 1 erro | guard sobrescrevia orçamento de lock500ms com5s; corrigido para preservar orçamento menor; timeout/assertion originais mantidos |
| extended-initial | 25 | passou | precisão, reservas e regressão dirigida do lock500ms |
| lifecycle-initial | compilação | falha | expressão AssertJ com wildcard; comparação explícita das mesmas duas combinações esperadas |
| capacity-migration-lifecycle | 10 | 1 erro | fixture V15 SYSTEM_INITIALIZED sem metadados obrigatórios da V3; corrigida fixture; constraint preservada |
| validation-current | 38 | passou | lifecycle, migração, custo, reservas parciais e pagamento cotidiano após E01 |
| pre-counterproof | 30 | passou | vetor canônico aprovado, falha posterior ao recibo/estado terminal e controle de aplicação |
| verify-candidate | 534 | 1 falha,78 erros | falha CF019: fixture manual de cron devolvia proxy detached e não injetava guard novo. Erros de contexto seguintes: PostgreSQL too many clients, não resultado financeiro |
| verify-final | 535 | 2 falhas,0 erros | CF025 detectou duas consultas adicionais do guard em reorder de hábitos, inclusive comandos inválidos/vazios; retirado guard somente dessa ordenação visual |
| verify-corrected | 504 | passou,0 ignorados; BUILD SUCCESS | candidato corrigido; CF025 original7/7, CF02430/30 e exclusão36/36; test+package/verify completos |
| mutation-stale-review | 1 | falhou como esperado,0 erros | revisão antiga foi aceita sem checagens; faltou409 |
| mutation-double-opening | 1 | falhou como esperado,0 erros | SQL de contas encontrou2500 em vez de1300 |
| mutation-partial-commit | 1 | falhou como esperado,0 erros | saldos1300 em vez de0 após falha posterior a recibo/COMPLETED |
| mutation-uncertain-new-source | 1 | falhou como esperado,0 erros | aumento em nova fonte incerta foi permitido; faltou bloqueioE28 |
| counterproof-restored | 21 | passou,0 ignorados; BUILD SUCCESS | aplicação11, rollback terminal1 e reservas9 na mesma cópia restaurada |

Em CF019, a fixture passou a usar a consulta com fetch que o cron já exige e a
injetar o guard real. Nenhuma expectativa de rollback/fechamento/notificação foi
alterada. Em `run.ps1`, o cache de contextos Spring foi limitado a8: cada contexto
mantém seu pool Hikari, e32 pools de até10 conexões excediam o limite100 do
PostgreSQL descartável. Não se aumentaram limite do banco, timeout de teste ou
tentativas. O fonte do produto não mudou por essas duas correções de infraestrutura.

A execução seguinte verify-final eliminou a falha CF019 e os78 erros de contexto,
e trouxe a regressão real de custo CF025. Não se mudou nenhuma assertion da CF025:
ordenar hábitos só altera order_index de hábitos, ausente do inventário consumido.
O guard foi retirado desse caminho, sem retirar a coordenação dos comandos de
hábitos que afetam progresso numérico. Preserva lote único, SQL zero para comando
inválido/vazio, rollback e custo constante3→30→120. Esse é o único diff de src
entre o candidato de verify-final e o de verify-corrected.

`verify-candidate` compilou antes dos últimos ajustes de inventário UTC, filtro de
histórico, reuso de fatura vazia e tratamento de ajuste legado negativo; seu log é
histórico, não certificação do candidato final. `reviewed-source-and-copy-sha256.json`
identifica os400 arquivos de src de verify-final/cf030-counterproof-reviewed.
`release-source-and-copy-sha256.json` identifica o candidato corrigido congelado
para verify-corrected/cf030-counterproof-ready. Manifests/cópias anteriores foram
preservados, sem substituição.

## Comandos

O runner `controle-financeiro-backend/src/test/cf030/run.ps1` exige nome inédito,
preserva logs/relatórios por execução, registra horários/resultado e oculta apenas
JWTs sintéticos. Não executa clean. O JDK21 existente em target é reutilizado.
O parâmetro `-Tests` de cada `execution.json` contém a seleção literal reproduzível;
`goal` indica test/verify. A execução ampla inclui os contratos CF029, regressões
CF018/019/020/021/024/025, intenção, exclusão, segurança/isolamento, temporalidade e
fixtures de hábitos, além de todos os testes novos CF030.

```powershell
& ./controle-financeiro-backend/src/test/cf030/run.ps1 -Name revisao-cf030-dirigida -Tests 'Onboarding*Test,DraftValidatorTest,Cf019CardIntegrationTest,Cf024ConcurrencyCacheIntegrationTest,Rv24DeletionIntegrationTest' -Verify
```

Para repetir exatamente a seleção final em nova execução, sem editar relatórios:

```powershell
$execution = Get-Content tasks/evidencias/CF-030/verify-corrected/execution.json -Raw | ConvertFrom-Json
& ./controle-financeiro-backend/src/test/cf030/run.ps1 -Name revisao-cf030-ampla -Tests $execution.tests -Verify
```

## Contraprovas isoladas

`mutations.ps1` só aceita uma cópia no diretório dedicado de contraprovas, nunca o
backend principal. Cada mutação salva bytes originais, altera uma regra crítica,
executa um oracle, guarda diff/log e restaura no finally com SHA256 idêntico.
Retorno não zero só conta como contraprova se a causa for a assertion esperada,
não falha de compilação/ambiente. O controle positivo final executa aplicação,
reservas e rollback na mesma cópia restaurada.

| Mutação | Oracle independente |
|---|---|
| remover frescor de inventário/review | confirmação de revisão antiga deve409, sem efeitos |
| duplicar abertura CREATE de conta | E01 deve persistir1300 em contas; mutante gravou2500 (default100 preservado) |
| permitir commit em exceção posterior ao recibo | falha deve deixar saldos/recibo/COMPLETED ausentes e PREPARED recuperável |
| permitir aumento em fonte incerta | E28 deve preservar bloqueio; ID novo não comprova independência |

```powershell
$reviewId='review-'+(Get-Date -Format yyyyMMdd-HHmmss)
& ./controle-financeiro-backend/src/test/cf030/mutations.ps1 -Prefix $reviewId -Backend 'C:\Users\Aluga.com\.codex\visualizations\2026\10\20\01a1570b-cd5c-77c0-b013-cf54480e8e48\cf030-counterproof-ready'
```

As falhas históricas acima permanecem no lote. Cada resultado de mutação inclui
seu próprio execution.json, mutation.diff, maven.log e relatórios XML/TXT; o
agregado mutations.json registra a restauração byte a byte dos fontes alterados.

O teste cujo nome termina AndCache verifica diretamente saldos, posições, recibo
e estado da sessão. Não mede isoladamente o cache nessa contraprova. A garantia
de invalidação reutiliza os listeners AFTER_COMMIT existentes, inspecionados, e as
regressões CF024 de rollback/commit/owner executadas na seleção ampla.

Depois do controle verde, foi acrescentado apenas o parâmetro opcional Prefix ao
runner de mutações para o revisor gerar nomes novos sem sobrescrever evidências.
Casos, âncoras, oracles, timeout e restauração não mudaram. Parsing PowerShell
validado sem erros; não se repetiu a suite financeira por essa opção de nome.
O runner efetivamente executado foi preservado em mutation-runner-executed.ps1.
`review-runner-validation.json` e `delivered-source-sha256.json` identificam essa
única diferença de infraestrutura posterior; nenhum fonte Java/SQL mudou.

Verify-corrected repete os504 casos da seleção ampla, exceto os31 de
HabitFixtureIsolationIntegrationTest já verdes em verify-final. A classe e as
fixtures CF022 não mudaram, não chamam reorder e sua nova execução não acrescentaria
prova da correção de uma linha. HabitIntegrityIntegrationTest, CF025 completo e os
testes temporais permanecem na seleção corrigida. Não se somam essas execuções
como535 casos rodados novamente sobre o candidato corrigido.

## Custo observado no candidato congelado

As linhas `CF030_COST` e `CF030_LEGACY_COST` de verify-corrected medem o DataSource
efetivamente usado, não mocks de repositório. Caso pequeno:1 conta. Caso máximo
válido:50 contas,50 posições,100 metas,200 alocações,20 cartões com600 parcelas
futuras e120 previsões;1140 tempIDs, request246595 bytes. Oráculos: contas50000,
investimentos25000, dívida600, patrimônio74400 e reservas200.

| Medida | Pequeno | Máximo |
|---|---:|---:|
| SELECTs em prepare, incluindo leitura da sessão | 25 | 26 |
| SELECTs em complete | 19 | 22 |
| Tempo de prepare observado | 90,3ms | 431,8ms |
| Tempo de complete observado | — | 10604,3ms |

O acréscimo constante cobre as referências/tipos presentes apenas no caso máximo;
não há SELECT por parcela ou alocação. Inserts/updates crescem com itens, e as
asserções não exigem tempo absoluto. Prepared211024 bytes; recibo240563 bytes.
O ensaio de1000 fontes **existentes** preservou todas no resumo:25 SELECTs,
754,9ms e prepared624066 bytes (maior que o teto de request, corretamente).
Heap usado observado antes/depois:183504880/268657768 bytes. Não é pico medido,
limite de heap, medição isolada de alocação ou benchmark de produção. O orçamento
32MiB limita bytes serializados, não promete consumo máximo32MiB na JVM.

O ensaio anterior verify-final observou prepare343,4ms/complete3550,8ms no mesmo
caso máximo. Essa variação local reforça que contagem de queries e oráculos são
as garantias verificadas, não um SLA. Uma aplicação de10,6s pode fazer um writer
do mesmo owner esgotar seu orçamento de lock5s e receber409 recuperável.
