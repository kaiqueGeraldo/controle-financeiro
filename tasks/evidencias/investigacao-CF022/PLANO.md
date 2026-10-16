# Investigação CF-022 — 16/10/2026

Base e1c63120129f202440992f29276fa4372111513a, branch codex/cf022-investigacao.
Nenhum produto será corrigido. Oracles: SPEC-002/AC-TIME-010 e DEC-08.

| Critério | Esperado | Aceite existente | Pendência / camada | Verificação dirigida |
|---|---|---|---|---|
| Dia único / reversão | 04/01/2027, meta 0→1→0, um log PENDING após desfazer | Revisão conjunta CF022/023, tabela DEC08 e mutações | RJ-022-01: semanal sem POST; navegador/harness | Mesma sequência DAILY→WEEKLY; DOM, eventos, rede, calllog e releitura PG; clock completo versus Date-only |
| Calendário e semana | Brasília para hoje/cron; segunda–domingo; semana aberta streak0 | Revisão conjunta e probes runtime UTC/SP/Kiritimati; CF006/RD58 posterior | Não reabrir regra aceita | Preservar payload literal e expected na jornada |
| Scheduler repetido | callback registrado, ShedLock real, um dia FAILED, streak0 após retry | Revisão conjunta; contraprova sem SchedulerLock | H24-01: segundo callback >10s, socket PG; causa não capturada | Callback fresco versus 501 fixtures residuais; observar inventário, pool, pg_stat_activity/pg_locks; comparar LAZY atual com EAGER anterior em cópia |
| Evidências sensíveis | Originais preservados, falhas não apagadas, revisão independente | Política de testes | Causas históricas sem observação suficiente | Hash dos originais; distinguir demonstração atual de inferência histórica |

Hipóteses: RJ relógio/animação confirma-se com impedimento observável ao click e contraste de clock, refuta-se no recorte se não houver impedimento em ambos; verde isolado não encerra história. H24 carga residual confirma-se por inventário crescente e tempo/SQL; lock requer bloqueador PG, pool requer saturação observada; EAGER pode explicar consulta de coleção, não prova sozinho o timeout antigo.

Experimentos limitados: dois modos de browser; dois modos de fetch do scheduler, cada um com fixture fresca e 501 adicionais. Falha ambiental será preservada e corrigida somente para tornar a comparação executável. Nenhum retry automático, timeout ampliado, animação desativada ou banco externo. Instrumentação só na exportação isolada. Após resultados, decidir se há causa comprovada ou experimento adicional discriminante.
