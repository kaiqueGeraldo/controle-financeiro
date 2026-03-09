"use client";

import { useState, useEffect, useRef } from "react";
import { Modal } from "@/components/ui/modal";
import { cardService } from "@/services/cardService";
import { Account } from "@/types";
import {
  Loader2,
  Wallet,
  Calendar,
  DollarSign,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";

interface PayInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  cardId: string;
  cardName: string;
  accounts: Account[];
  currentInvoiceValue: number;
  month: number;
  year: number;
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
}: PayInvoiceModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [accountId, setAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [isPrepayment, setIsPrepayment] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setAmount(currentInvoiceValue > 0 ? currentInvoiceValue.toFixed(2) : "");
      setAccountId(accounts.length > 0 ? accounts[0].id : "");
      setIsPrepayment(false);
      setIsLoading(false);
      setErrorMessage(null);
      setDate(new Date().toISOString().split("T")[0]);
      setTime(
        new Date().toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
    }
  }, [isOpen, currentInvoiceValue, accounts]);

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const valorNumerico = Number(amount);

      await cardService.payInvoice(cardId, {
        accountId,
        amount: valorNumerico,
        date,
        time,
        month,
        year,
        isPrepayment,
        description: isPrepayment
          ? "Adiantamento de Fatura"
          : "Pagamento de Fatura",
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      setErrorMessage(error?.message || "Erro ao processar pagamento.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
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
          <label className="text-xs text-text-muted font-bold uppercase ml-1">
            Pagar com
          </label>
          <div className="relative mt-1">
            <Wallet className="absolute left-4 top-3 w-4 h-4 text-text-muted" />
            <select
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
          <label className="text-xs text-text-muted font-bold uppercase ml-1">
            Valor do Pagamento
          </label>
          <div className="relative mt-1">
            <DollarSign className="absolute left-4 top-3 w-4 h-4 text-text-muted" />
            <input
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
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <p className="text-xs text-rose-400 font-medium">{errorMessage}</p>
          </div>
        )}

        {/* Data e Hora */}
        <div className="grid grid-cols-2 gap-3">
          {/* Data */}
          <div>
            <label className="text-xs text-text-muted font-bold uppercase ml-1">
              Data do Pagamento
            </label>
            <input
              required
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-bg-base border border-border-divider rounded-xl py-3 pl-4 pr-4 text-text-main focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Hora */}
          <div>
            <label className="text-xs text-text-muted font-bold uppercase ml-1">
              Hora
            </label>
            <input
              type="time"
              required
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full bg-bg-base border border-border-divider rounded-xl py-3 pl-4 pr-4 text-text-main focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <button
          disabled={isLoading}
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
