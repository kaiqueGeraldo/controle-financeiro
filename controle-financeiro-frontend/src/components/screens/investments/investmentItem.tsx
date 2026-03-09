import { PrivacyBlur } from "@/components/ui/privacyBlur";
import { useUser } from "@/hooks/useUser";
import { Investment, InvestType } from "@/types";
import { formatCurrency } from "@/utils/format";
import { motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, Bitcoin, Building2, Landmark, Wallet } from "lucide-react";
import React from "react";

// --- HELPERS ---
export const getAssetIcon = (type: InvestType) => {
  switch (type) {
    case "FIXED_INCOME": return <Wallet />;
    case "TREASURY": return <Building2 />;
    case "FII": return <Building2 />;
    case "CRYPTO": return <Bitcoin />;
    default: return <Landmark />;
  }
};

export const getAssetColor = (type: InvestType) => {
  switch (type) {
    case "FIXED_INCOME": return "bg-purple-500/10 text-purple-500 border-purple-500/20";
    case "CRYPTO": return "bg-orange-500/10 text-orange-500 border-orange-500/20";
    case "FII": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
    default: return "bg-blue-500/10 text-blue-500 border-blue-500/20";
  }
};

const getAssetLabel = (type: InvestType) => {
    const map: Record<string, string> = {
        STOCK: "Ação", FII: "FII", FIXED_INCOME: "Renda Fixa", 
        CRYPTO: "Cripto", TREASURY: "Tesouro"
    };
    return map[type] || "Outro";
};

export const BadgeTipo = ({ tipo }: { tipo: InvestType }) => (
  <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted bg-bg-surface px-2 py-0.5 rounded border border-border-divider">
    {getAssetLabel(tipo)}
  </span>
);

// --- COMPONENTE ---
interface InvestmentItemProps {
  asset: Investment;
  totalPortfolioValue: number;
  onClick: (id: string) => void;
}

export function InvestmentItem({ asset, totalPortfolioValue, onClick }: InvestmentItemProps) {
  const { user } = useUser();
  const saldoAtual = asset.quantity * asset.currentPrice;
  const custoTotal = asset.quantity * asset.averagePrice;
  const variacao = custoTotal > 0 ? saldoAtual - custoTotal : 0;
  const variacaoPerc = custoTotal > 0 ? (variacao / custoTotal) * 100 : 0;
  const isPositivo = variacao >= 0;
  const alocacao = totalPortfolioValue > 0 ? (saldoAtual / totalPortfolioValue) * 100 : 0;

  return (
    <div className="relative group perspective-1000 h-full">
      <motion.div 
        layoutId={`card-ativo-${asset.id}`}
        onClick={() => !user?.privacyMode && onClick(asset.id)}
        className={`bg-bg-surface border border-border-divider rounded-2xl p-5 group transition-all relative overflow-hidden h-full flex flex-col justify-between ${user?.privacyMode ? 'cursor-default' : 'cursor-pointer hover:border-border-divider hover:shadow-xl'}`}
      >
        {/* Topo */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex gap-3 items-center">
            <motion.div 
                layoutId={`icon-${asset.id}`} 
                className={`w-10 h-10 rounded-xl flex items-center justify-center border ${getAssetColor(asset.type)}`}
            >
              {React.cloneElement(getAssetIcon(asset.type) as React.ReactElement<any>, { size: 20 })}
            </motion.div>
            <div>
              <motion.h3 layoutId={`ticker-${asset.id}`} className="font-bold text-base text-text-main group-hover:text-emerald-400 transition-colors">
                {asset.ticker}
              </motion.h3>
              <BadgeTipo tipo={asset.type} />
            </div>
          </div>
        </div>

        {/* Info Principal */}
        <div className="mb-4">
           <PrivacyBlur className="text-xl font-bold text-text-main mb-1 tracking-tight w-min">{formatCurrency(saldoAtual)}</PrivacyBlur>
           
           {asset.type !== 'FIXED_INCOME' && (
               <div className={`flex items-center gap-1 text-xs font-medium ${isPositivo ? 'text-emerald-500' : 'text-rose-500'}`}>
                <PrivacyBlur>
                  {isPositivo ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  {Math.abs(variacaoPerc).toFixed(2)}%
                  <span className="opacity-60 ml-1">({isPositivo ? '+' : ''}{formatCurrency(variacao)})</span>
                </PrivacyBlur>
               </div>
           )}
           {asset.type === 'FIXED_INCOME' && (
                <div className="flex items-center gap-1 text-xs font-medium text-emerald-500">
                  <PrivacyBlur>
                    {isPositivo ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    {Math.abs(variacaoPerc).toFixed(2)}%
                    <span className="opacity-60 ml-1">({isPositivo ? '+' : ''}{formatCurrency(variacao)})</span>
                  </PrivacyBlur>
                </div>
           )}
        </div>

        {/* Rodapé Alocação */}
        <div className="pt-3 border-t border-border-divider flex justify-between items-center">
           <span className="text-[10px] text-text-muted font-bold uppercase">Alocação</span>
           <div className="flex items-center gap-2">
              <div className="w-12 h-1 bg-bg-surface-hover rounded-full overflow-hidden">
                <div className="h-full bg-zinc-500 rounded-full" style={{ width: `${alocacao}%` }}></div>
              </div>
              <PrivacyBlur className="text-[10px] font-bold text-text-muted">{alocacao.toFixed(0)}%</PrivacyBlur>
           </div>
        </div>
      </motion.div>
    </div>
  );
}