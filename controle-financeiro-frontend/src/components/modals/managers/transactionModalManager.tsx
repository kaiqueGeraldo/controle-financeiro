"use client";

import { useTransactionModals } from "@/contexts/modals/transactionModalContext";
import { useFinanceData } from "@/hooks/useFinanceData";
import { transactionService } from "@/services/transactionService";
import { NewTransactionModal } from "@/components/forms/newTransactionModal";
import { ConfirmationModal } from "@/components/modals/confirmModal";

export function TransactionModalManager() {
  const modals = useTransactionModals();
  const finance = useFinanceData();

  return (
    <>
      <NewTransactionModal
        isOpen={modals.isNewTransactionOpen}
        onClose={modals.closeNewTransaction}
        onSuccess={finance.refresh}
        accounts={finance.accounts}
        categories={finance.categories}
      />

      <ConfirmationModal
        isOpen={!!modals.transactionToDeleteId}
        onClose={modals.closeDeleteTransaction}
        title="Excluir Transação"
        message="Tem certeza? O valor será estornado do seu saldo atual."
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