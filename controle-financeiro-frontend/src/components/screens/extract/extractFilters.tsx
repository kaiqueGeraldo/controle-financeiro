import { Filter, ChevronDown } from "lucide-react";
import { Account } from "@/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ExtractFiltersProps {
  accounts: Account[];
  filterAccountId: string;
  setFilterAccountId: (id: string) => void;
  filterType: "todos" | "INCOME" | "EXPENSE";
  setFilterType: (type: "todos" | "INCOME" | "EXPENSE") => void;
}

export function ExtractFilters({
  accounts,
  filterAccountId,
  setFilterAccountId,
  filterType,
  setFilterType,
}: ExtractFiltersProps) {
  
  const selectedAccountName = filterAccountId === "todas" 
    ? "Todas as Contas" 
    : accounts.find(a => a.id === filterAccountId)?.name || "Todas as Contas";

  return (
    <div className="flex flex-col md:flex-row gap-3 items-center justify-between w-full">
      
      {/* Filtro de Tipo */}
      <div className="flex p-1 bg-bg-surface border border-border-divider rounded-xl w-full md:w-auto">
        {(["todos", "INCOME", "EXPENSE"] as const).map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`flex-1 md:flex-none px-4 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              filterType === type
                ? type === "INCOME" 
                    ? "bg-emerald-500/10 text-emerald-500 shadow-sm"
                    : type === "EXPENSE"
                        ? "bg-rose-500/10 text-rose-500 shadow-sm"
                        : "bg-bg-surface-hover text-text-main shadow-sm"
                : "text-text-muted hover:text-text-main"
            }`}
          >
            {type === "todos" ? "Tudo" : type === "INCOME" ? "Entradas" : "Saídas"}
          </button>
        ))}
      </div>

      {/* Dropdown de Conta */}
      <DropdownMenu>
        <DropdownMenuTrigger className="w-full md:w-64 outline-none group">
          <div className="relative w-full bg-bg-surface border border-border-divider group-hover:border-border-divider group-hover:bg-bg-surface-hover/50 transition-all text-text-main text-sm rounded-xl pl-9 pr-4 py-2.5 flex items-center justify-between cursor-pointer">
            <Filter className="absolute left-3 w-4 h-4 text-text-muted" />
            <span className="truncate">{selectedAccountName}</span>
            <ChevronDown className="w-4 h-4 text-text-muted ml-2 group-data-[state=open]:rotate-180 transition-transform" />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-(--radix-dropdown-menu-trigger-width) bg-bg-surface border border-border-divider text-text-main z-50">
          <DropdownMenuItem 
            onClick={() => setFilterAccountId("todas")}
            className="cursor-pointer focus:bg-bg-surface-hover focus:text-text-main py-2.5"
          >
            Todas as Contas
          </DropdownMenuItem>
          {accounts.map((acc) => (
            <DropdownMenuItem
              key={acc.id}
              onClick={() => setFilterAccountId(acc.id)}
              className="cursor-pointer focus:bg-bg-surface-hover focus:text-text-main flex items-center justify-between py-2.5"
            >
              <span>{acc.name}</span>
              {filterAccountId === acc.id && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}