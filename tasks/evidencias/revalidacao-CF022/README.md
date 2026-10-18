# Revisão independente CF-022 — 16/10/2026

Execuções em 16/10; finalização documental e commits locais em 17/10/2026,
após retomada da conversa. Candidato examinado permanece o mesmo.

**Investigação aprovada com os limites abaixo; CF-022 permanece em_revisao.**
Critérios funcionais1–3 têm suporte suficiente. Critério4 exige saneamento restrito
do relógio do harness de hábitos e do isolamento das fixtures do cron, ambos
presentes no checkout e confirmados por contraprova. Nenhuma correção de produto
é justificada. Não é necessário provar retroativamente a causa dos dois timeouts.

Candidato: `e1c63120129f202440992f29276fa4372111513a..0bab2050fcb8edbd879f75bb1e9f154ef0deabd8`,
commits9cc4662/dcf0721/0bab205, branch `codex/cf022-investigacao`. HEAD inicial exato,
sem commits posteriores; README alheio e .cf22 preservados. [Execuções](EXECUCOES.md).

| Achado | Parecer | Saneamento |
|---|---|---|
| RJ-022-01 | Distorção atual causada pelo relógio completo confirmada; Date-only preserva calendário e remove o mecanismo. Timeout original30s semPOST continua inconclusivo, apenas compatível | Harness browser.cjs de hábitos: Date-only antes da navegação; revalidar quatro jornadas/reload/SQL e animações |
| H24-01 | Resíduos aumentam trabalho, reversível pela isolação:2→1006→2 locks. LAZY/EAGER não explicam timeout histórico; nenhum defeito financeiro demonstrado | Fixtures de HabitIntegrityIntegrationTest: dataset isolado por método, respeitando commits dos workers e preservando caso501 |

[Matriz completa](MATRIZ.md) · [Diagnóstico e trade-offs](DIAGNOSTICO.md) ·
[Plano anterior aos testes](PLANO.md) · [Resultados verificáveis](verification.json).

A investigação acertou ao não atribuir os timeouts antigos aos mecanismos atuais.
Seu encaminhamento é excessivamente condicionado a reproduzir esses timeouts:
a necessidade de sanear relógio/fixtures já se sustenta nos defeitos presentes.
Essa é a divergência desta revisão. Não recomendamos EAGER, índice, timeout maior
ou refatoração de processamento. Não se exige uma auditoria ampla adicional.

Próximo trabalho: aplicar **somente os dois saneamentos de testes**, em lote próprio,
com os controles indicados no diagnóstico. Para fechamento, comprovar Date-only
no harness compartilhado com diário/semanal SP/UTC+14 e SQL/reload0→1→0; comprovar
fixture conhecida do scheduler nas ordens volume→callback e inversa, sem resíduos,
com lock/retry/assertions10s intactos. Revisor deve confrontar o diff e essas provas.

Cumpridas essas condições, RJ/H24 históricos podem permanecer registrados como
inconclusivos não bloqueantes, com gatilhos explícitos de reabertura. Não é exceção
ao critério: o impedimento atual de confiabilidade será efetivamente removido.
Nenhuma decisão de regra de negócio ou permissão do usuário é necessária agora.

CF029 conserva prontidão **exclusivamente local/descartável**, porque consome
CF017/023/028 e não houve regressão concreta nessa fundação. Não foi executada.
RVA03 encerrada, CF019/013 e CF011/012/014 aceitas permanecem; zoom200% CF010/015
e adoção real CF017/P01/P02 continuam pendentes. Não há nova dependência ou release.

Novas provas:1 testeJava de três fixtures aprovado e16 observações de relógio;
oito jornadas integradas e quatro combinações LAZY/EAGER são evidências do candidato
conferidas, não novas execuções. Falhas ambientais preservadas. Sem certificação
de performance de produção ou causa histórica; nenhum saneamento foi implementado.
