"use client";

import React, { useState } from "react";
import { Plus, Receipt, Loader2, CreditCard, ArrowUpDown } from "lucide-react";
import { useCards } from "@/hooks/useCards";
import { NewCardTransactionModal } from "@/components/forms/newCardTransactionModal";
import { PayInvoiceModal } from "@/components/forms/payInvoiceModal";
import { CreditCardItem } from "@/components/screens/cards/creditCardItem";
import { InvoiceDetails } from "@/components/screens/cards/invoiceDetails";
import { CardsSummary } from "@/components/screens/cards/cardsSummary";
import { cardService } from "@/services/cardService";
import { ConfirmationModal } from "@/components/modals/confirmModal";
import { ReorderModal } from "@/components/forms/reorderModal";
import { useCardModals } from "@/contexts/modals/cardModalContext";

export default function CartoesScreen() {
  const { openNewCard } = useCardModals();

  const {
    cards,
    accounts,
    categories,
    isLoading,
    summary,
    selectedCardId,
    selectedCard,
    invoiceDetails,
    isInvoiceLoading,
    viewDateFormatted,
    viewDate,
    selectCard,
    closeCardDetails,
    changeMonth,
    deleteCard,
    updateCardLimit,
    refreshAll,
    canGoBack,
    canGoForward,
  } = useCards();

  const [isTransactionOpen, setIsTransactionOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(
    null,
  );
  const [cardToDelete, setCardToDelete] = useState<string | null>(null);
  const [isReorderOpen, setIsReorderOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg-base">
        <Loader2 className="animate-spin text-emerald-500 w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-base text-text-main pb-20 font-sans">
      {/* HEADER */}
      <header className="sticky top-0 z-30 bg-bg-base/90 backdrop-blur-md py-6 border-b border-border-divider transition-all">
        <div className="px-6 md:px-8 max-w-5xl mx-auto flex justify-between items-center gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">Carteira</h1>
            <p className="text-text-muted text-sm hidden md:block mt-0.5">
              Gestão de crédito e faturas.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {cards.length > 1 && (
              <button
                onClick={() => setIsReorderOpen(true)}
                className="p-2.5 md:px-4 md:py-2.5 flex items-center justify-center gap-2 bg-bg-surface hover:bg-bg-surface-hover border border-border-divider text-text-main rounded-xl font-bold text-sm transition shadow-sm cursor-pointer"
                title="Organizar Cartões"
              >
                <ArrowUpDown size={18} />
                <span className="hidden lg:inline">Organizar</span>
              </button>
            )}
            {cards.length > 0 && (
              <button
                onClick={() => setIsTransactionOpen(true)}
                className="p-2.5 md:px-4 md:py-2.5 flex items-center justify-center gap-2 bg-bg-surface hover:bg-bg-surface-hover border border-border-divider text-text-main rounded-xl font-bold text-sm transition shadow-sm cursor-pointer"
                title="Lançar Compra"
              >
                <Receipt size={18} />
                <span className="hidden md:inline">Lançar Compra</span>
              </button>
            )}
            <button
              onClick={openNewCard}
              className="p-2.5 md:px-4 md:py-2.5 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm transition shadow-lg shadow-emerald-900/20 active:scale-95 cursor-pointer"
              title="Novo Cartão"
            >
              <Plus size={18} />
              <span className="hidden md:inline">Novo Cartão</span>
            </button>
          </div>
        </div>
      </header>

      {/* CONTEÚDO */}
      <main className="px-6 md:px-8 max-w-5xl mx-auto mt-6">
        {/* RESUMO */}
        <CardsSummary
          totalLimit={summary.totalLimit}
          totalInvoice={summary.totalInvoice}
          available={summary.available}
        />

        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-bold text-text-muted uppercase tracking-wider">
            Cartões Ativos
          </h2>
        </div>

        {/* GRID DE CARTÕES */}
        {cards.length === 0 ? (
          <div className="text-center py-20 flex flex-col items-center border-2 border-dashed border-zinc-900 rounded-3xl bg-bg-base/50">
            <div className="w-16 h-16 bg-bg-surface rounded-full flex items-center justify-center mb-4">
              <CreditCard className="w-8 h-8 text-zinc-700" />
            </div>
            <p className="text-text-muted font-medium">
              Nenhum cartão cadastrado.
            </p>
            <p className="text-text-muted text-sm mt-1">
              Adicione seu primeiro cartão para controlar faturas.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cards.map((cartao) => (
              <CreditCardItem
                key={cartao.id}
                card={cartao}
                onClick={selectCard}
              />
            ))}
          </div>
        )}
      </main>

      {/* MODAL DETALHES */}
      <InvoiceDetails
        isOpen={!!selectedCardId}
        onClose={closeCardDetails}
        canGoBack={canGoBack}
        canGoForward={canGoForward}
        card={selectedCard}
        invoiceData={invoiceDetails}
        isLoadingInvoice={isInvoiceLoading}
        viewDateFormatted={viewDateFormatted}
        onChangeMonth={changeMonth}
        onPay={() => setIsPayModalOpen(true)}
        categories={categories}
        onUpdateTransaction={async (id, data) => {
          await cardService.updateTransaction(id, data);
          refreshAll();
        }}
        onDeleteTransaction={async (id) => setTransactionToDelete(id)}
        onDelete={() => setCardToDelete(selectedCardId)}
        onUpdateLimit={(limit) => updateCardLimit(selectedCardId!, limit)}
      />

      {/* MODAIS DE AÇÃO */}

      <NewCardTransactionModal
        isOpen={isTransactionOpen}
        onClose={() => setIsTransactionOpen(false)}
        onSuccess={refreshAll}
        categories={categories}
        defaultCardId={selectedCardId || undefined}
      />

      {selectedCard && (
        <PayInvoiceModal
          isOpen={isPayModalOpen}
          onClose={() => setIsPayModalOpen(false)}
          onSuccess={refreshAll}
          cardId={selectedCard.id}
          cardName={selectedCard.name}
          accounts={accounts}
          currentInvoiceValue={invoiceDetails?.totalAmount || 0}
          month={viewDate.getMonth() + 1}
          year={viewDate.getFullYear()}
        />
      )}

      {/* Modal: Excluir Compra */}
      <ConfirmationModal
        isOpen={!!transactionToDelete}
        onClose={() => setTransactionToDelete(null)}
        title="Excluir Compra"
        message="Tem certeza que deseja excluir esta compra? Se for uma compra parcelada, todas as parcelas futuras vinculadas a ela também serão excluídas e seu limite será recalculado."
        confirmText="Excluir"
        confirmColor="bg-rose-600 hover:bg-rose-700 text-text-main"
        onConfirm={async () => {
          if (transactionToDelete) {
            await cardService.deleteTransaction(transactionToDelete);
            refreshAll();
            setTransactionToDelete(null);
          }
        }}
      />

      {/* Modal: Excluir Cartão Inteiro */}
      <ConfirmationModal
        isOpen={!!cardToDelete}
        onClose={() => setCardToDelete(null)}
        title="Excluir Cartão"
        message="Tem certeza? Todas as faturas e compras vinculadas a este cartão serão apagadas permanentemente. Isso impactará seu extrato e planejamento."
        confirmText="Excluir"
        confirmColor="bg-rose-600 hover:bg-rose-700 text-text-main"
        onConfirm={async () => {
          if (cardToDelete) {
            await deleteCard(cardToDelete);
            setCardToDelete(null);
          }
        }}
      />

      <ReorderModal
        isOpen={isReorderOpen}
        onClose={() => setIsReorderOpen(false)}
        title="Organizar Cartões"
        items={cards}
        onSave={async (ids) => {
          await cardService.reorder(ids);
          refreshAll();
        }}
        renderItem={(card) => (
          <div className="flex items-center gap-3">
            <div className="p-2 bg-bg-surface-hover rounded-lg text-text-muted">
              <CreditCard size={16} style={{ color: card.color }} />
            </div>
            <div>
              <p className="font-bold text-sm text-text-main truncate leading-tight">
                {card.name}
              </p>
              <p className="text-[10px] text-text-muted tracking-widest mt-0.5">
                •••• {card.last4Digits}
              </p>
            </div>
          </div>
        )}
      />
    </div>
  );
}
