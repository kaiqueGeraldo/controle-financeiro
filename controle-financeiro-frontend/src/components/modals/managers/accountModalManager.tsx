"use client";

import { useAccountModals } from "@/contexts/modals/accountModalContext";
import { useFinanceData } from "@/hooks/useFinanceData";
import { ManageAccountsModal } from "@/components/forms/manageAccountsModal";

export function AccountModalManager() {
  const { isManageAccountOpen, closeManageAccount } = useAccountModals();
  const { refresh } = useFinanceData();

  return (
    <ManageAccountsModal
      isOpen={isManageAccountOpen}
      onClose={closeManageAccount}
      onUpdate={refresh}
    />
  );
}