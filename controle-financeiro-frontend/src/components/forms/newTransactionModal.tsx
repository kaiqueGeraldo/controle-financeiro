"use client";

import { Modal } from "@/components/ui/modal";
import { useToast } from "@/contexts/toastContext";
import { transactionService } from "@/services/transactionService";
import { Account, Category, TransactionType } from "@/types";
import { formatCurrency } from "@/utils/format";
import { ChevronDown, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

interface NewTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  accounts: Account[];
  categories: Category[];
  initialDate?: string;
}

export function NewTransactionModal({
  isOpen,
  onClose,
  onSuccess,
  accounts,
  categories,
  initialDate,
}: NewTransactionModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [type, setType] = useState<TransactionType>("EXPENSE");
  const toast = useToast();

  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    date: "",
    time: "",
    accountId: "",
    categoryId: "",
    isPaid: true,
  });

  useEffect(() => {
    if (isOpen) {
      setFormData((prev) => ({
        ...prev,
        date: initialDate || new Date().toISOString().split("T")[0],
        time: new Date().toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        description: "",
        amount: "",
      }));
      setIsLoading(false);
    }
  }, [isOpen, initialDate]);

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await transactionService.create({
        description: formData.description,
        amount: Number(formData.amount),
        date: formData.date,
        time: formData.time,
        type,
        accountId: formData.accountId,
        categoryId: formData.categoryId,
        isPaid: formData.isPaid,
      });

      window.dispatchEvent(new Event("refreshExtract"));

      onSuccess();
      onClose();
    } catch (error) {
      toast.error("Erro ao criar transação. Verifique se preencheu tudo.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nova Transação">
      <form onSubmit={handleSubmit} className="space-y-4 mt-2">
        {/* TIPO (Receita / Despesa) */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-bg-base rounded-xl border border-border-divider">
          <button
            type="button"
            onClick={() => setType("EXPENSE")}
            className={`py-2 rounded-lg text-sm font-bold transition-all ${type === "EXPENSE" ? "bg-rose-500/10 text-rose-500 shadow-sm border border-rose-500/20" : "text-text-muted hover:text-text-main"}`}
          >
            Despesa
          </button>
          <button
            type="button"
            onClick={() => setType("INCOME")}
            className={`py-2 rounded-lg text-sm font-bold transition-all ${type === "INCOME" ? "bg-emerald-500/10 text-emerald-500 shadow-sm border border-emerald-500/20" : "text-text-muted hover:text-text-main"}`}
          >
            Receita
          </button>
        </div>

        {/* VALOR E DESCRIÇÃO OMITIDOS PARA BREVIDADE */}
        <div>
          <label className="text-xs text-text-muted font-bold uppercase ml-1">
            Valor
          </label>
          <div className="relative mt-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted font-bold">
              R$
            </span>
            <input
              type="number"
              step="0.01"
              required
              placeholder="0,00"
              value={formData.amount}
              min="0"
              onChange={(e) =>
                setFormData({ ...formData, amount: e.target.value })
              }
              className="w-full bg-bg-base border border-border-divider rounded-xl py-3 pl-10 pr-4 text-xl font-bold text-text-main focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-text-muted font-bold uppercase ml-1">
            Descrição
          </label>
          <input
            type="text"
            required
            placeholder="Ex: Mercado, Salário..."
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className="w-full mt-1 bg-bg-base border border-border-divider rounded-xl py-3 px-4 text-text-main focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-text-muted font-bold uppercase ml-1">
              Data
            </label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
              className="w-full mt-1 bg-bg-base border border-border-divider rounded-xl py-3 px-4 text-text-main focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
          <div>
            <label className="text-xs text-text-muted font-bold uppercase ml-1">
              Hora
            </label>
            <input
              type="time"
              required
              value={formData.time}
              onChange={(e) =>
                setFormData({ ...formData, time: e.target.value })
              }
              className="w-full mt-1 bg-bg-base border border-border-divider rounded-xl py-3 px-4 text-text-main focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-text-muted font-bold uppercase ml-1">
              Categoria
            </label>
            <div className="relative mt-1">
              <select
                required
                value={formData.categoryId}
                onChange={(e) =>
                  setFormData({ ...formData, categoryId: e.target.value })
                }
                className="w-full bg-bg-base border border-border-divider rounded-xl py-3 px-4 text-text-main appearance-none focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option
                  value=""
                  disabled
                  className="bg-bg-surface text-text-muted"
                >
                  Selecione
                </option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id} className="bg-bg-surface">
                    {cat.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="text-xs text-text-muted font-bold uppercase ml-1">
              Conta
            </label>
            <div className="relative mt-1">
              <select
                required
                value={formData.accountId}
                onChange={(e) =>
                  setFormData({ ...formData, accountId: e.target.value })
                }
                className="w-full bg-bg-base border border-border-divider rounded-xl py-3 px-4 text-text-main appearance-none focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option
                  value=""
                  disabled
                  className="bg-bg-surface text-text-muted"
                >
                  Selecione
                </option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id} className="bg-bg-surface">
                    {acc.name} • {formatCurrency(acc.balance)}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full mt-4 bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-3.5 rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            "Salvar Transação"
          )}
        </button>
      </form>
    </Modal>
  );
}
