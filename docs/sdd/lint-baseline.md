# Baseline de lint

07/09/2026: 70 erros e 37 avisos em 54 arquivos. Comando: npm run lint -- --format json. Coletado após o lote de datas. Não representa 107 bugs de execução; são violações de regras a triar. Nenhuma regra foi desabilitada.

## Reavaliação de prontidão CF-026 — 01/10/2026

Base `04cad8d072f789fbe3f4050d8912d5526ec600f5`: 23 erros e 21 avisos,
26 arquivos com ocorrências entre 234 inspecionados. Foram usados os mesmos
alvos e a configuração existente, sem novas exclusões nem alteração de regras.
CLI local: `node node_modules/eslint/bin/eslint.js --format json` no frontend;
o atalho global de npm aponta para um módulo ausente neste ambiente.

| Regra | Erros | Avisos |
|---|---:|---:|
| `@typescript-eslint/no-explicit-any` | 19 | 0 |
| `@typescript-eslint/no-unused-vars` | 0 | 20 |
| `react-hooks/exhaustive-deps` | 0 | 1 |
| `react/no-unescaped-entities` | 4 | 0 |

Typecheck aprovado com `node node_modules/typescript/bin/tsc --noEmit --incremental false`.
Esta é uma medição anterior à implementação: CF-026 está bloqueada pelas
dependências CF-009/CF-015 em revisão; nenhuma correção foi aplicada nesta rodada.
[Resultados brutos, comandos e limites](../../tasks/evidencias/CF-026/README.md).

## Medição histórica — 07/09/2026

| Arquivo | Erros | Avisos | Regras |
|---|---:|---:|---|
| controle-financeiro-frontend/src/app/api/[...path]/route.ts | 1 | 0 | @typescript-eslint/no-explicit-any |
| controle-financeiro-frontend/src/components/forms/changePasswordModal.tsx | 1 | 0 | @typescript-eslint/no-explicit-any |
| controle-financeiro-frontend/src/components/forms/configDashboardModal.tsx | 1 | 2 | @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars |
| controle-financeiro-frontend/src/components/forms/deleteGoalModal.tsx | 0 | 1 | @typescript-eslint/no-unused-vars |
| controle-financeiro-frontend/src/components/forms/deleteHistoryModal.tsx | 0 | 1 | @typescript-eslint/no-unused-vars |
| controle-financeiro-frontend/src/components/forms/depositGoalModal.tsx | 4 | 0 | @typescript-eslint/no-explicit-any, react/no-unescaped-entities |
| controle-financeiro-frontend/src/components/forms/editAccountModal.tsx | 0 | 1 | @typescript-eslint/no-unused-vars |
| controle-financeiro-frontend/src/components/forms/editProfileModal.tsx | 1 | 0 | @typescript-eslint/no-explicit-any |
| controle-financeiro-frontend/src/components/forms/manageAccountsModal.tsx | 1 | 1 | @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars |
| controle-financeiro-frontend/src/components/forms/manageCategoriesModal.tsx | 2 | 2 | @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any |
| controle-financeiro-frontend/src/components/forms/newAssetModal.tsx | 0 | 1 | @typescript-eslint/no-unused-vars |
| controle-financeiro-frontend/src/components/forms/newCardModal.tsx | 0 | 1 | @typescript-eslint/no-unused-vars |
| controle-financeiro-frontend/src/components/forms/newCardTransactionModal.tsx | 0 | 1 | @typescript-eslint/no-unused-vars |
| controle-financeiro-frontend/src/components/forms/newGoalModal.tsx | 0 | 1 | @typescript-eslint/no-unused-vars |
| controle-financeiro-frontend/src/components/forms/newHabitModal.tsx | 0 | 2 | @typescript-eslint/no-unused-vars |
| controle-financeiro-frontend/src/components/forms/newPlanModal.tsx | 0 | 1 | @typescript-eslint/no-unused-vars |
| controle-financeiro-frontend/src/components/forms/operationModal.tsx | 3 | 0 | @typescript-eslint/no-explicit-any, react/no-unescaped-entities |
| controle-financeiro-frontend/src/components/forms/payInvoiceModal.tsx | 1 | 0 | @typescript-eslint/no-explicit-any |
| controle-financeiro-frontend/src/components/forms/reorderModal.tsx | 2 | 1 | @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars |
| controle-financeiro-frontend/src/components/modals/managers/goalModalManager.tsx | 1 | 0 | @typescript-eslint/no-explicit-any |
| controle-financeiro-frontend/src/components/modals/managers/planningModalManager.tsx | 1 | 0 | @typescript-eslint/no-explicit-any |
| controle-financeiro-frontend/src/components/screens/cards/invoiceDetails.tsx | 4 | 0 | @typescript-eslint/no-explicit-any |
| controle-financeiro-frontend/src/components/screens/configuracoes/settingsSections.tsx | 3 | 1 | @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars |
| controle-financeiro-frontend/src/components/screens/dashboard/wealthChart.tsx | 1 | 0 | @typescript-eslint/no-explicit-any |
| controle-financeiro-frontend/src/components/screens/extract/transactionDetails.tsx | 2 | 0 | @typescript-eslint/no-explicit-any |
| controle-financeiro-frontend/src/components/screens/goals/goalDetails.tsx | 2 | 4 | @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any |
| controle-financeiro-frontend/src/components/screens/habits/habitDetails.tsx | 3 | 0 | @typescript-eslint/no-explicit-any |
| controle-financeiro-frontend/src/components/screens/habits/habitItem.tsx | 1 | 1 | @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-expressions |
| controle-financeiro-frontend/src/components/screens/investments/investmentDetails.tsx | 1 | 0 | @typescript-eslint/no-explicit-any |
| controle-financeiro-frontend/src/components/screens/investments/investmentItem.tsx | 1 | 0 | @typescript-eslint/no-explicit-any |
| controle-financeiro-frontend/src/components/screens/planning/planningDetails.tsx | 2 | 0 | @typescript-eslint/no-explicit-any |
| controle-financeiro-frontend/src/components/screens/planning/planningItem.tsx | 1 | 0 | @typescript-eslint/no-explicit-any |
| controle-financeiro-frontend/src/contexts/dashboardContext.tsx | 3 | 0 | @typescript-eslint/no-explicit-any |
| controle-financeiro-frontend/src/contexts/financeContext.tsx | 2 | 1 | @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps |
| controle-financeiro-frontend/src/contexts/goalsContext.tsx | 1 | 1 | @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps |
| controle-financeiro-frontend/src/contexts/habitsContext.tsx | 2 | 2 | @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps |
| controle-financeiro-frontend/src/contexts/investmentsContext.tsx | 0 | 1 | @typescript-eslint/no-unused-vars |
| controle-financeiro-frontend/src/contexts/planningContext.tsx | 1 | 0 | @typescript-eslint/no-explicit-any |
| controle-financeiro-frontend/src/hooks/useAnnualSummary.ts | 1 | 1 | @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars |
| controle-financeiro-frontend/src/hooks/useCards.ts | 3 | 0 | @typescript-eslint/no-explicit-any |
| controle-financeiro-frontend/src/hooks/useExtract.ts | 1 | 1 | @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any |
| controle-financeiro-frontend/src/hooks/useGoals.ts | 1 | 0 | react-hooks/set-state-in-effect |
| controle-financeiro-frontend/src/hooks/useInvestments.ts | 1 | 0 | react-hooks/set-state-in-effect |
| controle-financeiro-frontend/src/hooks/useOptimisticMutation.ts | 4 | 0 | @typescript-eslint/no-explicit-any |
| controle-financeiro-frontend/src/hooks/usePlanning.ts | 0 | 2 | @typescript-eslint/no-unused-vars |
| controle-financeiro-frontend/src/layouts/PrivateLayout.tsx | 2 | 0 | react-hooks/static-components |
| controle-financeiro-frontend/src/middleware.ts | 0 | 1 | @typescript-eslint/no-unused-vars |
| controle-financeiro-frontend/src/screens/private/accounts/accountsScreen.tsx | 1 | 1 | @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any |
| controle-financeiro-frontend/src/screens/private/configuracoes/configuracoesScreen.tsx | 0 | 3 | @typescript-eslint/no-unused-vars |
| controle-financeiro-frontend/src/screens/private/dashboard/dashboardScreen.tsx | 2 | 0 | @typescript-eslint/no-explicit-any |
| controle-financeiro-frontend/src/screens/private/habits/habitsScreen.tsx | 2 | 0 | react/no-unescaped-entities |
| controle-financeiro-frontend/src/screens/public/auth/authScreen.tsx | 2 | 0 | @typescript-eslint/no-explicit-any |
| controle-financeiro-frontend/src/services/cardService.ts | 1 | 0 | @typescript-eslint/no-explicit-any |
| controle-financeiro-frontend/src/services/planningService.ts | 0 | 1 | @typescript-eslint/no-unused-vars |
