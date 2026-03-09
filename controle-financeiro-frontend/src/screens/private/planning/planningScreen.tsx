"use client";

import { ChevronLeft, ChevronRight, Plus, Loader2, Copy } from "lucide-react";
import { useSidebar } from "@/hooks/useSidebar";
import { usePlanning } from "@/hooks/usePlanning";
import { PlanningItem } from "@/components/screens/planning/planningItem";
import { PlanningFooter } from "@/components/screens/planning/planningFooter";
import { PlanningDetails } from "@/components/screens/planning/planningDetails";
import { Reorder } from "framer-motion";
import { usePlanningModals } from "@/contexts/modals/planningModalContext";

export default function PlanningScreen() {
  const { scrolled } = useSidebar();
  const { openNewPlan, openDeletePlanItem } = usePlanningModals();

  const {
    orderedItems,
    handleReorder,
    items,
    categories,
    incomeForecast,
    isLoading,
    monthFormatted,
    totals,
    changeMonth,
    copyPreviousMonth,
    updateStatus,
    updateIncome,
    selectedPlanItemId,
    setSelectedPlanItemId,
    selectedPlanItem,
    updateItem,
    canGoBack,
    canGoForward,
  } = usePlanning();

  return (
    <div className="min-h-screen bg-bg-base font-sans text-text-main relative pb-48">
      {/* HEADER */}
      <header
        className={`
          sticky top-0 z-20 transition-all duration-300 ease-in-out border-b border-border-divider
          ${
            scrolled ? "bg-bg-base/90 backdrop-blur-md py-3" : "bg-bg-base py-6"
          }
        `}
      >
        <div className="px-6 md:px-8 max-w-5xl mx-auto flex flex-col gap-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            
            {/* Mobile: Título + Ações Curtas */}
            <div className="flex items-center justify-between w-full md:w-auto">
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">Planejamento</h1>
                <p className="text-text-muted text-sm hidden md:block mt-0.5">Organize suas despesas e receitas do mês.</p>
              </div>
              <div className="flex gap-2 md:hidden">
                <button onClick={copyPreviousMonth} className="p-2.5 bg-bg-surface border border-border-divider text-text-main rounded-xl shadow-sm cursor-pointer"><Copy size={18}/></button>
                <button onClick={openNewPlan} className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-lg cursor-pointer"><Plus size={18}/></button>
              </div>
            </div>

            {/* Navegador de Data */}
            <div className="flex items-center justify-between md:justify-center w-full md:w-auto gap-2 bg-bg-surface border border-border-divider rounded-xl p-1 shadow-sm shrink-0">
              <button disabled={!canGoBack} onClick={() => changeMonth(-1)} className={`p-2 rounded-lg transition ${canGoBack ? 'text-text-muted hover:text-text-main hover:bg-bg-surface-hover cursor-pointer' : 'text-text-muted/30 cursor-not-allowed'}`}>
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-semibold text-sm min-w-30 text-center capitalize select-none">
                {monthFormatted}
              </span>
              <button disabled={!canGoForward} onClick={() => changeMonth(1)} className={`p-2 rounded-lg transition ${canGoForward ? 'text-text-muted hover:text-text-main hover:bg-bg-surface-hover cursor-pointer' : 'text-text-muted/30 cursor-not-allowed'}`}>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Desktop: Botões Extensos */}
            <div className="hidden md:flex gap-2 shrink-0">
              <button onClick={copyPreviousMonth} className="flex items-center gap-2 px-4 py-2.5 bg-bg-surface hover:bg-bg-surface-hover border border-border-divider text-text-main rounded-xl font-medium text-sm transition shadow-sm cursor-pointer">
                <Copy size={16} /> Copiar Anterior
              </button>
              <button onClick={openNewPlan} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm transition shadow-lg shadow-emerald-900/20 cursor-pointer">
                <Plus size={18} /> Lançar
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="px-6 md:px-8 max-w-5xl mx-auto mt-6 space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 flex flex-col items-center border-2 border-dashed border-zinc-900 rounded-3xl bg-bg-base/50">
            <div className="w-16 h-16 bg-bg-surface rounded-full flex items-center justify-center mb-4">
              <Plus className="w-8 h-8 text-zinc-700" />
            </div>
            <p className="text-text-muted font-medium">
              Nenhum planejamento para este mês.
            </p>
            <p className="text-text-muted text-sm mt-1">
              Comece adicionando uma despesa prevista.
            </p>
          </div>
        ) : (
          <Reorder.Group
            axis="y"
            values={orderedItems}
            onReorder={handleReorder}
            className="space-y-3"
          >
            {orderedItems.map((item) => (
              <Reorder.Item
                key={item.id}
                value={item}
                className="relative cursor-grab active:cursor-grabbing"
              >
                <PlanningItem
                  item={item}
                  onStatusChange={updateStatus}
                  onDelete={openDeletePlanItem}
                  onClick={(item) => setSelectedPlanItemId(item.id)}
                />
              </Reorder.Item>
            ))}
          </Reorder.Group>
        )}
      </main>

      {/* RODAPÉ */}
      <PlanningFooter
        income={incomeForecast}
        expenses={totals.expenses}
        remaining={totals.remaining}
        onUpdateIncome={updateIncome}
      />

      {/* OVERLAY DE DETALHES */}
      <PlanningDetails
        isOpen={!!selectedPlanItemId}
        onClose={() => setSelectedPlanItemId(null)}
        item={selectedPlanItem}
        categories={categories}
        onUpdate={updateItem}
        onDelete={openDeletePlanItem}
      />
    </div>
  );
}
