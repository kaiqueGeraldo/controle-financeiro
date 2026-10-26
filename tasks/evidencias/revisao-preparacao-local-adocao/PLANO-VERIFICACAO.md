# Revisão independente — plano e critérios

Entrada: 6f70a877cd7c9c0024445026bec43931c8fbcba7, branch codex/preparacao-local-adocao;
base 46b85ee0428abb55c22d27d26284d054410ec128. Revisão em execução em 26/10/2026.
README raiz modificado preexistente fica fora do staging. Nenhuma implementação
de produto, runner, infraestrutura ou gate será corrigida neste lote.

| Requisito / contrato esperado | Alteração responsável | Prova existente | Verificação independente planejada | Limite / condição de encerramento |
|---|---|---|---|---|
| PG16/17 real: catálogo mantém estrutura/constraints | PgSchemaInventory, catalog.sql, suporte de teste | Matrizes p03, versões 16.15/17.11 | Conferir diff, major e clientes; reexecutar migração/preflight/restore nas duas majors | Não certifica banco real; aprovar somente majors efetivamente executadas |
| Preflight read-only recusa drift; restore compara conteúdo/estrutura/sequences/history | RestoreSnapshot/CLI | Contraprova FK; dumps e adversariais p03 | Executar casos dirigidos; conferir fixture legada independente, normalização e oráculos | Não inclui globals/RLS/ACL do alvo; divergência relevante bloqueia |
| Bootstrap adoption não migra e exige validate antes de persistência | AdoptionSafetyInitializer, perfil, spring.factories | 11 overrides + ambiente; banco vazio/incompatível | Executar pacote efetivo e controles de precedência | Sem falha por ambiente/import; SQL antes/depois deve ser igual |
| Ingresso fechado não escreve nem chama externos; jobs não registrados | MaintenanceFilter, OperationsState, SchedulerConfig, EmailService | HTTP/SQL/snapshots, jobs e e-mail | Contratos reais e contraprovas isoladas centrais; análise async/listeners/inicializadores | Flags por processo; drenagem de trabalho anterior e outros writers são operacionais |
| Probes mínimos: liveness independente do DB, readiness fecha em manutenção/DB indisponível | HealthController e segurança | Pausa/retorno DB + JWT, 1050ms | Reexecução por JAR/imagem; observação inicial e após DB voltar | Pool/acquisition/socket têm custos distintos; não certifica monitor do provedor |
| Preview identificado não acessa cookies/body/upstream | BFF e vercel.json | 14 contratos; seis de preview | Rever caminhos e ausência de VERCEL_ENV; reexecutar BFF | Deploys antigos/manual/API e exposição das system envs são pré-condições remotas |
| Pacote efetivo vinculado ao produtor e imagem | Dockerfile.release, manifestos | 831 inputs, 22 recursos e hash do JAR | Verificar bytes, blobs, recursos, imagem local e delta produtor→HEAD | Sem alegar build de HEAD, reprodução binária ou registry |
| Startup de 40s: observar evento correto e causa | AdoptionRuntimeTest.App | Falhas Windows/Linux preservadas | Extrair timeline original; executar controle 40s intacto e diagnóstico limitado 100s com thread dump | Diagnóstico longo nunca transforma falha de 40s em aprovação |
| Remoto atual e plano concreto | Railway/Vercel control planes | Inventário anterior | Metadados atuais e UI de campos omitidos; classificar destino sem imprimir valores protegidos | Sem DB/HTTP real, ativação, deploy ou mudança de configuração |

Resultados e decisões finais serão registrados separadamente. Aceites anteriores
e gates CF017/P01/P02, CF034 integral, expanded, zoom e sucessoras permanecem até
evidência/decisão específica. O plano A–D não será escolhido sem inventário real.
