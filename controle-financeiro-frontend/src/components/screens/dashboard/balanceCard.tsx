import { PrivacyBlur } from "@/components/ui/privacyBlur";
import { formatCurrency } from "@/utils/format";
import { ArrowUpRight, Wallet } from "lucide-react";

interface BalanceCardProps {
  saldoTotal: number;
  saldoContas: number;
  saldoInvestimentos: number;
}

export function BalanceCard({ saldoTotal, saldoContas, saldoInvestimentos }: BalanceCardProps) {
  return (
    <div className="bg-bg-surface border border-border-divider rounded-2xl p-6 flex flex-col justify-between shadow-sm hover:transition-colors relative overflow-hidden group">
      <div className="absolute -top-4 -right-4 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
        <Wallet className="w-28 h-28" />
      </div>

      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="p-3 bg-emerald-500/10 rounded-xl">
          <Wallet className="w-6 h-6 text-emerald-500" />
        </div>
        <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-md flex items-center gap-1 uppercase tracking-wider">
          <ArrowUpRight className="w-3 h-3" /> Atual
        </span>
      </div>
      
      <div className="relative z-10">
        <span className="text-text-muted text-xs font-bold uppercase tracking-wider">
          Patrimônio Total
        </span>
        <PrivacyBlur className="text-3xl font-bold mt-1 text-text-main tracking-tight w-min">
          {formatCurrency(saldoTotal)}
        </PrivacyBlur>

        {/* SUBTÍTULO DETALHADO */}
        <div className="flex items-center gap-2 mt-2 text-[10px] uppercase font-bold text-text-muted tracking-wider">
          <span className="flex items-center gap-1">
            Contas: <PrivacyBlur>{formatCurrency(saldoContas)}</PrivacyBlur>
          </span>
          <span className="w-1 h-1 bg-text-muted rounded-full"></span>
          <span className="flex items-center gap-1">
            Ativos: <PrivacyBlur>{formatCurrency(saldoInvestimentos)}</PrivacyBlur>
          </span>
        </div>
      </div>
    </div>
  );
}