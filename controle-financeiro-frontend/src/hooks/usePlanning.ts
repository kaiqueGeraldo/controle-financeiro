import { useEffect, useState } from "react";
import { planningService } from "@/services/planningService";
import { usePlanningContext } from "@/contexts/planningContext";
import { CreatePlanItemDTO, UpdatePlanItemDTO, PlanItem, PlanStatus } from "@/types";
import { useToast } from "@/contexts/toastContext";
import { usePlanningModals } from "@/contexts/modals/planningModalContext";
import { useOptimisticMutation } from "./useOptimisticMutation";
import { useUser } from "./useUser";

export function usePlanning() {
  const { user } = useUser();
  const {
    items,
    categories,
    incomeForecast,
    isLoading,
    error,
    dateRef,
    changeMonth,
    refreshPlanning,
    canGoBack,
    canGoForward,
  } = usePlanningContext();

  const { openCopyPlanning } = usePlanningModals();
  const toast = useToast();

  const [selectedPlanItemId, setSelectedPlanItemId] = useState<string | null>(
    null,
  );
  const [orderedItems, setOrderedItems] = useState<PlanItem[]>([]);

  useEffect(() => {
    setOrderedItems(items);
  }, [items]);

  const { mutate: updateStatus } = useOptimisticMutation({
    mutationFn: (data: { id: string; newStatus: PlanStatus }) =>
      planningService.updateStatus(data.id, data.newStatus),
    onMutate: (data) => {
      const previousItem = orderedItems.find((item) => item.id === data.id);
      setOrderedItems((prev) =>
        prev.map((i) =>
          i.id === data.id ? { ...i, status: data.newStatus } : i,
        ),
      );
      return { previousItem };
    },
    onError: async (_error, variables, context) => {
      if (context.previousItem) {
        setOrderedItems((current) =>
          current.map((item) =>
            item.id === variables.id ? context.previousItem! : item,
          ),
        );
      }
      await refreshPlanning(true, true);
    },
    onSuccess: () => {
      refreshPlanning(true, true);
    },
    getMutationKey: ({ id }) => id,
    scopeKey: user?.id,
  });

  const { mutate: removeItem } = useOptimisticMutation({
    mutationFn: (id: string) => planningService.delete(id),
    onMutate: (id) => {
      const index = orderedItems.findIndex((item) => item.id === id);
      const deletedItem = index >= 0 ? orderedItems[index] : undefined;
      setOrderedItems((prev) => prev.filter((i) => i.id !== id));
      setSelectedPlanItemId(null);
      return { deletedItem, index };
    },
    onError: async (_error, _id, context) => {
      const deletedItem = context.deletedItem;
      if (deletedItem) {
        setOrderedItems((current) => {
          if (current.some((item) => item.id === deletedItem.id)) {
            return current;
          }
          const restored = [...current];
          restored.splice(Math.max(0, context.index), 0, deletedItem);
          return restored;
        });
      }
      await refreshPlanning(true, true);
    },
    onSuccess: () => {
      refreshPlanning(true, true);
    },
    getMutationKey: (id) => id,
    scopeKey: user?.id,
  });

  const handleUpdateStatus = (item: PlanItem) => {
    if (item.cardId) {
      if (item.status === "PENDING") {
        void updateStatus({ id: item.id, newStatus: "SAVED" }).catch(
          () => undefined,
        );
      } else if (item.status === "SAVED") {
        void updateStatus({ id: item.id, newStatus: "PENDING" }).catch(
          () => undefined,
        );
        toast.info("Para marcar como Pago, realize o pagamento na tela de Cartões.",);
      } else if (item.status === "PAID") {
        toast.info("Faturas pagas só podem ser estornadas na tela de Cartões.");
      }
      return;
    }

    const map: Record<PlanStatus, PlanStatus> = {
      PENDING: "SAVED",
      SAVED: "PAID",
      PAID: "PENDING",
    };

    void updateStatus({ id: item.id, newStatus: map[item.status] }).catch(
      () => undefined,
    );
  };

  const handleReorder = async (newOrder: PlanItem[]) => {
    setOrderedItems(newOrder);
    try {
      await planningService.reorder(newOrder.map((i) => i.id));
    } catch {
      toast.error("Erro ao salvar nova ordem.");
      setOrderedItems(items);
    }
  };

  const addItem = async (data: CreatePlanItemDTO) => {
    await planningService.create(data);
    refreshPlanning(true);
  };

  const updateIncome = async (newIncome: number) => {
    try {
      await planningService.updateIncome(
        dateRef.getMonth() + 1,
        dateRef.getFullYear(),
        newIncome,
      );
      refreshPlanning(true);
    } catch {
      toast.error("Erro ao salvar receita");
    }
  };

  const updateItem = async (id: string, data: UpdatePlanItemDTO) => {
    await planningService.update(id, data);
    await refreshPlanning(true);
  };

  const copyPreviousMonth = async () => {
    const targetMonth = dateRef.getMonth() + 1;
    const targetYear = dateRef.getFullYear();
    openCopyPlanning(targetMonth, targetYear);
  };

  // --- CÁLCULOS DERIVADOS ---
  const totalExpenses = items.reduce((acc, item) => acc + item.amount, 0);
  const remainingBalance = incomeForecast - totalExpenses;
  const monthFormatted = dateRef.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  return {
    items,
    categories,
    incomeForecast,
    isLoading,
    error,
    dateRef,
    monthFormatted,
    totals: {
      expenses: totalExpenses,
      remaining: remainingBalance,
    },
    changeMonth,
    updateStatus: handleUpdateStatus,
    addItem,
    removeItem: (id: string) => removeItem(id),
    updateIncome,
    selectedPlanItemId,
    setSelectedPlanItemId,
    selectedPlanItem: items.find((i) => i.id === selectedPlanItemId),
    updateItem,
    copyPreviousMonth,
    refreshPlanning,
    orderedItems,
    handleReorder,
    canGoBack,
    canGoForward,
  };
}
