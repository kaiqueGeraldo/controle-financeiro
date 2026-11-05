export const wrapperDefinitions=Object.freeze({
  "MilestoneRemediationBrowserTest": {
    "qualified": "com.controlefinanceiro.api.MilestoneRemediationBrowserTest",
    "config": "tests/e2e/playwright.milestone-remediation.config.ts"
  },
  "FrontendClosureBrowserTest": {
    "qualified": "com.controlefinanceiro.api.FrontendClosureBrowserTest",
    "config": "tests/e2e/playwright.frontend-closure.config.ts"
  },
  "Cf014HistoryDiagnosticTest": {
    "qualified": "com.controlefinanceiro.api.Cf014HistoryDiagnosticTest",
    "config": "tests/e2e/playwright.cf014-history.config.ts"
  },
  "Cf014HistoryReviewTest": {
    "qualified": "com.controlefinanceiro.api.Cf014HistoryReviewTest",
    "config": "tests/e2e/playwright.cf014-history-review.config.ts"
  },
  "Cf019Rva03DiagnosticTest": {
    "qualified": "com.controlefinanceiro.api.Cf019Rva03DiagnosticTest",
    "config": "tests/e2e/playwright.cf019-rva03.config.ts"
  },
  "FinancialJourneyPostgresE2E": {
    "qualified": "com.controlefinanceiro.api.cf032.FinancialJourneyPostgresE2E",
    "config": "tests/cf032/playwright.config.ts",
    "directory": "browser",
    "jsonOutput": "playwright.json"
  },
  "HabitBrowserIntegrationTest": {
    "qualified": "com.controlefinanceiro.api.domain.habit.HabitBrowserIntegrationTest",
    "config": "src/test/java/com/controlefinanceiro/api/domain/habit/browser.cjs",
    "kind": "programmatic"
  },
  "UserIsolationBrowserIntegrationTest": {
    "qualified": "com.controlefinanceiro.api.infra.security.UserIsolationBrowserIntegrationTest",
    "config": "src/test/java/com/controlefinanceiro/api/infra/security/browser.cjs",
    "kind": "programmatic"
  },
  "IntegratedMilestoneBrowserReviewTest": {
    "qualified": "com.controlefinanceiro.api.IntegratedMilestoneBrowserReviewTest",
    "config": "tests/e2e/playwright.milestone-review.config.ts"
  },
  "Rf15IndependentBrowserTest": {
    "qualified": "com.controlefinanceiro.api.Rf15IndependentBrowserTest",
    "config": "tests/e2e/playwright.rf15-independent.config.ts"
  },
  "Rf15RemediationBrowserTest": {
    "qualified": "com.controlefinanceiro.api.Rf15RemediationBrowserTest",
    "config": "tests/e2e/playwright.rf15.config.ts",
    "kind": "zoom"
  },
  "Rf15ResidualBrowserTest": {
    "qualified": "com.controlefinanceiro.api.Rf15ResidualBrowserTest",
    "config": "tests/e2e/playwright.rf15-residual.config.ts"
  },
  "Rf15ResidualIndependentBrowserTest": {
    "qualified": "com.controlefinanceiro.api.Rf15ResidualIndependentBrowserTest",
    "config": "tests/e2e/playwright.rf15-residual-independent.config.ts"
  },
  "Rv24CreationBrowserIntegrationTest": {
    "qualified": "com.controlefinanceiro.api.Rv24CreationBrowserIntegrationTest",
    "config": "tests/e2e/playwright.rv24.config.ts",
    "configs": [
      "tests/e2e/playwright.rv24.config.ts",
      "tests/e2e/playwright.milestone-review.config.ts"
    ]
  },
  "Rvr24ReviewBrowserTest": {
    "qualified": "com.controlefinanceiro.api.Rvr24ReviewBrowserTest",
    "config": "tests/e2e/playwright.rvr24-review.config.ts"
  },
  "Rvr24VisualBrowserTest": {
    "qualified": "com.controlefinanceiro.api.Rvr24VisualBrowserTest",
    "config": "tests/e2e/playwright.rvr24-visual.config.ts"
  }
});
