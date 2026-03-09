"use client";

import { createContext, useContext, useState, ReactNode, useMemo } from "react";

interface TransactionModalContextType {
  isNewTransactionOpen: boolean;
  transactionToDeleteId: string | null;
  openNewTransaction: () => void;
  closeNewTransaction: () => void;
  openDeleteTransaction: (id: string) => void;
  closeDeleteTransaction: () => void;
}

const TransactionModalContext = createContext<TransactionModalContextType | undefined>(undefined);

export function TransactionModalProvider({ children }: { children: ReactNode }) {
  const [isNewTransactionOpen, setIsNewTransactionOpen] = useState(false);
  const [transactionToDeleteId, setTransactionToDeleteId] = useState<string | null>(null);

  const value = useMemo(() => ({
    isNewTransactionOpen,
    transactionToDeleteId,
    openNewTransaction: () => setIsNewTransactionOpen(true),
    closeNewTransaction: () => setIsNewTransactionOpen(false),
    openDeleteTransaction: (id: string) => setTransactionToDeleteId(id),
    closeDeleteTransaction: () => setTransactionToDeleteId(null),
  }), [isNewTransactionOpen, transactionToDeleteId]);

  return (
    <TransactionModalContext.Provider value={value}>
      {children}
    </TransactionModalContext.Provider>
  );
}

export const useTransactionModals = () => {
  const context = useContext(TransactionModalContext);
  if (!context) throw new Error("useTransactionModals deve ser usado dentro do Provider");
  return context;
};