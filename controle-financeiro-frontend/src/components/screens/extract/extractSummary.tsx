import {
  ArrowUpCircle,
  ArrowDownCircle,
  Download,
} from "lucide-react";
import { formatCurrency } from "@/utils/format";
import { PrivacyBlur } from "@/components/ui/privacyBlur";

interface ExtractSummaryProps {
  entries: number;
  exits: number;
  balance: number;
}

export function ExtractSummary({
  entries,
  exits,
  balance,
}: ExtractSummaryProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-bg-surface/50 border border-border-divider p-4 rounded-2xl flex items-center gap-4 hover:border-border-divider transition-colors">
        <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
          <ArrowUpCircle className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs text-text-muted uppercase font-bold">Entradas</p>
          <PrivacyBlur className="text-xl font-bold text-emerald-500">
            {formatCurrency(entries)}
          </PrivacyBlur>
        </div>
      </div>

      <div className="bg-bg-surface/50 border border-border-divider p-4 rounded-2xl flex items-center gap-4 hover:border-border-divider transition-colors">
        <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500">
          <ArrowDownCircle className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs text-text-muted uppercase font-bold">Saídas</p>
          <PrivacyBlur className="text-xl font-bold text-rose-500">
            {formatCurrency(exits)}
          </PrivacyBlur>
        </div>
      </div>

      <div className="bg-bg-surface/50 border border-border-divider p-4 rounded-2xl flex items-center gap-4 md:col-span-1 sm:col-span-2 hover:border-border-divider transition-colors">
        <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
          <Download className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs text-text-muted uppercase font-bold">Saldo do Período</p>
          <PrivacyBlur className={`text-xl font-bold ${balance >= 0 ? "text-text-main" : "text-rose-500"}`}>
            {formatCurrency(balance)}
          </PrivacyBlur>
        </div>
      </div>
    </div>
  );
}
