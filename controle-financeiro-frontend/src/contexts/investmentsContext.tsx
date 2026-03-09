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
import { investmentService } from "@/services/investmentService";
import { Investment } from "@/types";
import { useUser } from "@/hooks/useUser";
import { useFinanceData } from "@/hooks/useFinanceData";

interface InvestmentsContextType {
  investments: Investment[];
  isLoading: boolean;
  refreshInvestments: () => Promise<void>;
  totalInvestido: number;
  lucroTotal: number;
  rentabilidadeGeral: number;
}

const InvestmentsContext = createContext<InvestmentsContextType | undefined>(
  undefined,
);

export function InvestmentsProvider({ children }: { children: ReactNode }) {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { user, isLoading: isLoadingUser } = useUser();
  const { refresh: refreshFinance } = useFinanceData();
  const userId = user?.id;

  const refreshInvestments = useCallback(async () => {
    if (isLoadingUser || !userId) {
      setIsLoading(false);
      return;
    }

    try {
      const res = await investmentService.getAll();
      if (res?.data) setInvestments(res.data);
    } catch (error) {
      console.error("Erro ao buscar investimentos", error);
    } finally {
      setIsLoading(false);
    }
  }, [userId, isLoadingUser]);

  useEffect(() => {
    refreshInvestments();
  }, [refreshInvestments]);

  const refreshAll = useCallback(async () => {
    await refreshInvestments();
    await refreshFinance();
  }, [refreshInvestments, refreshFinance]);

  const { totalInvestido, custoTotal, lucroTotal, rentabilidadeGeral } =
    useMemo(() => {
      const totalInv = investments.reduce(
        (acc, inv) => acc + inv.quantity * inv.currentPrice,
        0,
      );
      const custoTot = investments.reduce(
        (acc, inv) => acc + inv.quantity * inv.averagePrice,
        0,
      );
      const lucroTot = totalInv - custoTot;
      const rentabilidade = custoTot > 0 ? (lucroTot / custoTot) * 100 : 0;

      return {
        totalInvestido: totalInv,
        custoTotal: custoTot,
        lucroTotal: lucroTot,
        rentabilidadeGeral: rentabilidade,
      };
    }, [investments]);

  const contextValue = useMemo(
    () => ({
      investments,
      isLoading,
      refreshInvestments: refreshAll,
      totalInvestido,
      lucroTotal,
      rentabilidadeGeral,
    }),
    [
      investments,
      isLoading,
      refreshAll,
      totalInvestido,
      lucroTotal,
      rentabilidadeGeral,
    ],
  );

  return (
    <InvestmentsContext.Provider value={contextValue}>
      {children}
    </InvestmentsContext.Provider>
  );
}

export function useInvestmentsContext() {
  const context = useContext(InvestmentsContext);
  if (!context)
    throw new Error(
      "useInvestmentsContext deve ser usado dentro de InvestmentsProvider",
    );
  return context;
}
