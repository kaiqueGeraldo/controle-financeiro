"use client";

import { createContext, ReactNode, useContext, useMemo, useState } from "react";

export type CopyPlanningData = {
  month: number;
  year: number;
} | null;

interface PlanningModalContextType {
  isNewPlanOpen: boolean;
  planItemToDeleteId: string | null;
  copyPlanningData: CopyPlanningData;
  
  openNewPlan: () => void;
  closeNewPlan: () => void;
  openDeletePlanItem: (id: string) => void;
  closeDeletePlanItem: () => void;
  openCopyPlanning: (month: number, year: number) => void;
  closeCopyPlanning: () => void;
}

const PlanningModalContext = createContext<PlanningModalContextType | undefined>(undefined);

export function PlanningModalProvider({ children }: { children: ReactNode }) {
  const [isNewPlanOpen, setIsNewPlanOpen] = useState(false);
  const [planItemToDeleteId, setPlanItemToDeleteId] = useState<string | null>(null);
  const [copyPlanningData, setCopyPlanningData] = useState<CopyPlanningData>(null);

  const value = useMemo(() => ({
    isNewPlanOpen,
    planItemToDeleteId,
    copyPlanningData,
    
    openNewPlan: () => setIsNewPlanOpen(true),
    closeNewPlan: () => setIsNewPlanOpen(false),
    openDeletePlanItem: (id: string) => setPlanItemToDeleteId(id),
    closeDeletePlanItem: () => setPlanItemToDeleteId(null),
    openCopyPlanning: (month: number, year: number) => setCopyPlanningData({ month, year }),
    closeCopyPlanning: () => setCopyPlanningData(null),
  }), [isNewPlanOpen, planItemToDeleteId, copyPlanningData]);

  return <PlanningModalContext.Provider value={value}>{children}</PlanningModalContext.Provider>;
}

export const usePlanningModals = () => {
  const context = useContext(PlanningModalContext);
  if (!context) throw new Error("usePlanningModals deve ser usado dentro do PlanningModalProvider");
  return context;
};