import { ReportingCoverageNotice } from "@/components/ui/reportingCoverage";
import { PrivacyBlur } from "@/components/ui/privacyBlur";
import { formatCurrency } from "@/utils/format";
import { CreditCard } from "lucide-react";

type AnnualCreditCardProps = import("@/types").AnnualSummaryResponse["creditCard"];

export function AnnualCreditCard({ totalSpent, subscriptionsTotal, monthlyAverage, coverage, observed }: AnnualCreditCardProps) {
  return (
    <div className="bg-bg-surface border border-border-divider rounded-3xl p-6 relative overflow-hidden flex flex-col h-full">
        <div className="flex items-center gap-2 mb-6 text-text-muted">
          <CreditCard className="w-5 h-5" />
          <h3 className="text-sm font-bold uppercase tracking-wider">Cartão de Crédito</h3>
        </div>
        
        <ReportingCoverageNotice coverage={coverage} observed={observed?{Consumo:observed.totalSpent,Assinaturas:observed.subscriptionsTotal,"Média":observed.monthlyAverage}:undefined}/>
        <div className="space-y-4 flex-1">
          <div className="flex flex-wrap gap-3 justify-between items-center border-b border-border-divider pb-3">
            <span className="text-text-main text-sm">Consumo líquido no ano (incluído no resultado)</span>
            <PrivacyBlur className="font-bold text-text-main">{totalSpent === null ? "Indisponível" : formatCurrency(totalSpent)}</PrivacyBlur>
          </div>
          <div className="flex flex-wrap gap-3 justify-between items-center border-b border-border-divider pb-3">
            <span className="text-text-main text-sm">Assinaturas Anuais</span>
            <PrivacyBlur className="font-bold text-text-main">{subscriptionsTotal === null ? "Indisponível" : formatCurrency(subscriptionsTotal)}</PrivacyBlur>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3 justify-between items-center pt-4 mt-auto">
            <span className="text-text-muted text-[10px] uppercase font-bold tracking-wider">Média mensal</span>
            <PrivacyBlur className="font-bold text-text-muted">{monthlyAverage === null ? "Indisponível" : formatCurrency(monthlyAverage)}</PrivacyBlur>
        </div>
    </div>
  );
}
