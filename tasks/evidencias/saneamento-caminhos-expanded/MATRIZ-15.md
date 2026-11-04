# Matriz das 15 falhas — antes e depois

Cada linha conserva a classe e o método originais. Os detalhes e hashes estão em VALIDACAO-15.json.

| Classe | Método | Erro primário anterior | Resultado atual |
|---|---|---|---|
|Cf014HistoryDiagnosticTest|persistedHistoryObservation|Chromium ENOENT → exit assertion|passed|
|Cf014HistoryReviewTest|persistedHistoryObservation|Chromium ENOENT → exit assertion|passed|
|Cf019Rva03DiagnosticTest|browserBffSpringPostgresAndReload|Chromium ENOENT → exit assertion|passed|
|FrontendClosureBrowserTest|browserBffSpringPostgresAndReload|Chromium ENOENT → exit assertion|failed|
|IntegratedMilestoneBrowserReviewTest|browserBffSpringPostgresAndReload|Chromium ENOENT → exit assertion|passed|
|MilestoneRemediationBrowserTest|browserBffSpringPostgresAndReload|Chromium ENOENT → exit assertion|passed|
|Rf15IndependentBrowserTest|browserBffSpringPostgresAndReload|Chromium ENOENT → exit assertion|passed|
|Rf15RemediationBrowserTest|browserBffSpringPostgresAndReload|Chromium ENOENT → exit assertion|passed|
|Rf15ResidualBrowserTest|browserBffSpringPostgresAndReload|Chromium ENOENT → exit assertion|passed|
|Rf15ResidualIndependentBrowserTest|browserBffSpringPostgresAndReload|Chromium ENOENT → exit assertion|passed|
|Rv24CreationBrowserIntegrationTest|browserBffSpringPostgresAndReload|Chromium ENOENT → exit assertion|passed|
|Rvr24ReviewBrowserTest|browserBffSpringPostgresAndReload|Chromium ENOENT → exit assertion|passed|
|Rvr24VisualBrowserTest|browserBffSpringPostgresAndReload|Chromium ENOENT → exit assertion|passed|
|HabitBrowserIntegrationTest|browserBffSpringAndPostgresKeepDailyAndWeeklyNumericEffectsAfterReload|Chromium ENOENT → exit assertion|passed|
|UserIsolationBrowserIntegrationTest|loginLogoutAccountSwitchAndReloadUseRealBffAndPostgres|Next preparado/path limit → readiness|passed|

RF15C23 está dentro de Rf15RemediationBrowserTest. Não somar15+23 como casos independentes.

Integridade de fontes após focused: {"passed":false,"error":"Source file set changed after the recorded snapshot"}
