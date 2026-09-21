"use client";

import { Modal } from "@/components/ui/modal";
import { ApiError } from "@/services/api";
import { cardService } from "@/services/cardService";
import { Account } from "@/types";
import { localDateString } from "@/utils/date";
import { ReconciliationCancelledError } from "@/utils/financialReconciliation";
import {
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Loader2,
  Wallet
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRequestCoordinator } from "@/hooks/useRequestCoordinator";

interface PayInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void | Promise<void>;
  cardId: string;
  cardName: string;
  accounts: Account[];
  currentInvoiceValue: number;
  month: number;
  year: number;
  ownerId?: string;
}

function confirmedReconciliationMessage(error: unknown) {
  return error instanceof ReconciliationCancelledError
    ? "Pagamento confirmado, mas a atualização foi cancelada ou substituída. Atualize os dados novamente; o pagamento não será reenviado."
    : "Pagamento confirmado, mas a atualização da tela falhou. Tente reconciliar novamente; o pagamento não será reenviado.";
}

export function PayInvoiceModal({
  isOpen,
  onClose,
  onSuccess,
  cardId,
  cardName,
  accounts,
  currentInvoiceValue,
  month,
  year,
  ownerId,
}: PayInvoiceModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const submitting = useRef(false);
  const [accountId, setAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [isPrepayment, setIsPrepayment] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const initializedInvoice = useRef<string | null>(null);
  const [outcome, setOutcome] = useState<"ready" | "confirmed" | "unknown">("ready");
  const outcomeRef = useRef(outcome);
  const scope = `${ownerId}:${cardId}:${year}:${month}`;
  const requests = useRequestCoordinator(scope);
  const storageKey = ownerId ? `invoice-payment:${scope}` : null;
  const remember = (value: typeof outcome) => {
    outcomeRef.current = value;
    setOutcome(value);
    if (storageKey) {
      if (value === "ready") sessionStorage.removeItem(storageKey);
      else sessionStorage.setItem(storageKey, value);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      initializedInvoice.current = null;
      requests.invalidate();
      return;
    }
    const invoiceKey = scope;
    if (initializedInvoice.current === invoiceKey) return;
    initializedInvoice.current = invoiceKey;
    if (isOpen) {
      const openedAt = new Date();
      setAmount(currentInvoiceValue > 0 ? currentInvoiceValue.toFixed(2) : "");
      setAccountId(accounts.length > 0 ? accounts[0].id : "");
      setIsPrepayment(false);
      setIsLoading(false);
      submitting.current = false;
      const stored = storageKey ? sessionStorage.getItem(storageKey) : null;
      const initialOutcome = stored === "confirmed" || stored === "unknown" ? stored : "ready";
      outcomeRef.current = initialOutcome;
      setOutcome(initialOutcome);
      setErrorMessage(initialOutcome === "confirmed"
        ? "Pagamento confirmado. Atualize os dados para concluir a reconciliação."
        : initialOutcome === "unknown" ? "Não foi possível confirmar o pagamento. Atualize os dados e confira a fatura e o extrato; não repita o pagamento." : null);
      setDate(localDateString(openedAt));
      setTime(
        openedAt.toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
    }
  }, [isOpen, currentInvoiceValue, accounts, scope, storageKey, requests]);

  const reconcile = async () => {
    if (submitting.current) return;
    submitting.current = true;
    setIsLoading(true);
    const request = requests.begin("payment");
    try {
      await onSuccess();
      if (!request.isCurrent()) return;
      if (outcomeRef.current === "confirmed") {
        remember("ready");
        onClose();
      } else {
        setErrorMessage("Dados atualizados para conferência. O resultado deste pagamento continua desconhecido. Confira o extrato e a fatura; não repita a operação.");
      }
    } catch (error: unknown) {
      if (request.isCurrent()) setErrorMessage(outcomeRef.current === "confirmed"
        ? confirmedReconciliationMessage(error)
        : "Não foi possível confirmar o pagamento nem atualizar todos os dados. Tente atualizar novamente, sem reenviar a operação.");
    } finally {
      if (request.isCurrent()) { submitting.current = false; setIsLoading(false); }
      request.finish();
    }
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (submitting.current || outcomeRef.current !== "ready") return;
    submitting.current = true;
    setIsLoading(true);
    setErrorMessage(null);
    const request = requests.begin("payment");
    let confirmed = false;

    try {
      const valorNumerico = Number(amount);
      // Persist before dispatch: reload after a lost response must not offer a resend.
      remember("unknown");

      await cardService.payInvoice(cardId, {
        accountId,
        amount: valorNumerico,
        date,
        time: time || null,
        month,
        year,
        isPrepayment,
        description: isPrepayment
          ? "Adiantamento de Fatura"
          : "Pagamento de Fatura",
      });
      confirmed = true;
      if (storageKey) sessionStorage.setItem(storageKey, "confirmed");
      if (!request.isCurrent()) return;
      remember("confirmed");
      await onSuccess();
      if (!request.isCurrent()) return;
      remember("ready");
      onClose();
    } catch (error: unknown) {
      if (!request.isCurrent()) return;
      if (confirmed) {
        setErrorMessage(confirmedReconciliationMessage(error));
      } else if (error instanceof ApiError && !error.requiresReconciliation && error.status >= 400 && error.status < 500) {
        remember("ready");
        setErrorMessage(`Pagamento recusado: ${error.message}`);
      } else {
        setErrorMessage("Não foi possível confirmar o pagamento. Atualize os dados e confira a fatura e o extrato; não repita o pagamento.");
        // Even an unknown write invalidates every affected read.
        await Promise.resolve().then(onSuccess).catch(() => undefined);
      }
    } finally {
      if (request.isCurrent()) { submitting.current = false; setIsLoading(false); }
      request.finish();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => { if (!submitting.current) onClose(); }}
      title={`Pagar Fatura - ${cardName}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4 mt-2">
        {/* Toggle Tipo de Pagamento */}
        <div className="flex bg-bg-base p-1 rounded-xl border border-border-divider">
          <button
            type="button"
            onClick={() => setIsPrepayment(false)}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${!isPrepayment ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "text-text-muted hover:text-text-main"}`}
          >
            Fechamento
          </button>
          <button
            type="button"
            onClick={() => setIsPrepayment(true)}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${isPrepayment ? "bg-blue-500/10 text-blue-500 border border-blue-500/20" : "text-text-muted hover:text-text-main"}`}
          >
            Adiantamento
          </button>
        </div>

        {/* Conta de Origem */}
        <div>
          <label htmlFor="invoice-payment-account" className="text-xs text-text-muted font-bold uppercase ml-1">
            Pagar com
          </label>
          <div className="relative mt-1">
            <Wallet className="absolute left-4 top-3 w-4 h-4 text-text-muted" />
            <select
              id="invoice-payment-account"
              required
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full bg-bg-base border border-border-divider rounded-xl py-3 pl-10 pr-4 text-text-main appearance-none focus:outline-none focus:border-emerald-500 cursor-pointer text-sm"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} (Saldo: R$ {acc.balance.toFixed(2)})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Valor */}
        <div>
          <label htmlFor="invoice-payment-amount" className="text-xs text-text-muted font-bold uppercase ml-1">
            Valor do Pagamento
          </label>
          <div className="relative mt-1">
            <DollarSign className="absolute left-4 top-3 w-4 h-4 text-text-muted" />
            <input
              id="invoice-payment-amount"
              required
              type="number"
              step="0.01"
              value={amount}
              min="0"
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-bg-base border border-border-divider rounded-xl py-3 pl-10 pr-4 text-text-main focus:outline-none focus:border-emerald-500 font-bold"
              placeholder="0,00"
            />
          </div>
          {!isPrepayment && currentInvoiceValue > 0 && (
            <p className="text-[10px] text-text-muted mt-1 ml-1">
              Valor total da fatura: R${" "}
              {currentInvoiceValue.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}
            </p>
          )}
        </div>

        {/* FEEDBACK DE ERRO */}
        {errorMessage && (
          <div role="alert" className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <p className="text-xs text-rose-400 font-medium">{errorMessage}</p>
          </div>
        )}

        {/* Data e Hora */}
        <div className="grid grid-cols-2 gap-3">
          {/* Data */}
          <div>
            <label htmlFor="invoice-payment-date" className="text-xs text-text-muted font-bold uppercase ml-1">
              Data do Pagamento
            </label>
            <input
              id="invoice-payment-date"
              required
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-bg-base border border-border-divider rounded-xl py-3 pl-4 pr-4 text-text-main focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Hora */}
          <div>
            <label htmlFor="invoice-payment-time" className="text-xs text-text-muted font-bold uppercase ml-1">
              Hora
            </label>
            <input
              id="invoice-payment-time"
              type="time"
              aria-label="Horário informado (opcional)"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full bg-bg-base border border-border-divider rounded-xl py-3 pl-4 pr-4 text-text-main focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {outcome !== "ready" && !isLoading && (
          <button type="button" onClick={() => void reconcile()} className="w-full rounded-xl border border-border-divider p-3 font-bold">
            Atualizar dados sem repetir pagamento
          </button>
        )}
        <button
          disabled={isLoading || outcome !== "ready"}
          type="submit"
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl mt-2 flex justify-center items-center gap-2 transition cursor-pointer"
        >
          {isLoading ? (
            <Loader2 className="animate-spin" />
          ) : (
            <>
              <CheckCircle2 size={18} />
              Confirmar Pagamento
            </>
          )}
        </button>
      </form>
    </Modal>
  );
}
