"use client";

import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  Plus,
} from "lucide-react";
import { useSidebar } from "@/hooks/useSidebar";
import { useExtract } from "@/hooks/useExtract";
import { ExtractFilters } from "@/components/screens/extract/extractFilters";
import { TransactionItem } from "@/components/screens/extract/transactionItem";
import { TransactionDetails } from "@/components/screens/extract/transactionDetails";
import { ExtractSummary } from "@/components/screens/extract/extractSummary";
import { useTransactionModals } from "@/contexts/modals/transactionModalContext";

export default function ExtractScreen() {
  const { scrolled } = useSidebar();
  const { openNewTransaction, openDeleteTransaction } = useTransactionModals();

  // --- HOOK CONTROLLER ---
  const {
    groupedTransactions,
    summary,
    accounts,
    categories,
    isInitialLoading,
    isFiltering,
    filters,
    setFilterType,
    setFilterAccountId,
    changeMonth,
    updateTransaction,
    selectedTransactionId,
    setSelectedTransactionId,
    selectedTransaction,
    canGoBack,
    canGoForward,
    hasMore,
    loadMore,
    isLoadingMore,
  } = useExtract();

  if (isInitialLoading) {
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
        <div className="px-6 md:px-8 max-w-5xl mx-auto flex flex-col gap-4">
          {/* Linha 1: Título, Data, Botão Novo */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Mobile: Título (Esq) + Botão Novo (Dir) */}
            <div className="flex items-center justify-between w-full md:w-auto">
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  Extrato
                  {filters.accountId !== "todas" && (
                    <span className="text-sm font-normal text-text-muted bg-bg-surface px-2 py-1 rounded-lg border border-border-divider hidden sm:inline-block">
                      {accounts.find((a) => a.id === filters.accountId)?.name}
                    </span>
                  )}
                </h1>
                <p className="text-text-muted text-sm hidden md:block mt-0.5">
                  Histórico completo de movimentações.
                </p>
              </div>
              <button
                onClick={openNewTransaction}
                className="md:hidden p-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg cursor-pointer"
              >
                <Plus size={20} />
              </button>
            </div>

            {/* Navegador de Data */}
            <div className="flex items-center justify-between md:justify-center w-full md:w-auto gap-2 bg-bg-surface border border-border-divider rounded-xl p-1 shadow-sm shrink-0">
              <button
                disabled={!canGoBack}
                onClick={() => changeMonth(-1)}
                className={`p-2 rounded-lg transition ${canGoBack ? "text-text-muted hover:text-text-main hover:bg-bg-surface-hover cursor-pointer" : "text-text-muted/30 cursor-not-allowed"}`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-semibold text-sm min-w-30 text-center capitalize select-none">
                {filters.formattedDate}
              </span>
              <button
                disabled={!canGoForward}
                onClick={() => changeMonth(1)}
                className={`p-2 rounded-lg transition ${canGoForward ? "text-text-muted hover:text-text-main hover:bg-bg-surface-hover cursor-pointer" : "text-text-muted/30 cursor-not-allowed"}`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Desktop: Botão de Ação */}
            <button
              onClick={openNewTransaction}
              className="hidden md:flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm transition shadow-lg shadow-emerald-900/20 active:scale-95 cursor-pointer shrink-0"
            >
              <Plus size={18} /> Lançar
            </button>
          </div>

          {/* Linha 2: Filtros */}
          <ExtractFilters
            accounts={accounts}
            filterAccountId={filters.accountId}
            setFilterAccountId={setFilterAccountId}
            filterType={filters.type}
            setFilterType={setFilterType}
          />
        </div>
      </header>

      <main className="px-6 md:px-8 max-w-5xl mx-auto mt-6 space-y-8">
        {/* CARDS DE RESUMO */}
        <ExtractSummary
          entries={summary.entries}
          exits={summary.exits}
          balance={summary.balance}
        />

        {/* LISTA DE TRANSAÇÕES */}
        {isFiltering ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
          </div>
        ) : groupedTransactions.length === 0 ? (
          <div className="text-center py-20 flex flex-col items-center">
            <div className="w-16 h-16 bg-bg-surface rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-zinc-700" />
            </div>
            <p className="text-text-muted font-medium">
              Nenhuma movimentação encontrada.
            </p>
            <p className="text-text-muted text-sm mt-1">
              Tente mudar os filtros ou o mês.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {groupedTransactions.map((grupo) => (
              <div key={grupo.date} className="space-y-3">
                {/* Data Sticky */}
                <h3 className="text-sm font-semibold text-text-muted sticky top-44 md:top-48 z-10 bg-bg-base/95 backdrop-blur w-fit px-3 py-1 rounded-full border border-border-divider shadow-sm">
                  {new Date(grupo.date + "T12:00:00").toLocaleDateString(
                    "pt-BR",
                    { day: "2-digit", month: "short", weekday: "short" },
                  )}
                </h3>

                <div className="bg-bg-surface border border-border-divider rounded-2xl overflow-hidden shadow-sm">
                  {grupo.items.map((item, index) => (
                    <TransactionItem
                      key={item.id}
                      item={item}
                      accounts={accounts}
                      isLast={index === grupo.items.length - 1}
                      onClick={setSelectedTransactionId}
                    />
                  ))}
                </div>
              </div>
            ))}
            {hasMore && (
              <div className="flex justify-center pt-4 pb-8">
                <button
                  onClick={loadMore}
                  disabled={isLoadingMore}
                  className="px-6 py-2 bg-bg-surface border border-border-divider rounded-full text-text-muted hover:text-text-main text-sm font-bold transition-colors disabled:opacity-50"
                >
                  {isLoadingMore ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Carregar mais antigas"
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* OVERLAY DE DETALHES */}
      <TransactionDetails
        isOpen={!!selectedTransactionId}
        onClose={() => setSelectedTransactionId(null)}
        transaction={selectedTransaction}
        categories={categories}
        accounts={accounts}
        onUpdate={updateTransaction}
        onDelete={openDeleteTransaction}
      />
    </div>
  );
}
