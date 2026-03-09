"use client";

import { ManageAccountsModal } from "@/components/forms/manageAccountsModal";
import { useAccountModals } from "@/contexts/modals/accountModalContext";
import { useFinanceData } from "@/hooks/useFinanceData";

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