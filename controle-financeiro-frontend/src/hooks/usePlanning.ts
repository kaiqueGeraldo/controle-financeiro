import { useEffect, useState } from "react";
import { planningService } from "@/services/planningService";
import { usePlanningContext } from "@/contexts/planningContext";
import { CreatePlanItemDTO, PlanItem, PlanStatus } from "@/types";
import { useToast } from "@/contexts/toastContext";
import { usePlanningModals } from "@/contexts/modals/planningModalContext";
import { useOptimisticMutation } from "./useOptimisticMutation";

export function usePlanning() {
  const {
    items,
    categories,
    incomeForecast,
    isLoading,
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
      const previousItems = [...orderedItems];
      setOrderedItems((prev) =>
        prev.map((i) =>
          i.id === data.id ? { ...i, status: data.newStatus } : i,
        ),
      );
      return previousItems;
    },
    onError: (err, vars, previousItems) => {
      setOrderedItems(previousItems);
      refreshPlanning(true, true);
    },
    onSuccess: () => {
      refreshPlanning(true, true);
    },
  });

  const { mutate: removeItem } = useOptimisticMutation({
    mutationFn: (id: string) => planningService.delete(id),
    onMutate: (id) => {
      const previousItems = [...orderedItems];
      setOrderedItems((prev) => prev.filter((i) => i.id !== id));
      setSelectedPlanItemId(null);
      return previousItems;
    },
    onError: (err, id, previousItems) => {
      setOrderedItems(previousItems);
    },
    onSuccess: () => {
      refreshPlanning(true, true);
    },
  });

  const handleUpdateStatus = (item: PlanItem) => {
    if (item.cardId) {
      if (item.status === "PENDING") {
        updateStatus({ id: item.id, newStatus: "SAVED" });
      } else if (item.status === "SAVED") {
        updateStatus({ id: item.id, newStatus: "PENDING" });
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

    updateStatus({ id: item.id, newStatus: map[item.status] });
  };

  const handleReorder = async (newOrder: PlanItem[]) => {
    setOrderedItems(newOrder);
    try {
      await planningService.reorder(newOrder.map((i) => i.id));
    } catch (error) {
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
    } catch (error) {
      toast.error("Erro ao salvar receita");
    }
  };

  const updateItem = async (id: string, data: Partial<CreatePlanItemDTO>) => {
    await planningService.update(id, data);
    refreshPlanning(true);
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
