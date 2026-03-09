"use client";

import { ReactNode } from "react";
import { ToastProvider } from "@/contexts/toastContext";
import { UserProvider } from "@/contexts/userContext";
import { SidebarProvider } from "@/contexts/sidebarContext";
import { FinanceProvider } from "@/contexts/financeContext";
import { GoalsProvider } from "@/contexts/goalsContext";
import { PlanningProvider } from "@/contexts/planningContext";
import { InvestmentsProvider } from "@/contexts/investmentsContext";
import { HabitsProvider } from "@/contexts/habitsContext";
import { DashboardProvider } from "@/contexts/dashboardContext";
import { AuthModalProvider } from "@/contexts/modals/authModalContext";
import { TransactionModalProvider } from "@/contexts/modals/transactionModalContext";
import { AccountModalProvider } from "@/contexts/modals/accountModalContext";
import { CardModalProvider } from "@/contexts/modals/cardModalContext";
import { PlanningModalProvider } from "@/contexts/modals/planningModalContext";
import { GoalModalProvider } from "@/contexts/modals/goalModalContext";
import { InvestmentModalProvider } from "@/contexts/modals/investmentModalContext";
import { HabitModalProvider } from "@/contexts/modals/habitModalContext";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <UserProvider>
        <SidebarProvider>

          <AuthModalProvider>
            <TransactionModalProvider>
              <AccountModalProvider>
                <CardModalProvider>
                  <PlanningModalProvider>
                    <GoalModalProvider>
                      <InvestmentModalProvider>
                        <HabitModalProvider>
                          
                          <FinanceProvider>
                            <DashboardProvider>
                              <GoalsProvider>
                                <PlanningProvider>
                                  <InvestmentsProvider>
                                    <HabitsProvider>
                                      {children}
                                    </HabitsProvider>
                                  </InvestmentsProvider>
                                </PlanningProvider>
                              </GoalsProvider>
                            </DashboardProvider>
                          </FinanceProvider>

                        </HabitModalProvider>
                      </InvestmentModalProvider>
                    </GoalModalProvider>
                  </PlanningModalProvider>
                </CardModalProvider>
              </AccountModalProvider>
            </TransactionModalProvider>
          </AuthModalProvider>
          
        </SidebarProvider>
      </UserProvider>
    </ToastProvider>
  );
}