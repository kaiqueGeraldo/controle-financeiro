import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  cardService,
  type CardInvoiceDetails,
  type CreditCard,
} from "@/services/cardService";
import { useFinanceData } from "./useFinanceData";
import { shiftMonth } from "@/utils/date";
import { useUser } from "./useUser";
import { monetaryAggregate } from "@/utils/monetaryAggregate";
import { cardLimitMetrics } from "@/utils/cardLimitMetrics";
import { completeReads, reconcileFinancialViews, ReconciliationCancelledError } from "@/utils/financialReconciliation";
import {
  isAbortError,
  useRequestCoordinator,
} from "./useRequestCoordinator";

export function useCards() {
  const { accounts, categories, refresh: refreshGlobal } = useFinanceData();
  const { user, isLoading: isUserLoading } = useUser();
  const userId = user?.id;
  const requests = useRequestCoordinator(userId);
  const [cards, setCards] = useState<CreditCard[]>([]);

  const [isLoading, setIsLoading] = useState(true); // Loading principal da tela
  const [error, setError] = useState<Error | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [viewDate, setViewDate] = useState(new Date());
  const [invoiceDetails, setInvoiceDetails] =
    useState<CardInvoiceDetails | null>(null);
  const [isInvoiceLoading, setIsInvoiceLoading] = useState(false);
  const [invoiceError, setInvoiceError] = useState<Error | null>(null);

  // --- CACHE EM MEMÓRIA ---
  const invoiceCache = useRef<Record<string, CardInvoiceDetails>>({});
  const isFirstLoad = useRef(true);

  const fetchCards = useCallback(async (background = false, requireSuccess = false) => {
    if (isUserLoading || !userId) {
      setIsLoading(false);
      if (requireSuccess) throw new Error("Sessão indisponível para reconciliar cartões.");
      return;
    }

    const request = requests.begin("cards");
    if (!background) setIsLoading(true);
    setError(null);

    try {
      const res = await cardService.getAll(request.signal);
      if (request.isCurrent()) setCards(res.data ?? []);
      else if (requireSuccess) throw new Error("Leitura de cartões substituída; atualize novamente.");
    } catch (error: unknown) {
      if (request.isCurrent() && !isAbortError(error)) {
        setError(
          error instanceof Error ? error : new Error("Falha ao carregar cartões."),
        );
        console.error("Erro ao buscar cartões", error);
      }
      if (requireSuccess) throw error;
    } finally {
      if (request.isCurrent()) {
        if (!background) setIsLoading(false);
        isFirstLoad.current = false;
      }
      request.finish();
    }
  }, [isUserLoading, userId, requests]);

  useEffect(() => {
    invoiceCache.current = {};
    setCards([]);
    setError(null);
    setSelectedCardId(null);
    setInvoiceDetails(null);
    setInvoiceError(null);
    isFirstLoad.current = true;

    if (isUserLoading) {
      setIsLoading(true);
      return;
    }

    fetchCards(false);
  }, [userId, isUserLoading, fetchCards]);

  useEffect(() => {
    requests.invalidate("invoice");
    setInvoiceError(null);
    if (!userId || !selectedCardId) {
      setInvoiceDetails(null);
      setIsInvoiceLoading(false);
      requests.invalidate("invoice");
      return;
    }

    const cardId = selectedCardId;
    const month = viewDate.getMonth() + 1;
    const year = viewDate.getFullYear();
    const cacheKey = `${userId}:${cardId}-${month}-${year}`;

    if (Object.hasOwn(invoiceCache.current, cacheKey)) {
      setInvoiceDetails(invoiceCache.current[cacheKey]);
      setIsInvoiceLoading(false);
      return;
    }

    setInvoiceDetails(null);
    setIsInvoiceLoading(true);
    const request = requests.begin("invoice");

    const timerId = setTimeout(async () => {
      try {
        const res = await cardService.getInvoiceDetails(
          cardId,
          month,
          year,
          request.signal,
        );
        if (request.isCurrent() && res?.data) {
          setInvoiceDetails(res.data);
          invoiceCache.current[cacheKey] = res.data;
        }
      } catch (error: unknown) {
        if (request.isCurrent() && !isAbortError(error)) {
          setInvoiceError(error instanceof Error ? error : new Error("Falha ao carregar fatura."));
          console.error("Erro ao buscar fatura", error);
        }
      } finally {
        if (request.isCurrent()) setIsInvoiceLoading(false);
        request.finish();
      }
    }, 350);

    return () => {
      clearTimeout(timerId);
      requests.invalidate("invoice");
    };
  }, [selectedCardId, viewDate, userId, requests]);

  // --- ACTIONS ---

  const selectCard = (card: CreditCard) => {
    requests.invalidate("cards-reconciliation");
    requests.invalidate("invoice");
    const now = new Date();
    if (now.getDate() >= card.closingDay) {
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      setViewDate(nextMonth);
    } else {
      setViewDate(now);
    }
    setSelectedCardId(card.id);
  };

  const changeMonth = (direction: number) => {
    if (direction === -1 && !canGoBack) return;
    if (direction === 1 && !canGoForward) return;
    requests.invalidate("cards-reconciliation");
    requests.invalidate("invoice");
    setViewDate((previous) => shiftMonth(previous, direction));
  };

  const deleteCard = async (id: string) => {
    await cardService.delete(id);
    setSelectedCardId(null);
    fetchCards(true);
    refreshGlobal();
  };

  const updateCardLimit = async (id: string, newLimit: number) => {
    await cardService.update(id, { limit: newLimit });
    fetchCards(true);
  };

  const refreshAll = useCallback(async (reconcileConsumers = true) => {
    const reconciliation = requests.begin("cards-reconciliation");
    const refreshes: Promise<unknown>[] = [fetchCards(true, true)];

    invoiceCache.current = {};

    if (userId && selectedCardId) {
      const cardId = selectedCardId;
      const month = viewDate.getMonth() + 1;
      const year = viewDate.getFullYear();
      const cacheKey = `${userId}:${cardId}-${month}-${year}`;
      const request = requests.begin("invoice");

      setIsInvoiceLoading(true);
      setInvoiceDetails(null);
      setInvoiceError(null);
      refreshes.push(
        cardService
          .getInvoiceDetails(cardId, month, year, request.signal)
          .then((res) => {
            if (request.isCurrent() && res?.data) {
              setInvoiceDetails(res.data);
              invoiceCache.current[cacheKey] = res.data;
            } else throw new Error("Leitura da fatura substituída; atualize novamente.");
          })
          .catch((error: unknown) => {
            if (request.isCurrent() && !isAbortError(error)) {
              console.error("Erro ao atualizar fatura", error);
              setInvoiceError(error instanceof Error ? error : new Error("Falha ao atualizar fatura."));
            }
            throw error;
          })
          .finally(() => {
            if (request.isCurrent()) setIsInvoiceLoading(false);
            request.finish();
          }),
      );
    } else {
      requests.invalidate("invoice");
      setInvoiceDetails(null);
      setIsInvoiceLoading(false);
    }

    refreshes.push(refreshGlobal(true));
    if (reconcileConsumers) refreshes.push(reconcileFinancialViews());
    try {
      await completeReads(refreshes);
      // Only this still-current batch can certify the caller's reconciliation.
      if (!reconciliation.isCurrent()) throw new ReconciliationCancelledError();
    } catch (error) {
      if (!reconciliation.isCurrent()) {
        throw new ReconciliationCancelledError({ cause: error });
      }
      throw error;
    } finally {
      reconciliation.finish();
    }
  }, [
    fetchCards,
    selectedCardId,
    viewDate,
    refreshGlobal,
    userId,
    requests,
  ]);

  const closeCardDetails = useCallback(() => {
    requests.invalidate("cards-reconciliation");
    requests.invalidate("invoice");
    setSelectedCardId(null);
    setInvoiceDetails(null);
    setIsInvoiceLoading(false);
  }, [requests]);

  // --- EVENT LISTENER ---
  useEffect(() => {
    const handleRefresh = () => {
      void refreshAll().catch(() => { /* Errors remain visible in their consumers. */ });
    };

    window.addEventListener("refreshCards", handleRefresh);
    return () => window.removeEventListener("refreshCards", handleRefresh);
  }, [refreshAll]);

  // --- LIMITES DE DATA ---
  const currentViewValue = viewDate.getFullYear() * 12 + viewDate.getMonth();
  const minLimitValue = 2025 * 12 + 0;
  const now = new Date();
  const maxLimitValue = (now.getFullYear() + 3) * 12 + now.getMonth();

  const canGoBack = currentViewValue > minLimitValue;
  const canGoForward = currentViewValue < maxLimitValue;

  // --- CÁLCULOS ---
  const summary = useMemo(() => {
    if(isLoading || error)return {totalLimit:null,totalInvoice:null,available:null};
    const totalLimit = monetaryAggregate(cards.map(c => c.limit));
    const totalInvoice = monetaryAggregate(cards.map(c => c.currentInvoiceValue));
    return {
      totalLimit,
      totalInvoice,
      available: monetaryAggregate(cards.map(card => cardLimitMetrics(card).available ?? NaN)),
    };
  }, [cards,isLoading,error]);

  return {
    userId,
    cards,
    accounts,
    categories,
    isLoading: isLoading && isFirstLoad.current,
    error,
    invoiceError,
    summary,

    selectedCardId,
    selectedCard: cards.find((c) => c.id === selectedCardId),
    invoiceDetails,
    isInvoiceLoading,
    viewDate,
    viewDateFormatted: viewDate.toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric",
    }),

    selectCard,
    closeCardDetails,
    changeMonth,
    deleteCard,
    updateCardLimit,
    refreshAll,
    canGoBack,
    canGoForward,
  };
}
