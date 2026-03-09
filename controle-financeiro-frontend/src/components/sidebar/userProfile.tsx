import { useUser } from "@/hooks/useUser";

export function SidebarUserProfile() {
  const { user } = useUser();
  const getInitials = (name: string) => name?.charAt(0).toUpperCase() || "U";

  return (
    <div className="px-6 py-8 flex items-center gap-4">
      <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 font-bold text-xl shadow-[0_0_15px_rgba(16,185,129,0.3)]">
        {getInitials(user?.nome || "")}
      </div>
      <div className="flex flex-col overflow-hidden">
        <h2 className="text-text-main font-bold text-lg truncate">
          {user?.nome || "Carregando..."}
        </h2>
        <span className="text-text-muted text-xs truncate">
          {user?.email || "..."}
        </span>
      </div>
    </div>
  );
}