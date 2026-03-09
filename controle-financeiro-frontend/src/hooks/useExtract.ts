import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useFinanceData } from "./useFinanceData";
import { transactionService } from "@/services/transactionService";
import { Transaction, CreateTransactionDTO } from "@/types";
import { useOptimisticMutation } from "./useOptimisticMutation";

interface ExtractCacheData {
  transactions: Transaction[];
  page: number;
  totalPages: number;
  hasMore: boolean;
}

export function useExtract() {
  const {
    accounts,
    categories,
    refresh: refreshGlobal,
    isLoading: isLoadingGlobal,
  } = useFinanceData();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const [selectedTransactionId, setSelectedTransactionId] = useState<
    string | null
  >(null);
  const [dateRef, setDateRef] = useState(new Date());
  const [filterType, setFilterType] = useState<"todos" | "INCOME" | "EXPENSE">(
    "todos",
  );
  const [filterAccountId, setFilterAccountId] = useState<string>("todas");

  // CAMADA DE CACHE ESTRATÉGICA
  const extractCache = useRef<Record<string, ExtractCacheData>>({});
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchExtract = useCallback(
    async (currentPage: number, append = false, invalidateCache = false) => {
      setIsLoadingList(true);

      const month = dateRef.getMonth() + 1;
      const year = dateRef.getFullYear();
      const cacheKey = `${year}-${month}-${filterType}-${filterAccountId}`;

      if (invalidateCache) {
        extractCache.current = {};
      }

      if (
        !invalidateCache &&
        !append &&
        currentPage === 0 &&
        extractCache.current[cacheKey]
      ) {
        const cached = extractCache.current[cacheKey];
        setTransactions(cached.transactions);
        setPage(cached.page);
        setTotalPages(cached.totalPages);
        setHasMore(cached.hasMore);

        setIsLoadingList(false);
        setIsFirstLoad(false);
        return;
      }

      // --- PROTEÇÃO CONTRA RACE CONDITION ---
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      try {
        const res = await transactionService.getAll({
          page: currentPage,
          size: 30,
          month,
          year,
          type: filterType === "todos" ? undefined : filterType,
          accountId: filterAccountId === "todas" ? undefined : filterAccountId,
          signal,
        });

        if (signal.aborted) return;

        if (res?.data) {
          const newData = res.data;

          setTransactions((prev) => {
            const updatedTransactions = append
              ? [...prev, ...newData.content]
              : newData.content;

            extractCache.current[cacheKey] = {
              transactions: updatedTransactions,
              page: currentPage,
              totalPages: newData.page.totalPages,
              hasMore: newData.page.number < newData.page.totalPages - 1,
            };

            return updatedTransactions;
          });

          setTotalPages(newData.page.totalPages);
          setHasMore(newData.page.number < newData.page.totalPages - 1);
        }
      } catch (error: any) {
        if (error.name === "AbortError") return;
        console.error("Erro ao buscar extrato paginado", error);
      } finally {
        if (!signal.aborted) {
          setIsLoadingList(false);
          setIsFirstLoad(false);
        }
      }
    },
    [dateRef, filterType, filterAccountId],
  );

  // Listener para filtros de navegação
  useEffect(() => {
    setPage(0);
    fetchExtract(0, false);
  }, [fetchExtract]);

  // Listener de Mutações Globais (Nova Transação vinda do Modal Superior)
  useEffect(() => {
    const handleRefresh = () => {
      setPage(0);
      fetchExtract(0, false, true); // True = Explode o cache
    };
    window.addEventListener("refreshExtract", handleRefresh);
    return () => window.removeEventListener("refreshExtract", handleRefresh);
  }, [fetchExtract]);

  const loadMore = () => {
    if (hasMore && !isLoadingList) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchExtract(nextPage, true);
    }
  };

  const groupedTransactions = useMemo(() => {
    const groups: { [key: string]: Transaction[] } = {};
    transactions.forEach((t) => {
      if (!groups[t.date]) groups[t.date] = [];
      groups[t.date].push(t);
    });

    return Object.keys(groups)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
      .map((date) => ({
        date,
        items: groups[date].sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime(),
        ),
      }));
  }, [transactions]);

  const summary = useMemo(() => {
    const entries = transactions
      .filter((t) => t.type === "INCOME")
      .reduce((acc, t) => acc + Number(t.amount), 0);
    const exits = transactions
      .filter((t) => t.type === "EXPENSE")
      .reduce((acc, t) => acc + Number(t.amount), 0);
    return { entries, exits, balance: entries - exits };
  }, [transactions]);

  const currentViewValue = dateRef.getFullYear() * 12 + dateRef.getMonth();
  const minLimitValue = 2025 * 12 + 0;
  const maxLimitValue =
    new Date().getFullYear() * 12 + new Date().getMonth() + 1;

  const changeMonth = (direction: number) => {
    const newDate = new Date(dateRef);
    newDate.setMonth(dateRef.getMonth() + direction);
    setDateRef(newDate);
  };

  const { mutate: deleteTransactionOptimistic } = useOptimisticMutation({
    mutationFn: (id: string) => transactionService.delete(id),
    onMutate: (id) => {
      const previousTransactions = [...transactions];

      setTransactions((prev) => prev.filter((t) => t.id !== id));
      setSelectedTransactionId(null);

      return previousTransactions;
    },
    onError: (err, id, previousTransactions) => {
      setTransactions(previousTransactions);
    },
    onSuccess: () => {
      refreshGlobal();
      window.dispatchEvent(new Event("refreshExtract"));
    },
  });

  const { mutate: updateTransactionOptimistic } = useOptimisticMutation({
    mutationFn: (data: {
      id: string;
      payload: Partial<CreateTransactionDTO>;
    }) => transactionService.update(data.id, data.payload),

    onMutate: ({ id, payload }) => {
      const previousTransactions = [...transactions];

      setTransactions((prev) =>
        prev.map((t) => {
          if (t.id === id) {
            const catName = payload.categoryId
              ? categories.find((c) => c.id === payload.categoryId)?.name
              : t.categoryName;
            return {
              ...t,
              ...payload,
              categoryName: catName || t.categoryName,
            } as Transaction;
          }
          return t;
        }),
      );

      return previousTransactions;
    },
    onError: (err, vars, previousTransactions) => {
      setTransactions(previousTransactions);
    },
    onSuccess: () => {
      refreshGlobal();
      window.dispatchEvent(new Event("refreshExtract"));
    },
  });

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    groupedTransactions,
    summary,
    accounts,
    categories,
    isInitialLoading: isFirstLoad || isLoadingGlobal,
    isFiltering: isLoadingList && !isFirstLoad && page === 0,
    isLoadingMore: isLoadingList && page > 0,
    hasMore,
    loadMore,
    filters: {
      date: dateRef,
      formattedDate: dateRef.toLocaleDateString("pt-BR", {
        month: "long",
        year: "numeric",
      }),
      type: filterType,
      accountId: filterAccountId,
    },
    setFilterType,
    setFilterAccountId,
    changeMonth,
    selectedTransactionId,
    setSelectedTransactionId,
    selectedTransaction: transactions.find(
      (t) => t.id === selectedTransactionId,
    ),
    deleteTransaction: (id: string) => deleteTransactionOptimistic(id),
    updateTransaction: (id: string, data: Partial<CreateTransactionDTO>) =>
      updateTransactionOptimistic({ id, payload: data }),
    canGoBack: currentViewValue > minLimitValue,
    canGoForward: currentViewValue < maxLimitValue,
  };
}
