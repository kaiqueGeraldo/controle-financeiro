"use client";

import { createContext, useContext, useState, ReactNode, useMemo } from "react";
import { Goal, GoalHistory } from "@/types";

interface GoalModalContextType {
  isNewGoalOpen: boolean;
  goalDepositData: Goal | null;
  goalToDelete: Goal | null;
  goalHistoryToDeleteId: string | null;
  historyToDelete: { item: GoalHistory; parent: Goal } | null;

  openNewGoal: () => void;
  closeNewGoal: () => void;
  openGoalDeposit: (goal: Goal) => void;
  closeGoalDeposit: () => void;
  openDeleteGoal: (goal: Goal) => void;
  closeDeleteGoal: () => void;
  openDeleteGoalHistory: (id: string) => void;
  closeDeleteGoalHistory: () => void;
  openDeleteHistory: (item: GoalHistory, parent: Goal) => void;
  closeDeleteHistory: () => void;
}

const GoalModalContext = createContext<GoalModalContextType | undefined>(undefined);

export function GoalModalProvider({ children }: { children: ReactNode }) {
  const [isNewGoalOpen, setIsNewGoalOpen] = useState(false);
  const [goalDepositData, setGoalDepositData] = useState<Goal | null>(null);
  const [goalToDelete, setGoalToDelete] = useState<Goal | null>(null);
  const [goalHistoryToDeleteId, setGoalHistoryToDeleteId] = useState<string | null>(null);
  const [historyToDelete, setHistoryToDelete] = useState<{ item: GoalHistory; parent: Goal } | null>(null);

  const value = useMemo(() => ({
    isNewGoalOpen,
    goalDepositData,
    goalToDelete,
    goalHistoryToDeleteId,
    historyToDelete,

    openNewGoal: () => setIsNewGoalOpen(true),
    closeNewGoal: () => setIsNewGoalOpen(false),
    openGoalDeposit: (goal: Goal) => setGoalDepositData(goal),
    closeGoalDeposit: () => setGoalDepositData(null),
    openDeleteGoal: (goal: Goal) => setGoalToDelete(goal),
    closeDeleteGoal: () => setGoalToDelete(null),
    openDeleteGoalHistory: (id: string) => setGoalHistoryToDeleteId(id),
    closeDeleteGoalHistory: () => setGoalHistoryToDeleteId(null),
    openDeleteHistory: (item: GoalHistory, parent: Goal) => setHistoryToDelete({ item, parent }),
    closeDeleteHistory: () => setHistoryToDelete(null),
  }), [isNewGoalOpen, goalDepositData, goalToDelete, goalHistoryToDeleteId, historyToDelete]);

  return <GoalModalContext.Provider value={value}>{children}</GoalModalContext.Provider>;
}

export const useGoalModals = () => {
  const context = useContext(GoalModalContext);
  if (!context) throw new Error("useGoalModals deve ser usado dentro do Provider");
  return context;
};