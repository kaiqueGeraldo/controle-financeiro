"use client";

import { NewPlanModal } from "@/components/forms/newPlanModal";
import { ConfirmationModal } from "@/components/modals/confirmModal";
import { usePlanningModals } from "@/contexts/modals/planningModalContext";
import { usePlanningContext } from "@/contexts/planningContext";
import { useToast } from "@/contexts/toastContext";
import { planningService } from "@/services/planningService";

export function PlanningModalManager() {
  const modals = usePlanningModals();
  const { refreshPlanning } = usePlanningContext();
  const toast = useToast();

  return (
    <>
      <NewPlanModal
        isOpen={modals.isNewPlanOpen}
        onClose={modals.closeNewPlan}
        onSuccess={refreshPlanning}
      />

      <ConfirmationModal
        isOpen={!!modals.planItemToDeleteId}
        onClose={modals.closeDeletePlanItem}
        title="Excluir Planejamento"
        message="Deseja remover este item da sua previsão?"
        onConfirm={async () => {
          if (modals.planItemToDeleteId) {
            await planningService.delete(modals.planItemToDeleteId);
            refreshPlanning();
            modals.closeDeletePlanItem();
          }
        }}
      />

      <ConfirmationModal
        isOpen={!!modals.copyPlanningData}
        onClose={modals.closeCopyPlanning}
        title="Copiar Mês Anterior"
        message="Deseja importar os itens do mês passado para o mês atual?"
        confirmText="Sim, Copiar"
        onConfirm={async () => {
          if (modals.copyPlanningData) {
            try {
              await planningService.copyFromPrevious(
                modals.copyPlanningData.month,
                modals.copyPlanningData.year
              );
              refreshPlanning();
              modals.closeCopyPlanning();
            } catch (error: any) {
              toast.error(error.message || "Erro ao copiar planejamento.");
            }
          }
        }}
      />
    </>
  );
}