"use client";

import { Modal } from "@/components/ui/modal";
import { useGoalsContext } from "@/contexts/goalsContext";
import { useHabitsContext } from "@/contexts/habitsContext";
import { useToast } from "@/contexts/toastContext";
import { habitService } from "@/services/habitService";
import { HabitFrequency } from "@/types";
import {
  BookOpen,
  Droplets,
  Dumbbell,
  Flame,
  Loader2,
  Moon,
  Sunrise,
  Target,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";

interface NewHabitModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ICONS = [
  { name: "Flame", icon: <Flame size={20} /> },
  { name: "Droplets", icon: <Droplets size={20} /> },
  { name: "BookOpen", icon: <BookOpen size={20} /> },
  { name: "Dumbbell", icon: <Dumbbell size={20} /> },
  { name: "Zap", icon: <Zap size={20} /> },
  { name: "Sunrise", icon: <Sunrise size={20} /> },
  { name: "Moon", icon: <Moon size={20} /> },
  { name: "Target", icon: <Target size={20} /> },
];

const COLORS = [
  { name: "EMERALD", hex: "#10b981" },
  { name: "BLUE", hex: "#3b82f6" },
  { name: "PURPLE", hex: "#8b5cf6" },
  { name: "ROSE", hex: "#f43f5e" },
  { name: "AMBER", hex: "#f59e0b" },
];

export function NewHabitModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { goals } = useGoalsContext();
  const { habits, refreshHabits } = useHabitsContext();
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    icon: "Flame",
    color: "EMERALD",
    frequency: "DAILY" as HabitFrequency,
    weeklyGoal: "",
    goalId: "",
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: "",
        description: "",
        icon: "Flame",
        color: "EMERALD",
        frequency: "DAILY",
        weeklyGoal: "",
        goalId: "",
      });
      setIsLoading(false);
    }
  }, [isOpen]);

  const linkedGoalIds = habits.map((h) => h.goalId).filter(Boolean);
  const availableGoals = goals.filter(
    (g) => g.type === "NUMERIC" && !linkedGoalIds.includes(g.id),
  );

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (
      formData.frequency === "WEEKLY_GOAL" &&
      (!formData.weeklyGoal || Number(formData.weeklyGoal) <= 0)
    ) {
      toast.error("Informe a quantidade de vezes na semana.");
      return;
    }

    setIsLoading(true);
    try {
      await habitService.create({
        name: formData.name,
        description: formData.description,
        icon: formData.icon,
        color: formData.color,
        frequency: formData.frequency,
        weeklyGoal:
          formData.frequency === "WEEKLY_GOAL"
            ? Number(formData.weeklyGoal)
            : undefined,
        goalId: formData.goalId || undefined,
      });

      await refreshHabits();
      onClose();
    } catch (error) {
      toast.error("Erro ao criar hábito.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Novo Hábito">
      <form onSubmit={handleSubmit} className="space-y-4 mt-2">
        <div>
          <label className="text-xs text-text-muted font-bold uppercase ml-1">
            Nome do Hábito
          </label>
          <input
            required
            autoFocus
            placeholder="Ex: Beber 3L de Água"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full bg-bg-base border border-border-divider rounded-xl px-4 py-3 text-text-main focus:outline-none focus:border-emerald-500 transition-colors mt-1"
          />
        </div>

        <div>
          <label className="text-xs text-text-muted font-bold uppercase ml-1">
            Descrição / Regra (Opcional)
          </label>
          <input
            placeholder="Ex: Deixar garrafa na mesa"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className="w-full bg-bg-base border border-border-divider rounded-xl px-4 py-3 text-text-main text-sm focus:outline-none focus:border-emerald-500 transition-colors mt-1"
          />
        </div>

        <div>
          <label className="text-xs text-text-muted font-bold uppercase ml-1">
            Frequência
          </label>
          <div className="flex bg-bg-base p-1 rounded-xl border border-border-divider mt-1">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, frequency: "DAILY" })}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${formData.frequency === "DAILY" ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-sm" : "text-text-muted hover:text-text-main"}`}
            >
              Todos os dias
            </button>
            <button
              type="button"
              onClick={() =>
                setFormData({ ...formData, frequency: "WEEKLY_GOAL" })
              }
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${formData.frequency === "WEEKLY_GOAL" ? "bg-blue-500/10 text-blue-500 border border-blue-500/20 shadow-sm" : "text-text-muted hover:text-text-main"}`}
            >
              Meta na Semana
            </button>
          </div>
        </div>

        {formData.frequency === "WEEKLY_GOAL" && (
          <div>
            <label className="text-xs text-text-muted font-bold uppercase ml-1">
              Quantas vezes na semana?
            </label>
            <input
              required
              type="number"
              min="1"
              max="7"
              placeholder="Ex: 4"
              value={formData.weeklyGoal}
              onChange={(e) =>
                setFormData({ ...formData, weeklyGoal: e.target.value })
              }
              className="w-full bg-bg-base border border-border-divider rounded-xl px-4 py-3 text-text-main focus:outline-none focus:border-blue-500 mt-1"
            />
          </div>
        )}

        <div>
          <label className="text-xs text-text-muted font-bold uppercase ml-1">
            Vincular à Meta (Opcional)
          </label>
          <select
            value={formData.goalId}
            onChange={(e) =>
              setFormData({ ...formData, goalId: e.target.value })
            }
            className="w-full bg-bg-base border border-border-divider rounded-xl py-3 px-4 text-text-main appearance-none focus:outline-none focus:border-emerald-500 mt-1 cursor-pointer"
          >
            <option value="">Sem vínculo (Apenas rastrear ofensiva)</option>
            {availableGoals.map((goal) => (
              <option key={goal.id} value={goal.id}>
                {goal.title} (Alvo: {goal.targetValue})
              </option>
            ))}
          </select>
          <p className="text-[10px] text-text-muted mt-1 ml-1">
            Se vinculado, ao concluir este hábito, a meta numérica subirá
            automaticamente.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2">
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
                                ${formData.icon === item.name ? "bg-bg-surface-hover border-emerald-500 text-emerald-500" : "bg-bg-surface border-border-divider text-text-muted"}`}
                >
                  {item.icon}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-text-muted font-bold uppercase ml-1">
              Cor
            </label>
            <div className="flex gap-3 mt-2 flex-wrap">
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
        </div>

        <button
          disabled={isLoading}
          type="submit"
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl mt-4 flex justify-center items-center gap-2 transition cursor-pointer shadow-lg shadow-emerald-900/20"
        >
          {isLoading ? <Loader2 className="animate-spin" /> : "Criar Hábito"}
        </button>
      </form>
    </Modal>
  );
}
