import { ReportingCoverageNotice } from "@/components/ui/reportingCoverage";
import { PrivacyBlur } from "@/components/ui/privacyBlur";
import { formatCurrency } from "@/utils/format";
import { Wallet } from "lucide-react";

interface AnnualBalanceProps {
  coverage?:import("@/types").ReportingCoverage; observed?:import("@/types").ObservedTotals;
  totalIncome: number | null;
  totalExpense: number | null;
  annualBalance: number | null;
  investmentResult?: number | null;
}

export function AnnualBalance({
  totalIncome,
  totalExpense,
  annualBalance,
  investmentResult, coverage, observed,
}: AnnualBalanceProps) {
  return (
    <div className="bg-bg-surface border border-border-divider rounded-3xl p-6 md:p-8 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center gap-2 text-text-muted">
          <Wallet className="w-5 h-5" />
          <h3 className="text-sm font-bold uppercase tracking-wider">
            Resultado gerencial do ano
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 relative z-10">
        {investmentResult !== undefined && <div className="bg-bg-base/50 p-4 rounded-2xl border border-border-divider/50">
          <p className="text-text-muted text-xs mb-1 uppercase font-bold">Ganho/perda realizados de investimentos</p>
          <PrivacyBlur className="text-xl font-bold text-text-main">
            {investmentResult === null ? "Indisponível" : formatCurrency(investmentResult)}
          </PrivacyBlur>
        </div>}
        <div className="bg-bg-base/50 p-4 rounded-2xl border border-border-divider/50">
          <p className="text-text-muted text-xs mb-1 uppercase font-bold">
            Receitas realizadas
          </p>
          <PrivacyBlur className="text-xl font-bold text-emerald-500">
            {totalIncome === null ? "Indisponível" : formatCurrency(totalIncome)}
          </PrivacyBlur>
        </div>
        <div className="bg-bg-base/50 p-4 rounded-2xl border border-border-divider/50">
          <p className="text-text-muted text-xs mb-1 uppercase font-bold">
            Consumo e encargos
          </p>
          <PrivacyBlur className="text-xl font-bold text-rose-500">
            {totalExpense === null ? "Indisponível" : formatCurrency(totalExpense)}
          </PrivacyBlur>
        </div>
        <div className="bg-bg-base/50 p-4 rounded-2xl border border-border-divider/50">
          <p className="text-text-muted text-xs mb-1 uppercase font-bold">
            Resultado do período
          </p>
          <PrivacyBlur
            className={`text-xl font-bold ${annualBalance === null || annualBalance >= 0 ? "text-blue-400" : "text-rose-400"}`}
          >
            {annualBalance === null ? "Indisponível" : formatCurrency(annualBalance)}
          </PrivacyBlur>
        </div>
      </div>
      <ReportingCoverageNotice coverage={coverage} observed={observed?{Receitas:observed.income,Consumo:observed.expense,Resultado:observed.balance,"Ganho/perda":observed.investmentResult}:undefined}/>
      <p className="mt-4 text-xs text-text-muted">Abertura, transferências e principal investido não são resultado. Lançamentos legados de origem desconhecida exigem reconciliação.</p>
    </div>
  );
}
