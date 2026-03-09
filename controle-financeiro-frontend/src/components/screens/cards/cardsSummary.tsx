import { PrivacyBlur } from "@/components/ui/privacyBlur";
import { formatCurrency } from "@/utils/format";
import {
  CreditCard,
  Receipt,
  Wallet
} from "lucide-react";

interface CardsSummaryProps {
  totalLimit: number;
  totalInvoice: number;
  available: number;
}

export function CardsSummary({
  totalLimit,
  totalInvoice,
  available,
}: CardsSummaryProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <div className="bg-bg-surface/50 border border-border-divider p-4 rounded-2xl flex items-center gap-4 hover:border-border-divider transition-colors">
        <div className="w-10 h-10 rounded-full flex items-center justify-center">
          <CreditCard className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs text-text-muted uppercase font-bold">Limite Global</p>
          <PrivacyBlur className={`text-xl font-bold`}>
            {formatCurrency(totalLimit)}
          </PrivacyBlur>
        </div>
      </div>

      <div className="bg-bg-surface/50 border border-border-divider p-4 rounded-2xl flex items-center gap-4 hover:border-border-divider transition-colors">
        <div className="w-10 h-10 rounded-full flex items-center justify-center">
          <Receipt className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs text-text-muted uppercase font-bold">Faturas Abertas</p>
          <PrivacyBlur className="text-xl font-bold">
            {formatCurrency(totalInvoice)}
          </PrivacyBlur>
        </div>
      </div>

      <div className="bg-bg-surface/50 border border-border-divider p-4 rounded-2xl flex items-center gap-4 md:col-span-1 sm:col-span-2 hover:border-border-divider transition-colors">
        <div className="w-10 h-10 rounded-full flex items-center justify-center">
          <Wallet className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs text-text-muted uppercase font-bold">Disponível</p>
          <PrivacyBlur className="text-xl font-bold">
            {formatCurrency(available)}
          </PrivacyBlur>
        </div>
      </div>
    </div>
  );
}
