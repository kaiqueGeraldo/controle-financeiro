"use client";

import { useState } from "react";
import { goalService } from "@/services/goalService";
import { Account, Goal, GoalHistory } from "@/types";
import { Loader2, Wallet, AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/utils/format";
import { useToast } from "@/contexts/toastContext";

interface DeleteHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  historyItem: GoalHistory | null;
  parentGoal: Goal | null;
  accounts: Account[];
}

export function DeleteHistoryModal({ isOpen, onClose, onSuccess, historyItem, parentGoal, accounts }: DeleteHistoryModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [targetAccountId, setTargetAccountId] = useState("");
  const toast = useToast();

  if (!historyItem || !parentGoal || !isOpen) return null;

  const needsRefund = parentGoal.type === "MONETARY" && historyItem.amount > 0;
  const validAccounts = accounts.filter(a => !a.isArchived);

  const handleDelete = async () => {
    if (needsRefund && !targetAccountId) {
      toast.error("Selecione uma conta para devolver o dinheiro.");
      return;
    }

    setIsLoading(true);
    try {
      await goalService.deleteHistory(historyItem.id, needsRefund ? targetAccountId : undefined);
      window.dispatchEvent(new Event("refreshFinance"));
      onSuccess();
      onClose();
    } catch (error) {
      toast.error("Erro ao excluir registro de aporte.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 flex flex-col h-full">
      <div className="flex-1">
        <h2 className="text-xl font-semibold text-text-main mb-4">Excluir Aporte</h2>

        <p className="text-text-muted mb-6">
          Deseja excluir o registro de <strong className="text-text-main">{historyItem.note || "Aporte financeiro"}</strong>?
        </p>

        {needsRefund && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl animate-in fade-in slide-in-from-bottom-2">
            <h3 className="text-emerald-400 font-medium mb-2 flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              Estorno Automático
            </h3>
            <p className="text-text-muted text-sm mb-4">
              Este aporte de <strong className="text-emerald-400">{formatCurrency(historyItem.amount)}</strong> será retirado da meta. 
              Para qual conta deseja devolver este dinheiro?
            </p>
            
            <div className="relative">
                <Wallet className="absolute left-3 top-3.5 w-4 h-4 text-text-muted" />
                <select
                    value={targetAccountId}
                    onChange={(e) => setTargetAccountId(e.target.value)}
                    className="w-full bg-bg-surface border border-border-divider rounded-lg py-3 pl-10 pr-4 text-text-main text-sm focus:border-emerald-500 outline-none cursor-pointer"
                >
                    <option value="">Selecione a conta de destino</option>
                    {validAccounts.map(acc => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name} (Saldo: {formatCurrency(acc.balance)})
                        </option>
                    ))}
                </select>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-6 border-t border-border-divider mt-auto">
         <button 
           onClick={onClose} 
           disabled={isLoading}
           className="flex-1 py-3 bg-bg-surface-hover hover:bg-zinc-800 text-text-main rounded-xl font-bold transition cursor-pointer disabled:opacity-50"
         >
           Cancelar
         </button>
         <button 
           onClick={handleDelete}
           disabled={isLoading || (needsRefund && !targetAccountId)}
           className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
         >
           {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : (
             <>
                <AlertTriangle className="w-4 h-4" />
                Excluir
             </>
           )}
         </button>
      </div>
    </div>
  );
}