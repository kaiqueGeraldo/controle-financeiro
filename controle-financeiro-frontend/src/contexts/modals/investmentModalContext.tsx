"use client";

import { Investment } from "@/types";
import { createContext, ReactNode, useContext, useMemo, useState } from "react";

interface InvestmentModalContextType {
  isNewAssetOpen: boolean;
  operationAsset: Investment | null;

  openNewAsset: () => void;
  closeNewAsset: () => void;
  openOperation: (asset: Investment) => void;
  closeOperation: () => void;
}

const InvestmentModalContext = createContext<InvestmentModalContextType | undefined>(undefined);

export function InvestmentModalProvider({ children }: { children: ReactNode }) {
  const [isNewAssetOpen, setIsNewAssetOpen] = useState(false);
  const [operationAsset, setOperationAsset] = useState<Investment | null>(null);

  const value = useMemo(() => ({
    isNewAssetOpen,
    operationAsset,
    openNewAsset: () => setIsNewAssetOpen(true),
    closeNewAsset: () => setIsNewAssetOpen(false),
    openOperation: (asset: Investment) => setOperationAsset(asset),
    closeOperation: () => setOperationAsset(null),
  }), [isNewAssetOpen, operationAsset]);

  return <InvestmentModalContext.Provider value={value}>{children}</InvestmentModalContext.Provider>;
}

export const useInvestmentModals = () => {
  const context = useContext(InvestmentModalContext);
  if (!context) throw new Error("useInvestmentModals deve ser usado dentro do Provider");
  return context;
};