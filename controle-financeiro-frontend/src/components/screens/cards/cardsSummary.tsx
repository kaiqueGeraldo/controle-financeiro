import { PrivacyBlur } from "@/components/ui/privacyBlur";
import { formatCurrency } from "@/utils/format";
import {
  CreditCard,
  Receipt,
  Wallet
} from "lucide-react";

interface CardsSummaryProps {
  totalLimit: number | null;
  totalInvoice: number | null;
  available: number | null;
}

export function CardsSummary({
  totalLimit,
  totalInvoice,
  available,
}: CardsSummaryProps) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,16rem),1fr))] gap-4 mb-8">
      <div className="bg-bg-surface/50 border border-border-divider p-4 rounded-2xl flex items-center gap-4 hover:border-border-divider transition-colors">
        <div className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center">
          <CreditCard className="w-6 h-6" />
        </div>
        <div className="min-w-0 [overflow-wrap:anywhere]">
          <p className="text-xs text-text-muted uppercase font-bold">Limite Global</p>
          <PrivacyBlur className={`text-xl font-bold`}>
            {totalLimit === null ? "Total fora da faixa" : formatCurrency(totalLimit)}
          </PrivacyBlur>
        </div>
      </div>

      <div className="bg-bg-surface/50 border border-border-divider p-4 rounded-2xl flex items-center gap-4 hover:border-border-divider transition-colors">
        <div className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center">
          <Receipt className="w-6 h-6" />
        </div>
        <div className="min-w-0 [overflow-wrap:anywhere]">
          <p className="text-xs text-text-muted uppercase font-bold">Faturas Abertas</p>
          <PrivacyBlur className="text-xl font-bold">
            {totalInvoice === null ? "Total fora da faixa" : formatCurrency(totalInvoice)}
          </PrivacyBlur>
        </div>
      </div>

      <div className="bg-bg-surface/50 border border-border-divider p-4 rounded-2xl flex items-center gap-4 hover:border-border-divider transition-colors">
        <div className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center">
          <Wallet className="w-5 h-5" />
        </div>
        <div className="min-w-0 [overflow-wrap:anywhere]">
          <p className="text-xs text-text-muted uppercase font-bold">Disponível</p>
          <PrivacyBlur className="text-xl font-bold">
            {available === null ? "Indisponível" : formatCurrency(available)}
          </PrivacyBlur>
        </div>
      </div>
    </div>
  );
}
