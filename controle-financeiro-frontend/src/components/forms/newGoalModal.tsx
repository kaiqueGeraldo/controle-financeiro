"use client";

import { useEffect, useRef, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { goalService } from "@/services/goalService";
import {
  Loader2,
  Target,
  ShieldAlert,
  BookOpen,
  Droplets,
  Laptop,
  Car,
  Home,
  Plane,
  Trophy,
} from "lucide-react";
import { GoalType } from "@/types";
import { useToast } from "@/contexts/toastContext";

interface NewGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Lista de ícones disponíveis para escolha
const ICONS = [
  { name: "Target", icon: <Target size={20} /> },
  { name: "ShieldAlert", icon: <ShieldAlert size={20} /> },
  { name: "BookOpen", icon: <BookOpen size={20} /> },
  { name: "Droplets", icon: <Droplets size={20} /> },
  { name: "Laptop", icon: <Laptop size={20} /> },
  { name: "Car", icon: <Car size={20} /> },
  { name: "Home", icon: <Home size={20} /> },
  { name: "Plane", icon: <Plane size={20} /> },
  { name: "Trophy", icon: <Trophy size={20} /> },
];

// Lista de cores (nomes que o backend/helper reconhece)
const COLORS = [
  { name: "EMERALD", hex: "#10b981" },
  { name: "BLUE", hex: "#3b82f6" },
  { name: "CYAN", hex: "#06b6d4" },
  { name: "PURPLE", hex: "#8b5cf6" },
  { name: "ROSE", hex: "#f43f5e" },
  { name: "AMBER", hex: "#f59e0b" },
];

export function NewGoalModal({
  isOpen,
  onClose,
  onSuccess,
}: NewGoalModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const [formData, setFormData] = useState({
    title: "",
    targetValue: "",
    deadline: "",
    category: "",
    icon: "Target",
    color: "EMERALD",
    type: "MONETARY" as GoalType,
    useChecklist: false,
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: "",
        targetValue: "",
        deadline: "",
        category: "",
        icon: "Target",
        color: "EMERALD",
        type: "MONETARY",
        useChecklist: false,
      });
      setIsLoading(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await goalService.create({
        title: formData.title,
        targetValue: formData.useChecklist ? 0 : Number(formData.targetValue),
        deadline: formData.deadline,
        category: formData.category,
        icon: formData.icon,
        color: formData.color,
        type: formData.type,
        useChecklist: formData.useChecklist,
      });

      onSuccess();
      onClose();
    } catch (error) {
      toast.error("Erro ao criar meta. Verifique os campos.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nova Meta">
      <form
        onSubmit={handleSubmit}
        className="space-y-4 mt-2 max-h-[80vh] overflow-y-auto custom-scroll px-1"
      >
        {/* TIPO DA META */}
        <div className="flex bg-bg-base p-1 rounded-xl border border-border-divider">
          <button
            type="button"
            onClick={() => setFormData({ ...formData, type: "MONETARY" })}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${formData.type === "MONETARY" ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "text-text-muted hover:text-text-main"}`}
          >
            Dinheiro (R$)
          </button>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, type: "NUMERIC", useChecklist: false })}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${formData.type === "NUMERIC" ? "bg-blue-500/10 text-blue-500 border border-blue-500/20" : "text-text-muted hover:text-text-main"}`}
          >
            Numérica (Un.)
          </button>
        </div>

        {/* FORMATO DA META FINANCEIRA */}
        {formData.type === "MONETARY" && (
          <div>
            <label className="text-xs text-text-muted font-bold uppercase ml-1">
              Formato
            </label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <button
                type="button"
                onClick={() =>
                  setFormData({ ...formData, useChecklist: false })
                }
                className={`p-3 rounded-xl border text-left transition-all ${!formData.useChecklist ? "bg-bg-surface-hover border-emerald-500/50 text-text-main" : "bg-bg-base border-border-divider text-text-muted"}`}
              >
                <p className="text-sm font-bold">Poupança</p>
                <p className="text-[10px] mt-0.5 leading-tight">
                  Apenas acumular dinheiro (Ex: Reserva)
                </p>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, useChecklist: true })}
                className={`p-3 rounded-xl border text-left transition-all ${formData.useChecklist ? "bg-bg-surface-hover border-emerald-500/50 text-text-main" : "bg-bg-base border-border-divider text-text-muted"}`}
              >
                <p className="text-sm font-bold">Aquisição</p>
                <p className="text-[10px] mt-0.5 leading-tight">
                  Comprar itens (Ex: PC Gamer)
                </p>
              </button>
            </div>
          </div>
        )}

        {/* NOME */}
        <div>
          <label className="text-xs text-text-muted font-bold uppercase ml-1">
            Título da Meta
          </label>
          <input
            required
            placeholder={
              formData.type === "MONETARY"
                ? "Ex: Reserva de Emergência"
                : "Ex: Ler Livros"
            }
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            className="w-full bg-bg-base border border-border-divider rounded-xl px-4 py-3 text-text-main focus:outline-none focus:border-emerald-500 transition-colors mt-1"
          />
        </div>

        {/* VALOR ALVO OU AVISO DE CHECKLIST */}
        {!formData.useChecklist ? (
          <div>
            <label className="text-xs text-text-muted font-bold uppercase ml-1">
              Objetivo Final
            </label>
            <div className="relative mt-1">
              {formData.type === "MONETARY" && (
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted font-bold">
                  R$
                </span>
              )}
              <input
                required
                type="number"
                step={formData.type === "MONETARY" ? "0.01" : "1"}
                placeholder={formData.type === "MONETARY" ? "0,00" : "0"}
                value={formData.targetValue}
                min="0"
                onChange={(e) =>
                  setFormData({ ...formData, targetValue: e.target.value })
                }
                className={`w-full bg-bg-base border border-border-divider rounded-xl py-3 pr-4 text-text-main focus:outline-none focus:border-emerald-500 ${formData.type === "MONETARY" ? "pl-10" : "pl-4"}`}
              />
            </div>
          </div>
        ) : (
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-2 flex flex-col items-center justify-center text-center mt-1">
            <p className="text-sm text-emerald-400 font-bold mb-1">
              Valor Dinâmico Automático
            </p>
            <p className="text-xs text-emerald-500/80 leading-relaxed">
              O valor final desta meta será calculado automaticamente de acordo
              com os itens que você adicionar ao seu checklist de compras.
            </p>
          </div>
        )}

        {/* DATA E CATEGORIA */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-text-muted font-bold uppercase ml-1">
              Data Limite
            </label>
            <input
              required
              type="date"
              value={formData.deadline}
              onChange={(e) =>
                setFormData({ ...formData, deadline: e.target.value })
              }
              className="w-full bg-bg-base border border-border-divider rounded-xl px-3 py-3 text-text-main text-sm focus:outline-none focus:border-emerald-500 mt-1"
            />
          </div>
          <div>
            <label className="text-xs text-text-muted font-bold uppercase ml-1">
              Categoria
            </label>
            <input
              placeholder="Ex: Viagem"
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              className="w-full bg-bg-base border border-border-divider rounded-xl px-3 py-3 text-text-main text-sm focus:outline-none focus:border-emerald-500 mt-1"
            />
          </div>
        </div>

        {/* ÍCONE */}
        <div>
          <label className="text-xs text-text-muted font-bold uppercase ml-1">
            Ícone
          </label>
          <div className="flex gap-2 mt-2 overflow-x-auto custom-scroll pb-2">
            {ICONS.map((item) => (
              <div
                key={item.name}
                onClick={() => setFormData({ ...formData, icon: item.name })}
                className={`w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer shrink-0 border transition-all
                            ${
                              formData.icon === item.name
                                ? "bg-bg-surface-hover border-emerald-500 text-emerald-500"
                                : "bg-bg-surface border-border-divider text-text-muted hover:bg-bg-surface-hover"
                            }`}
              >
                {item.icon}
              </div>
            ))}
          </div>
        </div>

        {/* COR */}
        <div>
          <label className="text-xs text-text-muted font-bold uppercase ml-1">
            Cor do Tema
          </label>
          <div className="flex gap-3 mt-2">
            {COLORS.map((c) => (
              <div
                key={c.name}
                onClick={() => setFormData({ ...formData, color: c.name })}
                className={`w-8 h-8 rounded-full cursor-pointer border-2 transition-transform hover:scale-110 ${formData.color === c.name ? "border-white scale-110" : "border-transparent"}`}
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </div>
        </div>

        <button
          disabled={isLoading}
          type="submit"
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl mt-4 flex justify-center items-center gap-2 transition cursor-pointer shadow-lg shadow-emerald-900/20"
        >
          {isLoading ? <Loader2 className="animate-spin" /> : "Criar Meta"}
        </button>
      </form>
    </Modal>
  );
}
