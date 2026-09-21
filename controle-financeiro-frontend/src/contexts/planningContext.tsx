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
import { planningService } from "@/services/planningService";
import { categoryService } from "@/services/categoryService";
import { PlanItem, Category } from "@/types";
import { useUserContext } from "./userContext";
import { shiftMonth } from "@/utils/date";
import { onFinancialReconciliation } from "@/utils/financialReconciliation";
import {
  isAbortError,
  useRequestCoordinator,
} from "@/hooks/useRequestCoordinator";

interface PlanningContextType {
  items: PlanItem[];
  incomeForecast: number;
  categories: Category[];
  isLoading: boolean;
  error: Error | null;
  dateRef: Date;
  changeMonth: (direction: number) => void;
  refreshPlanning: (
    invalidateCache?: boolean,
    isBackground?: boolean,
  ) => Promise<void>;
  canGoBack: boolean;
  canGoForward: boolean;
}

const PlanningContext = createContext<PlanningContextType | undefined>(
  undefined,
);

export function PlanningProvider({ children }: { children: ReactNode }) {
  const [dateRef, setDateRef] = useState(new Date());
  const [items, setItems] = useState<PlanItem[]>([]);
  const [incomeForecast, setIncomeForecast] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const { user, isLoading: isLoadingUser } = useUserContext();
  const userId = user?.id;
  const requests = useRequestCoordinator(userId);

  // --- CACHE DE MEMÓRIA E CONTROLE DE DEBOUNCE ---
  const planCache = useRef<
    Record<string, { items: PlanItem[]; incomeForecast: number }>
  >({});
  const categoryCache = useRef<Record<string, Category[]>>({});
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const timerResolveRef = useRef<(() => void) | null>(null);

  const cancelScheduledFetch = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    timerResolveRef.current?.();
    timerResolveRef.current = null;
  }, []);

  const fetchData = useCallback(
    async (invalidateCache = false, isBackground = false, requireSuccess = false) => {
      if (isLoadingUser || !userId) {
        setIsLoading(false);
        return;
      }

      if (invalidateCache) {
        planCache.current = {};
      }

      const month = dateRef.getMonth() + 1;
      const year = dateRef.getFullYear();
      const cacheKey = `${userId}:${month}-${year}`;
      const cachedCategories = categoryCache.current[userId];
      cancelScheduledFetch();
      requests.invalidate("planning");
      setError(null);

      if (
        !invalidateCache &&
        planCache.current[cacheKey] &&
        cachedCategories
      ) {
        setItems(planCache.current[cacheKey].items);
        setIncomeForecast(planCache.current[cacheKey].incomeForecast);
        setCategories(cachedCategories);
        setIsLoading(false);
        return;
      }

      if (!isBackground) setIsLoading(true);

      cancelScheduledFetch();
      const request = requests.begin("planning");

      return new Promise<void>((resolve, reject) => {
        timerResolveRef.current = () => {
          if (requireSuccess) reject(new Error("Reconciliação do planejamento cancelada; atualize novamente."));
          else resolve();
        };
        timerRef.current = setTimeout(async () => {
          timerRef.current = null;
          timerResolveRef.current = null;

          try {
            const fetchCategories = !cachedCategories;

            const [plansRes, catsRes] = await Promise.all([
              planningService.getByMonth(month, year, request.signal),
              fetchCategories
                ? categoryService.getAll("EXPENSE", request.signal)
                : Promise.resolve(null),
            ]);

            if (!request.isCurrent()) {
              if (requireSuccess) reject(new Error("Leitura do planejamento substituída."));
              return;
            }

            if (plansRes?.data) {
              setItems(plansRes.data.items || []);
              setIncomeForecast(plansRes.data.incomeForecast || 0);

              planCache.current[cacheKey] = {
                items: plansRes.data.items || [],
                incomeForecast: plansRes.data.incomeForecast || 0,
              };
            } else {
              setItems([]);
              setIncomeForecast(0);
            }

            if (catsRes?.data) {
              categoryCache.current[userId] = catsRes.data;
              setCategories(catsRes.data);
            } else if (cachedCategories) {
              setCategories(cachedCategories);
            }
          } catch (error: unknown) {
            if (request.isCurrent() && !isAbortError(error)) {
              setError(error instanceof Error ? error : new Error("Falha ao carregar planejamento."));
            }
            if (requireSuccess) reject(error);
            if (
              request.isCurrent() &&
              !isAbortError(error) &&
              !isHttpStatus(error, 403) &&
              !isHttpStatus(error, 401)
            ) {
              console.error("Erro ao buscar planejamento", error);
            }
          } finally {
            if (request.isCurrent()) setIsLoading(false);
            request.finish();
            resolve();
          }
        }, 350);
      });
    },
    [
      dateRef,
      userId,
      isLoadingUser,
      requests,
      cancelScheduledFetch,
    ],
  );

  useEffect(() => {
    setItems([]);
    setIncomeForecast(0);
    setCategories([]);
    planCache.current = {};
    categoryCache.current = {};

    if (isLoadingUser) {
      setIsLoading(true);
    } else if (!userId) {
      setIsLoading(false);
    }
  }, [userId, isLoadingUser]);

  useEffect(() => {
    fetchData();
    return () => {
      cancelScheduledFetch();
      requests.invalidate("planning");
    };
  }, [fetchData, cancelScheduledFetch, requests]);

  useEffect(() => {
    const handleRefresh = () => {
      fetchData(true, true);
    };
    window.addEventListener("refreshPlanning", handleRefresh);
    return () => window.removeEventListener("refreshPlanning", handleRefresh);
  }, [fetchData]);

  useEffect(() => onFinancialReconciliation(() => fetchData(true, false, true)), [fetchData]);

  // --- LIMITES DE DATA ---
  const currentViewValue = dateRef.getFullYear() * 12 + dateRef.getMonth();
  const minLimitValue = 2025 * 12 + 0;
  const now = new Date();
  const maxLimitValue = (now.getFullYear() + 1) * 12 + 11;

  const canGoBack = currentViewValue > minLimitValue;
  const canGoForward = currentViewValue < maxLimitValue;

  const handleChangeMonth = useCallback(
    (direction: number) => {
      if (direction === -1 && !canGoBack) return;
      if (direction === 1 && !canGoForward) return;
      setDateRef((prev) => {
        return shiftMonth(prev, direction);
      });
    },
    [canGoBack, canGoForward],
  );

  const handleRefreshPlanning = useCallback(
    async (invalidateCache = true, isBackground = true) => {
      await fetchData(invalidateCache, isBackground);
    },
    [fetchData],
  );

  const contextValue = useMemo(
    () => ({
      items,
      incomeForecast,
      categories,
      isLoading,
      error,
      dateRef,
      changeMonth: handleChangeMonth,
      refreshPlanning: handleRefreshPlanning,
      canGoBack,
      canGoForward,
    }),
    [
      items,
      incomeForecast,
      categories,
      isLoading,
      error,
      dateRef,
      handleChangeMonth,
      handleRefreshPlanning,
      canGoBack,
      canGoForward,
    ],
  );

  return (
    <PlanningContext.Provider value={contextValue}>
      {children}
    </PlanningContext.Provider>
  );
}

function isHttpStatus(error: unknown, status: number): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    error.status === status
  );
}

export function usePlanningContext() {
  const context = useContext(PlanningContext);
  if (!context)
    throw new Error(
      "usePlanningContext deve ser usado dentro de PlanningProvider",
    );
  return context;
}
