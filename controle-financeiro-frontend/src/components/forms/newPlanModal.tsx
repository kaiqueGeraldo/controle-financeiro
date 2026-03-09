"use client";

import { useEffect, useRef, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { planningService } from "@/services/planningService";
import { useFinanceData } from "@/hooks/useFinanceData";
import { Loader2 } from "lucide-react";
import { useToast } from "@/contexts/toastContext";

interface NewPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function NewPlanModal({
  isOpen,
  onClose,
  onSuccess,
}: NewPlanModalProps) {
  const { categories } = useFinanceData();
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();

  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    dueDate: "",
    categoryId: "",
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({ description: "", amount: "", dueDate: "", categoryId: "" });
      setIsSaving(false);
    }
  }, [isOpen]);

const handleCreate = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await planningService.create({
        description: formData.description,
        amount: Number(formData.amount),
        dueDate: formData.dueDate,
        categoryId: formData.categoryId,
        status: "PENDING",
      });

      window.dispatchEvent(new Event("refreshPlanning"));

      onSuccess();
      onClose();
    } catch (error) {
      toast.error("Erro ao criar item de planejamento.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Novo Planejamento">
      <form onSubmit={handleCreate} className="space-y-4 mt-2">
        <div>
          <label className="text-xs text-text-muted font-bold uppercase ml-1">
            Descrição
          </label>
          <input
            required
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className="w-full mt-1 bg-bg-base border border-border-divider rounded-xl py-3 px-4 text-text-main focus:outline-none focus:border-emerald-500"
            placeholder="Ex: Faculdade"
          />
        </div>
        <div>
          <label className="text-xs text-text-muted font-bold uppercase ml-1">
            Valor
          </label>
          <div className="relative mt-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted font-bold">
              R$
            </span>
            <input
              required
              type="number"
              step="0.01"
              value={formData.amount}
              min="0"
              onChange={(e) =>
                setFormData({ ...formData, amount: e.target.value })
              }
              className="w-full bg-bg-base border border-border-divider rounded-xl py-3 pl-10 pr-4 text-text-main focus:outline-none focus:border-emerald-500"
              placeholder="0,00"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-text-muted font-bold uppercase ml-1">
              Vencimento
            </label>
            <input
              required
              type="date"
              value={formData.dueDate}
              onChange={(e) =>
                setFormData({ ...formData, dueDate: e.target.value })
              }
              className="w-full mt-1 bg-bg-base border border-border-divider rounded-xl py-3 px-4 text-text-main focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="text-xs text-text-muted font-bold uppercase ml-1">
              Categoria
            </label>
            <select
              required
              value={formData.categoryId}
              onChange={(e) =>
                setFormData({ ...formData, categoryId: e.target.value })
              }
              className="w-full mt-1 bg-bg-base border border-border-divider rounded-xl py-3 px-4 text-text-main focus:outline-none focus:border-emerald-500 appearance-none cursor-pointer"
            >
              <option value="">Selecione</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button
          disabled={isSaving}
          type="submit"
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl mt-4 transition cursor-pointer flex justify-center"
        >
          {isSaving ? (
            <Loader2 className="animate-spin" />
          ) : (
            "Adicionar ao Planejamento"
          )}
        </button>
      </form>
    </Modal>
  );
}
