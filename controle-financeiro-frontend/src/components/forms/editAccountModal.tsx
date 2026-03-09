"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { accountService } from "@/services/accountService";
import { Account, AccountType } from "@/types";
import { Loader2, Save } from "lucide-react";
import { useToast } from "@/contexts/toastContext";

interface EditAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  account: Account | null;
}

export function EditAccountModal({ isOpen, onClose, onSuccess, account }: EditAccountModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");
  const toast = useToast();

  useEffect(() => {
    if (isOpen && account) {
      setName(account.name);
    }
  }, [isOpen, account]);

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!account) return;
    setIsLoading(true);

    try {
      await accountService.update(account.id, { name, color: account.color });
      onSuccess();
      onClose();
    } catch (error) {
      toast.error("Erro ao editar conta.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!account) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar Conta">
      <form onSubmit={handleSubmit} className="space-y-4 mt-2">
        <div>
          <label className="text-xs text-text-muted font-bold uppercase ml-1">Nome da Conta</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full mt-1 bg-bg-base border border-border-divider rounded-xl py-3 px-4 text-text-main focus:outline-none focus:border-emerald-500"
          />
        </div>
        
        <button
          disabled={isLoading}
          type="submit"
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl mt-4 flex justify-center items-center gap-2 transition cursor-pointer shadow-lg shadow-emerald-900/20"
        >
          {isLoading ? <Loader2 className="animate-spin" /> : <><Save size={18} /> Salvar Alterações</>}
        </button>
      </form>
    </Modal>
  );
}