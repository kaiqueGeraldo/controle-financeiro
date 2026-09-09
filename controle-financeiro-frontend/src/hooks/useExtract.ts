import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useFinanceData } from "./useFinanceData";
import { transactionService } from "@/services/transactionService";
import { Transaction, CreateTransactionDTO } from "@/types";
import { useOptimisticMutation } from "./useOptimisticMutation";
import { shiftMonth } from "@/utils/date";
import { useUser } from "./useUser";
import {
  isAbortError,
  useRequestCoordinator,
} from "./useRequestCoordinator";

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
  const { user, isLoading: isUserLoading } = useUser();
  const userId = user?.id;
  const requests = useRequestCoordinator(userId);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  const [page, setPage] = useState(0);
  const [requestedPage, setRequestedPage] = useState(0);
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

  const fetchExtract = useCallback(
    async (currentPage: number, append = false, invalidateCache = false) => {
      if (isUserLoading || !userId) {
        setIsLoadingList(false);
        setIsFirstLoad(false);
        return;
      }

      requests.invalidate("extract");
      setIsLoadingList(true);
      setRequestedPage(currentPage);

      const month = dateRef.getMonth() + 1;
      const year = dateRef.getFullYear();
      const cacheKey = `${userId}:${year}-${month}-${filterType}-${filterAccountId}`;

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
        setHasMore(cached.hasMore);

        setIsLoadingList(false);
        setIsFirstLoad(false);
        return;
      }

      const request = requests.begin("extract");

      try {
        const res = await transactionService.getAll({
          page: currentPage,
          size: 30,
          month,
          year,
          type: filterType === "todos" ? undefined : filterType,
          accountId: filterAccountId === "todas" ? undefined : filterAccountId,
          signal: request.signal,
        });

        if (!request.isCurrent()) return;

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

          setHasMore(newData.page.number < newData.page.totalPages - 1);
          setPage(currentPage);
        }
      } catch (error: unknown) {
        if (request.isCurrent() && !isAbortError(error)) {
          console.error("Erro ao buscar extrato paginado", error);
        }
      } finally {
        if (request.isCurrent()) {
          setIsLoadingList(false);
          setIsFirstLoad(false);
        }
        request.finish();
      }
    },
    [
      dateRef,
      filterType,
      filterAccountId,
      isUserLoading,
      userId,
      requests,
    ],
  );

  // Listener para filtros de navegação
  useEffect(() => {
    extractCache.current = {};
    setTransactions([]);
    setPage(0);
    setHasMore(false);
    setSelectedTransactionId(null);
    setIsFirstLoad(true);
    fetchExtract(0, false);
  }, [userId, fetchExtract]);

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
      .sort((a, b) => b.localeCompare(a))
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
    setDateRef((previous) => shiftMonth(previous, direction));
  };

  const { mutate: deleteTransactionOptimistic } = useOptimisticMutation({
    mutationFn: (id: string) => transactionService.delete(id),
    onMutate: (id) => {
      const index = transactions.findIndex((transaction) => transaction.id === id);
      const deletedTransaction =
        index >= 0 ? transactions[index] : undefined;

      setTransactions((prev) => prev.filter((t) => t.id !== id));
      setSelectedTransactionId(null);

      return { deletedTransaction, index };
    },
    onError: async (_error, _id, context) => {
      const deletedTransaction = context.deletedTransaction;
      if (deletedTransaction) {
        setTransactions((current) => {
          if (
            current.some(
              (transaction) => transaction.id === deletedTransaction.id,
            )
          ) {
            return current;
          }
          const restored = [...current];
          restored.splice(
            Math.max(0, context.index),
            0,
            deletedTransaction,
          );
          return restored;
        });
      }
      await fetchExtract(0, false, true);
    },
    onSuccess: () => {
      refreshGlobal();
      window.dispatchEvent(new Event("refreshExtract"));
    },
    getMutationKey: (id) => id,
    scopeKey: userId,
  });

  const { mutate: updateTransactionOptimistic } = useOptimisticMutation({
    mutationFn: (data: {
      id: string;
      payload: Partial<CreateTransactionDTO>;
    }) => transactionService.update(data.id, data.payload),

    onMutate: ({ id, payload }) => {
      const previousTransaction = transactions.find(
        (transaction) => transaction.id === id,
      );

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

      return { previousTransaction };
    },
    onError: async (_error, variables, context) => {
      if (context.previousTransaction) {
        setTransactions((current) =>
          current.map((transaction) =>
            transaction.id === variables.id
              ? context.previousTransaction!
              : transaction,
          ),
        );
      }
      await fetchExtract(0, false, true);
    },
    onSuccess: () => {
      refreshGlobal();
      window.dispatchEvent(new Event("refreshExtract"));
    },
    getMutationKey: ({ id }) => id,
    scopeKey: userId,
  });

  return {
    groupedTransactions,
    summary,
    accounts,
    categories,
    isInitialLoading: isFirstLoad || isLoadingGlobal,
    isFiltering: isLoadingList && !isFirstLoad && requestedPage === 0,
    isLoadingMore: isLoadingList && requestedPage > 0,
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
    deleteTransaction: async (id: string) => {
      await deleteTransactionOptimistic(id);
    },
    updateTransaction: async (
      id: string,
      data: Partial<CreateTransactionDTO>,
    ) => {
      await updateTransactionOptimistic({ id, payload: data });
    },
    canGoBack: currentViewValue > minLimitValue,
    canGoForward: currentViewValue < maxLimitValue,
  };
}
