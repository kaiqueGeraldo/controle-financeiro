import { PrivacyBlur } from "@/components/ui/privacyBlur";
import { formatCurrency } from "@/utils/format";
import { TrendingUp } from "lucide-react";

interface MonthlyFlowCardProps {
  despesas: number;
  receitas: number;
  percentual: number;
}

export function MonthlyFlowCard({ despesas, receitas, percentual }: MonthlyFlowCardProps) {
  return (
    <div className="bg-bg-surface border border-border-divider rounded-2xl p-6 flex flex-col justify-between shadow-sm hover:border-border-divider transition-colors relative overflow-hidden group">
      <div className="absolute -top-4 -right-4 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
        <TrendingUp className="w-28 h-28" />
      </div>

      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="p-3 bg-blue-500/10 rounded-xl">
          <TrendingUp className="w-6 h-6 text-blue-500" />
        </div>
      </div>
      <div className="relative z-10">
        <span className="text-text-muted text-xs font-bold uppercase tracking-wider">
          Balanço do Mês
        </span>

        <div className="mt-4 mb-2 h-3 w-full bg-bg-surface-hover rounded-full overflow-hidden border border-border-divider">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${
              percentual > 100 ? "bg-rose-500" : "bg-linear-to-r from-emerald-600 to-emerald-400"
            }`}
            style={{ width: `${Math.min(percentual, 100)}%` }}
          />
        </div>

        <div className="flex justify-between text-[10px] mt-2 font-bold uppercase tracking-wider">
          <span className="text-text-muted">
            Saídas <b className="text-rose-400"><PrivacyBlur>{formatCurrency(despesas)}</PrivacyBlur></b>
          </span>
          <span className="text-text-muted">
            Entradas <b className="text-emerald-500"><PrivacyBlur>{formatCurrency(receitas)}</PrivacyBlur></b>
          </span>
        </div>
      </div>
    </div>
  );
}