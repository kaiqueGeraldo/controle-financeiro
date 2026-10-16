# Linha do tempo e aceites utilizados

| Base/data | Evento e alcance |
|---|---|
| bb14aa2, 30/09 | CF022 implementa DEC08, V12, identidade da contribuição, locks e watermark; autotestes não eram aceite |
| 9ff1aec → 9fa4fae, 30/09 | Revisão conjunta CF022/023 aceita backend/calendário/scheduler/contraprovas; RJ02201 nasce na tentativa habits-synchronized: diário passa, semanal criado200/GET200, espera30s sem POST; Promise rejeitada encerra Node antes de calllog/trace/SQL terminal |
| mesma revisão | Promise.all e captura diagnóstica acrescentados; habits-diagnostic passa4 jornadas, sem fechar a causa histórica |
| f225657, 30/09–01/10 | Revisão CF024: classe hábitos27 primeiro no gate119, segundo callback timeout10s; dump em carregamento de coleção JDBC; caso isolado passa, H24-01 permanece |
| 65ec14e, CF025 | specificDays EAGER→LAZY elimina consultas não usadas no reorder; não muda regra cron |
| 06c1a51, revisão03/10 | CF025/026/027 aceitas; LAZY, consumidores, ownership/locks e limites revisados. Matriz CF022 que ainda aguardava revisão de CF025 tornou-se desatualizada nesse ponto; RJ/H24 continuam |
| ead4323 → 0c068d9, revisão09/10 | RD58-02: gravações novas de GoalHistory usam Instant/recordedAt, V14 local e consumidores aprovados; CF006 concluída. Não substituir a prova antiga de timestamp local por expected novo silenciosamente |
| bcec50c → d806f82; 6e64aad → 8a83c35, 15/10 | Fundação CF017 V1–V14 e restore/preflight locais aceitos; resíduo documental P2 encerrado. Adoção real permanece; CF029 pronta somente local/descartável |
| e1c6312, 16/10 | RVA03 encerrada com ressalva histórica; CF019/013 concluídas; CF015 permanece por zoom200%. Lote aprovado publicado/integrado nesta sessão |
| investigação atual | Probes novos não são revisão independente e não encerram CF022 automaticamente |

Fontes: READMEs/ACHADOS/EXECUCOES das pastas CF-022,
revisao-CF-022-CF-023, revisao-CF-024, revisao-CF-025-CF-027-RV24,
consolidacao-CF-001-CF-026/RECONCILIACAO-CF-001-CF-027.md,
revalidacao-RD58, revalidacao-CF-017, revalidacao-RV17-01-P2,
revalidacao-CF019-RVA03; canônicos CF006/017/022/029 e SPEC002.

As referências históricas conservam a data/base de seus estados; a anotação nova
no canônico CF022 só corrige a pendência documental CF025 já aceita.
