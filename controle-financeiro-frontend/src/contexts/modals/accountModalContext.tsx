"use client";

import { createContext, useContext, useState, ReactNode, useMemo } from "react";

interface AccountModalContextType {
  isManageAccountOpen: boolean;
  openManageAccount: () => void;
  closeManageAccount: () => void;
}

const AccountModalContext = createContext<AccountModalContextType | undefined>(
  undefined,
);

export function AccountModalProvider({ children }: { children: ReactNode }) {
  const [isManageAccountOpen, setIsManageAccountOpen] = useState(false);

  const value = useMemo(
    () => ({
      isManageAccountOpen,
      openManageAccount: () => setIsManageAccountOpen(true),
      closeManageAccount: () => setIsManageAccountOpen(false),
    }),
    [isManageAccountOpen],
  );

  return (
    <AccountModalContext.Provider value={value}>
      {children}
    </AccountModalContext.Provider>
  );
}

export const useAccountModals = () => {
  const context = useContext(AccountModalContext);
  if (!context)
    throw new Error("useAccountModals deve ser usado dentro do Provider");
  return context;
};
