import { compactWallTime, informedTime } from "@/services/temporal";
import { PrivacyBlur } from "@/components/ui/privacyBlur";
import { useUser } from "@/hooks/useUser";
import { Account, Transaction } from "@/types";
import { formatCurrency } from "@/utils/format";
import { motion } from "framer-motion";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Building2,
  Clock,
  Landmark,
  PiggyBank,
  Wallet,
} from "lucide-react";

// Helper de Ícones
const getAccountIcon = (type: string) => {
  switch (type) {
    case "CASH":
      return <Wallet size={12} />;
    case "INVESTMENT":
      return <Building2 size={12} />;
    case "SAVINGS":
      return <PiggyBank size={12} />;
    default:
      return <Landmark size={12} />;
  }
};

interface TransactionItemProps {
  item: Transaction;
  accounts: Account[];
  onClick: (id: string) => void;
  isLast: boolean;
  layoutIdPrefix?: string;
}

export function TransactionItem({
  item,
  accounts,
  onClick,
  isLast,
  layoutIdPrefix = "extract",
}: TransactionItemProps) {
  const { user } = useUser();
  
  const contaNome =
    accounts.find((a) => a.id === item.accountId)?.name ||
    item.accountName ||
    item.account?.name ||
    "Conta";

  const categoriaNome = 
    item.categoryName || 
    item.category?.name || 
    "Geral";

  const contaTipo =
    accounts.find((a) => a.id === item.accountId)?.type ||
    item.account?.type ||
    "CHECKING";
  const time = informedTime(item);
  const horario = time ? compactWallTime(time) : null;

  return (
    <motion.div
      layoutId={`${layoutIdPrefix}-card-container-${item.id}`}
      onClick={() => !user?.privacyMode && onClick(item.id)}
      className={`
        p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 transition-colors group relative
        ${!isLast ? "border-b border-border-divider/50" : ""}
        ${user?.privacyMode ? "cursor-default" : "cursor-pointer hover:bg-bg-surface-hover/50"}
      `}
    >
      <div className="flex items-center gap-4 min-w-0 sm:flex-1">
        {/* Ícone de Tipo */}
        <motion.div
          layoutId={`${layoutIdPrefix}-icon-${item.id}`}
          className={`
            w-10 h-10 rounded-xl flex items-center justify-center shrink-0
            ${item.type === "INCOME" ? "bg-emerald-500/10 text-emerald-500" : "bg-bg-surface-hover text-text-muted"}
          `}
        >
          {item.type === "INCOME" ? (
            <ArrowUpCircle size={20} />
          ) : (
            <ArrowDownCircle size={20} />
          )}
        </motion.div>

        {/* Detalhes */}
        <div className="flex flex-col min-w-0">
          <div className="flex justify-between items-center w-full">
            <motion.span
              layoutId={`${layoutIdPrefix}-title-${item.id}`}
              className="font-semibold text-text-main break-words pr-2 text-sm md:text-base"
            >
              {item.description}
            </motion.span>
          </div>

          <div className="flex items-center flex-wrap gap-2 text-xs text-text-muted mt-0.5">
            {/* Horário */}
            <span className="flex items-center gap-1 text-text-muted bg-bg-surface px-1.5 py-0.5 rounded border border-border-divider">
              <Clock size={10} /><span aria-label={horario ? "Horário informado" : "Horário não informado"}>{horario ?? "—"}</span>
            </span>

            {/* Categoria */}
            <span>{categoriaNome}</span>
            {item.status&&<span>{({PENDING:"Previsto",PARTIALLY_SETTLED:"Baixa parcial",FULFILLED:"Previsão realizada",CANCELLED:"Previsão cancelada",SETTLED:"Realizado",REVERSED:"Estornado"})[item.status]}</span>}

            <span className="w-0.5 h-0.5 bg-zinc-600 rounded-full shrink-0"></span>

            {/* Badge da Conta */}
            <div className="flex items-center gap-1 text-text-muted">
              {getAccountIcon(contaTipo)}
              <span className="truncate max-w-20">{contaNome}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Valor */}
      <div className="flex items-center self-end sm:self-auto shrink-0 pl-2">
        <motion.span
          layoutId={`${layoutIdPrefix}-amount-${item.id}`}
          className={`font-bold whitespace-nowrap text-sm md:text-base ${item.type === "INCOME" ? "text-emerald-500" : "text-text-main"}`}
        >
          <PrivacyBlur>
            {item.type === "EXPENSE" ? "- " : "+ "}
            {formatCurrency(item.amount)}
          </PrivacyBlur>
        </motion.span>
      </div>
    </motion.div>
  );
}
