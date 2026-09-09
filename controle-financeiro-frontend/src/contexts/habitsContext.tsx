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
import { habitService } from "@/services/habitService";
import { Habit, HabitLog } from "@/types";
import { useUser } from "@/hooks/useUser";
import { useOptimisticMutation } from "@/hooks/useOptimisticMutation";
import {
  isAbortError,
  useRequestCoordinator,
} from "@/hooks/useRequestCoordinator";

interface HabitsContextType {
  habits: Habit[];
  isLoading: boolean;
  refreshHabits: (isBackground?: boolean) => Promise<void>;
  toggleHabitOptimistic: (id: string, date: string) => Promise<void>;
}

const HabitsContext = createContext<HabitsContextType | undefined>(undefined);

// UTILITÁRIO DE BLINDAGEM DE DATA (Lida com o Array do Spring Boot)
const normalizeDate = (d: unknown) => {
  if (!d) return "";
  if (Array.isArray(d)) {
    return `${d[0]}-${String(d[1]).padStart(2, "0")}-${String(d[2]).padStart(2, "0")}`;
  }
  return typeof d === "string" ? d : "";
};

export function HabitsProvider({ children }: { children: ReactNode }) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isLoading: isLoadingUser } = useUser();
  const userId = user?.id;
  const requests = useRequestCoordinator(userId);

  const refreshHabits = useCallback(
    async (isBackground = false) => {
      if (isLoadingUser || !userId) {
        setIsLoading(false);
        return;
      }

      const request = requests.begin("habits");
      if (!isBackground) setIsLoading(true);
      try {
        const res = await habitService.getAll(request.signal);
        if (request.isCurrent()) setHabits(res.data ?? []);
      } catch (error: unknown) {
        if (request.isCurrent() && !isAbortError(error)) {
          console.error("Erro ao buscar hábitos", error);
        }
      } finally {
        if (request.isCurrent()) setIsLoading(false);
        request.finish();
      }
    },
    [userId, isLoadingUser, requests],
  );

  useEffect(() => {
    setHabits([]);
    if (isLoadingUser) {
      setIsLoading(true);
      return;
    }
    refreshHabits();
  }, [userId, isLoadingUser, refreshHabits]);

  const { mutate: toggleHabitOptimistic } = useOptimisticMutation({
    mutationFn: (data: { id: string; date: string }) =>
      habitService.toggle(data.id, data.date),

    onMutate: ({ id, date }) => {
      const previousHabit = habits.find((habit) => habit.id === id);

      setHabits((prev) =>
        prev.map((habit) => {
          if (habit.id !== id) return habit;

          const logs = [...(habit.logs || [])];
          const existingLogIndex = logs.findIndex(
            (l) => normalizeDate(l.date) === date,
          );

          if (existingLogIndex >= 0) {
            const currentLog = { ...logs[existingLogIndex] };
            if (currentLog.status === "COMPLETED") {
              currentLog.status = "PENDING";
            } else {
              currentLog.status = "COMPLETED";
            }
            logs[existingLogIndex] = currentLog;
          } else {
            logs.push({
              id: `temp-${habit.id}-${date}`,
              date,
              status: "COMPLETED",
            } satisfies HabitLog);
          }

          return {
            ...habit,
            logs,
          };
        }),
      );

      // Sequências permanecem no último valor confirmado pelo servidor: não
      // são contadores de cliques e podem envolver dias/semana concorrentes.
      return { previousLog: previousHabit?.logs.find((log) => normalizeDate(log.date) === date) };
    },

    onError: async (_error, variables, context) => {
      setHabits((current) => current.map((habit) => {
        if (habit.id !== variables.id) return habit;
        const logs = habit.logs.filter((log) => normalizeDate(log.date) !== variables.date);
        if (context.previousLog) logs.push(context.previousLog);
        return { ...habit, logs };
      }));
      await refreshHabits(true);
    },

    onSuccess: () => {
      window.dispatchEvent(new Event("refreshGoals"));
      refreshHabits(true);
    },
    getMutationKey: ({ id, date }) => `${id}:${date}`,
    scopeKey: userId,
  });

  const contextValue = useMemo(
    () => ({
      habits,
      isLoading,
      refreshHabits,
      toggleHabitOptimistic: async (id: string, date: string) => {
        await toggleHabitOptimistic({ id, date });
      },
    }),
    [habits, isLoading, refreshHabits, toggleHabitOptimistic],
  );

  return (
    <HabitsContext.Provider value={contextValue}>
      {children}
    </HabitsContext.Provider>
  );
}

export function useHabitsContext() {
  const context = useContext(HabitsContext);
  if (!context)
    throw new Error("useHabitsContext deve ser usado dentro de HabitsProvider");
  return context;
}
