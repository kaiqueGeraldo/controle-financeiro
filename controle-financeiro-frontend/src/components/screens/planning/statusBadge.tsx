import { PlanStatus } from "@/types";
import { AlertCircle, CheckCircle2, Wallet } from "lucide-react";

interface StatusBadgeProps {
  status: PlanStatus;
  onClick: () => void;
}

export function StatusBadge({ status, onClick }: StatusBadgeProps) {
  const styles = {
    PAID: { 
      bg: "bg-emerald-500/10", text: "text-emerald-500", border: "border-emerald-500/20", 
      icon: <CheckCircle2 className="w-3 h-3" />, label: "Pago" 
    },
    SAVED: { 
      bg: "bg-amber-500/10", text: "text-amber-500", border: "border-amber-500/20", 
      icon: <Wallet className="w-3 h-3" />, label: "Guardado" 
    },
    PENDING: { 
      bg: "bg-rose-500/10", text: "text-rose-500", border: "border-rose-500/20", 
      icon: <AlertCircle className="w-3 h-3" />, label: "Pendente" 
    },
  };

  const style = styles[status];

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${style.bg} ${style.border} ${style.text} hover:brightness-110 transition cursor-pointer`}
    >
      {style.icon}
      <span className="text-xs font-semibold uppercase tracking-wide">
        {style.label}
      </span>
    </button>
  );
}