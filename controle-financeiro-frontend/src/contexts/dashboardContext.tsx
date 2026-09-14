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
import {
  isAbortError,
  useRequestCoordinator,
} from "@/hooks/useRequestCoordinator";

interface FlowData {
  income: number;
  expense: number;
  balance: number;
  percentage: number;
}

type ChartPoint = { label: string; valor: number };

interface DashboardContextType {
  flowData: FlowData;
  chartData: ChartPoint[];
  recentTransactions: Transaction[];
  isFlowLoading: boolean;
  isChartLoading: boolean;
  isRecentLoading: boolean;
  flowError: Error | null;
  chartError: Error | null;
  recentTransactionsError: Error | null;
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
  const requests = useRequestCoordinator(userId);

  const [flowData, setFlowData] = useState({
    income: 0,
    expense: 0,
    balance: 0,
    percentage: 0,
  });
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>(
    [],
  );

  const [isFlowLoading, setIsFlowLoading] = useState(true);
  const [isChartLoading, setIsChartLoading] = useState(true);
  const [isRecentLoading, setIsRecentLoading] = useState(true);
  const [flowError, setFlowError] = useState<Error | null>(null);
  const [chartError, setChartError] = useState<Error | null>(null);
  const [recentTransactionsError, setRecentTransactionsError] =
    useState<Error | null>(null);

  const flowCache = useRef<Record<string, FlowData>>({});
  const chartCache = useRef<Record<string, ChartPoint[]>>({});
  const recentCache = useRef<Record<string, Transaction[]>>({});

  const fetchFlowData = useCallback(
    async (invalidateCache = false, isBackground = false) => {
      if (isLoadingUser || !userId) return;

      setFlowError(null);

      const now = new Date();
      const cacheKey = `${userId}:${now.getMonth() + 1}-${now.getFullYear()}`;

      if (invalidateCache) flowCache.current = {};

      if (!invalidateCache && flowCache.current[cacheKey]) {
        setFlowData(flowCache.current[cacheKey]);
        if (!isBackground) setIsFlowLoading(false);
        return;
      }

      if (!isBackground) setIsFlowLoading(true);
      const request = requests.begin("dashboard-flow");

      try {
        const res = await dashboardService.getMonthlyFlow(
          now.getMonth() + 1,
          now.getFullYear(),
          request.signal,
        );
        if (request.isCurrent() && res?.data) {
          setFlowData(res.data);
          flowCache.current[cacheKey] = res.data;
        }
      } catch (error: unknown) {
        if (request.isCurrent() && !isAbortError(error)) {
          setFlowError(
            error instanceof Error
              ? error
              : new Error("Falha ao carregar o fluxo mensal."),
          );
          console.error("Erro ao buscar fluxo mensal", error);
        }
      } finally {
        if (request.isCurrent() && !isBackground) setIsFlowLoading(false);
        request.finish();
      }
    },
    [userId, isLoadingUser, requests],
  );

  const fetchChartData = useCallback(
    async (period: "30D" | "6M" | "1Y", invalidateCache = false) => {
      if (isLoadingUser || !userId) return;
      setChartError(null);
      if (invalidateCache) chartCache.current = {};
      const cacheKey = `${userId}:${period}`;
      if (!invalidateCache && chartCache.current[cacheKey]) {
        setChartData(chartCache.current[cacheKey]);
        setIsChartLoading(false);
        return;
      }
      setIsChartLoading(true);
      const request = requests.begin("dashboard-chart");
      try {
        const res = await dashboardService.getWealthChart(
          period,
          request.signal,
        );
        if (request.isCurrent() && res?.data) {
          setChartData(res.data);
          chartCache.current[cacheKey] = res.data;
        }
      } catch (error: unknown) {
        if (request.isCurrent() && !isAbortError(error)) {
          setChartError(
            error instanceof Error
              ? error
              : new Error("Falha ao carregar o gráfico."),
          );
          console.error("Erro ao buscar gráfico", error);
        }
      } finally {
        if (request.isCurrent()) setIsChartLoading(false);
        request.finish();
      }
    },
    [userId, isLoadingUser, requests],
  );

  const fetchRecentTransactions = useCallback(
    async (invalidateCache = false, isBackground = false) => {
      if (isLoadingUser || !userId) return;

      setRecentTransactionsError(null);

      const cacheKey = userId;
      if (invalidateCache) recentCache.current = {};

      if (!invalidateCache && recentCache.current[cacheKey]?.length > 0) {
        setRecentTransactions(recentCache.current[cacheKey]);
        if (!isBackground) setIsRecentLoading(false);
        return;
      }

      if (!isBackground) setIsRecentLoading(true);
      const request = requests.begin("dashboard-recent");

      try {
        const res = await transactionService.getAll({
          page: 0,
          size: 5,
          signal: request.signal,
        });
        if (request.isCurrent() && res?.data?.content) {
          setRecentTransactions(res.data.content);
          recentCache.current[cacheKey] = res.data.content;
        }
      } catch (error: unknown) {
        if (request.isCurrent() && !isAbortError(error)) {
          setRecentTransactionsError(
            error instanceof Error
              ? error
              : new Error("Falha ao carregar as transações recentes."),
          );
          console.error("Erro ao buscar transações recentes", error);
        }
      } finally {
        if (request.isCurrent() && !isBackground) setIsRecentLoading(false);
        request.finish();
      }
    },
    [userId, isLoadingUser, requests],
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
    flowCache.current = {};
    chartCache.current = {};
    recentCache.current = {};
    setFlowData({ income: 0, expense: 0, balance: 0, percentage: 0 });
    setChartData([]);
    setRecentTransactions([]);
    setFlowError(null);
    setChartError(null);
    setRecentTransactionsError(null);

    if (isLoadingUser) {
      setIsFlowLoading(true);
      setIsChartLoading(true);
      setIsRecentLoading(true);
    } else if (!userId) {
      setIsFlowLoading(false);
      setIsChartLoading(false);
      setIsRecentLoading(false);
    }
  }, [userId, isLoadingUser]);

  useEffect(() => {
    fetchFlowData();
    fetchRecentTransactions();
  }, [fetchFlowData, fetchRecentTransactions]);

  const contextValue = useMemo(
    () => ({
      flowData,
      chartData,
      recentTransactions,
      isFlowLoading,
      isChartLoading,
      isRecentLoading,
      flowError,
      chartError,
      recentTransactionsError,
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
      flowError,
      chartError,
      recentTransactionsError,
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
