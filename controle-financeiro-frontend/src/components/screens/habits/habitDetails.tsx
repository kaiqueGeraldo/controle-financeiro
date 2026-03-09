"use client";

import { Habit } from "@/types";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Flame, Loader2, Minus, Save, Trash2, X } from "lucide-react";
import React, { useEffect, useState } from "react";
import { getGoalColorClass, getGoalIcon } from "../goals/goalItem";

interface HabitDetailsProps {
  isOpen: boolean;
  habit: Habit | undefined;
  onClose: () => void;
  onUpdate: (id: string, data: any) => Promise<void>;
  onDelete: (id: string) => void;
}

const normalizeDate = (d: any) =>
  Array.isArray(d)
    ? `${d[0]}-${String(d[1]).padStart(2, "0")}-${String(d[2]).padStart(2, "0")}`
    : d;

export function HabitDetails({
  isOpen,
  habit,
  onClose,
  onUpdate,
  onDelete,
}: HabitDetailsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({ name: "", description: "" });

  useEffect(() => {
    if (habit && isOpen) {
      setFormData({ name: habit.name, description: habit.description || "" });
      setIsEditing(false);
    }
  }, [habit, isOpen]);

  const handleSave = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!habit) return;
    setIsSaving(true);
    try {
      await onUpdate(habit.id, formData);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  if (!habit) return null;

  const colorClass = getGoalColorClass(habit.color);
  const [textColor, bgColor] = colorClass.split(" ");

  const getLocalDateString = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  const todayStr = getLocalDateString(new Date());
  const last28Days = Array.from({ length: 28 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (27 - i));
    return getLocalDateString(d);
  });

  const getLogStatus = (dateStr: string) => {
    const log = habit.logs?.find((l) => normalizeDate(l.date) === dateStr);
    return log?.status || "PENDING";
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-bg-base/80 backdrop-blur-sm cursor-pointer"
          />

          <motion.form
            layoutId={`habits-habit-card-${habit.id}`}
            onSubmit={handleSave}
            className="w-full max-w-md bg-bg-surface border border-border-divider rounded-3xl overflow-hidden shadow-2xl relative z-10 flex flex-col"
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full text-text-main transition cursor-pointer z-20"
            >
              <X size={20} />
            </button>

            {/* HEADER */}
            <div className="p-6 border-b border-border-divider bg-bg-surface relative">
              <div className="flex gap-4 items-start">
                <motion.div
                  layoutId={`habits-icon-${habit.id}`}
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 ${textColor} ${bgColor}`}
                >
                  {React.cloneElement(
                    getGoalIcon(habit.icon) as React.ReactElement<any>,
                    { size: 32 },
                  )}
                </motion.div>

                <div className="flex-1 pt-1 pr-6">
                  {isEditing ? (
                    <div className="space-y-2">
                      <input
                        autoFocus
                        required
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        className="w-full bg-bg-base border border-border-divider text-text-main text-lg font-bold rounded-lg px-2 py-1 focus:outline-none focus:border-emerald-500"
                      />
                      <input
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            description: e.target.value,
                          })
                        }
                        className="w-full bg-bg-base border border-border-divider text-text-muted text-sm rounded-lg px-2 py-1 focus:outline-none focus:border-emerald-500"
                        placeholder="Descrição (Opcional)"
                      />
                    </div>
                  ) : (
                    <>
                      <motion.h3
                        layoutId={`habits-title-${habit.id}`}
                        className="text-2xl font-bold text-text-main leading-tight"
                      >
                        {habit.name}
                      </motion.h3>
                      {habit.description && (
                        <p className="text-sm text-text-muted mt-1">
                          {habit.description}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-6">
                <div className="bg-bg-base/50 p-3 rounded-xl border border-border-divider/50 flex items-center gap-3">
                  <Flame className="text-orange-500 shrink-0" size={24} />
                  <div>
                    <p className="text-[10px] text-text-muted uppercase font-bold tracking-wider">
                      Ofensiva Atual
                    </p>
                    <p className="text-xl font-bold text-text-main">
                      {habit.currentStreak}{" "}
                      {habit.frequency === "WEEKLY_GOAL" ? (habit.currentStreak === 1 ? "semana" : "semanas") : (habit.currentStreak === 1 ? "dia" : "dias")}
                    </p>
                  </div>
                </div>
                <div className="bg-bg-base/50 p-3 rounded-xl border border-border-divider/50">
                  <p className="text-[10px] text-text-muted uppercase font-bold tracking-wider">
                    Recorde Pessoal
                  </p>
                  <p className="text-xl font-bold text-text-main">
                    {habit.highestStreak}{" "}
                    {habit.frequency === "WEEKLY_GOAL" ? (habit.currentStreak === 1 ? "semana" : "semanas") : (habit.currentStreak === 1 ? "dia" : "dias")}
                  </p>
                </div>
              </div>
            </div>

            {/* BODY */}
            <div className="p-6 bg-bg-base/50">
              <p className="text-xs text-text-muted uppercase font-bold tracking-wider mb-4">
                Últimos 28 dias
              </p>
              <div className="grid grid-cols-7 gap-2">
                {last28Days.map((dateStr) => {
                  const status = getLogStatus(dateStr);
                  const isToday = dateStr === todayStr;

                  let squareClass = "bg-bg-surface border-border-divider";
                  if (status === "COMPLETED")
                    squareClass = `${bgColor} ${textColor} border-transparent`;
                  if (status === "SKIPPED")
                    squareClass =
                      "bg-yellow-500/20 border-yellow-500/30 text-yellow-500";
                  if (status === "FAILED")
                    squareClass =
                      "bg-rose-500/20 border-rose-500/30 text-rose-500";

                  return (
                    <div
                      key={dateStr}
                      title={new Date(dateStr + "T12:00:00").toLocaleDateString(
                        "pt-BR",
                      )}
                      className={`aspect-square rounded-lg border flex items-center justify-center transition-colors ${squareClass} ${isToday ? "ring-2 ring-offset-2 ring-offset-bg-base ring-emerald-500/50" : ""}`}
                    >
                      {status === "SKIPPED" && <Minus size={14} />}
                      {status === "FAILED" && <X size={14} />}
                      {status === "COMPLETED" && <Check size={14} />}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* FOOTER ACTIONS */}
            <div className="p-6 border-t border-border-divider bg-bg-surface grid grid-cols-2 gap-4">
              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="py-3 rounded-xl font-bold text-text-muted hover:bg-bg-button-hover transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="py-3 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center justify-center gap-2 shadow-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <>
                        <Save size={18} /> Salvar
                      </>
                    )}
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => onDelete(habit.id)}
                    className="py-3 rounded-xl font-bold text-rose-500 hover:bg-rose-500/10 transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Trash2 size={18} /> Excluir
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="py-3 rounded-xl font-bold bg-bg-surface-hover text-text-main transition cursor-pointer"
                  >
                    Editar Hábito
                  </button>
                </>
              )}
            </div>
          </motion.form>
        </div>
      )}
    </AnimatePresence>
  );
}
