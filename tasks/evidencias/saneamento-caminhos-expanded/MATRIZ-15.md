# Matriz das15 falhas — reconciliação final

Identidades e XML brutos por SHA-256 em RESULTADOS.json; a tentativa focused reprovada permanece em VALIDACAO-15.json.

| Classe | Método original | Falha anterior | Focused15 | Full116 atual |
|---|---|---|---|---|
|Cf014HistoryDiagnosticTest|persistedHistoryObservation|Chromium ENOENT → assertion exit|passed|passed|
|Cf014HistoryReviewTest|persistedHistoryObservation|Chromium ENOENT → assertion exit|passed|passed|
|Cf019Rva03DiagnosticTest|browserBffSpringPostgresAndReload|Chromium ENOENT → assertion exit|passed|passed|
|FrontendClosureBrowserTest|browserBffSpringPostgresAndReload|Chromium ENOENT → assertion exit|failed|passed|
|IntegratedMilestoneBrowserReviewTest|browserBffSpringPostgresAndReload|Chromium ENOENT → assertion exit|passed|passed|
|MilestoneRemediationBrowserTest|browserBffSpringPostgresAndReload|Chromium ENOENT → assertion exit|passed|passed|
|Rf15IndependentBrowserTest|browserBffSpringPostgresAndReload|Chromium ENOENT → assertion exit|passed|passed|
|Rf15RemediationBrowserTest|browserBffSpringPostgresAndReload|Chromium ENOENT → assertion exit|passed|passed|
|Rf15ResidualBrowserTest|browserBffSpringPostgresAndReload|Chromium ENOENT → assertion exit|passed|passed|
|Rf15ResidualIndependentBrowserTest|browserBffSpringPostgresAndReload|Chromium ENOENT → assertion exit|passed|passed|
|Rv24CreationBrowserIntegrationTest|browserBffSpringPostgresAndReload|Chromium ENOENT → assertion exit|passed|passed|
|Rvr24ReviewBrowserTest|browserBffSpringPostgresAndReload|Chromium ENOENT → assertion exit|passed|passed|
|Rvr24VisualBrowserTest|browserBffSpringPostgresAndReload|Chromium ENOENT → assertion exit|passed|passed|
|HabitBrowserIntegrationTest|browserBffSpringAndPostgresKeepDailyAndWeeklyNumericEffectsAfterReload|Chromium ENOENT → assertion exit|passed|passed|
|UserIsolationBrowserIntegrationTest|loginLogoutAccountSwitchAndReloadUseRealBffAndPostgres|Next preparado → readiness|passed|passed|

FrontendClosure:5/6 passou na primeira focused; E falhou após reload sem resposta confirmada. Os controles corrigidos6/6 e1/1 foram executados antes da full. A microprova não confirmou cancelamento; não há alteração financeira.

RF15A25=B2+C23. C23 pertence a um wrapper Java dessas15 classes. Não somar15+23,928+23 nem execuções sobrepostas como cobertura independente.
