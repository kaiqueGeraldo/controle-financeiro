import { useFinanceContext } from "@/contexts/financeContext";

export function useFinanceData() {
  return useFinanceContext();
}