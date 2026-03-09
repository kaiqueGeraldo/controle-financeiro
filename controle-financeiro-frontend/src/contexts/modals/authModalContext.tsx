"use client";

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";

interface AuthModalContextType {
  isLogoutOpen: boolean;
  isSessionExpired: boolean;
  openLogout: () => void;
  closeLogout: () => void;
  closeSessionExpired: () => void;
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined);

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [isSessionExpired, setIsSessionExpired] = useState(false);

  useEffect(() => {
    const handleSessionExpired = () => setIsSessionExpired(true);
    window.addEventListener("sessionExpired", handleSessionExpired);
    return () => window.removeEventListener("sessionExpired", handleSessionExpired);
  }, []);

  const value = useMemo(() => ({
    isLogoutOpen,
    isSessionExpired,
    openLogout: () => setIsLogoutOpen(true),
    closeLogout: () => setIsLogoutOpen(false),
    closeSessionExpired: () => setIsSessionExpired(false),
  }), [isLogoutOpen, isSessionExpired]);

  return <AuthModalContext.Provider value={value}>{children}</AuthModalContext.Provider>;
}

export const useAuthModals = () => {
  const context = useContext(AuthModalContext);
  if (!context) throw new Error("useAuthModals deve ser usado dentro do AuthModalProvider");
  return context;
};