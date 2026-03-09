import { useSidebar } from "@/hooks/useSidebar";
import { Menu } from "lucide-react";

export function SidebarTopbarMobile() {
  const { setSidebarOpen, scrolled } = useSidebar();

  return (
    <div
      className={`md:hidden shrink-0 w-full flex items-center justify-between px-6 py-3 relative z-40 transition-all duration-300 ease-in-out ${
        scrolled
          ? "bg-bg-base/80 backdrop-blur-xl border-b border-border-divider shadow-[0_4px_20px_-10px_rgba(0,0,0,0.15)]"
          : "bg-bg-base border-b border-transparent"
      }`}
    >
      <div className="flex items-center gap-3">
        <button
          className="p-2 -ml-2 rounded-xl text-text-main bg-bg-surface border border-border-divider shadow-sm hover:text-emerald-500 hover:border-emerald-500/50 active:scale-95 transition-all cursor-pointer"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="w-5 h-5" />
        </button>
        
        <div className="flex items-center gap-2">
            <span className="text-text-main text-lg font-bold tracking-tight">Controle Financeiro</span>
        </div>
      </div>
    </div>
  );
}