"use client";

import { Modal } from "@/components/ui/modal";
import { useToast } from "@/contexts/toastContext";
import { transactionService } from "@/services/transactionService";
import { Account, Category, TransactionType } from "@/types";
import { useCreationIntent } from "@/hooks/useCreationIntent";
import { CreationRecovery } from "./creationRecovery";
import { formatCurrency } from "@/utils/format";
import { localDateString } from "@/utils/date";
import { ChevronDown, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface NewTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  accounts: Account[];
  categories: Category[];
  initialDate?: string;
}

export function NewTransactionModal({
  isOpen,
  onClose,
  onSuccess,
  accounts,
  categories,
  initialDate,
}: NewTransactionModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const submitting = useRef(false);
  const [type, setType] = useState<TransactionType>("EXPENSE");
  const toast = useToast();
  const intent = useCreationIntent("TRANSACTION_CREATE");
  const send = (command: import("@/services/creationIntent").CreationCommand) => {
    if (!("description" in command)) throw new Error("Tipo de intenção inválido.");
    return transactionService.create(command);
  };
  const confirmed = () => {
    onClose(); onSuccess(); window.dispatchEvent(new Event("refreshExtract"));
  };

  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    date: "",
    time: "",
    accountId: "",
    categoryId: "",
    isPaid: true,
    destinationAccountId: "",
    fee: "0.00",
  });

  useEffect(() => {
    if (isOpen) {
      const openedAt = new Date();
      setFormData((prev) => ({
        ...prev,
        date: initialDate || localDateString(openedAt),
        time: openedAt.toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        description: "",
        amount: "",
        isPaid: true,
      }));
      setIsLoading(false);
    }
  }, [isOpen, initialDate]);

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (submitting.current || intent.pending || intent.blocked || intent.busy) return;
    submitting.current = true;
    setIsLoading(true);

    try {
      const success = await intent.start({
        description: formData.description,
        amount: formData.amount,
        date: formData.date,
        time: formData.time || null,
        type,
        accountId: formData.accountId,
        categoryId: type === "TRANSFER" ? "" : formData.categoryId,
        isPaid: formData.isPaid,
        ...(type === "TRANSFER" ? {destinationAccountId: formData.destinationAccountId, fee: formData.fee} : {}),
      }, send);
      if (success === "confirmed") confirmed();
    } catch (error) {
      toast.error("Erro ao criar transação. Verifique se preencheu tudo.");
      console.error(error);
    } finally {
      submitting.current = false;
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nova Transação">
      <form onSubmit={handleSubmit} className="space-y-4 mt-2">
        <CreationRecovery busy={intent.busy} message={intent.message} pending={intent.pending}
          recover={() => { void intent.recover().then(outcome => { if (outcome === "confirmed") confirmed(); }); }}
          retry={() => { void intent.retry(send).then(outcome => { if (outcome === "confirmed") confirmed(); }); }} />
        <fieldset disabled={isLoading || intent.busy || !!intent.pending || intent.blocked} className="space-y-4">
        {/* TIPO (Receita / Despesa) */}
        <div className="grid grid-cols-3 gap-2 p-1 bg-bg-base rounded-xl border border-border-divider">
          <button
            type="button"
            onClick={() => setType("EXPENSE")}
            className={`py-2 rounded-lg text-sm font-bold transition-all ${type === "EXPENSE" ? "bg-rose-500/10 text-rose-500 shadow-sm border border-rose-500/20" : "text-text-muted hover:text-text-main"}`}
          >
            Despesa
          </button>
          <button
            type="button"
            onClick={() => setType("INCOME")}
            className={`py-2 rounded-lg text-sm font-bold transition-all ${type === "INCOME" ? "bg-emerald-500/10 text-emerald-500 shadow-sm border border-emerald-500/20" : "text-text-muted hover:text-text-main"}`}
          >
            Receita
          </button>
          <button type="button" onClick={()=>setType("TRANSFER")} className={`py-2 rounded-lg text-sm font-bold ${type==="TRANSFER"?"text-emerald-500 bg-emerald-500/10":"text-text-muted"}`}>Transferência</button>
        </div>

        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!formData.isPaid} onChange={e=>setFormData({...formData,isPaid:!e.target.checked})}/>Registrar previsão (sem movimentar saldo)</label>
        {!formData.isPaid&&<p className="text-sm text-text-muted">A data é o vencimento previsto. Realize a baixa pelo extrato quando ocorrer o movimento bancário.</p>}

        {/* VALOR E DESCRIÇÃO OMITIDOS PARA BREVIDADE */}
        <div>
          <label className="text-xs text-text-muted font-bold uppercase ml-1">
            Valor
          </label>
          <div className="relative mt-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted font-bold">
              R$
            </span>
            <input
              type="number"
              aria-label="Valor do lançamento"
              step="0.01"
              required
              placeholder="0,00"
              value={formData.amount}
              min="0.01"
              max="999999999999.99"
              onChange={(e) =>
                setFormData({ ...formData, amount: e.target.value })
              }
              className="w-full bg-bg-base border border-border-divider rounded-xl py-3 pl-10 pr-4 text-xl font-bold text-text-main focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-text-muted font-bold uppercase ml-1">
            Descrição
          </label>
          <input
            type="text"
            aria-label="Descrição do lançamento"
            required
            placeholder="Ex: Mercado, Salário..."
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className="w-full mt-1 bg-bg-base border border-border-divider rounded-xl py-3 px-4 text-text-main focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-text-muted font-bold uppercase ml-1">
              Data
            </label>
            <input
              type="date"
              aria-label="Data do lançamento"
              required
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
              className="w-full mt-1 bg-bg-base border border-border-divider rounded-xl py-3 px-4 text-text-main focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
          <div>
            <label className="text-xs text-text-muted font-bold uppercase ml-1">
              Hora
            </label>
            <input
              type="time"
              aria-label="Horário informado (opcional)"
              value={formData.time}
              onChange={(e) =>
                setFormData({ ...formData, time: e.target.value })
              }
              className="w-full mt-1 bg-bg-base border border-border-divider rounded-xl py-3 px-4 text-text-main focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-text-muted font-bold uppercase ml-1">
              Categoria
            </label>
            <div className="relative mt-1" hidden={type==="TRANSFER"}>
              <select
                required={type!=="TRANSFER"}
                aria-label="Categoria do lançamento"
                value={formData.categoryId}
                onChange={(e) =>
                  setFormData({ ...formData, categoryId: e.target.value })
                }
                className="w-full bg-bg-base border border-border-divider rounded-xl py-3 px-4 text-text-main appearance-none focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option
                  value=""
                  disabled
                  className="bg-bg-surface text-text-muted"
                >
                  Selecione
                </option>
                {categories.filter(cat=>cat.type===type).map((cat) => (
                  <option key={cat.id} value={cat.id} className="bg-bg-surface">
                    {cat.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="text-xs text-text-muted font-bold uppercase ml-1">
              Conta
            </label>
            <div className="relative mt-1">
              <select
                required
                aria-label="Conta do lançamento"
                value={formData.accountId}
                onChange={(e) =>
                  setFormData({ ...formData, accountId: e.target.value })
                }
                className="w-full bg-bg-base border border-border-divider rounded-xl py-3 px-4 text-text-main appearance-none focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option
                  value=""
                  disabled
                  className="bg-bg-surface text-text-muted"
                >
                  Selecione
                </option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id} className="bg-bg-surface">
                    {acc.name} • {formatCurrency(acc.balance)}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
            </div>
          </div>
        </div>

        {type==="TRANSFER"&&<div className="space-y-3">
          <label className="block text-sm">Conta destino<select required value={formData.destinationAccountId} onChange={e=>setFormData({...formData,destinationAccountId:e.target.value})} className="w-full bg-bg-base border border-border-divider rounded-xl p-3">
            <option value="">Selecione</option>{accounts.filter(a=>a.id!==formData.accountId).map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
          </select></label>
          <label className="block text-sm">Taxa da transferência<input type="number" min="0" max="999999999999.99" step="0.01" required value={formData.fee} onChange={e=>setFormData({...formData,fee:e.target.value})} className="w-full bg-bg-base border border-border-divider rounded-xl p-3"/></label>
        </div>}

        <button
          type="submit"
          disabled={isLoading || intent.busy || !!intent.pending || intent.blocked}
          className="w-full mt-4 bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-3.5 rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            "Salvar Transação"
          )}
        </button>
        </fieldset>
      </form>
    </Modal>
  );
}
