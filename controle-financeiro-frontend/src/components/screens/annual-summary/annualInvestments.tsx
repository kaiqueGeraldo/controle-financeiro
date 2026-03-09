import { PrivacyBlur } from "@/components/ui/privacyBlur";
import { InvestmentBreakdown } from "@/types";
import { formatCurrency } from "@/utils/format";
import { TrendingUp } from "lucide-react";

interface AnnualInvestmentsProps {
  totalValue: number;
  items: InvestmentBreakdown[];
}

export function AnnualInvestments({ totalValue, items }: AnnualInvestmentsProps) {
  const getBadgeColor = (color: string) => {
    const map: Record<string, string> = {
        EMERALD: "text-emerald-400", BLUE: "text-blue-400", CYAN: "text-cyan-400",
        PURPLE: "text-purple-400", ROSE: "text-rose-400", AMBER: "text-amber-400"
    };
    return map[color] || "text-emerald-400";
  };

  return (
    <div className="bg-bg-surface border border-border-divider rounded-3xl p-6 flex flex-col h-full">
        <div className="flex items-center gap-2 mb-6 text-text-muted">
          <TrendingUp className="w-5 h-5" />
          <h3 className="text-sm font-bold uppercase tracking-wider">Metas e Investimentos</h3>
        </div>
        
        <div className="space-y-3 flex-1 overflow-y-auto custom-scroll pr-2 max-h-40">
          {items.length > 0 ? (
              items.map((inv, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm">
                      <span className="text-text-muted truncate max-w-35" title={inv.name}>{inv.name}</span>
                      <PrivacyBlur className={`font-mono font-bold ${getBadgeColor(inv.color)}`}>
                          {formatCurrency(inv.value)}
                      </PrivacyBlur>
                  </div>
              ))
          ) : (
              <p className="text-text-muted text-xs text-center mt-4">Nenhum investimento registrado.</p>
          )}
        </div>

        <div className="border-t border-border-divider pt-4 mt-4 flex justify-between items-center font-bold text-base">
          <span className="text-text-main">Total Acumulado</span>
          <PrivacyBlur className="text-emerald-500">{formatCurrency(totalValue)}</PrivacyBlur>
        </div>
    </div>
  );
}