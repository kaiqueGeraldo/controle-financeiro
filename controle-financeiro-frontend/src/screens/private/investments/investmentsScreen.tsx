"use client";

import React, { useState } from "react";
import { Plus, Loader2, AlertCircle } from "lucide-react";
import { useInvestments } from "@/hooks/useInvestments";
import { InvestmentsSummary } from "@/components/screens/investments/investmentsSummary";
import { InvestmentItem } from "@/components/screens/investments/investmentItem";
import { InvestmentDetails } from "@/components/screens/investments/investmentDetails";
import { useSidebar } from "@/hooks/useSidebar";
import { ConfirmationModal } from "@/components/modals/confirmModal";
import { useInvestmentModals } from "@/contexts/modals/investmentModalContext";

export default function InvestimentosScreen() {
  const { scrolled } = useSidebar();
  const {
    investments,
    isLoading,
    totalInvestido,
    lucroTotal,
    rentabilidadeGeral,
    selectedInvestmentId,
    setSelectedInvestmentId,
    selectedInvestment,
    history,
    isHistoryLoading,
    deleteInvestment,
    deleteHistory,
  } = useInvestments();

  const { openNewAsset, openOperation } = useInvestmentModals();
  const [assetToDelete, setAssetToDelete] = useState<string | null>(null);
  const [historyToDelete, setHistoryToDelete] = useState<string | null>(null);

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
        <div className="px-6 md:px-8 max-w-5xl mx-auto flex justify-between items-center gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-text-main">Investimentos</h1>
            <p className="text-sm text-text-muted hidden md:block mt-0.5">
              Acompanhe a evolução do seu patrimônio.
            </p>
          </div>

          <button
            onClick={openNewAsset}
            className="p-2.5 md:px-4 md:py-2.5 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm transition shadow-lg shadow-emerald-900/20 active:scale-95 cursor-pointer shrink-0"
            title="Novo Ativo"
          >
            <Plus size={18} />
            <span className="hidden md:inline">Novo Ativo</span>
          </button>
        </div>
      </header>

      {/* CONTEÚDO */}
      <main className="px-6 md:px-8 max-w-5xl mx-auto mt-6">
        {/* SUMÁRIO */}
        <InvestmentsSummary
          totalInvestido={totalInvestido}
          lucroTotal={lucroTotal}
          rentabilidadeGeral={rentabilidadeGeral}
        />

        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-bold text-text-muted uppercase tracking-wider">
            Sua Carteira
          </h2>
        </div>

        {/* GRID DE ATIVOS */}
        {investments.length === 0 ? (
          <div className="text-center py-20 flex flex-col items-center border-2 border-dashed border-zinc-900 rounded-3xl bg-bg-base/50">
            <div className="w-16 h-16 bg-bg-surface rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-zinc-700" />
            </div>
            <p className="text-text-muted font-medium">
              Nenhum ativo cadastrado.
            </p>
            <p className="text-text-muted text-sm mt-1">
              Cadastre sua reserva ou ações para começar.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {investments.map((ativo) => (
              <InvestmentItem
                key={ativo.id}
                asset={ativo}
                totalPortfolioValue={totalInvestido}
                onClick={() => setSelectedInvestmentId(ativo.id)}
              />
            ))}
          </div>
        )}
      </main>

      {/* MODAL DETALHES */}
      <InvestmentDetails
        isOpen={!!selectedInvestmentId}
        onClose={() => setSelectedInvestmentId(null)}
        asset={selectedInvestment}
        history={history}
        isHistoryLoading={isHistoryLoading}
        onOperation={openOperation}
        onDeleteAsset={(id) => setAssetToDelete(id)}
        onDeleteHistory={(id) => setHistoryToDelete(id)}
      />

      <ConfirmationModal
        isOpen={!!assetToDelete}
        onClose={() => setAssetToDelete(null)}
        title="Excluir Ativo"
        message="Deseja excluir este ativo? Todo o histórico de operações dele será apagado permanentemente."
        confirmText="Excluir"
        confirmColor="bg-rose-600 hover:bg-rose-700 text-white"
        onConfirm={async () => {
          if (assetToDelete) {
            await deleteInvestment(assetToDelete);
            setAssetToDelete(null);
          }
        }}
      />

      <ConfirmationModal
        isOpen={!!historyToDelete}
        onClose={() => setHistoryToDelete(null)}
        title="Excluir Movimentação"
        message="Deseja excluir esta operação? A quantidade de cotas será recalculada. Lembre-se: Ajustes de estorno no saldo bancário deverão ser feitos manualmente no extrato."
        confirmText="Excluir"
        confirmColor="bg-rose-600 hover:bg-rose-700 text-white"
        onConfirm={async () => {
          if (historyToDelete) {
            await deleteHistory(historyToDelete);
            setHistoryToDelete(null);
          }
        }}
      />
    </div>
  );
}
