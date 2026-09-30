"use client";

import { NewTransactionModal } from "@/components/forms/newTransactionModal";
import { ConfirmationModal } from "@/components/modals/confirmModal";
import { useTransactionModals } from "@/contexts/modals/transactionModalContext";
import { useFinanceData } from "@/hooks/useFinanceData";
import { transactionService } from "@/services/transactionService";

export function TransactionModalManager() {
  const modals = useTransactionModals();
  const finance = useFinanceData();

  return (
    <>
      {modals.isNewTransactionOpen && <NewTransactionModal
        isOpen={modals.isNewTransactionOpen}
        onClose={modals.closeNewTransaction}
        onSuccess={finance.refresh}
        accounts={finance.accounts}
        categories={finance.categories}
      />}

      <ConfirmationModal
        isOpen={!!modals.transactionToDeleteId}
        onClose={modals.closeDeleteTransaction}
        title="Excluir Transação"
        message="Cancelar libera a intenção pendente. Baixas já realizadas permanecem no histórico e devem ser estornadas separadamente."
        onConfirm={async () => {
          if (modals.transactionToDeleteId) {
            await transactionService.delete(modals.transactionToDeleteId);
            finance.refresh();
            modals.closeDeleteTransaction();
            window.dispatchEvent(new Event("refreshExtract"));
          }
        }}
      />
    </>
  );
}
