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
import {
  isAbortError,
  useRequestCoordinator,
} from "@/hooks/useRequestCoordinator";

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
  const requests = useRequestCoordinator(userId);

  const refreshInvestments = useCallback(async () => {
    if (isLoadingUser || !userId) {
      setIsLoading(false);
      return;
    }

    const request = requests.begin("investments");
    setIsLoading(true);

    try {
      const res = await investmentService.getAll(request.signal);
      if (request.isCurrent()) setInvestments(res.data ?? []);
    } catch (error: unknown) {
      if (request.isCurrent() && !isAbortError(error)) {
        console.error("Erro ao buscar investimentos", error);
      }
    } finally {
      if (request.isCurrent()) setIsLoading(false);
      request.finish();
    }
  }, [userId, isLoadingUser, requests]);

  useEffect(() => {
    setInvestments([]);
    if (isLoadingUser) {
      setIsLoading(true);
      return;
    }
    refreshInvestments();
  }, [userId, isLoadingUser, refreshInvestments]);

  const refreshAll = useCallback(async () => {
    await refreshInvestments();
    await refreshFinance();
  }, [refreshInvestments, refreshFinance]);

  const { totalInvestido, lucroTotal, rentabilidadeGeral } =
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
