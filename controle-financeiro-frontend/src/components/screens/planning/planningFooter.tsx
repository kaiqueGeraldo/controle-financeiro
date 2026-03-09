import { formatCurrency } from "@/utils/format";
import { Check, Pencil, X } from "lucide-react";
import { useState } from "react";

interface PlanningFooterProps {
  income: number;
  expenses: number;
  remaining: number;
  onUpdateIncome: (val: number) => Promise<void>;
}

export function PlanningFooter({ income, expenses, remaining, onUpdateIncome }: PlanningFooterProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempIncome, setTempIncome] = useState("");

  const handleSave = async () => {
    const valor = Number(tempIncome);
    if (!isNaN(valor)) {
      await onUpdateIncome(valor);
      setIsEditing(false);
    }
  };

  const startEditing = () => {
    setTempIncome(income.toString());
    setIsEditing(true);
  };

  return (
    <div className="fixed bottom-0 left-0 md:left-72 right-0 bg-bg-base/90 backdrop-blur-xl border-t border-border-divider p-3 md:p-6 z-30 shadow-[0_-5px_20px_rgba(0,0,0,0.3)]">
      <div className="max-w-5xl mx-auto flex justify-between items-center px-1 md:px-0">
        
        {/* Coluna Receita */}
        <div className="flex flex-col items-start md:items-start">
          <div className="flex items-center gap-2">
            <span className="text-[9px] md:text-[10px] uppercase tracking-wider text-text-muted font-bold whitespace-nowrap">
              <span className="hidden sm:inline">Receita Estimada</span>
              <span className="sm:hidden">Receitas</span>
            </span>
            {!isEditing && (
              <button onClick={startEditing} className="text-text-muted hover:text-text-main transition p-0.5 rounded cursor-pointer hidden sm:block">
                <Pencil size={12} />
              </button>
            )}
          </div>

          {isEditing ? (
            <div className="flex items-center gap-1 md:gap-2 mt-1">
              <input
                type="number"
                value={tempIncome}
                onChange={(e) => setTempIncome(e.target.value)}
                className="w-20 md:w-24 bg-bg-surface-hover border border-border-divider text-text-main text-xs rounded p-1 px-2 outline-none focus:border-emerald-500"
                autoFocus
              />
              <button onClick={handleSave} className="text-emerald-500"><Check size={16} /></button>
              <button onClick={() => setIsEditing(false)} className="text-rose-500"><X size={16} /></button>
            </div>
          ) : (
            <span onClick={startEditing} className="text-sm md:text-xl font-bold text-emerald-500 cursor-pointer flex items-center gap-1">
              {formatCurrency(income)}
              <Pencil size={10} className="sm:hidden text-text-muted" />
            </span>
          )}
        </div>

        <div className="h-6 md:h-8 w-px bg-bg-surface-hover mx-2"></div>

        {/* Coluna Despesas */}
        <div className="flex flex-col items-start md:items-start">
          <span className="text-[9px] md:text-[10px] uppercase tracking-wider text-text-muted font-bold whitespace-nowrap">
            <span className="hidden sm:inline">Despesas Planejadas</span>
            <span className="sm:hidden">Despesas</span>
          </span>
          <span className="text-sm md:text-xl font-bold text-rose-500">
            {formatCurrency(expenses)}
          </span>
        </div>

        <div className="h-6 md:h-8 w-px bg-bg-surface-hover mx-2"></div>

        {/* Coluna Sobra */}
        <div className="flex flex-col items-end md:items-end bg-bg-surface/50 px-2 md:px-4 py-1 rounded-lg md:rounded-xl border border-border-divider/50">
          <span className="text-[9px] md:text-[10px] uppercase tracking-wider text-text-muted font-bold whitespace-nowrap">
            <span className="hidden sm:inline">Sobra Prevista</span>
            <span className="sm:hidden">Sobra</span>
          </span>
          <span className={`text-base md:text-2xl font-bold whitespace-nowrap ${remaining >= 0 ? "text-blue-400" : "text-rose-400"}`}>
            {remaining > 0 ? "+" : ""}
            {formatCurrency(remaining)}
          </span>
        </div>
        
      </div>
    </div>
  );
}