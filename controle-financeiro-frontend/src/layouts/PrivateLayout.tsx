"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/sidebar/sidebar";
import { SidebarTopbarMobile } from "@/components/sidebar/topbarMobile";
import { useSidebar } from "@/hooks/useSidebar";
import { AuthModalManager } from "@/components/modals/managers/authModalManager";
import { TransactionModalManager } from "@/components/modals/managers/transactionModalManager";
import { AccountModalManager } from "@/components/modals/managers/accountModalManager";
import { CardModalManager } from "@/components/modals/managers/cardModalManager";
import { PlanningModalManager } from "@/components/modals/managers/planningModalManager";
import { GoalModalManager } from "@/components/modals/managers/goalModalManager";
import { InvestmentModalManager } from "@/components/modals/managers/investmentModalManager";
import { HabitModalManager } from "@/components/modals/managers/habitModalManager";

export default function PrivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { scrollContainerRef } = useSidebar();

  const DomainModalManagers = () => (
    <>
      <AuthModalManager />
      <TransactionModalManager />
      <AccountModalManager />
      <CardModalManager />
      <PlanningModalManager />
      <GoalModalManager />
      <InvestmentModalManager />
      <HabitModalManager />
    </>
  );

  if (pathname === "/configuracoes") {
    return (
      <>
        {children}
        <DomainModalManagers />
      </>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-bg-base">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 relative">
        <SidebarTopbarMobile />
        <main
          ref={scrollContainerRef}
          className="flex-1 overflow-auto custom-scroll relative"
        >
          {children}
        </main>
      </div>
      <DomainModalManagers />
    </div>
  );
}
