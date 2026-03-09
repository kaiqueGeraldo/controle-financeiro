import { PrivacyBlur } from "@/components/ui/privacyBlur";
import { formatCurrency } from "@/utils/format";
import { Wallet } from "lucide-react";

interface AnnualBalanceProps {
  totalIncome: number;
  totalExpense: number;
  annualBalance: number;
}

export function AnnualBalance({
  totalIncome,
  totalExpense,
  annualBalance,
}: AnnualBalanceProps) {
  return (
    <div className="bg-bg-surface border border-border-divider rounded-3xl p-6 md:p-8 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center gap-2 text-text-muted">
          <Wallet className="w-5 h-5" />
          <h3 className="text-sm font-bold uppercase tracking-wider">
            Balanço Geral
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 relative z-10">
        <div className="bg-bg-base/50 p-4 rounded-2xl border border-border-divider/50">
          <p className="text-text-muted text-xs mb-1 uppercase font-bold">
            Total Entradas
          </p>
          <PrivacyBlur className="text-xl font-bold text-emerald-500">
            {formatCurrency(totalIncome)}
          </PrivacyBlur>
        </div>
        <div className="bg-bg-base/50 p-4 rounded-2xl border border-border-divider/50">
          <p className="text-text-muted text-xs mb-1 uppercase font-bold">
            Total Saídas
          </p>
          <PrivacyBlur className="text-xl font-bold text-rose-500">
            {formatCurrency(totalExpense)}
          </PrivacyBlur>
        </div>
        <div className="bg-bg-base/50 p-4 rounded-2xl border border-border-divider/50">
          <p className="text-text-muted text-xs mb-1 uppercase font-bold">
            Saldo Acumulado
          </p>
          <PrivacyBlur
            className={`text-xl font-bold ${annualBalance >= 0 ? "text-blue-400" : "text-rose-400"}`}
          >
            {formatCurrency(annualBalance)}
          </PrivacyBlur>
        </div>
      </div>
    </div>
  );
}
