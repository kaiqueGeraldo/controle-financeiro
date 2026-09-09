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
import {
  isAbortError,
  useRequestCoordinator,
} from "@/hooks/useRequestCoordinator";

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
  const requests = useRequestCoordinator(userId);

  const refreshGoals = useCallback(async () => {
    if (isLoadingUser || !userId) {
      setIsLoading(false);
      return;
    }

    const request = requests.begin("goals");
    setIsLoading(true);

    try {
      const res = await goalService.getAll(request.signal);
      if (request.isCurrent()) setGoals(res.data ?? []);
    } catch (error: unknown) {
      if (
        request.isCurrent() &&
        !isAbortError(error) &&
        !isHttpStatus(error, 403) &&
        !isHttpStatus(error, 401)
      ) {
        console.error("Erro ao buscar metas", error);
      }
    } finally {
      if (request.isCurrent()) setIsLoading(false);
      request.finish();
    }
  }, [userId, isLoadingUser, requests]);

  useEffect(() => {
    setGoals([]);
    if (isLoadingUser) {
      setIsLoading(true);
      return;
    }
    refreshGoals();
  }, [userId, isLoadingUser, refreshGoals]);

  const { mutate: depositOptimistic } = useOptimisticMutation({
    mutationFn: (vars: { id: string; data: GoalDepositDTO }) => goalService.deposit(vars.id, vars.data),
    
    onMutate: ({ id, data }) => {
      const previousGoal = goals.find((goal) => goal.id === id);
      
      setGoals((prev) => prev.map(g => {
        if (g.id === id) {
          return { ...g, currentValue: g.currentValue + data.amount };
        }
        return g;
      }));
      
      return { previousGoal };
    },
    
    onError: async (_error, variables, context) => {
      if (context.previousGoal) {
        setGoals((current) =>
          current.map((goal) =>
            goal.id === variables.id ? context.previousGoal! : goal,
          ),
        );
      }
      await refreshGoals();
    },
    
    onSuccess: () => {
      refreshGoals();
      window.dispatchEvent(new Event("refreshFinance"));
    },
    getMutationKey: ({ id }) => id,
    scopeKey: userId,
  });

  const contextValue = useMemo(() => ({
    goals,
    isLoading,
    refreshGoals,
    depositOptimistic: async (id: string, data: GoalDepositDTO) => {
      await depositOptimistic({ id, data });
    },
  }), [goals, isLoading, refreshGoals, depositOptimistic]);

  return (
    <GoalsContext.Provider value={contextValue}>
      {children}
    </GoalsContext.Provider>
  );
}

function isHttpStatus(error: unknown, status: number): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    error.status === status
  );
}

export function useGoalsContext() {
  const context = useContext(GoalsContext);
  if (!context) {
    throw new Error("useGoalsContext deve ser usado dentro de GoalsProvider");
  }
  return context;
}
