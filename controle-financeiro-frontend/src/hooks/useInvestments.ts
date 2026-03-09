import { useState, useEffect } from "react";
import { useInvestmentsContext } from "@/contexts/investmentsContext";
import { investmentService } from "@/services/investmentService";
import { InvestTransaction } from "@/types";

export function useInvestments() {
  const context = useInvestmentsContext();
  const [selectedInvestmentId, setSelectedInvestmentId] = useState<
    string | null
  >(null);
  const [history, setHistory] = useState<InvestTransaction[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  useEffect(() => {
    if (selectedInvestmentId) {
      setIsHistoryLoading(true);
      investmentService
        .getHistory(selectedInvestmentId)
        .then((res) => {
          if (res?.data) setHistory(res.data);
        })
        .catch(() => setHistory([]))
        .finally(() => setIsHistoryLoading(false));
    } else {
      setHistory([]);
    }
  }, [selectedInvestmentId, context.investments]);

  const deleteInvestment = async (id: string) => {
    await investmentService.delete(id);
    setSelectedInvestmentId(null);
    context.refreshInvestments();
  };

  const deleteHistory = async (transactionId: string) => {
    await investmentService.deleteHistory(transactionId);
    context.refreshInvestments();
    if (selectedInvestmentId) {
      setIsHistoryLoading(true);
      investmentService
        .getHistory(selectedInvestmentId)
        .then((res) => {
          setHistory(res?.data || []);
        })
        .finally(() => setIsHistoryLoading(false));
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
