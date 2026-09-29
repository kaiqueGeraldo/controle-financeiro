"use client";
import { useState } from "react";
import { goalService } from "@/services/goalService";
import { Account, Goal } from "@/types";
import { Loader2 } from "lucide-react";
import { useToast } from "@/contexts/toastContext";
import { Modal } from "@/components/ui/modal";
interface DeleteGoalModalProps {
  isOpen: boolean; onClose: () => void; onSuccess: () => void;
  goal: Goal | null; accounts: Account[];
}
export function DeleteGoalModal({isOpen,onClose,onSuccess,goal}: DeleteGoalModalProps) {
  const [loading,setLoading]=useState(false);
  const toast=useToast();
  if(!goal || !isOpen) return null;
  const remove=async()=>{
    setLoading(true);
    try {await goalService.delete(goal.id);onSuccess();onClose();}
    catch(error){toast.error(error instanceof Error ? error.message : "Erro ao excluir meta.");}
    finally {setLoading(false);}
  };
  return <Modal isOpen={isOpen} onClose={onClose} title="Excluir Meta"><div className="space-y-6">
    <p>Excluir <strong>{goal.title}</strong> libera suas destinações. O dinheiro continua nas contas e investimentos. Compras já realizadas permanecem no histórico de compras, com reembolso separado.</p>
    <div className="flex gap-3">
      <button type="button" onClick={onClose} disabled={loading} className="flex-1 p-3 rounded-xl bg-bg-surface-hover">Cancelar</button>
      <button type="button" onClick={remove} disabled={loading} className="flex-1 p-3 rounded-xl bg-rose-600 text-white">{loading ? <Loader2 className="animate-spin"/> : "Excluir"}</button>
    </div>
  </div></Modal>;
}
