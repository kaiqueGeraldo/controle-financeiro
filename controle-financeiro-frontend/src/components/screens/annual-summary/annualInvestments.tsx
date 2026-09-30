import { PrivacyBlur } from "@/components/ui/privacyBlur";
import { InvestmentBreakdown } from "@/types";
import { formatCurrency } from "@/utils/format";
import { TrendingUp } from "lucide-react";
import {formatCalendarDate} from "@/utils/date";
import {formatObservedMoney} from "@/components/ui/reportingCoverage";

interface AnnualInvestmentsProps {
  totalCost?: number | null;
  totalValue: number | null;
  items: InvestmentBreakdown[];
  positionDateLabel: string;
  outsideSupportedRange?:boolean;
  observedCost?:string|null;
  observedValue?:string|null;
}

export function AnnualInvestments({ totalCost, totalValue, items, positionDateLabel, outsideSupportedRange, observedCost, observedValue }: AnnualInvestmentsProps) {
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
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider">Posição atual de investimentos</h3>
            <p className="mt-1 text-xs normal-case tracking-normal">{positionDateLabel}</p>
          </div>
        </div>
        
        {outsideSupportedRange&&<p role="status" className="text-xs text-text-muted break-words">Total fora da faixa monetária. Custo observado: <PrivacyBlur>{observedCost==null?"Indisponível":formatObservedMoney(observedCost)}</PrivacyBlur>. Avaliação observada: <PrivacyBlur>{observedValue==null?"Indisponível":formatObservedMoney(observedValue)}</PrivacyBlur>.</p>}
        <div className="space-y-3 flex-1 overflow-y-auto custom-scroll pr-2 max-h-40">
          {items.length > 0 ? (
              items.map((inv, idx) => (
                  <div key={idx} className="space-y-1 text-sm min-w-0">
                      <div className="flex flex-wrap justify-between items-center gap-2"><span className="text-text-muted break-words" title={inv.name}>{inv.name}</span>
                      <PrivacyBlur className={`font-mono font-bold ${getBadgeColor(inv.color)}`}>
                          {inv.value === null ? "Avaliação indisponível" : formatCurrency(inv.value)}
                      </PrivacyBlur></div>
                      <p className="text-xs text-text-muted break-words">Avaliação: {inv.valuationDate?formatCalendarDate(inv.valuationDate):"data indisponível"} · Origem: {inv.valuationSource??"desconhecida"}</p>
                  </div>
              ))
          ) : (
              <p className="text-text-muted text-xs text-center mt-4">Nenhum investimento registrado.</p>
          )}
        </div>

        {totalCost !== undefined && <div className="border-t border-border-divider pt-4 mt-4 flex flex-wrap gap-3 justify-between items-center text-sm">
          <span className="text-text-muted">Custo investido</span>
          <PrivacyBlur>{totalCost === null ? "Custo indisponível" : formatCurrency(totalCost)}</PrivacyBlur>
        </div>}
        <div className="border-t border-border-divider pt-4 mt-4 flex flex-wrap gap-3 justify-between items-center font-bold text-base">
          <span className="text-text-main">Total na posição atual</span>
          <PrivacyBlur className="text-emerald-500">{totalValue === null ? "Avaliação indisponível" : formatCurrency(totalValue)}</PrivacyBlur>
        </div>
    </div>
  );
}
