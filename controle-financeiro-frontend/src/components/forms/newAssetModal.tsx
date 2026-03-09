"use client";

import { useEffect, useRef, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { investmentService } from "@/services/investmentService";
import { useGoalsContext } from "@/contexts/goalsContext";
import { useInvestmentsContext } from "@/contexts/investmentsContext";
import { InvestType } from "@/types";
import {
  Loader2,
  TrendingUp,
  Building2,
  Wallet,
  Bitcoin,
  Landmark,
  Target,
} from "lucide-react";
import { useToast } from "@/contexts/toastContext";

interface NewAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ASSET_TYPES: {
  value: InvestType;
  label: string;
  icon: React.ReactNode;
}[] = [
  {
    value: "FIXED_INCOME",
    label: "Renda Fixa / Tesouro",
    icon: <Wallet size={18} />,
  },
  { value: "STOCK", label: "Ações", icon: <Landmark size={18} /> },
  { value: "FII", label: "Fundos Imobiliários", icon: <Building2 size={18} /> },
  { value: "CRYPTO", label: "Criptomoedas", icon: <Bitcoin size={18} /> },
  { value: "TREASURY", label: "Tesouro Direto", icon: <Building2 size={18} /> },
  { value: "OTHER", label: "Outros", icon: <TrendingUp size={18} /> },
];

export function NewAssetModal({
  isOpen,
  onClose,
  onSuccess,
}: NewAssetModalProps) {
  const { goals } = useGoalsContext();
  const { investments } = useInvestmentsContext();
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const [formData, setFormData] = useState({
    ticker: "",
    name: "",
    type: "FIXED_INCOME" as InvestType,
    goalId: "",
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({ ticker: "", name: "", type: "FIXED_INCOME", goalId: "" });
      setIsLoading(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await investmentService.create({
        ticker: formData.ticker.toUpperCase(),
        name: formData.name,
        type: formData.type,
        goalId: formData.goalId || undefined,
      });

      onSuccess();
      onClose();
    } catch (error) {
      toast.error("Erro ao criar ativo.");
    } finally {
      setIsLoading(false);
    }
  };

  const linkedGoalIds = investments
    .map((inv) => inv.goalId || inv.goal?.id)
    .filter(Boolean);
  const availableGoals = goals.filter(
    (g) => g.type === "MONETARY" && !linkedGoalIds.includes(g.id),
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Novo Ativo">
      <form onSubmit={handleSubmit} className="space-y-4 mt-2">
        {/* TIPO DE ATIVO */}
        <div>
          <label className="text-xs text-text-muted font-bold uppercase ml-1">
            Tipo de Investimento
          </label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {ASSET_TYPES.slice(0, 4).map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setFormData({ ...formData, type: item.value })}
                className={`
                            flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all
                            ${
                              formData.type === item.value
                                ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-500"
                                : "bg-bg-surface border-border-divider text-text-muted hover:bg-bg-surface-hover"
                            }
                        `}
              >
                {item.icon}
                {item.label.split(" ")[0]}
              </button>
            ))}
          </div>
        </div>

        {/* TICKER E NOME */}
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-1">
            <label className="text-xs text-text-muted font-bold uppercase ml-1">
              Código
            </label>
            <input
              required
              placeholder={formData.type === "FIXED_INCOME" ? "CDB" : "WEGE3"}
              value={formData.ticker}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  ticker: e.target.value.toUpperCase(),
                })
              }
              className="w-full mt-1 bg-bg-base border border-border-divider rounded-xl px-3 py-3 text-text-main uppercase placeholder:normal-case focus:outline-none focus:border-emerald-500 font-bold"
              maxLength={10}
            />
          </div>
          <div className="col-span-2">
            <label className="text-xs text-text-muted font-bold uppercase ml-1">
              Nome do Ativo
            </label>
            <input
              required
              placeholder={
                formData.type === "FIXED_INCOME"
                  ? "Nubank 100% CDI"
                  : "Weg S.A."
              }
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full mt-1 bg-bg-base border border-border-divider rounded-xl px-4 py-3 text-text-main focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* VINCULAR META */}
        <div>
          <label className="text-xs text-text-muted font-bold uppercase ml-1">
            Vincular à Meta (Opcional)
          </label>
          <div className="relative mt-1">
            <Target className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <select
              value={formData.goalId}
              onChange={(e) =>
                setFormData({ ...formData, goalId: e.target.value })
              }
              className="w-full bg-bg-base border border-border-divider rounded-xl py-3 pl-10 pr-4 text-text-main appearance-none focus:outline-none focus:border-emerald-500 cursor-pointer text-sm"
            >
              <option value="">Sem vínculo</option>
              {availableGoals.map((goal) => (
                <option key={goal.id} value={goal.id}>
                  {goal.title}
                </option>
              ))}
            </select>
          </div>
          <p className="text-[10px] text-text-muted mt-1 ml-1">
            {availableGoals.length === 0 &&
            goals.some((g) => g.type === "MONETARY")
              ? "Todas as suas metas financeiras já possuem ativos vinculados."
              : "O saldo deste investimento atualizará automaticamente o progresso da meta."}
          </p>
        </div>

        <button
          disabled={isLoading}
          type="submit"
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl mt-4 flex justify-center items-center gap-2 transition cursor-pointer shadow-lg shadow-emerald-900/20"
        >
          {isLoading ? <Loader2 className="animate-spin" /> : "Cadastrar Ativo"}
        </button>
      </form>
    </Modal>
  );
}
