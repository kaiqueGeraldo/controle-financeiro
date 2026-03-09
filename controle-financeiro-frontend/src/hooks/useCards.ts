import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { cardService, CreditCard } from "@/services/cardService";
import { useFinanceData } from "./useFinanceData";

export function useCards() {
  const { accounts, categories, refresh: refreshGlobal } = useFinanceData();
  const [cards, setCards] = useState<CreditCard[]>([]);

  const [isLoading, setIsLoading] = useState(true); // Loading principal da tela
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [viewDate, setViewDate] = useState(new Date());
  const [invoiceDetails, setInvoiceDetails] = useState<any>(null);
  const [isInvoiceLoading, setIsInvoiceLoading] = useState(false);

  // --- CACHE EM MEMÓRIA ---
  const invoiceCache = useRef<Record<string, any>>({});
  const isFirstLoad = useRef(true);

  const fetchCards = useCallback(async (background = false) => {
    if (!background) setIsLoading(true);

    try {
      const res = await cardService.getAll();
      if (res?.data) setCards(res.data);
    } catch (error) {
      console.error("Erro ao buscar cartões", error);
    } finally {
      if (!background) setIsLoading(false);
      isFirstLoad.current = false;
    }
  }, []);

  useEffect(() => {
    fetchCards(false);
  }, [fetchCards]);

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (selectedCardId) {
      const month = viewDate.getMonth() + 1;
      const year = viewDate.getFullYear();
      const cacheKey = `${selectedCardId}-${month}-${year}`;

      if (invoiceCache.current[cacheKey]) {
        setInvoiceDetails(invoiceCache.current[cacheKey]);
        setIsInvoiceLoading(false);
        return;
      }

      setIsInvoiceLoading(true);

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const timerId = setTimeout(() => {
        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;

        cardService
          .getInvoiceDetails(selectedCardId, month, year, signal)
          .then((res: any) => {
            if (res?.data && !signal.aborted) {
              setInvoiceDetails(res.data);
              invoiceCache.current[cacheKey] = res.data;
            }
          })
          .catch((err) => {
            if (err.name === "AbortError") return;
            console.error(err);
          })
          .finally(() => {
            if (!signal.aborted) setIsInvoiceLoading(false);
          });
      }, 350);

      return () => {
        clearTimeout(timerId);
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      };
    }
  }, [selectedCardId, viewDate]);

  // --- ACTIONS ---

  const selectCard = (card: CreditCard) => {
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
    const newDate = new Date(viewDate);
    newDate.setMonth(viewDate.getMonth() + direction);
    setViewDate(newDate);
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

  const refreshAll = useCallback(() => {
    fetchCards(true);

    invoiceCache.current = {};

    if (selectedCardId) {
      const month = viewDate.getMonth() + 1;
      const year = viewDate.getFullYear();
      cardService.getInvoiceDetails(selectedCardId, month, year).then((res) => {
        if (res?.data) {
          setInvoiceDetails(res.data);
          invoiceCache.current[`${selectedCardId}-${month}-${year}`] = res.data;
        }
      });
    }
    refreshGlobal();
    window.dispatchEvent(new Event("refreshPlanning"));
  }, [fetchCards, selectedCardId, viewDate, refreshGlobal]);

  // --- EVENT LISTENER ---
  useEffect(() => {
    const handleRefresh = () => {
      refreshAll();
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
    const totalLimit = cards.reduce((acc, c) => acc + c.limit, 0);
    const totalInvoice = cards.reduce(
      (acc, c) => acc + c.currentInvoiceValue,
      0,
    );
    return {
      totalLimit,
      totalInvoice,
      available: totalLimit - totalInvoice,
    };
  }, [cards]);

  return {
    cards,
    accounts,
    categories,
    isLoading: isLoading && isFirstLoad.current,
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
    closeCardDetails: () => setSelectedCardId(null),
    changeMonth,
    deleteCard,
    updateCardLimit,
    refreshAll,
    canGoBack,
    canGoForward,
  };
}
