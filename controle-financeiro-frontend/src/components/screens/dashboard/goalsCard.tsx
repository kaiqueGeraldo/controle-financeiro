import { Target, Plus } from "lucide-react";
import { formatCurrency } from "@/utils/format";
import { Goal } from "@/types";
import { PrivacyBlur } from "@/components/ui/privacyBlur";

interface GoalsCardProps {
  goals: Goal[];
  onNewGoal: () => void;
}

export function GoalsCard({ goals, onNewGoal }: GoalsCardProps) {
  const topGoals = goals.slice(0, 3);

  return (
    <div className="bg-bg-surface border border-border-divider rounded-2xl p-6 shadow-sm flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-text-main">Metas Principais</h3>
      </div>

      <div className="space-y-4 flex-1">
        {topGoals.length > 0 ? topGoals.map((meta) => {
          const percentual = Math.min((meta.currentValue / meta.targetValue) * 100, 100);
          const isComplete = percentual >= 100;
          
          return (
            <div key={meta.id} className="bg-bg-base/50 rounded-xl p-4 border border-border-divider/50">
              <div className="flex items-center gap-4">
                <div className="relative flex items-center justify-center w-12 h-12 shrink-0">
                  <svg width="48" height="48" className="transform -rotate-90">
                    <circle cx="24" cy="24" r="20" stroke="#27272a" strokeWidth="4" fill="transparent" />
                    <circle
                      cx="24" cy="24" r="20" stroke={isComplete ? "#3b82f6" : "#10b981"} strokeWidth="4" fill="transparent"
                      strokeDasharray={20 * 2 * Math.PI}
                      strokeDashoffset={(20 * 2 * Math.PI) - (percentual / 100) * (20 * 2 * Math.PI)}
                      strokeLinecap="round" className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <PrivacyBlur className={`absolute text-[10px] font-bold ${isComplete ? 'text-blue-400' : 'text-emerald-400'}`}>
                    {percentual.toFixed(0)}%
                  </PrivacyBlur>
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm text-text-main truncate" title={meta.title}>
                    {meta.title}
                  </h4>
                  <PrivacyBlur className="flex items-end gap-1 mt-1 truncate w-min">
                    <PrivacyBlur className={`font-bold text-sm ${isComplete ? 'text-blue-400' : 'text-emerald-400'}`}>
                      {meta.type === 'MONETARY' ? formatCurrency(meta.currentValue) : meta.currentValue}
                    </PrivacyBlur>
                    <PrivacyBlur className="text-text-muted text-[10px] font-medium mb-0.5 truncate">
                      / {meta.type === 'MONETARY' ? formatCurrency(meta.targetValue) : meta.targetValue}
                    </PrivacyBlur>
                  </PrivacyBlur>
                </div>
              </div>
            </div>
          );
        }) : (
          <div className="flex flex-col items-center justify-center h-full text-text-muted opacity-50">
             <Target size={32} className="mb-2" />
             <p className="text-xs font-medium">Nenhuma meta ativa</p>
          </div>
        )}
      </div>

      <button 
        onClick={onNewGoal}
        className="w-full mt-4 py-3 border border-dashed border-border-divider text-text-muted rounded-xl hover:bg-bg-surface-hover hover:text-text-main transition-all flex items-center justify-center gap-2 text-sm font-bold cursor-pointer"
      >
        <Plus className="w-4 h-4" /> Nova Meta
      </button>
    </div>
  );
}