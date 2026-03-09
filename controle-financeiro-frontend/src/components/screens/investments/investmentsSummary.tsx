import { PrivacyBlur } from "@/components/ui/privacyBlur";
import { formatCurrency } from "@/utils/format";
import { PieChart, TrendingDown, TrendingUp } from "lucide-react";

interface InvestmentsSummaryProps {
  totalInvestido: number;
  lucroTotal: number;
  rentabilidadeGeral: number;
}

export function InvestmentsSummary({ totalInvestido, lucroTotal, rentabilidadeGeral }: InvestmentsSummaryProps) {
  const isPositivo = lucroTotal >= 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
      
      {/* Card 1: Patrimônio Total */}
      <div className="bg-bg-surface/50 border border-border-divider p-6 rounded-2xl flex flex-col justify-between hover:border-border-divider transition-colors relative overflow-hidden group">
        {/* Glow Sutil Azulado */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/10 rounded-full blur-[60px] pointer-events-none -mr-10 -mt-10 transition-opacity group-hover:opacity-20"></div>
        
        <div className="flex items-center gap-3 text-text-muted mb-2 relative z-10">
           <div className="p-2 bg-bg-surface rounded-lg border border-border-divider">
              <PieChart size={20} />
           </div>
           <span className="text-xs font-bold uppercase tracking-wider">Patrimônio Total</span>
        </div>
        
        <PrivacyBlur className="text-3xl md:text-4xl font-bold text-text-main tracking-tight relative z-10 w-min">
          {formatCurrency(totalInvestido)}
        </PrivacyBlur>
      </div>

      {/* Card 2: Rentabilidade */}
      <div className="bg-bg-surface/50 border border-border-divider p-6 rounded-2xl flex flex-col justify-between hover:border-border-divider transition-colors relative overflow-hidden group">
         
         {/* O EFEITO DE LUZ */}
         <div className={`absolute top-0 right-0 w-48 h-48 rounded-full blur-[50px] pointer-events-none -mr-12 -mt-12 transition-all duration-500 
            ${isPositivo ? 'bg-emerald-500/20 group-hover:bg-emerald-500/30' : 'bg-rose-500/15 group-hover:bg-rose-500/25'}`}
         ></div>

         <div className="flex items-center gap-3 text-text-muted mb-2 relative z-10">
           <div className="p-2 bg-bg-surface rounded-lg border border-border-divider">
              {isPositivo ? <TrendingUp size={20} className="text-emerald-500" /> : <TrendingDown size={20} className="text-rose-500" />}
           </div>
           <span className="text-xs font-bold uppercase tracking-wider">Rentabilidade Geral</span>
        </div>

        <div className="relative z-10">
            <PrivacyBlur className={`text-3xl font-bold flex items-center gap-3 w-min ${isPositivo ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isPositivo ? "+" : ""}{rentabilidadeGeral.toFixed(2)}%
                
                {/* Badge de Valor Monetário */}
                <PrivacyBlur className={`text-sm font-bold px-2 py-1 rounded-lg border ${isPositivo ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-rose-500/10 border-rose-500/20 text-rose-500'}`}>
                    {isPositivo ? "+" : ""}{formatCurrency(lucroTotal)}
                </PrivacyBlur>
            </PrivacyBlur>
        </div>
      </div>

    </div>
  );
}