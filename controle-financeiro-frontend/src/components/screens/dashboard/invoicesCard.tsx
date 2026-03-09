import { Receipt, CreditCard } from "lucide-react";
import { formatCurrency } from "@/utils/format";
import { PrivacyBlur } from "@/components/ui/privacyBlur";

interface InvoiceItem {
  id: string;
  nome: string;
  valor: number;
  vencimento: string;
  cor: string;
}

interface InvoicesCardProps {
  total: number;
  lista: InvoiceItem[];
}

export function InvoicesCard({ total, lista }: InvoicesCardProps) {
  return (
    <div className="bg-bg-surface border border-border-divider rounded-2xl p-6 shadow-sm hover:border-border-divider transition-colors relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
        <Receipt className="w-24 h-24" />
      </div>

      <div className="flex flex-col h-full relative z-10">
        <span className="text-text-muted text-xs font-bold uppercase tracking-wider mb-1">
          Faturas Abertas
        </span>
        <PrivacyBlur className="text-3xl font-bold text-text-main mb-6 tracking-tight w-min">
          {formatCurrency(total)}
        </PrivacyBlur>

        <div className="space-y-3 flex-1 overflow-y-auto custom-scroll pr-1 max-h-32">
          {lista.length > 0 ? (
            lista.map((cartao) => (
              <div key={cartao.id} className="flex justify-between items-center text-sm border-b border-border-divider/50 pb-2 last:border-0 last:pb-0">
                <div className="flex items-center gap-2">
                  <CreditCard className={`w-4 h-4 ${cartao.cor}`} />
                  <span className="text-text-main font-medium">{cartao.nome}</span>
                </div>
                <div className="flex flex-col items-end">
                  <PrivacyBlur className="font-bold text-text-main">{formatCurrency(cartao.valor)}</PrivacyBlur>
                  <span className="text-[9px] font-bold uppercase text-text-muted">
                    {cartao.valor > 0 ? `Vence ${cartao.vencimento}` : "Zerado"}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-text-muted text-xs py-2 font-medium">Nenhum cartão com fatura aberta.</div>
          )}
        </div>
      </div>
    </div>
  );
}