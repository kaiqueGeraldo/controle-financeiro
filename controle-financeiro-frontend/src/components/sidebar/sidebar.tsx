"use client";

import { OverlayMobile } from "./overlayMobile";
import { SidebarUserProfile } from "./userProfile";
import { SidebarNavLinks } from "./navLinks";
import { SidebarFooter } from "./footer";
import { useSidebar } from "@/hooks/useSidebar";
import { useAuthModals } from "@/contexts/modals/authModalContext";
export function Sidebar() {
  const { sidebarOpen, setSidebarOpen } = useSidebar();
  const { openLogout } = useAuthModals();
  
  return (
    <>
      {sidebarOpen && <OverlayMobile onClose={() => setSidebarOpen(false)} />}

      <aside
        className={`
          fixed md:relative z-50 md:z-40 h-full w-72 
          bg-bg-surface border-r border-border-divider
          flex flex-col transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        {/* Perfil no Topo */}
        <SidebarUserProfile />

        {/* Links de Navegação */}
        <div className="flex-1 overflow-y-auto custom-scroll py-2">
          <SidebarNavLinks />
        </div>

        {/* Footer com Config e Logout */}
        <SidebarFooter onLogout={() => openLogout()} />
      </aside>
    </>
  );
}