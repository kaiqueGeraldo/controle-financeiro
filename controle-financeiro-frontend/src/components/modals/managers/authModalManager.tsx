"use client";

import { useAuthModals } from "@/contexts/modals/authModalContext";
import { useAuth } from "@/hooks/useAuth";
import { ConfirmationModal } from "@/components/modals/confirmModal";

export function AuthModalManager() {
  const { isLogoutOpen, isSessionExpired, closeLogout, closeSessionExpired } = useAuthModals();
  const { handleLogout } = useAuth();

  const handleCloseSession = () => {
    closeSessionExpired();
    handleLogout();
  };

  return (
    <>
      {isSessionExpired && (
        <ConfirmationModal
          isOpen={true}
          onClose={handleCloseSession}
          onConfirm={handleCloseSession}
          title="Sessão Expirada"
          message="Por medidas de segurança, sua sessão foi encerrada. Por favor, faça login novamente para continuar."
          confirmText="Ir para o Login"
          confirmColor="bg-emerald-600 hover:bg-emerald-700 text-white"
          hideCancel={true}
        />
      )}

      <ConfirmationModal
        isOpen={isLogoutOpen}
        onClose={closeLogout}
        onConfirm={() => handleLogout(() => closeLogout())}
        title="Sair da Conta"
        message="Deseja realmente sair do Controle Financeiro?"
        confirmText="Sair"
        confirmColor="bg-rose-600 hover:bg-rose-700 text-white"
      />
    </>
  );
}