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

interface PlanningContextType {
  items: PlanItem[];
  incomeForecast: number;
  categories: Category[];
  isLoading: boolean;
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

  const { user, isLoading: isLoadingUser } = useUserContext();
  const userId = user?.id;

  // --- CACHE DE MEMÓRIA E CONTROLE DE DEBOUNCE ---
  const planCache = useRef<
    Record<string, { items: PlanItem[]; incomeForecast: number }>
  >({});
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(
    async (invalidateCache = false, isBackground = false) => {
      if (isLoadingUser || !userId) {
        setIsLoading(false);
        return;
      }

      if (invalidateCache) {
        planCache.current = {};
      }

      const month = dateRef.getMonth() + 1;
      const year = dateRef.getFullYear();
      const cacheKey = `${month}-${year}`;

      if (
        !invalidateCache &&
        planCache.current[cacheKey] &&
        categories.length > 0
      ) {
        setItems(planCache.current[cacheKey].items);
        setIncomeForecast(planCache.current[cacheKey].incomeForecast);
        setIsLoading(false);
        return;
      }

      if (!isBackground) setIsLoading(true);

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      return new Promise<void>((resolve) => {
        timerRef.current = setTimeout(async () => {
          abortControllerRef.current = new AbortController();
          const signal = abortControllerRef.current.signal;

          try {
            const fetchCategories = categories.length === 0;

            const [plansRes, catsRes] = await Promise.all([
              planningService.getByMonth(month, year, signal),
              fetchCategories
                ? categoryService.getAll("EXPENSE", signal)
                : Promise.resolve(null),
            ]);

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

            if (catsRes?.data) setCategories(catsRes.data);
          } catch (error: any) {
            if (error.name === "AbortError") {
              return;
            }
            if (error.status !== 403 && error.status !== 401) {
              console.error("Erro ao buscar planejamento", error);
            }
          } finally {
            if (!signal.aborted) {
              setIsLoading(false);
              resolve();
            }
          }
        }, 350);
      });
    },
    [dateRef, userId, isLoadingUser, categories.length],
  );

  useEffect(() => {
    fetchData();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [fetchData]);

  useEffect(() => {
    const handleRefresh = () => {
      fetchData(true, true);
    };
    window.addEventListener("refreshPlanning", handleRefresh);
    return () => window.removeEventListener("refreshPlanning", handleRefresh);
  }, [fetchData]);

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
        const newDate = new Date(prev);
        newDate.setMonth(prev.getMonth() + direction);
        return newDate;
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

export function usePlanningContext() {
  const context = useContext(PlanningContext);
  if (!context)
    throw new Error(
      "usePlanningContext deve ser usado dentro de PlanningProvider",
    );
  return context;
}
