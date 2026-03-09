"use client";

import React, { useState } from "react";
import { Plus, Loader2, Sparkles, ArrowUpDown } from "lucide-react";
import { useSidebar } from "@/hooks/useSidebar";
import { useHabits } from "@/hooks/useHabits";
import { HabitItem } from "@/components/screens/habits/habitItem";
import { habitService } from "@/services/habitService";
import { HabitDetails } from "@/components/screens/habits/habitDetails";
import { ConfirmationModal } from "@/components/modals/confirmModal";
import { ReorderModal } from "@/components/forms/reorderModal";
import { getGoalColorClass, getGoalIcon } from "@/components/screens/goals/goalItem";
import { useGoals } from "@/hooks/useGoals";
import { useHabitModals } from "@/contexts/modals/habitModalContext";

export default function HabitsScreen() {
  const { scrolled } = useSidebar();
  const { habits, isLoading, refreshHabits, toggleHabitOptimistic } = useHabits();
  const { refreshGoals } = useGoals();
  const { openNewHabit } = useHabitModals();

  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  const [habitToDelete, setHabitToDelete] = useState<string | null>(null);
  const [isReorderOpen, setIsReorderOpen] = useState(false);

  const selectedHabit = habits.find((h) => h.id === selectedHabitId);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg-base">
        <Loader2 className="animate-spin text-emerald-500 w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-base font-sans text-text-main pb-20">
      <header
        className={`sticky top-0 z-30 transition-all duration-300 ease-in-out border-b border-border-divider ${scrolled ? "bg-bg-base/90 backdrop-blur-md py-3" : "bg-bg-base py-6"}`}
      >
        <div className="px-6 md:px-8 max-w-5xl mx-auto flex justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Hábitos</h1>
            <p className="text-text-muted text-sm hidden md:block">
              Construa disciplina com 1% ao dia.
            </p>
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            {habits.length > 1 && (
              <button
                onClick={() => setIsReorderOpen(true)}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-bg-surface hover:bg-bg-surface-hover border border-border-divider text-text-main rounded-xl font-bold text-sm transition shadow-sm cursor-pointer"
              >
                <ArrowUpDown size={16} />
                <span className="hidden sm:inline">Organizar</span>
              </button>
            )}
            <button
              onClick={openNewHabit}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm transition shadow-lg shadow-emerald-900/20 cursor-pointer"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">Novo Hábito</span>
            </button>
          </div>
        </div>
      </header>

      <main className="px-6 md:px-8 max-w-5xl mx-auto mt-6">
        {/* Banner Motivacional */}
        <div className="bg-linear-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/20 rounded-2xl p-5 flex items-start gap-4 mb-8">
          <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl shrink-0">
            <Sparkles size={20} />
          </div>
          <div>
            <h3 className="font-bold text-emerald-400 text-sm">
              O Perdão Automático está ativo
            </h3>
            <p className="text-xs text-text-muted mt-1 leading-relaxed max-w-2xl">
              Baseado no livro "Hábitos Atômicos": se você esquecer de registrar
              um dia por um imprevisto (mas tiver cumprido no dia anterior), o
              sistema protegerá sua ofensiva. Nunca falhe duas vezes.
            </p>
          </div>
        </div>

        {habits.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-zinc-900 rounded-3xl">
            <p className="text-text-muted">Nenhum hábito cadastrado.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {habits.map((habit) => (
              <HabitItem
                key={habit.id}
                habit={habit}
                onToggle={toggleHabitOptimistic}
                onClick={(h) => setSelectedHabitId(h.id)}
              />
            ))}
          </div>
        )}
      </main>

      {/* O NOVO MODAL */}
      <HabitDetails
        isOpen={!!selectedHabitId}
        habit={selectedHabit}
        onClose={() => setSelectedHabitId(null)}
        onUpdate={async (id, data) => {
          await habitService.update(id, data);
          refreshHabits();
        }}
        onDelete={(id) => {
          setHabitToDelete(id);
          setSelectedHabitId(null);
        }}
      />

      <ConfirmationModal
        isOpen={!!habitToDelete}
        onClose={() => setHabitToDelete(null)}
        title="Excluir Hábito"
        message="Todo o histórico e ofensivas serão perdidos. Se havia vínculo com alguma meta, a meta não será apagada, mas os incrementos pararão. Confirma?"
        confirmText="Excluir"
        confirmColor="bg-rose-600 hover:bg-rose-700 text-white"
        onConfirm={async () => {
          if (habitToDelete) {
            await habitService.delete(habitToDelete);
            refreshHabits();
            refreshGoals();
            setHabitToDelete(null);
          }
        }}
      />

      <ReorderModal
        isOpen={isReorderOpen}
        onClose={() => setIsReorderOpen(false)}
        title="Organizar Hábitos"
        items={habits}
        onSave={async (ids) => {
          await habitService.reorder(ids);
          refreshHabits();
        }}
        renderItem={(habit) => {
          const colorClass = getGoalColorClass(habit.color);
          const [textColor, bgColor] = colorClass.split(" ");
          return (
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg flex items-center justify-center ${textColor} ${bgColor}`}
              >
                {getGoalIcon(habit.icon)}
              </div>
              <p className="font-bold text-sm text-text-main truncate">
                {habit.name}
              </p>
            </div>
          );
        }}
      />
    </div>
  );
}
