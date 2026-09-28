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
  error: Error | null;
  refreshInvestments: () => Promise<void>;
  totalInvestido: number;
  valuationComplete: boolean;
  lucroTotal: number | null;
  rentabilidadeGeral: number | null;
}

const InvestmentsContext = createContext<InvestmentsContextType | undefined>(
  undefined,
);

export function summarizeInvestmentPosition(investments: Investment[]) {
  const totalInvestido = investments.reduce((sum, investment) => sum + (investment.valuationAmount ?? 0), 0);
  const totalCost = investments.reduce((sum, investment) => sum + (investment.totalCost ?? 0), 0);
  const valuationComplete = investments.every((investment) => investment.valuationAmount != null);
  const costComplete = investments.every((investment) => investment.totalCost != null);
  const lucroTotal = valuationComplete && costComplete ? totalInvestido - totalCost : null;
  const rentabilidadeGeral = lucroTotal !== null && totalCost > 0 ? (lucroTotal / totalCost) * 100 : null;
  return { totalInvestido, valuationComplete, lucroTotal, rentabilidadeGeral };
}

export function InvestmentsProvider({ children }: { children: ReactNode }) {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

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
    setError(null);

    try {
      const res = await investmentService.getAll(request.signal);
      if (request.isCurrent()) setInvestments(res.data ?? []);
    } catch (error: unknown) {
      if (request.isCurrent() && !isAbortError(error)) {
        setError(
          error instanceof Error
            ? error
            : new Error("Falha ao carregar investimentos."),
        );
        console.error("Erro ao buscar investimentos", error);
      }
    } finally {
      if (request.isCurrent()) setIsLoading(false);
      request.finish();
    }
  }, [userId, isLoadingUser, requests]);

  useEffect(() => {
    setInvestments([]);
    setError(null);
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

  const { totalInvestido, valuationComplete, lucroTotal, rentabilidadeGeral } =
    useMemo(() => summarizeInvestmentPosition(investments), [investments]);

  const contextValue = useMemo(
    () => ({
      investments,
      isLoading,
      error,
      refreshInvestments: refreshAll,
      totalInvestido,
      valuationComplete,
      lucroTotal,
      rentabilidadeGeral,
    }),
    [
      investments,
      isLoading,
      error,
      refreshAll,
      totalInvestido,
      valuationComplete,
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
