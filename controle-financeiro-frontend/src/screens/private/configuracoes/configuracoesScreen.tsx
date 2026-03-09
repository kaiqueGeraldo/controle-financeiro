"use client";

import { ChangePasswordModal } from "@/components/forms/changePasswordModal";
import { ConfigDashboardModal } from "@/components/forms/configDashboardModal";
import { EditProfileModal } from "@/components/forms/editProfileModal";
import { ManageCategoriesModal } from "@/components/forms/manageCategoriesModal";
import { ConfirmationModal } from "@/components/modals/confirmModal";
import { ProfileSection } from "@/components/screens/configuracoes/profileSection";
import {
  NotificationsSection,
  PreferencesSection,
  SecuritySection,
} from "@/components/screens/configuracoes/settingsSections";
import { useAuthModals } from "@/contexts/modals/authModalContext";
import { useAuth } from "@/hooks/useAuth";
import { useSidebar } from "@/hooks/useSidebar";
import { useUser } from "@/hooks/useUser";
import { transactionService } from "@/services/transactionService";
import { userService } from "@/services/userService";
import { AlertCircle, ArrowLeft, CheckCircle2, Info } from "lucide-react";
import { useState } from "react";

export default function ConfiguracoesScreen() {
  const { user, refetchUser } = useUser();
  const { handleLogout } = useAuth();
  const { openLogout } = useAuthModals();
  const { scrolled } = useSidebar();

  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isChangePassOpen, setIsChangePassOpen] = useState(false);
  const [isDeleteAccOpen, setIsDeleteAccOpen] = useState(false);
  const [isManageCategoriesOpen, setIsManageCategoriesOpen] = useState(false);
  const [isConfigDashOpen, setIsConfigDashOpen] = useState(false);
  const [feedback, setFeedback] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const showFeedback = (
    message: string,
    type: "success" | "error" | "info",
  ) => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleTogglePreference = async (
    key: "privacyMode" | "darkMode" | "notifContas" | "notifSemanal",
  ) => {
    if (!user) return;
    try {
      const newVal = !user[key];
      await userService.updatePreferences({ [key]: newVal });
      await refetchUser();
      showFeedback("Preferência atualizada com sucesso!", "success");
    } catch (e) {
      showFeedback("Erro ao alterar preferência", "error");
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await userService.deleteAccount();
      handleLogout(() => {});
    } catch (error) {
      showFeedback(
        "Erro crítico ao excluir conta. Contate o suporte.",
        "error",
      );
    }
  };

  const handleExportData = async () => {
    showFeedback("Gerando planilha Excel, aguarde...", "info");
    try {
      const res = await transactionService.exportExcel();
      if (res?.data) {
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute(
          "download",
          `Extrato_KaiqueFinancas_${new Date().getTime()}.xlsx`,
        );
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);

        showFeedback("Planilha gerada com sucesso!", "success");
      }
    } catch (error) {
      console.error(error);
      showFeedback("Erro ao exportar a planilha. Tente novamente.", "error");
    }
  };

  const handleComingSoon = () =>
    showFeedback("Em breve nas próximas atualizações! 🚀", "info");

  return (
    <div className="min-h-screen bg-bg-base font-sans text-text-main pb-20">
      
      {/* HEADER PADRONIZADO COM BOTÃO VOLTAR */}
      <header
        className={`
          sticky top-0 z-30 transition-all duration-300 ease-in-out border-b border-border-divider
          ${scrolled ? "bg-bg-base/90 backdrop-blur-md py-3" : "bg-bg-base py-6"}
        `}
      >
        <div className="px-6 md:px-8 max-w-3xl mx-auto flex items-center gap-4">
          <button 
            onClick={() => window.history.back()}
            className="p-2 -ml-2 text-text-muted hover:text-text-main hover:bg-bg-surface-hover rounded-xl transition-colors cursor-pointer"
          >
             <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Ajustes</h1>
            <p className="text-text-muted text-sm hidden sm:block">Gerencie sua conta e preferências do app.</p>
          </div>
        </div>
      </header>

      <main className="px-6 md:px-8 max-w-3xl mx-auto mt-6 space-y-8">
        {/* COMPONENTE DE FEEDBACK INLINE */}
        {feedback && (
          <div
            className={`p-4 rounded-xl border flex items-start gap-3 transition-all animate-in fade-in slide-in-from-top-4 
            ${feedback.type === "success" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : ""}
            ${feedback.type === "error" ? "bg-rose-500/10 border-rose-500/20 text-rose-400" : ""}
            ${feedback.type === "info" ? "bg-blue-500/10 border-blue-500/20 text-blue-400" : ""}
          `}
          >
            {feedback.type === "success" && (
              <CheckCircle2 className="shrink-0 mt-0.5" size={18} />
            )}
            {feedback.type === "error" && (
              <AlertCircle className="shrink-0 mt-0.5" size={18} />
            )}
            {feedback.type === "info" && (
              <Info className="shrink-0 mt-0.5" size={18} />
            )}
            <p className="text-sm font-medium">{feedback.message}</p>
          </div>
        )}

        <ProfileSection
          user={user}
          onEditClick={() => setIsEditProfileOpen(true)}
        />

        <PreferencesSection
          privacyMode={user?.privacyMode || false}
          darkMode={user?.darkMode || false}
          onTogglePrivacy={() => handleTogglePreference("privacyMode")}
          onToggleDark={() => handleTogglePreference("darkMode")}
          onManageCategories={() => setIsManageCategoriesOpen(true)}
          onConfigDashboard={() => setIsConfigDashOpen(true)}
        />

        <NotificationsSection
          notifContas={user?.notifContas ?? true}
          notifSemanal={user?.notifSemanal ?? true}
          onToggleContas={() => handleTogglePreference("notifContas")}
          onToggleSemanal={() => handleTogglePreference("notifSemanal")}
        />

        <SecuritySection
          onChangePassword={() => setIsChangePassOpen(true)}
          onExportData={handleExportData}
          onLogout={openLogout}
          onDeleteAccount={() => setIsDeleteAccOpen(true)}
        />

        <div className="text-center pt-8 pb-4">
          <p className="text-text-muted text-xs">Kaique Finanças v1.0.0</p>
          <p className="text-zinc-700 text-[10px] mt-1">
            Feito com 💚 e Next.js
          </p>
        </div>
      </main>

      {/* MODAIS LOCAIS */}
      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
      />
      <ChangePasswordModal
        isOpen={isChangePassOpen}
        onClose={() => setIsChangePassOpen(false)}
      />
      <ManageCategoriesModal
        isOpen={isManageCategoriesOpen}
        onClose={() => setIsManageCategoriesOpen(false)}
      />
      <ConfigDashboardModal
        isOpen={isConfigDashOpen}
        onClose={() => setIsConfigDashOpen(false)}
      />
      <ConfirmationModal
        isOpen={isDeleteAccOpen}
        onClose={() => setIsDeleteAccOpen(false)}
        onConfirm={handleDeleteAccount}
        title="Excluir Conta"
        message="ATENÇÃO: Todos os seus dados, cartões, extratos e metas serão apagados permanentemente. Esta ação não tem volta."
        confirmText="Excluir Conta"
        confirmColor="bg-rose-600 hover:bg-rose-700 text-text-main"
      />
    </div>
  );
}
