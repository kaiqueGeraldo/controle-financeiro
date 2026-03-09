import { Mail } from "lucide-react";
import { Usuario } from "@/models/usuarioModel";

interface ProfileSectionProps {
  user: Usuario | null;
  onEditClick: () => void;
}

export function ProfileSection({ user, onEditClick }: ProfileSectionProps) {
  return (
    <section>
      <h2 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-3 ml-1">Perfil</h2>
      <div className="bg-bg-surface border border-border-divider rounded-2xl p-6 flex items-center gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>

        <div className="relative w-20 h-20 rounded-full bg-bg-surface-hover border-2 border-border-divider flex items-center justify-center text-2xl font-bold text-text-main shrink-0">
          {user?.nome?.charAt(0).toUpperCase() || "U"}
        </div>
        
        <div className="flex-1 relative z-10 min-w-0">
          <h3 className="text-xl font-bold text-text-main truncate">{user?.nome || "Carregando..."}</h3>
          <div className="flex items-center gap-2 text-text-muted mt-1">
            <Mail size={14} className="shrink-0" />
            <span className="text-sm truncate">{user?.email || "..."}</span>
          </div>
          <button onClick={onEditClick} className="mt-3 text-sm text-emerald-500 font-bold hover:text-emerald-400 transition cursor-pointer">
            Editar informações
          </button>
        </div>
      </div>
    </section>
  );
}