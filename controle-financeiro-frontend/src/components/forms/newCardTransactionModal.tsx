"use client";

import { Modal } from "@/components/ui/modal";
import { useToast } from "@/contexts/toastContext";
import { cardService, CreditCard } from "@/services/cardService";
import { Category } from "@/types";
import { CreditCard as CardIcon, ChevronDown, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

interface NewCardTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categories: Category[];
  initialDate?: string;
  defaultCardId?: string;
}

export function NewCardTransactionModal({
  isOpen,
  onClose,
  onSuccess,
  categories,
  initialDate,
  defaultCardId,
}: NewCardTransactionModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [cards, setCards] = useState<CreditCard[]>([]);
  const toast = useToast();

  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    date: "",
    time: "",
    cardId: defaultCardId || "",
    categoryId: "",
    installments: "1",
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
        installments: "1",
        cardId: defaultCardId || prev.cardId,
      }));

      setIsLoading(false);

      cardService.getAll().then((res) => {
        if (res?.data) setCards(res.data);
      });
    }
  }, [isOpen, initialDate, defaultCardId]);

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const amountClean = Number(formData.amount);

      if (!formData.cardId) {
        toast.error("Selecione um cartão de crédito.");
        setIsLoading(false);
        return;
      }

      await cardService.createTransaction({
        description: formData.description,
        amount: amountClean,
        date: formData.date,
        time: formData.time,
        categoryId: formData.categoryId,
        cardId: formData.cardId,
        totalInstallments: Number(formData.installments),
      });

      onSuccess();
      onClose();
    } catch (error) {
      toast.error("Erro ao criar transação no cartão. Verifique os dados.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nova Despesa no Crédito">
      <form onSubmit={handleSubmit} className="space-y-4 mt-2">
        {/* 1. VALOR PRINCIPAL */}
        <div>
          <label className="text-xs text-text-muted font-bold uppercase ml-1">
            Valor da Compra
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
              className="w-full bg-bg-base border border-border-divider rounded-xl py-3 pl-10 pr-4 text-xl font-bold text-text-main focus:outline-none focus:border-purple-500 transition-colors placeholder:text-zinc-700"
            />
          </div>
        </div>

        {/* 2. DESCRIÇÃO */}
        <div>
          <label className="text-xs text-text-muted font-bold uppercase ml-1">
            O que você comprou?
          </label>
          <input
            type="text"
            required
            placeholder="Ex: Uber, Amazon, Jantar..."
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className="w-full mt-1 bg-bg-base border border-border-divider rounded-xl py-3 px-4 text-text-main focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>

        {/* 3. DATA, HORA E CARTÃO */}
        <div className="grid grid-cols-3 gap-3">
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
              className="w-full mt-1 bg-bg-base border border-border-divider rounded-xl py-3 px-2 text-text-main focus:outline-none focus:border-purple-500 transition-colors text-sm"
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
              className="w-full mt-1 bg-bg-base border border-border-divider rounded-xl py-3 px-2 text-text-main focus:outline-none focus:border-purple-500 transition-colors text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-text-muted font-bold uppercase ml-1">
              Cartão
            </label>
            <div className="relative mt-1">
              <select
                required
                value={formData.cardId}
                onChange={(e) =>
                  setFormData({ ...formData, cardId: e.target.value })
                }
                className="w-full bg-bg-base border border-border-divider rounded-xl py-3 px-2 text-text-main appearance-none focus:outline-none focus:border-purple-500 cursor-pointer text-sm"
              >
                <option value="" disabled>
                  Selecione
                </option>
                {cards.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
            </div>
          </div>
        </div>

        {/* 4. CATEGORIA E PARCELAMENTO (Lado a Lado) */}
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
                className="w-full bg-bg-base border border-border-divider rounded-xl py-3 px-4 text-text-main appearance-none focus:outline-none focus:border-purple-500 cursor-pointer text-sm"
              >
                <option value="" disabled>
                  Selecione
                </option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="text-xs text-text-muted font-bold uppercase ml-1">
              Parcelas
            </label>
            <div className="relative mt-1">
              <select
                value={formData.installments}
                onChange={(e) =>
                  setFormData({ ...formData, installments: e.target.value })
                }
                className="w-full bg-bg-base border border-border-divider rounded-xl py-3 px-4 text-text-main appearance-none focus:outline-none focus:border-purple-500 cursor-pointer text-sm"
              >
                <option value="1">À vista (1x)</option>
                {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
                  <option key={n} value={n}>
                    {n}x
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
            </div>
          </div>
        </div>

        {/* BOTÃO FINAL - ROXO PARA INDICAR CRÉDITO */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full mt-4 bg-purple-600 hover:bg-purple-500 text-white font-bold py-3.5 rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-purple-900/20"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <CardIcon size={18} />
              Confirmar Compra
            </>
          )}
        </button>
      </form>
    </Modal>
  );
}
