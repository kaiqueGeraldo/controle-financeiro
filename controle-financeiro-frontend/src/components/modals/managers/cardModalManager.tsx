"use client";

import { useCardModals } from "@/contexts/modals/cardModalContext";
import { useFinanceData } from "@/hooks/useFinanceData";
import { cardService } from "@/services/cardService";
import { NewCardModal } from "@/components/forms/newCardModal";
import { NewCardTransactionModal } from "@/components/forms/newCardTransactionModal";
import { PayInvoiceModal } from "@/components/forms/payInvoiceModal";
import { ConfirmationModal } from "@/components/modals/confirmModal";

export function CardModalManager() {
  const modals = useCardModals();
  const finance = useFinanceData();

  const handleCardsRefresh = () => {
    window.dispatchEvent(new Event("refreshCards"));
    finance.refresh();
  };

  return (
    <>
      <NewCardModal
        isOpen={modals.isNewCardOpen}
        onClose={modals.closeNewCard}
        onSuccess={handleCardsRefresh}
      />

      <NewCardTransactionModal
        isOpen={modals.newCardTransactionCardId !== undefined}
        onClose={modals.closeNewCardTransaction}
        onSuccess={handleCardsRefresh}
        categories={finance.categories}
        defaultCardId={modals.newCardTransactionCardId}
      />

      <PayInvoiceModal
        isOpen={!!modals.payInvoiceData}
        onClose={modals.closePayInvoice}
        onSuccess={handleCardsRefresh}
        cardId={modals.payInvoiceData?.card?.id || ""}
        cardName={modals.payInvoiceData?.card?.name || ""}
        accounts={finance.accounts}
        currentInvoiceValue={modals.payInvoiceData?.invoiceTotal || 0}
        month={modals.payInvoiceData?.month || 1}
        year={modals.payInvoiceData?.year || 2024}
      />

      <ConfirmationModal
        isOpen={!!modals.cardToDeleteId}
        onClose={modals.closeDeleteCard}
        title="Excluir Cartão"
        message="Tem certeza? Todas as faturas e compras vinculadas a este cartão serão apagadas permanentemente. Isso impactará seu extrato e planejamento."
        onConfirm={async () => {
          if (modals.cardToDeleteId) {
            await cardService.delete(modals.cardToDeleteId);
            handleCardsRefresh();
            modals.closeDeleteCard();
          }
        }}
      />
    </>
  );
}