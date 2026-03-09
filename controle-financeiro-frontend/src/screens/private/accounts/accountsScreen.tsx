"use client";

import { useState } from "react";
import {
  Plus,
  Loader2,
  ArrowUpDown,
  Wallet,
  Banknote,
  Building2,
  PiggyBank,
} from "lucide-react";
import { useSidebar } from "@/hooks/useSidebar";
import { useFinanceData } from "@/hooks/useFinanceData";
import { useRouter } from "next/navigation";
import { AccountCard } from "@/components/screens/accounts/accountCard";
import { AccountsSummary } from "@/components/screens/accounts/accountsSummary";
import { ConfirmationModal } from "@/components/modals/confirmModal";
import { accountService } from "@/services/accountService";
import { useUser } from "@/hooks/useUser";
import { useInvestments } from "@/hooks/useInvestments";
import { Account } from "@/types";
import { EditAccountModal } from "@/components/forms/editAccountModal";
import { ReorderModal } from "@/components/forms/reorderModal";
import { useToast } from "@/contexts/toastContext";
import { useDashboard } from "@/hooks/useDashboard";
import { useAccountModals } from "@/contexts/modals/accountModalContext";

export default function AccountsScreen() {
  const router = useRouter();
  const { user } = useUser();
  const { scrolled } = useSidebar();
  const { refreshDashboard } = useDashboard();
  const { accounts, isLoading, saldoTotal, refresh } = useFinanceData();
  const { openManageAccount } = useAccountModals();
  const [accountToDelete, setAccountToDelete] = useState<string | null>(null);
  const [accountToEdit, setAccountToEdit] = useState<Account | null>(null);
  const { totalInvestido } = useInvestments();
  const [isReorderOpen, setIsReorderOpen] = useState(false);
  const toast = useToast();

  const totalCorrente = accounts
    .filter((a) => a.type === "CHECKING" || a.type === "CASH")
    .reduce((acc, curr) => acc + curr.balance, 0);

  const total = saldoTotal + totalInvestido;

  return (
    <div className="min-h-screen bg-bg-base font-sans text-text-main pb-20">
      {/* HEADER */}
      <header className="sticky top-0 z-30 bg-bg-base/90 backdrop-blur-md py-6 border-b border-border-divider transition-all">
        <div className="px-6 md:px-8 max-w-5xl mx-auto flex justify-between items-center gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">
              Minhas Contas
            </h1>
            <p className="text-text-muted text-sm hidden md:block mt-0.5">
              Gerencie onde seu dinheiro está guardado.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {accounts.length > 1 && (
              <button
                onClick={() => setIsReorderOpen(true)}
                className="p-2.5 md:px-4 md:py-2.5 flex items-center justify-center gap-2 bg-bg-surface hover:bg-bg-surface-hover border border-border-divider text-text-main rounded-xl font-bold text-sm transition shadow-sm cursor-pointer"
                title="Organizar Contas"
              >
                <ArrowUpDown size={18} />
                <span className="hidden md:inline">Organizar</span>
              </button>
            )}
            <button
              onClick={openManageAccount}
              className="p-2.5 md:px-4 md:py-2.5 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm transition shadow-lg shadow-emerald-900/20 active:scale-95 cursor-pointer"
              title="Nova Conta"
            >
              <Plus size={18} />
              <span className="hidden md:inline">Nova Conta</span>
            </button>
          </div>
        </div>
      </header>

      {/* CONTEÚDO */}
      <main className="px-6 md:px-8 max-w-5xl mx-auto mt-6">
        {/* RESUMO */}
        <AccountsSummary
          total={total}
          checking={totalCorrente}
          invested={totalInvestido}
        />

        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-bold text-text-muted uppercase tracking-wider">
            Contas Ativas
          </h2>
        </div>

        {/* GRID DE CONTAS */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map((acc) => (
              <AccountCard
                key={acc.id}
                account={acc}
                isHidden={user?.privacyMode || false}
                onClick={() => router.push(`/extrato?accountId=${acc.id}`)}
                onDelete={(id) => setAccountToDelete(id)}
                onEdit={(account) => setAccountToEdit(account)}
              />
            ))}

            {/* Botão de Adicionar */}
            <button
              onClick={openManageAccount}
              className="group border border-dashed border-border-divider hover:border-emerald-500/30 hover:bg-emerald-500/5 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 text-text-muted hover:text-emerald-500 transition-all cursor-pointer min-h-40"
            >
              <div className="w-12 h-12 rounded-xl bg-bg-surface border border-border-divider group-hover:border-emerald-500/30 flex items-center justify-center transition-colors">
                <Plus size={24} />
              </div>
              <span className="font-medium text-xs uppercase tracking-wide">
                Nova Conta
              </span>
            </button>
          </div>
        )}
      </main>

      {/* Modal de Exclusão de Conta */}
      <ConfirmationModal
        isOpen={!!accountToDelete}
        onClose={() => setAccountToDelete(null)}
        title="Excluir Conta"
        message="Tem certeza que deseja excluir esta conta? Excluir uma conta vinculada a transações antigas pode gerar inconsistências no seu Balanço e Extrato."
        confirmText="Excluir Conta"
        confirmColor="bg-rose-600 hover:bg-rose-700 text-white"
        onConfirm={async () => {
          if (accountToDelete) {
            try {
              await accountService.delete(accountToDelete);
              setAccountToDelete(null);
              refresh();
              refreshDashboard(true);
            } catch (error: any) {
              toast.error(error.message || "Erro ao excluir conta.");
            }
          }
        }}
      />

      {/* Modal de Edição de Conta */}
      <EditAccountModal
        isOpen={!!accountToEdit}
        onClose={() => setAccountToEdit(null)}
        onSuccess={refresh}
        account={accountToEdit}
      />

      <ReorderModal
        isOpen={isReorderOpen}
        onClose={() => setIsReorderOpen(false)}
        title="Organizar Contas"
        items={accounts}
        onSave={async (ids) => {
          await accountService.reorder(ids);
          refresh();
        }}
        renderItem={(acc) => (
          <div className="flex items-center gap-3">
            <div className="p-2 bg-bg-surface-hover rounded-lg text-text-muted">
              {acc.type === "CASH" ? (
                <Banknote size={16} />
              ) : acc.type === "INVESTMENT" ? (
                <Building2 size={16} />
              ) : acc.type === "SAVINGS" ? (
                <PiggyBank size={16} />
              ) : (
                <Wallet size={16} />
              )}
            </div>
            <p className="font-bold text-sm text-text-main truncate">
              {acc.name}
            </p>
          </div>
        )}
      />
    </div>
  );
}
