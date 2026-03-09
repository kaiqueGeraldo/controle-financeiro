"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
  useRef,
  useMemo,
} from "react";
import { dashboardService } from "@/services/dashboardService";
import { transactionService } from "@/services/transactionService";
import { useUserContext } from "./userContext";
import { Transaction } from "@/types";

interface DashboardContextType {
  flowData: {
    income: number;
    expense: number;
    balance: number;
    percentage: number;
  };
  chartData: { label: string; valor: number }[];
  recentTransactions: Transaction[];
  isFlowLoading: boolean;
  isChartLoading: boolean;
  isRecentLoading: boolean;
  refreshDashboard: (
    invalidateCache?: boolean,
    isBackground?: boolean,
  ) => Promise<void>;
  fetchChartData: (
    period: "30D" | "6M" | "1Y",
    invalidateCache?: boolean,
  ) => Promise<void>;
}

const DashboardContext = createContext<DashboardContextType | undefined>(
  undefined,
);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: isLoadingUser } = useUserContext();
  const userId = user?.id;

  const [flowData, setFlowData] = useState({
    income: 0,
    expense: 0,
    balance: 0,
    percentage: 0,
  });
  const [chartData, setChartData] = useState<
    { label: string; valor: number }[]
  >([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>(
    [],
  );

  const [isFlowLoading, setIsFlowLoading] = useState(true);
  const [isChartLoading, setIsChartLoading] = useState(true);
  const [isRecentLoading, setIsRecentLoading] = useState(true);

  const flowCache = useRef<Record<string, any>>({});
  const chartCache = useRef<Record<string, any>>({});
  const recentCache = useRef<Transaction[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchFlowData = useCallback(
    async (invalidateCache = false, isBackground = false) => {
      if (isLoadingUser || !userId) return;

      const now = new Date();
      const cacheKey = `${now.getMonth() + 1}-${now.getFullYear()}`;

      if (invalidateCache) flowCache.current = {};

      if (!invalidateCache && flowCache.current[cacheKey]) {
        setFlowData(flowCache.current[cacheKey]);
        if (!isBackground) setIsFlowLoading(false);
        return;
      }

      if (!isBackground) setIsFlowLoading(true);

      try {
        const res = await dashboardService.getMonthlyFlow(
          now.getMonth() + 1,
          now.getFullYear(),
        );
        if (res?.data) {
          setFlowData(res.data);
          flowCache.current[cacheKey] = res.data;
        }
      } catch (error) {
        console.error("Erro ao buscar fluxo mensal", error);
      } finally {
        if (!isBackground) setIsFlowLoading(false);
      }
    },
    [userId, isLoadingUser],
  );

  const fetchChartData = useCallback(
    async (period: "30D" | "6M" | "1Y", invalidateCache = false) => {
      if (isLoadingUser || !userId) return;
      if (invalidateCache) chartCache.current = {};
      if (!invalidateCache && chartCache.current[period]) {
        setChartData(chartCache.current[period]);
        setIsChartLoading(false);
        return;
      }
      setIsChartLoading(true);
      if (abortControllerRef.current) abortControllerRef.current.abort();
      abortControllerRef.current = new AbortController();
      try {
        const res = await dashboardService.getWealthChart(
          period,
          abortControllerRef.current.signal,
        );
        if (res?.data) {
          setChartData(res.data);
          chartCache.current[period] = res.data;
        }
      } catch (error: any) {
        if (error.name !== "AbortError")
          console.error("Erro ao buscar gráfico", error);
      } finally {
        setIsChartLoading(false);
      }
    },
    [userId, isLoadingUser],
  );

  const fetchRecentTransactions = useCallback(
    async (invalidateCache = false, isBackground = false) => {
      if (isLoadingUser || !userId) return;

      if (invalidateCache) recentCache.current = [];

      if (!invalidateCache && recentCache.current.length > 0) {
        setRecentTransactions(recentCache.current);
        if (!isBackground) setIsRecentLoading(false);
        return;
      }

      if (!isBackground) setIsRecentLoading(true);

      try {
        const res = await transactionService.getAll({ page: 0, size: 5 });
        if (res?.data?.content) {
          setRecentTransactions(res.data.content);
          recentCache.current = res.data.content;
        }
      } catch (error) {
        console.error("Erro ao buscar transações recentes", error);
      } finally {
        if (!isBackground) setIsRecentLoading(false);
      }
    },
    [userId, isLoadingUser],
  );

  const refreshDashboard = useCallback(
    async (invalidateCache = false, isBackground = false) => {
      await Promise.all([
        fetchFlowData(invalidateCache, isBackground),
        fetchRecentTransactions(invalidateCache, isBackground),
      ]);
    },
    [fetchFlowData, fetchRecentTransactions],
  );

  useEffect(() => {
    const handleSilentRefresh = () => refreshDashboard(true, true);

    window.addEventListener("refreshExtract", handleSilentRefresh);
    window.addEventListener("refreshCards", handleSilentRefresh);
    window.addEventListener("refreshFinance", handleSilentRefresh);

    return () => {
      window.removeEventListener("refreshExtract", handleSilentRefresh);
      window.removeEventListener("refreshCards", handleSilentRefresh);
      window.removeEventListener("refreshFinance", handleSilentRefresh);
    };
  }, [refreshDashboard]);

  useEffect(() => {
    fetchFlowData();
    fetchRecentTransactions();
  }, [fetchFlowData, fetchRecentTransactions]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const contextValue = useMemo(
    () => ({
      flowData,
      chartData,
      recentTransactions,
      isFlowLoading,
      isChartLoading,
      isRecentLoading,
      refreshDashboard,
      fetchChartData,
    }),
    [
      flowData,
      chartData,
      recentTransactions,
      isFlowLoading,
      isChartLoading,
      isRecentLoading,
      refreshDashboard,
      fetchChartData,
    ],
  );

  return (
    <DashboardContext.Provider value={contextValue}>
      {children}
    </DashboardContext.Provider>
  );
}

export const useDashboardContext = () => {
  const context = useContext(DashboardContext);
  if (!context)
    throw new Error(
      "useDashboardContext deve ser usado dentro do DashboardProvider",
    );
  return context;
};
