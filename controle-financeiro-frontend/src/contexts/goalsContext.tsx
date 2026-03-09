"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
  useMemo,
} from "react";
import { goalService } from "@/services/goalService";
import { Goal, GoalDepositDTO } from "@/types";
import { useUser } from "@/hooks/useUser";
import { useOptimisticMutation } from "@/hooks/useOptimisticMutation";

interface GoalsContextType {
  goals: Goal[];
  isLoading: boolean;
  refreshGoals: () => Promise<void>;
  depositOptimistic: (id: string, data: GoalDepositDTO) => Promise<void>;
}

const GoalsContext = createContext<GoalsContextType | undefined>(undefined);

export function GoalsProvider({ children }: { children: ReactNode }) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isLoading: isLoadingUser } = useUser();
  const userId = user?.id;

  const refreshGoals = useCallback(async () => {
    if (isLoadingUser || !userId) {
      setIsLoading(false);
      return;
    }

    try {
      const res = await goalService.getAll();
      if (res?.data) setGoals(res.data);
    } catch (error: any) {
      if (error.status !== 403 && error.status !== 401) {
        console.error("Erro ao buscar metas", error);
      }
    } finally {
      setIsLoading(false);
    }
  }, [userId, isLoadingUser]);

  useEffect(() => {
    refreshGoals();
  }, [refreshGoals]);

  const { mutate: depositOptimistic } = useOptimisticMutation({
    mutationFn: (vars: { id: string; data: GoalDepositDTO }) => goalService.deposit(vars.id, vars.data),
    
    onMutate: ({ id, data }) => {
      const previousGoals = [...goals];
      
      setGoals((prev) => prev.map(g => {
        if (g.id === id) {
          return { ...g, currentValue: g.currentValue + data.amount };
        }
        return g;
      }));
      
      return previousGoals;
    },
    
    onError: (err, vars, previousGoals) => {
      setGoals(previousGoals);
    },
    
    onSuccess: () => {
      refreshGoals();
      window.dispatchEvent(new Event("refreshFinance"));
    }
  });

  const contextValue = useMemo(() => ({
    goals,
    isLoading,
    refreshGoals,
    depositOptimistic: async (id: string, data: GoalDepositDTO) => depositOptimistic({ id, data })
  }), [goals, isLoading, refreshGoals]);

  return (
    <GoalsContext.Provider value={contextValue}>
      {children}
    </GoalsContext.Provider>
  );
}

export function useGoalsContext() {
  const context = useContext(GoalsContext);
  if (!context) {
    throw new Error("useGoalsContext deve ser usado dentro de GoalsProvider");
  }
  return context;
}
