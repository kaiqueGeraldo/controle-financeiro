"use client";

import { NewAssetModal } from "@/components/forms/newAssetModal";
import { OperationModal } from "@/components/forms/operationModal";
import { useInvestmentsContext } from "@/contexts/investmentsContext";
import { useInvestmentModals } from "@/contexts/modals/investmentModalContext";

export function InvestmentModalManager() {
  const modals = useInvestmentModals();
  const { refreshInvestments } = useInvestmentsContext();

  return (
    <>
      <NewAssetModal
        isOpen={modals.isNewAssetOpen}
        onClose={modals.closeNewAsset}
        onSuccess={refreshInvestments}
      />
      <OperationModal
        isOpen={!!modals.operationAsset}
        onClose={modals.closeOperation}
        asset={modals.operationAsset}
        onSuccess={refreshInvestments}
      />
    </>
  );
}