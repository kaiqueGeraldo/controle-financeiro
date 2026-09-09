import { useState, useEffect } from "react";
import { useInvestmentsContext } from "@/contexts/investmentsContext";
import { investmentService } from "@/services/investmentService";
import { InvestTransaction } from "@/types";
import { useUser } from "./useUser";
import {
  isAbortError,
  useRequestCoordinator,
} from "./useRequestCoordinator";

export function useInvestments() {
  const context = useInvestmentsContext();
  const { user } = useUser();
  const requests = useRequestCoordinator(user?.id);
  const [selectedInvestmentId, setSelectedInvestmentId] = useState<
    string | null
  >(null);
  const [history, setHistory] = useState<InvestTransaction[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  useEffect(() => {
    if (selectedInvestmentId) {
      const request = requests.begin("investment-history");
      void Promise.resolve().then(() => {
        if (request.isCurrent()) setIsHistoryLoading(true);
      });
      investmentService
        .getHistory(selectedInvestmentId, request.signal)
        .then((res) => {
          if (request.isCurrent()) setHistory(res.data ?? []);
        })
        .catch((error: unknown) => {
          if (request.isCurrent() && !isAbortError(error)) setHistory([]);
        })
        .finally(() => {
          if (request.isCurrent()) setIsHistoryLoading(false);
          request.finish();
        });
    } else {
      requests.invalidate("investment-history");
      void Promise.resolve().then(() => {
        setHistory([]);
        setIsHistoryLoading(false);
      });
    }

    return () => requests.invalidate("investment-history");
  }, [selectedInvestmentId, context.investments, requests]);

  const deleteInvestment = async (id: string) => {
    await investmentService.delete(id);
    setSelectedInvestmentId(null);
    context.refreshInvestments();
  };

  const deleteHistory = async (transactionId: string) => {
    await investmentService.deleteHistory(transactionId);
    context.refreshInvestments();
    if (selectedInvestmentId) {
      const request = requests.begin("investment-history");
      setIsHistoryLoading(true);
      investmentService
        .getHistory(selectedInvestmentId, request.signal)
        .then((res) => {
          if (request.isCurrent()) setHistory(res?.data || []);
        })
        .catch((error: unknown) => {
          if (request.isCurrent() && !isAbortError(error)) setHistory([]);
        })
        .finally(() => {
          if (request.isCurrent()) setIsHistoryLoading(false);
          request.finish();
        });
    }
  };

  return {
    ...context,
    selectedInvestmentId,
    setSelectedInvestmentId,
    selectedInvestment: context.investments.find(
      (i) => i.id === selectedInvestmentId,
    ),
    history,
    isHistoryLoading,
    deleteInvestment,
    deleteHistory,
  };
}
