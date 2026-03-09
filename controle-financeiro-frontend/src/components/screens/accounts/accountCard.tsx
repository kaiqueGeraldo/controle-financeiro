import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PrivacyBlur } from "@/components/ui/privacyBlur";
import { Account, AccountType } from "@/types";
import { formatCurrency } from "@/utils/format";
import { motion } from "framer-motion";
import {
  Banknote,
  Building2,
  MoreHorizontal,
  Pencil,
  PiggyBank,
  Trash2,
  TrendingUp
} from "lucide-react";

interface AccountCardProps {
  account: Account;
  isHidden: boolean;
  onClick: () => void;
  onDelete: (id: string) => void;
  onEdit: (account: Account) => void;
}

const getIcon = (type: AccountType) => {
  switch (type) {
    case "CASH":
      return <Banknote className="w-5 h-5" />;
    case "INVESTMENT":
      return <TrendingUp className="w-5 h-5" />;
    case "SAVINGS":
      return <PiggyBank className="w-5 h-5" />;
    default:
      return <Building2 className="w-5 h-5" />;
  }
};

const getTypeLabel = (type: AccountType) => {
  switch (type) {
    case "CASH":
      return "Carteira Física";
    case "INVESTMENT":
      return "Investimentos";
    case "SAVINGS":
      return "Poupança";
    case "CHECKING":
      return "Conta Corrente";
    default:
      return type;
  }
};

export function AccountCard({
  account,
  isHidden,
  onClick,
  onDelete,
  onEdit,
}: AccountCardProps) {
  // Cor padrão ou a definida
  const accentColor = account.color || "#3b82f6";

  return (
    <motion.div whileHover={{ y: -4 }} className="relative group w-full">
      {/* Container Principal com Gradiente Sutil */}
      <div
        role={isHidden ? "presentation" : "button"}
        tabIndex={isHidden ? -1 : 0}
        aria-label={`Ver extrato da conta ${account.name}`}
        onClick={isHidden ? undefined : onClick}
        onKeyDown={(e) => {
          if (!isHidden && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            onClick();
          }
        }}
        className={`relative bg-bg-surface border border-border-divider p-5 rounded-2xl overflow-hidden h-full flex flex-col justify-between shadow-lg transition-all ${isHidden ? "cursor-default" : "cursor-pointer hover:border-border-divider focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-bg-base"}`}
      >
        {/* Background Decorativo (Noise/Gradient) */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(135deg, ${accentColor} 0%, transparent 100%)`,
          }}
        />

        {/* Topo: Ícone + Menu */}
        <div className="flex justify-between items-start mb-6 z-10">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center bg-bg-base border border-border-divider shadow-inner"
              style={{ color: accentColor }}
            >
              {getIcon(account.type)}
            </div>
            <div>
              <h3 className="font-bold text-text-main text-sm leading-tight">
                {account.name}
              </h3>
              <p className="text-[10px] text-text-muted uppercase tracking-wide font-medium">
                {getTypeLabel(account.type)}
              </p>
            </div>
          </div>

          {/* Menu Dropdown */}
          {!isHidden && (
            <div onClick={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger className="text-text-muted hover:text-text-main p-1 rounded-lg hover:bg-bg-surface-hover transition outline-none">
                  <MoreHorizontal size={18} />
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="bg-bg-surface border border-border-divider text-text-main"
                >
                  <DropdownMenuItem
                    onClick={() => onEdit(account)}
                    className="cursor-pointer focus:bg-bg-surface-hover"
                  >
                    <Pencil className="w-4 h-4 mr-2" /> Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onDelete(account.id)}
                    className="cursor-pointer text-rose-500 focus:bg-rose-500/10 focus:text-rose-500"
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        {/* Valor */}
        <div className="z-10">
          <p className="text-text-muted text-[9px] uppercase font-bold tracking-wider mb-1">
            Saldo Atual
          </p>
          <PrivacyBlur className="text-2xl font-bold text-text-main tracking-tight w-min">
            {formatCurrency(account.balance)}
          </PrivacyBlur>
        </div>

        {/* Barra Decorativa Inferior */}
        <div
          className="absolute bottom-0 left-0 right-0 h-1 opacity-50"
          style={{ backgroundColor: accentColor }}
        />
      </div>
    </motion.div>
  );
}
