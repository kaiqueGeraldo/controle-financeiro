import { useUser } from "@/hooks/useUser";
import { userService } from "@/services/userService";
import { Eye, EyeOff, LogOut, Settings } from "lucide-react";
import { useRouter } from "next/navigation";

interface SidebarFooterProps {
  onLogout: () => void;
}

export function SidebarFooter({ onLogout }: SidebarFooterProps) {
  const router = useRouter();
  const { user, refetchUser } = useUser();

  const handleTogglePrivacy = async () => {
    if (!user) return;
    try {
      await userService.updatePreferences({ privacyMode: !user.privacyMode });
      await refetchUser();
    } catch (error) {
      console.error("Erro ao alterar modo privacidade", error);
    }
  };

  return (
    <div className="p-4 border-t border-border-divider mt-auto">
      <div className="flex flex-col gap-1">
        
        <button
          onClick={handleTogglePrivacy}
          className="flex items-center justify-between px-4 py-3 text-text-muted hover:text-text-main hover:bg-bg-surface-hover/50 rounded-xl transition-colors w-full cursor-pointer"
        >
          <div className="flex items-center gap-3">
            {user?.privacyMode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            <span>Privacidade</span>
          </div>
          <div className={`w-8 h-4 rounded-full flex items-center transition-colors px-0.5 ${user?.privacyMode ? 'bg-emerald-500' : 'bg-zinc-700'}`}>
             <div className={`w-3 h-3 rounded-full bg-white transition-transform ${user?.privacyMode ? 'translate-x-4' : 'translate-x-0'}`}></div>
          </div>
        </button>

        <button
          onClick={() => router.push("/configuracoes")}
          className="flex items-center gap-3 px-4 py-3 text-text-muted hover:text-text-main hover:bg-bg-surface-hover/50 rounded-xl transition-colors w-full text-left cursor-pointer"
        >
          <Settings className="w-5 h-5" />
          <span>Configurações</span>
        </button>
        
        <button
          onClick={onLogout}
          className="flex items-center gap-3 px-4 py-3 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-colors w-full text-left cursor-pointer"
        >
          <LogOut className="w-5 h-5" />
          <span>Sair da Conta</span>
        </button>
      </div>
    </div>
  );
}