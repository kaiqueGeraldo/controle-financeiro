import {
  Bell,
  Download,
  Eye, EyeOff,
  Lock,
  LogOut,
  Mail,
  Moon,
  Smartphone,
  Sun,
  Tag,
  Trash2
} from "lucide-react";
import { ConfigItem, Toggle } from "./configItem";

// --- PREFERÊNCIAS ---
export function PreferencesSection({ 
    privacyMode, darkMode, onTogglePrivacy, onToggleDark, onConfigDashboard, onManageCategories, pendingPreference,
}: {
  privacyMode: boolean; darkMode: boolean; onTogglePrivacy: () => void; onToggleDark: () => void;
  onConfigDashboard: () => void; onManageCategories: () => void;
  pendingPreference: "privacyMode" | "darkMode" | "notifContas" | "notifSemanal" | null;
}) {
  return (
    <section>
      <h2 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-3 ml-1">Preferências</h2>
      <div className="flex flex-col">
        <ConfigItem 
          icon={privacyMode ? <EyeOff size={20} /> : <Eye size={20} />}
          title="Modo Privacidade"
          description="Ocultar valores monetários na interface"
          rightElement={<Toggle label="Modo Privacidade" isOn={privacyMode} onToggle={onTogglePrivacy} disabled={pendingPreference === "privacyMode"} />}
        />
        <ConfigItem 
          icon={darkMode ? <Moon size={20} /> : <Sun size={20} />}
          title="Tema Escuro"
          description="Alternar entre modo claro e escuro"
          rightElement={<Toggle label="Tema Escuro" isOn={darkMode} onToggle={onToggleDark} disabled={pendingPreference === "darkMode"} />}
        />
        <ConfigItem 
          icon={<Tag size={20} />}
          title="Gerenciar Categorias"
          description="Personalize cores, ícones e nomes"
          onClick={onManageCategories}
        />
        <ConfigItem 
          icon={<Smartphone size={20} />}
          title="Configurar Dashboard"
          description="Escolha quais cards aparecem na tela inicial"
          onClick={onConfigDashboard}
        />
      </div>
    </section>
  );
}

// --- NOTIFICAÇÕES ---
export function NotificationsSection({ 
    notifContas, notifSemanal, onToggleContas, onToggleSemanal, pendingPreference,
}: {
  notifContas: boolean; notifSemanal: boolean; onToggleContas: () => void; onToggleSemanal: () => void;
  pendingPreference: "privacyMode" | "darkMode" | "notifContas" | "notifSemanal" | null;
}) {
  return (
    <section>
      <h2 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-3 ml-1">Notificações</h2>
      <div className="flex flex-col">
        <ConfigItem 
          icon={<Bell size={20} />} title="Lembretes de Contas" description="Receber alerta por e-mail um dia antes do vencimento"
          rightElement={<Toggle label="Lembretes de Contas" isOn={notifContas} onToggle={onToggleContas} disabled={pendingPreference === "notifContas"} />}
        />
        <ConfigItem 
          icon={<Mail size={20} />} title="Resumo Semanal" description="Receber relatório por e-mail toda segunda"
          rightElement={<Toggle label="Resumo Semanal" isOn={notifSemanal} onToggle={onToggleSemanal} disabled={pendingPreference === "notifSemanal"} />}
        />
      </div>
    </section>
  );
}

// --- SEGURANÇA E CONTA ---
export function SecuritySection({ 
    onChangePassword, onExportData, onLogout, onDeleteAccount, isExporting,
}: {
  onChangePassword: () => void; onExportData: () => void; onLogout: () => void; onDeleteAccount: () => void;
  isExporting: boolean;
}) {
  return (
    <>
      <section>
        <h2 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-3 ml-1">Dados e Segurança</h2>
        <div className="flex flex-col">
          <ConfigItem icon={<Lock size={20} />} title="Alterar Senha" description="Atualize sua senha de acesso" onClick={onChangePassword} />
          <ConfigItem icon={<Download size={20} />} title="Exportar Dados" description={isExporting ? "Gerando extrato em Excel..." : "Baixar extrato completo em Excel"} onClick={onExportData} disabled={isExporting} />
        </div>
      </section>

      <section>
        <h2 className="text-sm font-bold text-rose-500/70 uppercase tracking-wider mb-3 ml-1">Conta</h2>
        <div className="flex flex-col">
          <ConfigItem icon={<LogOut size={20} />} title="Sair da Conta" onClick={onLogout} isDanger />
          <ConfigItem icon={<Trash2 size={20} />} title="Excluir Minha Conta" description="Esta ação é permanente e irreversível" onClick={onDeleteAccount} isDanger />
        </div>
      </section>
    </>
  );
}
