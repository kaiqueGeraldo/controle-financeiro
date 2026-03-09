import { PrivacyBlur } from "@/components/ui/privacyBlur";
import { formatCurrency } from "@/utils/format";
import { Trophy } from "lucide-react";

interface GoalsSummaryProps {
  totalCurrent: number;
  totalTarget: number;
  progress: number;
}

export function GoalsSummary({ totalCurrent, totalTarget, progress }: GoalsSummaryProps) {
  return (
    <div className="bg-bg-surface border border-border-divider rounded-3xl p-6 md:p-8 relative overflow-hidden mb-10">
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16"></div>
      
      <div className="flex flex-col md:flex-row gap-8 items-center relative z-10">
        <div className="flex-1">
          <div className="flex items-center gap-2 text-emerald-400 mb-1">
            <Trophy size={18} />
            <span className="text-sm font-bold uppercase tracking-wider">Patrimônio Alvo</span>
          </div>
          <PrivacyBlur className="text-4xl md:text-5xl font-bold text-text-main mb-2">
            {formatCurrency(totalCurrent)}
          </PrivacyBlur>
          <p className="text-text-muted text-sm inline-flex items-center gap-1">
            de <PrivacyBlur className="text-text-main font-semibold">{formatCurrency(totalTarget)}</PrivacyBlur> previstos
          </p>
        </div>
        <div className="hidden md:block w-px h-16 bg-bg-surface-hover"></div>
        <div className="flex-1 w-full">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-text-main font-medium">Conquista Global</span>
            <PrivacyBlur className="text-text-main font-bold">{progress.toFixed(0)}%</PrivacyBlur>
          </div>
          <div className="h-4 w-full bg-bg-base rounded-full p-1 border border-border-divider">
            <div 
                className="h-full rounded-full bg-linear-to-r from-emerald-500 to-blue-500 transition-all duration-1000" 
                style={{ width: `${progress}%` }} 
            /> 
          </div>
        </div>
      </div>
    </div>
  );
}