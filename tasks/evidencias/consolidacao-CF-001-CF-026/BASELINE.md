# Inventário histórico da baseline CF-026

Snapshot de 01/10/2026; diagnóstico executado sobre 04cad8d, registrado em c7f7ffc.
Derivado do [JSON bruto](../CF-026/lint-inicial.json), sem executar ESLint novamente.
234 arquivos inspecionados; 26 com ocorrências; 23 erros e 21 avisos.
Linhas abaixo referem-se à base medida. Não são achados funcionais nem correções feitas.

| Arquivo | Erros | Avisos | Linha e regra |
|---|---|---|---|
| [src/components/forms/changePasswordModal.tsx](../../../controle-financeiro-frontend/src/components/forms/changePasswordModal.tsx) | 1 | 0 | 54: @typescript-eslint/no-explicit-any |
| [src/components/forms/configDashboardModal.tsx](../../../controle-financeiro-frontend/src/components/forms/configDashboardModal.tsx) | 1 | 2 | 50: @typescript-eslint/no-explicit-any; 57: @typescript-eslint/no-unused-vars; 103: @typescript-eslint/no-unused-vars |
| [src/components/forms/deleteHistoryModal.tsx](../../../controle-financeiro-frontend/src/components/forms/deleteHistoryModal.tsx) | 0 | 1 | 41: @typescript-eslint/no-unused-vars |
| [src/components/forms/depositGoalModal.tsx](../../../controle-financeiro-frontend/src/components/forms/depositGoalModal.tsx) | 4 | 0 | 71: @typescript-eslint/no-explicit-any; 92: @typescript-eslint/no-explicit-any; 257: react/no-unescaped-entities; 257: react/no-unescaped-entities |
| [src/components/forms/editAccountModal.tsx](../../../controle-financeiro-frontend/src/components/forms/editAccountModal.tsx) | 0 | 1 | 37: @typescript-eslint/no-unused-vars |
| [src/components/forms/editProfileModal.tsx](../../../controle-financeiro-frontend/src/components/forms/editProfileModal.tsx) | 1 | 0 | 61: @typescript-eslint/no-explicit-any |
| [src/components/forms/manageAccountsModal.tsx](../../../controle-financeiro-frontend/src/components/forms/manageAccountsModal.tsx) | 1 | 1 | 125: @typescript-eslint/no-explicit-any; 153: @typescript-eslint/no-unused-vars |
| [src/components/forms/manageCategoriesModal.tsx](../../../controle-financeiro-frontend/src/components/forms/manageCategoriesModal.tsx) | 2 | 2 | 129: @typescript-eslint/no-unused-vars; 129: @typescript-eslint/no-explicit-any; 142: @typescript-eslint/no-unused-vars; 142: @typescript-eslint/no-explicit-any |
| [src/components/forms/newAssetModal.tsx](../../../controle-financeiro-frontend/src/components/forms/newAssetModal.tsx) | 0 | 1 | 81: @typescript-eslint/no-unused-vars |
| [src/components/forms/newCardModal.tsx](../../../controle-financeiro-frontend/src/components/forms/newCardModal.tsx) | 0 | 1 | 82: @typescript-eslint/no-unused-vars |
| [src/components/forms/newCardTransactionModal.tsx](../../../controle-financeiro-frontend/src/components/forms/newCardTransactionModal.tsx) | 0 | 1 | 94: @typescript-eslint/no-unused-vars |
| [src/components/forms/newGoalModal.tsx](../../../controle-financeiro-frontend/src/components/forms/newGoalModal.tsx) | 0 | 1 | 103: @typescript-eslint/no-unused-vars |
| [src/components/forms/newHabitModal.tsx](../../../controle-financeiro-frontend/src/components/forms/newHabitModal.tsx) | 0 | 2 | 22: @typescript-eslint/no-unused-vars; 115: @typescript-eslint/no-unused-vars |
| [src/components/forms/newPlanModal.tsx](../../../controle-financeiro-frontend/src/components/forms/newPlanModal.tsx) | 0 | 1 | 55: @typescript-eslint/no-unused-vars |
| [src/components/forms/reorderModal.tsx](../../../controle-financeiro-frontend/src/components/forms/reorderModal.tsx) | 2 | 1 | 11: @typescript-eslint/no-explicit-any; 13: @typescript-eslint/no-explicit-any; 30: @typescript-eslint/no-unused-vars |
| [src/components/modals/managers/goalModalManager.tsx](../../../controle-financeiro-frontend/src/components/modals/managers/goalModalManager.tsx) | 1 | 0 | 58: @typescript-eslint/no-explicit-any |
| [src/components/modals/managers/planningModalManager.tsx](../../../controle-financeiro-frontend/src/components/modals/managers/planningModalManager.tsx) | 1 | 0 | 52: @typescript-eslint/no-explicit-any |
| [src/components/screens/habits/habitDetails.tsx](../../../controle-financeiro-frontend/src/components/screens/habits/habitDetails.tsx) | 3 | 0 | 15: @typescript-eslint/no-explicit-any; 19: @typescript-eslint/no-explicit-any; 101: @typescript-eslint/no-explicit-any |
| [src/components/screens/habits/habitItem.tsx](../../../controle-financeiro-frontend/src/components/screens/habits/habitItem.tsx) | 1 | 0 | 17: @typescript-eslint/no-explicit-any |
| [src/components/screens/planning/planningItem.tsx](../../../controle-financeiro-frontend/src/components/screens/planning/planningItem.tsx) | 1 | 0 | 26: @typescript-eslint/no-explicit-any |
| [src/hooks/useOptimisticMutation.ts](../../../controle-financeiro-frontend/src/hooks/useOptimisticMutation.ts) | 0 | 1 | 49: react-hooks/exhaustive-deps |
| [src/middleware.ts](../../../controle-financeiro-frontend/src/middleware.ts) | 0 | 1 | 19: @typescript-eslint/no-unused-vars |
| [src/screens/private/configuracoes/configuracoesScreen.tsx](../../../controle-financeiro-frontend/src/screens/private/configuracoes/configuracoesScreen.tsx) | 0 | 2 | 72: @typescript-eslint/no-unused-vars; 106: @typescript-eslint/no-unused-vars |
| [src/screens/private/habits/habitsScreen.tsx](../../../controle-financeiro-frontend/src/screens/private/habits/habitsScreen.tsx) | 2 | 0 | 81: react/no-unescaped-entities; 81: react/no-unescaped-entities |
| [src/screens/public/auth/authScreen.tsx](../../../controle-financeiro-frontend/src/screens/public/auth/authScreen.tsx) | 2 | 0 | 59: @typescript-eslint/no-explicit-any; 89: @typescript-eslint/no-explicit-any |
| [tests/component/async-state.test.tsx](../../../controle-financeiro-frontend/tests/component/async-state.test.tsx) | 0 | 2 | 448: @typescript-eslint/no-unused-vars; 471: @typescript-eslint/no-unused-vars |

Todos os 26 arquivos acima permanecem sem diff entre 0099185 e c7f7ffc.
Mudanças indiretas de sessão/contratos continuam exigindo testes dos consumidores.
O arquivo de testes listado está fora de src: eventual ajuste futuro exige justificar
esse caminho na CF-026, sem mudar assertions ou oráculos para obter aprovação.
