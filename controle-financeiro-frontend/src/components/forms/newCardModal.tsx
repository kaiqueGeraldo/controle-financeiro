"use client";

import { Modal } from "@/components/ui/modal";
import { useToast } from "@/contexts/toastContext";
import { cardService } from "@/services/cardService";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

interface NewCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function NewCardModal({
  isOpen,
  onClose,
  onSuccess,
}: NewCardModalProps) {
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const [formData, setFormData] = useState({
    name: "",
    limit: "",
    closingDay: "",
    dueDay: "",
    brand: "MASTERCARD",
    last4Digits: "",
    color: "#820AD1",
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: "",
        limit: "",
        closingDay: "",
        dueDay: "",
        brand: "MASTERCARD",
        last4Digits: "",
        color: "#820AD1",
      });
      setLoading(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();

    if (!/^\d{4}$/.test(formData.last4Digits)) {
      toast.error("Os 4 últimos dígitos devem conter exatamente 4 números.");
      return;
    }

    const cDay = Number(formData.closingDay);
    const dDay = Number(formData.dueDay);
    if (cDay < 1 || cDay > 31 || dDay < 1 || dDay > 31) {
      toast.error("Os dias de fechamento e vencimento devem ser entre 1 e 31.");
      return;
    }

    if (Number(formData.limit) <= 0) {
      toast.error("O limite do cartão deve ser maior que zero.");
      return;
    }

    setLoading(true);
    try {
      await cardService.create({
        name: formData.name,
        limit: Number(formData.limit),
        closingDay: Number(formData.closingDay),
        dueDay: Number(formData.dueDay),
        brand: formData.brand,
        last4Digits: formData.last4Digits,
        color: formData.color,
      });

      onSuccess();
      onClose();
    } catch (error) {
      toast.error("Erro ao criar cartão");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Novo Cartão de Crédito">
      <form onSubmit={handleSubmit} className="space-y-4 mt-2">
        <div>
          <label className="text-xs text-text-muted font-bold uppercase ml-1">
            Nome do Cartão
          </label>
          <input
            required
            placeholder="Ex: Nubank, Inter..."
            className="w-full bg-bg-base border border-border-divider rounded-xl px-4 py-3 text-text-main focus:outline-none focus:border-emerald-500 transition-colors"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-text-muted font-bold uppercase ml-1">
              Limite
            </label>
            <input
              required
              type="number"
              step="0.01"
              min="0.01"
              placeholder="R$ 0,00"
              className="w-full bg-bg-base border border-border-divider rounded-xl px-4 py-3 text-text-main focus:outline-none focus:border-emerald-500"
              value={formData.limit}
              onChange={(e) =>
                setFormData({ ...formData, limit: e.target.value })
              }
            />
          </div>
          <div>
            <label className="text-xs text-text-muted font-bold uppercase ml-1">
              4 Últimos Dígitos
            </label>
            <input
              required
              type="text"
              inputMode="numeric"
              pattern="\d{4}"
              maxLength={4}
              placeholder="Ex: 4512"
              className="w-full bg-bg-base border border-border-divider rounded-xl px-4 py-3 text-text-main focus:outline-none focus:border-emerald-500"
              value={formData.last4Digits}
              onChange={(e) => {
                const onlyNumbers = e.target.value.replace(/\D/g, "");
                setFormData({ ...formData, last4Digits: onlyNumbers });
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-text-muted font-bold uppercase ml-1">
              Dia Fechamento
            </label>
            <input
              required
              type="number"
              min="1"
              max="31"
              placeholder="Ex: 05"
              className="w-full bg-bg-base border border-border-divider rounded-xl px-4 py-3 text-text-main focus:outline-none focus:border-emerald-500"
              value={formData.closingDay}
              onChange={(e) =>
                setFormData({ ...formData, closingDay: e.target.value })
              }
            />
          </div>
          <div>
            <label className="text-xs text-text-muted font-bold uppercase ml-1">
              Dia Vencimento
            </label>
            <input
              required
              type="number"
              min="1"
              max="31"
              placeholder="Ex: 12"
              className="w-full bg-bg-base border border-border-divider rounded-xl px-4 py-3 text-text-main focus:outline-none focus:border-emerald-500"
              value={formData.dueDay}
              onChange={(e) =>
                setFormData({ ...formData, dueDay: e.target.value })
              }
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-text-muted font-bold uppercase ml-1">
            Cor do Cartão
          </label>
          <div className="flex gap-3 mt-2">
            {[
              "#820AD1",
              "#009EE3",
              "#FF6800",
              "#EF4444",
              "#10B981",
              "#18181b",
            ].map((c) => (
              <div
                key={c}
                onClick={() => setFormData({ ...formData, color: c })}
                className={`w-8 h-8 rounded-full cursor-pointer border-2 transition-transform hover:scale-110 ${formData.color === c ? "border-white scale-110" : "border-transparent"}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        <button
          disabled={loading}
          type="submit"
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl mt-4 flex justify-center items-center gap-2 transition cursor-pointer"
        >
          {loading ? <Loader2 className="animate-spin" /> : "Criar Cartão"}
        </button>
      </form>
    </Modal>
  );
}
