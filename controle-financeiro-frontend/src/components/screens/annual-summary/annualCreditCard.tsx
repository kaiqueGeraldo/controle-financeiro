import { CreditCard } from "lucide-react";
import { formatCurrency } from "@/utils/format";
import { PrivacyBlur } from "@/components/ui/privacyBlur";

interface AnnualCreditCardProps {
  totalSpent: number;
  subscriptionsTotal: number;
  monthlyAverage: number;
}

export function AnnualCreditCard({ totalSpent, subscriptionsTotal, monthlyAverage }: AnnualCreditCardProps) {
  return (
    <div className="bg-bg-surface border border-border-divider rounded-3xl p-6 relative overflow-hidden flex flex-col h-full">
        <div className="flex items-center gap-2 mb-6 text-text-muted">
          <CreditCard className="w-5 h-5" />
          <h3 className="text-sm font-bold uppercase tracking-wider">Cartão de Crédito</h3>
        </div>
        
        <div className="space-y-4 flex-1">
          <div className="flex justify-between items-center border-b border-border-divider pb-3">
            <span className="text-text-main text-sm">Gasto Total no Ano</span>
            <PrivacyBlur className="font-bold text-text-main">{formatCurrency(totalSpent)}</PrivacyBlur>
          </div>
          <div className="flex justify-between items-center border-b border-border-divider pb-3">
            <span className="text-text-main text-sm">Assinaturas Anuais</span>
            <PrivacyBlur className="font-bold text-text-main">{formatCurrency(subscriptionsTotal)}</PrivacyBlur>
          </div>
        </div>
        
        <div className="flex justify-between items-center pt-4 mt-auto">
            <span className="text-text-muted text-[10px] uppercase font-bold tracking-wider">Média mensal</span>
            <PrivacyBlur className="font-bold text-text-muted">{formatCurrency(monthlyAverage)}</PrivacyBlur>
        </div>
    </div>
  );
}