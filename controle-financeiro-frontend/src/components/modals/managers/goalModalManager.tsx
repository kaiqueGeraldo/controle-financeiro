"use client";

import { useGoalModals } from "@/contexts/modals/goalModalContext";
import { useGoalsContext } from "@/contexts/goalsContext";
import { useFinanceData } from "@/hooks/useFinanceData";
import { goalService } from "@/services/goalService";
import { NewGoalModal } from "@/components/forms/newGoalModal";
import { DepositGoalModal } from "@/components/forms/depositGoalModal";
import { DeleteGoalModal } from "@/components/forms/deleteGoalModal";
import { DeleteHistoryModal } from "@/components/forms/deleteHistoryModal";
import { ConfirmationModal } from "@/components/modals/confirmModal";
import { useToast } from "@/contexts/toastContext";

export function GoalModalManager() {
  const modals = useGoalModals();
  const { refreshGoals } = useGoalsContext();
  const finance = useFinanceData();
  const toast = useToast();

  const handleSuccess = () => {
    finance.refresh();
    refreshGoals();
  };

  return (
    <>
      <NewGoalModal isOpen={modals.isNewGoalOpen} onClose={modals.closeNewGoal} onSuccess={handleSuccess} />
      
      <DepositGoalModal
        isOpen={!!modals.goalDepositData}
        onClose={modals.closeGoalDeposit}
        onSuccess={handleSuccess}
        goal={modals.goalDepositData}
        accounts={finance.accounts}
      />
      
      <DeleteGoalModal
        isOpen={!!modals.goalToDelete}
        onClose={modals.closeDeleteGoal}
        onSuccess={handleSuccess}
        goal={modals.goalToDelete}
        accounts={finance.accounts}
      />

      <ConfirmationModal
        isOpen={!!modals.goalHistoryToDeleteId}
        onClose={modals.closeDeleteGoalHistory}
        title="Excluir Registro"
        message="Tem certeza? O valor será revertido do saldo da meta."
        confirmText="Excluir Registro"
        confirmColor="bg-rose-600 hover:bg-rose-700 text-text-main"
        onConfirm={async () => {
          if (modals.goalHistoryToDeleteId) {
            try {
              await goalService.deleteHistory(modals.goalHistoryToDeleteId);
              refreshGoals();
              modals.closeDeleteGoalHistory();
            } catch (error: any) {
              toast.error(error.message || "Erro ao excluir registro da meta.");
            }
          }
        }}
      />

      <DeleteHistoryModal
        isOpen={!!modals.historyToDelete}
        onClose={modals.closeDeleteHistory}
        onSuccess={handleSuccess}
        historyItem={modals.historyToDelete?.item || null}
        parentGoal={modals.historyToDelete?.parent || null}
        accounts={finance.accounts}
      />
    </>
  );
}