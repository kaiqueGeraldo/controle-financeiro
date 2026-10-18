# Matriz final — revisão independente de 0bab205

Contrato: [DEC-08](../CF-022/CONTRATO.md), SPEC-002/AC-TIME-010 e os quatro
critérios canônicos CF-022. Planejamento pré-execução em [PLANO](PLANO.md).

| Critério canônico | Expected | Evidência/aceite anterior reutilizado | Relação RJ/H24 e verificação atual | Parecer / lacuna |
|---|---|---|---|---|
| 1. Mesmo dia sem duplicidade; desfazer reverte | Um log por hábito/dia, meta 0→1→0; outra contribuição intacta | [Revisão conjunta CF022/023](../revisao-CF-022-CF-023/README.md), tabela DEC08: concorrência, identidade, ownership, rollback e SQL; mutações causais | Oito jornadas da investigação conferidas: 16 requests de toggle com data explícita, 16 respostas200; quatro PENDING/metas0 por modo no SQL terminal. Assertions browser/Java mantidas | Atendimento funcional aceito no recorte. Nenhuma regressão concreta reabre o backend. Confiabilidade do harness fica no critério4 |
| 2. JVM não desloca dia; virada semanal preserva meta | Produto SP, semana seg–dom inclusive ano novo; aberta streak0, fechamento2 dias streak1 | Mesma revisão: default JVM alterado realmente em três fusos, fronteira e mutação temporal; CF006 [RD58](../revalidacao-RD58/README.md) posterior integrado | Proxy Date-only preserva Date.now/new Date/constructor explícito e diaProduto04/01 em SP/Kiritimati, 16 observações novas; original e Date-only enviam04/01 nos dados integrados | Atendido. Clock fixo não prova avanço de meia-noite em aba aberta; esse comportamento continua sustentado pelos aceites temporais anteriores, não por este probe |
| 3. Duas execuções/retry preservam ofensiva/histórico | Worker registrado recusa outro nó; executa após unlock e repete após expiração; um FAILED/streak0 e nenhum progresso extra | Mesma revisão: ShedLock real + mutação sem lock, retry/rollback/concorrência; [CF025 matriz1–4](../revisao-CF-025-CF-027-RV24/MATRIZ.md) aceita LAZY e consumidores | Novo probe usa assertions originais/10s; três fixtures passam, 2→1006→2 leituras, SQL1→503→1 FAILED; zero GoalHistory final | Atendimento funcional preservado/confirmado. H24 histórico não demonstra corrupção ou contrato violado. Isolamento entre testes pendente no critério4 |
| 4. Evidências/limites e testes não enfraquecidos | Evidência verificável, fixtures isoladas e relógio apropriado, sem falso verde, retries cegos ou assertions removidas | Política de testes, revisão conjunta e investigação com falhas preservadas | 134 hashes do candidato conferidos; oito jornadas e quatro combinações revisadas. Novas contraprovas confirmam defeito atual de harness e dependência de dados residuais | **Pendente exclusivamente de saneamento do harness de hábitos e isolamento dos casos de cron**, seguido de validação dirigida. Documentação da investigação aprovada; o checkout ainda contém ambas as fragilidades |

Não se exige reconstrução impossível dos instantes antigos para fechar a tarefa.
As ocorrências históricas podem permanecer registradas como inconclusivas e não
bloqueantes após o saneamento atual comprovado. O bloqueio desta decisão decorre
de problemas presentes de prova reproduzível exigida pela política, não do status
anterior nem da ausência de causa histórica. Não é exigência de benchmark/SLA novo.

CF006 concluída e fundação CF017 liberada localmente são suficientes ao recorte.
[Reconferência CF017](../reconferencia-CF-017/README.md) e canônico CF029 mantêm
V1–V14/restore/upgrade locais; adoção real CF017/P01/P02 não foi reaberta ou aceita.
CF029 depende de CF017/023/028, não de CF022: nenhuma nova aresta criada. Sua
prontidão exclusivamente local/descartável permanece, sem início de execução.

Preservados RVA03 encerrada, CF019/013 concluídas, aceites CF011/012/014;
CF010/015 ainda exigem zoom nativo200%. Não houve aceite global/publicação.
