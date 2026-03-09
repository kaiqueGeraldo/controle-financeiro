import { PrivacyBlur } from "@/components/ui/privacyBlur";
import { formatCurrency } from "@/utils/format";
import { Building2, TrendingUp, Wallet } from "lucide-react";

interface AccountsSummaryProps {
  total: number;
  checking: number;
  invested: number;
}

export function AccountsSummary({
  total,
  checking,
  invested,
}: AccountsSummaryProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      {/* Card Principal - Patrimônio */}
      <div className="relative bg-bg-surface/50 border border-border-divider p-4 rounded-2xl flex items-center gap-4 hover:border-border-divider transition-colors">
        <div className="w-10 h-10 rounded-full flex items-center justify-center">
          <Wallet className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs text-text-muted uppercase font-bold">
            Patrimônio Total
          </p>
          <PrivacyBlur className="text-xl font-bold text-text-main">
            {formatCurrency(total)}
          </PrivacyBlur>
        </div>
      </div>

      {/* Card Disponível */}
      <div className="bg-bg-surface/50 border border-border-divider p-4 rounded-2xl flex items-center gap-4 hover:border-border-divider transition-colors">
        <div className="w-10 h-10 rounded-full flex items-center justify-center">
          <Building2 className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs text-text-muted uppercase font-bold">
            Conta Corrente
          </p>
          <PrivacyBlur className="text-xl font-bold text-blue-400">
            {formatCurrency(checking)}
          </PrivacyBlur>
        </div>
      </div>

      {/* Card Investido */}
      <div className="bg-bg-surface/50 border border-border-divider p-4 rounded-2xl flex items-center gap-4 hover:border-border-divider transition-colors">
        <div className="w-10 h-10 rounded-full flex items-center justify-center">
          <TrendingUp className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs text-text-muted uppercase font-bold">
            Investido / Guardado
          </p>
          <PrivacyBlur className="text-xl font-bold text-purple-400">
            {formatCurrency(invested)}
          </PrivacyBlur>
        </div>
      </div>
    </div>
  );
}
