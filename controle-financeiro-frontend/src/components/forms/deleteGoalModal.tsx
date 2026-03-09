"use client";

import { useState } from "react";
import { goalService } from "@/services/goalService";
import { Account, Goal } from "@/types";
import { Loader2, Wallet, AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/utils/format";
import { useToast } from "@/contexts/toastContext";

interface DeleteGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  goal: Goal | null;
  accounts: Account[];
}

export function DeleteGoalModal({ isOpen, onClose, onSuccess, goal, accounts }: DeleteGoalModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [targetAccountId, setTargetAccountId] = useState("");
  const toast = useToast();

  if (!goal || !isOpen) return null;

  const hasBalance = goal.type === "MONETARY" && goal.currentValue > 0;
  const validAccounts = accounts.filter(a => !a.isArchived);

  const handleDelete = async () => {
    if (hasBalance && !targetAccountId) {
      toast.error("Selecione uma conta para devolver o dinheiro.");
      return;
    }

    setIsLoading(true);
    try {
      await goalService.delete(goal.id, targetAccountId || undefined);
      window.dispatchEvent(new Event("refreshFinance")); 
      onSuccess();
      onClose();
    } catch (error) {
      toast.error("Erro ao excluir meta.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 flex flex-col h-full">
      <div className="flex-1">
        <h2 className="text-xl font-semibold text-text-main mb-4">Excluir Meta</h2>

        <p className="text-text-muted mb-6">
          Tem certeza que deseja excluir a meta <strong className="text-text-main">{goal.title}</strong>? Esta ação não pode ser desfeita.
        </p>

        {hasBalance && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl animate-in fade-in slide-in-from-bottom-2">
            <h3 className="text-emerald-400 font-medium mb-2 flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              Estorno de Saldo ({formatCurrency(goal.currentValue)})
            </h3>
            <p className="text-text-muted text-sm mb-4">
              Esta meta possui dinheiro guardado. Para qual conta devemos devolver este valor?
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
           disabled={isLoading || (hasBalance && !targetAccountId)}
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