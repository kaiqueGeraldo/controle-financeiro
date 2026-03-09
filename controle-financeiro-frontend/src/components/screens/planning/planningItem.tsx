import { PrivacyBlur } from "@/components/ui/privacyBlur";
import { useUser } from "@/hooks/useUser";
import { PlanItem, PlanStatus } from "@/types";
import { formatCurrency } from "@/utils/format";
import { motion } from "framer-motion";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  GripVertical,
  Trash2,
} from "lucide-react";

interface PlanningItemProps {
  item: PlanItem;
  onStatusChange: (item: PlanItem) => void;
  onDelete: (id: string) => void;
  onClick: (item: PlanItem) => void;
}

const StatusBadge = ({
  status,
  onClick,
}: {
  status: PlanStatus;
  onClick: (e: any) => void;
}) => {
  const styles = {
    PENDING: "text-rose-500 bg-rose-500/10 border-rose-500/20",
    SAVED: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    PAID: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
  };

  const labels = {
    PENDING: "PENDENTE",
    SAVED: "GUARDADO",
    PAID: "PAGO",
  };

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick(e);
      }}
      className={`px-3 py-1 rounded-lg text-[10px] font-bold border transition hover:brightness-110 ${styles[status]} cursor-pointer`}
    >
      {status === "PENDING" && (
        <AlertCircle size={12} className="inline mr-1 mb-0.5" />
      )}
      {status === "PAID" && (
        <CheckCircle2 size={12} className="inline mr-1 mb-0.5" />
      )}
      {labels[status]}
    </button>
  );
};

export function PlanningItem({
  item,
  onStatusChange,
  onDelete,
  onClick,
}: PlanningItemProps) {
  const { user } = useUser();
  const isInvoice = !!item.cardId;
  const isPaid = item.status === "PAID";

  return (
    <motion.div
      layoutId={`plan-card-${item.id}`}
      onClick={() => !user?.privacyMode && onClick(item)}
      className={`
        group relative flex items-center justify-between p-4 rounded-2xl border transition-all
        ${isPaid ? "bg-bg-surface/30 border-border-divider/50" : "bg-bg-surface border-border-divider"}
        ${
          user?.privacyMode
            ? "cursor-default"
            : isPaid
              ? "hover:bg-bg-surface/50 cursor-pointer"
              : "hover:border-border-divider hover:shadow-lg hover:shadow-black/20 cursor-pointer"
        }
      `}
    >
      <div className="flex items-center gap-4">
        {!user?.privacyMode && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="text-zinc-700 hover:text-text-muted cursor-grab active:cursor-grabbing transition-colors hidden sm:block p-1 -ml-1"
          >
            <GripVertical size={20} />
          </div>
        )}

        <motion.div
          layoutId={`plan-icon-${item.id}`}
          className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${isPaid ? "bg-bg-surface-hover text-text-muted" : "bg-bg-surface-hover text-text-muted group-hover:bg-bg-button-hover group-hover:text-text-main"}`}
        >
          {item.category?.icon ? (
            <span>{item.category.icon}</span>
          ) : (
            <Calendar size={20} />
          )}
        </motion.div>

        <div>
          <motion.h3
            layoutId={`plan-title-${item.id}`}
            className={`font-bold text-sm md:text-base ${isPaid ? "text-text-muted line-through" : "text-text-main"}`}
          >
            {item.description}
          </motion.h3>

          <div className="flex items-center gap-2 mt-1">
            <span
              className={`text-xs ${isPaid ? "text-text-muted" : "text-text-muted"}`}
            >
              Vence dia{" "}
              <span className="text-text-main">
                {new Date(item.dueDate).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                  timeZone: "UTC",
                })}
              </span>
            </span>
            {isInvoice && (
              <span className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-1.5 rounded">
                Cartão
              </span>
            )}
          </div>
        </div>
      </div>

      <div className={`flex flex-col md:flex-row items-end md:items-center gap-2 md:gap-6 ${user?.privacyMode ? 'pointer-events-none opacity-50' : ''}`}>
        <motion.span
          layoutId={`plan-amount-${item.id}`}
          className={`font-bold text-base md:text-lg ${isPaid ? "text-text-muted" : "text-text-main"}`}
        >
          <PrivacyBlur>{formatCurrency(item.amount)}</PrivacyBlur>
        </motion.span>

        <div className="flex items-center gap-3">
          <StatusBadge
            status={item.status}
            onClick={() => onStatusChange(item)}
          />

          {isInvoice ? (
            <div className="w-8 h-8 shrink-0" />
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(item.id);
              }}
              className="opacity-100 md:opacity-0 group-hover:opacity-100 p-2 text-text-muted hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition shrink-0 cursor-pointer"
              title="Excluir item"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
