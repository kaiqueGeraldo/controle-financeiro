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
import { Habit } from "@/types";
import { useUser } from "@/hooks/useUser";
import { useToast } from "@/contexts/toastContext";
import { useOptimisticMutation } from "@/hooks/useOptimisticMutation";

interface HabitsContextType {
  habits: Habit[];
  isLoading: boolean;
  refreshHabits: (isBackground?: boolean) => Promise<void>;
  toggleHabitOptimistic: (id: string, date: string) => Promise<void>;
}

const HabitsContext = createContext<HabitsContextType | undefined>(undefined);

// UTILITÁRIO DE BLINDAGEM DE DATA (Lida com o Array do Spring Boot)
const normalizeDate = (d: any) => {
  if (!d) return "";
  if (Array.isArray(d)) {
    return `${d[0]}-${String(d[1]).padStart(2, "0")}-${String(d[2]).padStart(2, "0")}`;
  }
  return d;
};

export function HabitsProvider({ children }: { children: ReactNode }) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isLoading: isLoadingUser } = useUser();
  const toast = useToast();

  const refreshHabits = useCallback(
    async (isBackground = false) => {
      if (isLoadingUser || !user?.id) {
        setIsLoading(false);
        return;
      }

      if (!isBackground) setIsLoading(true);
      try {
        const res = await habitService.getAll();
        if (res?.data) setHabits(res.data);
      } catch (error) {
        console.error("Erro ao buscar hábitos", error);
      } finally {
        setIsLoading(false);
      }
    },
    [user?.id, isLoadingUser],
  );

  useEffect(() => {
    refreshHabits();
  }, [refreshHabits]);

  const { mutate: toggleHabitOptimistic } = useOptimisticMutation({
    mutationFn: (data: { id: string; date: string }) =>
      habitService.toggle(data.id, data.date),

    onMutate: ({ id, date }) => {
      const previousHabits = [...habits];

      setHabits((prev) =>
        prev.map((habit) => {
          if (habit.id !== id) return habit;

          const logs = [...(habit.logs || [])];
          const existingLogIndex = logs.findIndex(
            (l) => normalizeDate(l.date) === date,
          );

          let newStreak = habit.currentStreak;
          let newHighest = habit.highestStreak;

          if (existingLogIndex >= 0) {
            const currentLog = { ...logs[existingLogIndex] };
            if (currentLog.status === "COMPLETED") {
              currentLog.status = "PENDING";
              if (habit.frequency === "DAILY" || !habit.frequency) {
                  newStreak = Math.max(0, newStreak - 1);
              }
            } else {
              currentLog.status = "COMPLETED";
              if (habit.frequency === "DAILY" || !habit.frequency) {
                  newStreak += 1;
                  newHighest = Math.max(newHighest, newStreak);
              }
            }
            logs[existingLogIndex] = currentLog;
          } else {
            logs.push({ date, status: "COMPLETED" } as any);
            if (habit.frequency === "DAILY" || !habit.frequency) {
                newStreak += 1;
                newHighest = Math.max(newHighest, newStreak);
            }
          }

          return {
            ...habit,
            logs,
            currentStreak: newStreak,
            highestStreak: newHighest,
          };
        }),
      );

      return previousHabits;
    },

    onError: (err, vars, previousHabits) => {
      setHabits(previousHabits);
    },

    onSuccess: () => {
      window.dispatchEvent(new Event("refreshGoals"));
      refreshHabits(true);
    },
  });

  const contextValue = useMemo(
    () => ({
      habits,
      isLoading,
      refreshHabits,
      toggleHabitOptimistic: async (id: string, date: string) =>
        toggleHabitOptimistic({ id, date }),
    }),
    [habits, isLoading, refreshHabits],
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
