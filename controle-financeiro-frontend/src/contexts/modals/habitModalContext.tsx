"use client";

import { createContext, ReactNode, useContext, useMemo, useState } from "react";

interface HabitModalContextType {
  isNewHabitOpen: boolean;
  openNewHabit: () => void;
  closeNewHabit: () => void;
}

const HabitModalContext = createContext<HabitModalContextType | undefined>(undefined);

export function HabitModalProvider({ children }: { children: ReactNode }) {
  const [isNewHabitOpen, setIsNewHabitOpen] = useState(false);

  const value = useMemo(() => ({
    isNewHabitOpen,
    openNewHabit: () => setIsNewHabitOpen(true),
    closeNewHabit: () => setIsNewHabitOpen(false),
  }), [isNewHabitOpen]);

  return <HabitModalContext.Provider value={value}>{children}</HabitModalContext.Provider>;
}

export const useHabitModals = () => {
  const context = useContext(HabitModalContext);
  if (!context) throw new Error("useHabitModals deve ser usado dentro do Provider");
  return context;
};