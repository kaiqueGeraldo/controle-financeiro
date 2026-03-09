"use client";

import React from "react";
import { ChevronLeft, ChevronRight, Loader2, Info } from "lucide-react";
import { motion } from "framer-motion";
import { useAnnualSummary } from "@/hooks/useAnnualSummary";
import { useSidebar } from "@/hooks/useSidebar";
import { AnnualBalance } from "@/components/screens/annual-summary/annualBalance";
import { AnnualCreditCard } from "@/components/screens/annual-summary/annualCreditCard";
import { AnnualInvestments } from "@/components/screens/annual-summary/annualInvestments";
import { AnnualNotepad } from "@/components/screens/annual-summary/annualNotepad";

export default function AnnualSummaryScreen() {
  const { scrolled } = useSidebar();
  const {
    year,
    setYear,
    summary,
    isLoading,
    noteContent,
    setNoteContent,
    saveNote,
    isSavingNote,
  } = useAnnualSummary();
  const currentYear = new Date().getFullYear();
  const MIN_YEAR = 2020;
  const MAX_YEAR = currentYear + 5;

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg-base">
        <Loader2 className="animate-spin text-emerald-500 w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-base font-sans text-text-main pb-20">
      {/* HEADER FIXO */}
      <header
        className={`
          sticky top-0 z-30 transition-all duration-300 ease-in-out border-b border-border-divider
          ${scrolled ? "bg-bg-base/90 backdrop-blur-md py-3" : "bg-bg-base py-6"}
        `}
      >
        <div className="px-6 md:px-8 max-w-5xl mx-auto flex justify-between items-center gap-2">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-text-main truncate">Resumo Anual</h1>
            <p className="text-sm text-text-muted hidden md:block mt-0.5">
              Visão consolidada do seu ano financeiro.
            </p>
          </div>

          <div className="flex items-center gap-1 md:gap-2 bg-bg-surface border border-border-divider rounded-xl p-1 shadow-sm shrink-0">
            <button
              onClick={() => setYear(year - 1)}
              disabled={year <= MIN_YEAR}
              className={`p-2 rounded-lg transition ${year <= MIN_YEAR ? "text-zinc-700 cursor-not-allowed" : "text-text-muted hover:text-text-main hover:bg-bg-surface-hover cursor-pointer"}`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-bold text-base md:text-lg px-2 md:px-4 select-none">{year}</span>
            <button
              onClick={() => setYear(year + 1)}
              disabled={year >= MAX_YEAR}
              className={`p-2 rounded-lg transition ${year >= MAX_YEAR ? "text-zinc-700 cursor-not-allowed" : "text-text-muted hover:text-text-main hover:bg-bg-surface-hover cursor-pointer"}`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* CONTEÚDO */}
      <main className="px-6 md:px-8 max-w-5xl mx-auto mt-6">
        {!summary ? (
          <div className="text-center py-20 text-text-muted">
            Nenhum dado encontrado para {year}.
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* COLUNA 1: DADOS (2/3 do espaço na tela grande) */}
            <div className="lg:col-span-2 space-y-6">
              {/* MENSAGEM COMPARATIVA */}
              {summary.comparison.message && (
                <div className="bg-bg-surface/50 border border-border-divider p-4 rounded-2xl flex items-center gap-3">
                  <div className="p-2 bg-bg-surface-hover rounded-full text-text-muted shrink-0">
                    <Info size={16} />
                  </div>
                  <p className="text-sm text-text-main">
                    {summary.comparison.message}
                  </p>
                </div>
              )}

              {/* BALANÇO */}
              <AnnualBalance
                totalIncome={summary.balance.totalIncome}
                totalExpense={summary.balance.totalExpense}
                annualBalance={summary.balance.annualBalance}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AnnualCreditCard
                  totalSpent={summary.creditCard.totalSpent}
                  subscriptionsTotal={summary.creditCard.subscriptionsTotal}
                  monthlyAverage={summary.creditCard.monthlyAverage}
                />

                <AnnualInvestments
                  totalValue={summary.investments.totalValue}
                  items={summary.investments.items}
                />
              </div>
            </div>

            {/* COLUNA 2: BLOCO DE NOTAS (1/3 do espaço na tela grande) */}
            <div className="lg:col-span-1">
              <AnnualNotepad
                year={year}
                content={noteContent}
                isSaving={isSavingNote}
                onContentChange={setNoteContent}
                onSave={saveNote}
              />
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
