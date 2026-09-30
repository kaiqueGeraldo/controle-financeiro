import {
  CardInvoiceTransaction,
  CardInvoiceDetails,
  CreditCard,
} from "@/services/cardService";
import { normalizeOperationTemporal } from "@/services/temporal";
import { Category } from "@/types";
import { formatCurrency } from "@/utils/format";
import { formatCalendarDate } from "@/utils/date";
import { AnimatePresence, motion } from "framer-motion";
import {
  Banknote,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Receipt,
  ShoppingBag,
  Trash2,
  X,
} from "lucide-react";
import { useId, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { getCardStyle } from "./creditCardItem";
import { useDialogFocus } from "@/hooks/useDialogFocus";
import { DataLoadError } from "../dashboard/dataLoadError";

type InvoiceViewData = Omit<CardInvoiceDetails, "id" | "transactions"> & {
  id?: string;
  transactions?: CardInvoiceTransaction[];
};

interface InvoiceDetailsProps {
  card: CreditCard | undefined;
  isOpen: boolean;
  onClose: () => void;
  invoiceData: InvoiceViewData | null;
  isLoadingInvoice: boolean;
  invoiceError?: Error | null;
  onRetry?: () => Promise<void>;
  viewDateFormatted: string;
  onChangeMonth: (dir: number) => void;
  onPay: () => void;
  onDelete: () => void;
  onUpdateLimit: (newLimit: number) => Promise<void>;
  categories?: Category[];
  onUpdateTransaction?: (
    id: string,
    data: { description?: string; categoryId?: string },
  ) => Promise<void>;
  onDeleteTransaction?: (id: string) => Promise<void>;
  canGoBack?: boolean;
  canGoForward?: boolean;
}

export function InvoiceDetails({
  card,
  isOpen,
  onClose,
  invoiceData,
  isLoadingInvoice,
  invoiceError,
  onRetry,
  viewDateFormatted,
  onChangeMonth,
  onPay,
  onDelete,
  onUpdateLimit,
  categories = [],
  onUpdateTransaction,
  onDeleteTransaction,
  canGoBack = false,
  canGoForward = false,
}: InvoiceDetailsProps) {
  const titleId = useId();
  const dialogRef = useDialogFocus(isOpen && !!card, onClose);
  const [isEditingLimit, setIsEditingLimit] = useState(false);
  const [tempLimit, setTempLimit] = useState("");
  const [editingTxId, setEditingTxId] = useState<string | null>(null);
  const [editTxData, setEditTxData] = useState({
    description: "",
    categoryId: "",
  });

  // Lógica Inteligente de Cálculo de Datas Exatas
  const { closingDateStr, dueDateStr } = useMemo(() => {
    if (!invoiceData || !card) return { closingDateStr: "", dueDateStr: "" };

    const m = invoiceData.month - 1;
    const y = invoiceData.year;

    const lastDayDueMonth = new Date(y, m + 1, 0).getDate();
    const safeDue = Math.min(card.dueDay, lastDayDueMonth);
    const dueDate = new Date(y, m, safeDue);

    const closingM = card.closingDay > card.dueDay ? m - 1 : m;
    const lastDayClosingMonth = new Date(y, closingM + 1, 0).getDate();
    const safeClosing = Math.min(card.closingDay, lastDayClosingMonth);
    const closingDate = new Date(y, closingM, safeClosing);

    return {
      closingDateStr: closingDate
        .toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
        .replace(".", ""),
      dueDateStr: dueDate
        .toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
        .replace(".", ""),
    };
  }, [invoiceData, card]);

  if (!card) return null;

  const styles = getCardStyle(card.name, card.color || "#333");
  const totalAmount = invoiceData?.totalAmount || 0;
  const payableAmount = invoiceData?.payableAmount ?? totalAmount;
  const transactions = invoiceData?.transactions ?? [];

  const isPaid = invoiceData?.status === "PAID";
  const isClosed = invoiceData?.status === "CLOSED";
  const isEmpty = payableAmount <= 0;

  let isOverdue = false;
  if (invoiceData && card) {
    const todayObj = new Date();
    todayObj.setHours(0, 0, 0, 0);

    const m = invoiceData.month - 1;
    const y = invoiceData.year;
    const lastDayDueMonth = new Date(y, m + 1, 0).getDate();
    const safeDue = Math.min(card.dueDay, lastDayDueMonth);
    const dueDateObj = new Date(y, m, safeDue);

    isOverdue = !isPaid && todayObj > dueDateObj;
  }

  const unavailable = isLoadingInvoice || !!invoiceError || !invoiceData;
  const isPayDisabled = unavailable || isPaid || isEmpty;

  let btnClass =
    "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/20 text-white";
  let btnText = "Adiantar Fatura";

  if (isPayDisabled) {
    btnClass =
      "bg-bg-surface-hover text-text-muted cursor-not-allowed shadow-none border border-border-divider";
    btnText = unavailable ? "Fatura indisponível" : isPaid ? "Fatura Paga" : "Fatura Zerada";
  } else if (isOverdue) {
    btnClass = "bg-rose-600 hover:bg-rose-500 shadow-rose-900/20 text-white";
    btnText = "Pagar Atrasada";
  } else if (isClosed) {
    btnClass = "bg-amber-600 hover:bg-amber-500 shadow-amber-900/20 text-white";
    btnText = "Pagar Fatura";
  }

  return typeof document === "undefined" ? null : createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-bg-base/90 backdrop-blur-sm cursor-pointer"
          />

          {/* Container Principal */}
          <motion.div
            ref={dialogRef}
            tabIndex={-1}
            layoutId={`card-container-${card.id}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative w-full max-w-lg bg-bg-surface border border-border-divider rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col h-[85vh] sm:max-h-[85vh] z-10 shadow-2xl">
            {/* NAVEGADOR DE DATA */}
            <div className="flex shrink-0 justify-between items-center gap-2 px-2 relative">
              <div className="flex items-center justify-between bg-bg-base/50 p-2 rounded-xl border border-border-divider/50 my-2">
                <button
                  type="button"
                  disabled={!canGoBack}
                  onClick={() => onChangeMonth(-1)}
                  aria-label="Mês anterior da fatura"
                  className={`p-2 rounded-lg transition ${canGoBack ? "text-text-muted hover:text-text-main hover:bg-bg-surface-hover cursor-pointer" : "text-text-muted/30 cursor-not-allowed"}`}
                >
                  <ChevronLeft size={16} />
                </button>
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-text-muted" />
                  <span className="text-sm font-bold text-text-main capitalize select-none">
                    {viewDateFormatted}
                  </span>
                </div>
                <button
                  type="button"
                  disabled={!canGoForward}
                  onClick={() => onChangeMonth(1)}
                  aria-label="Próximo mês da fatura"
                  className={`p-2 rounded-lg transition ${canGoForward ? "text-text-muted hover:text-text-main hover:bg-bg-surface-hover cursor-pointer" : "text-text-muted/30 cursor-not-allowed"}`}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
              <button
                type="button"
                onClick={() => onClose()}
                aria-label="Fechar detalhes da fatura"
                data-dialog-close
                className="shrink-0 p-3 text-rose-500 hover:bg-rose-500/10 rounded-xl cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            {/* O BANNER DO CARTÃO */}
            <motion.div
              layoutId={`card-visual-${card.id}`}
              className={`w-full p-6 flex flex-col justify-between relative shrink-0 z-20 shadow-md ${styles.bg}`}
              style={styles.style}
            >
              <div className="flex flex-wrap gap-2 justify-between items-start z-10">
                <div>
                  <p id={titleId} className="text-[10px] uppercase font-bold text-white/70 tracking-widest mb-1">
                    {card.name} •••• {card.last4Digits}
                  </p>
                  <p className="text-4xl [overflow-wrap:anywhere] font-bold text-white tracking-tight drop-shadow-md">
                    {unavailable ? "—" : formatCurrency(totalAmount)}
                  </p>
                  {!unavailable&&<p className="text-xs text-white/90 mt-2">Consumo original · Saldo pagável: {formatCurrency(payableAmount)} · Crédito: {formatCurrency(card.creditBalance??0)}</p>}

                  {/* DATAS DE FECHAMENTO E VENCIMENTO */}
                  <div className="flex gap-4 mt-3 text-[10px] uppercase font-bold tracking-wider text-white/90">
                    <div
                      className="flex items-center gap-1.5"
                      title="Data em que as compras passam para o próximo mês"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                      Fecha: {closingDateStr}
                    </div>
                    <div
                      className="flex items-center gap-1.5"
                      title="Data limite para pagamento"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      Vence: {dueDateStr}
                    </div>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border backdrop-blur-md shadow-sm uppercase tracking-wider
                    ${
                      invoiceData?.status === "OPEN"
                        ? "text-blue-100 border-blue-400/30 bg-blue-500/30"
                        : invoiceData?.status === "PAID"
                          ? "text-emerald-100 border-emerald-400/30 bg-emerald-500/30"
                          : "text-amber-100 border-amber-400/30 bg-amber-500/30"
                    }`}
                >
                  {unavailable ? "Indisponível" : invoiceData?.status === "OPEN"
                    ? "Aberta"
                    : invoiceData?.status === "PAID"
                      ? "Paga"
                      : "Fechada"}
                </span>
              </div>
            </motion.div>

            {/* CORPO DA FATURA (Lista de Transações) */}
            <div className="flex-1 overflow-y-auto custom-scroll p-4 space-y-2 bg-bg-base/50 relative">
              {isLoadingInvoice ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-16 bg-bg-surface-hover/50 rounded-xl animate-pulse"
                    />
                  ))}
                </div>
              ) : invoiceError || !invoiceData ? (
                <DataLoadError onRetry={() => onRetry?.().catch(() => undefined)} />
              ) : transactions.length > 0 ? (
                transactions.map((t) => {
                  const isEditing = editingTxId === t.id;
                  const catName = t.categoryName || "Geral";
                  const temporal = normalizeOperationTemporal(t);

                  return (
                    <div
                      key={t.id}
                      className="flex justify-between items-center p-3.5 bg-bg-surface border border-border-divider/50 hover:bg-bg-surface-hover rounded-xl transition group"
                    >
                      <div className="flex items-center gap-3 flex-1 mr-4 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-bg-base border border-border-divider flex items-center justify-center text-text-muted group-hover:text-text-main transition-colors shrink-0">
                          <ShoppingBag size={16} />
                        </div>

                        {isEditing ? (
                          <div className="flex-1 flex flex-col gap-1 pr-2">
                            <input
                              autoFocus
                              value={editTxData.description}
                              onChange={(e) =>
                                setEditTxData({
                                  ...editTxData,
                                  description: e.target.value,
                                })
                              }
                              className="bg-bg-base text-text-main text-sm px-2 py-1 rounded outline-none border border-border-divider w-full"
                            />
                            <select
                              value={editTxData.categoryId}
                              onChange={(e) =>
                                setEditTxData({
                                  ...editTxData,
                                  categoryId: e.target.value,
                                })
                              }
                              className="bg-bg-base text-text-muted text-xs px-2 py-1 rounded outline-none border border-border-divider w-full"
                            >
                              {categories?.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-text-main truncate">
                              {t.description}
                            </p>
                            <p className="text-[10px] text-text-muted flex items-center gap-1 mt-0.5">
                              {formatCalendarDate(t.date)}{" "}
                              <span className="w-1 h-1 bg-zinc-700 rounded-full shrink-0"></span>{" "}
                              <span className="truncate">{catName}</span>
                            </p>
                            <details className="text-[10px] text-text-muted mt-1 break-all">
                              <summary className="cursor-pointer">Horário e registro</summary>
                              <p>Hora: <span aria-label={temporal.time ? "Horário informado" : "Horário não informado"}>{temporal.time ?? "—"}</span></p>
                              <p>Registro do servidor: {temporal.recordedAt ?? "Indisponível"}</p>
                              {temporal.legacyCreatedAtRaw && <p>{temporal.legacyCreatedAtRaw} · Fuso desconhecido</p>}
                            </details>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span
                          className={`text-sm font-bold whitespace-nowrap ${t.amount < 0 ? "text-emerald-500" : "text-text-main"}`}
                        >
                          {formatCurrency(t.amount)}
                        </span>

                        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                          {isEditing ? (
                            <>
                              <button
                                onClick={() => {
                                  onUpdateTransaction?.(t.id, editTxData);
                                  setEditingTxId(null);
                                }}
                                className="p-1.5 text-emerald-500 hover:bg-emerald-500/10 rounded cursor-pointer"
                              >
                                <Check size={14} />
                              </button>
                              <button
                                onClick={() => setEditingTxId(null)}
                                className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded cursor-pointer"
                              >
                                <X size={14} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => {
                                  setEditTxData({
                                    description: t.description,
                                    categoryId: "",
                                  });
                                  setEditingTxId(t.id);
                                }}
                                className="p-1.5 text-text-muted hover:text-text-main rounded cursor-pointer"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                onClick={() => onDeleteTransaction?.(t.id)}
                                className="p-1.5 text-text-muted hover:text-rose-500 rounded cursor-pointer"
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-text-muted py-10">
                  <Receipt size={32} className="mb-2 opacity-20" />
                  <p className="text-sm">Sem lançamentos.</p>
                </div>
              )}
            </div>

            {/* RODAPÉ (Ações Rápidas) */}
            <div className="p-4 bg-bg-surface border-t border-border-divider shrink-0">
              <div className="flex items-center justify-between mb-4 px-1">
                {isEditingLimit ? (
                  <div className="flex items-center gap-2 bg-bg-base p-1 rounded-lg border border-border-divider">
                    <input
                      autoFocus
                      type="number"
                      value={tempLimit}
                      onChange={(e) => setTempLimit(e.target.value)}
                      className="w-20 bg-transparent text-right px-2 py-1 outline-none text-text-main font-bold text-xs"
                      placeholder="Limite"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        onUpdateLimit(Number(tempLimit));
                        setIsEditingLimit(false);
                      }}
                      className="p-1 text-emerald-500 hover:bg-emerald-500/10 rounded cursor-pointer"
                    >
                      <Check size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingLimit(false)}
                      className="p-1 text-rose-500 hover:bg-rose-500/10 rounded cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setTempLimit(card.limit.toString());
                      setIsEditingLimit(true);
                    }}
                    className="text-text-muted hover:text-text-main font-bold flex items-center gap-1.5 py-1 transition text-xs cursor-pointer"
                  >
                    Limite: {formatCurrency(card.limit)}
                    <Pencil size={12} />
                  </button>
                )}

                <button
                  type="button"
                  onClick={onDelete}
                  className="text-rose-500/70 hover:text-rose-500 font-bold flex items-center gap-1.5 transition text-xs cursor-pointer"
                >
                  Excluir
                  <Trash2 size={12} />
                </button>
              </div>

              <button
                type="button"
                onClick={onPay}
                disabled={isPayDisabled}
                className={`w-full font-bold py-3.5 rounded-xl transition flex items-center justify-center gap-2 shadow-lg cursor-pointer ${btnClass}`}
              >
                <Banknote size={18} />
                {btnText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>, document.body
  );
}
