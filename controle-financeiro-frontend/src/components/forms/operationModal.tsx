"use client";

import { Modal } from "@/components/ui/modal";
import { useToast } from "@/contexts/toastContext";
import { useFinanceData } from "@/hooks/useFinanceData";
import { investmentService } from "@/services/investmentService";
import { ApiError } from "@/services/api";
import { Investment, InvestTransType } from "@/types";
import { formatCurrency } from "@/utils/format";
import { localDateString } from "@/utils/date";
import {
  Calendar,
  DollarSign,
  Loader2,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { PrivacyBlur } from "../ui/privacyBlur";
import { useCreationIntent } from "@/hooks/useCreationIntent";
import { CreationRecovery } from "./creationRecovery";
import type { CreationCommand } from "@/services/creationIntent";
import { useUser } from "@/hooks/useUser";
import { subscribeToSessionChange } from "@/actions/sessionBoundary";

interface OperationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onReconcile?: () => void | Promise<void>;
  asset: Investment | null;
}

type TabType = "BUY" | "SELL" | "DIVIDEND" | "UPDATE_BALANCE";

export function OperationModal({
  isOpen,
  onClose,
  onSuccess,
  onReconcile,
  asset,
}: OperationModalProps) {
  const { accounts } = useFinanceData();
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const submitting = useRef<symbol | null>(null);
  const visualInstance = useRef({ active: false });
  const session = useRef({ active: false });
  const [activeTab, setActiveTab] = useState<TabType>("BUY");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [totalValue, setTotalValue] = useState("");
  const [date, setDate] = useState("");
  const [accountId, setAccountId] = useState("");
  const [reason, setReason] = useState("");
  const [fees, setFees] = useState("");
  const initializedAsset = useRef<string | null>(null);
  const toast = useToast();
  const intent = useCreationIntent("INVESTMENT_OPERATION");
  const send = (command: CreationCommand) => {
    if (!("investmentId" in command)) throw new Error("Tipo de intenção inválido.");
    return investmentService.operation(command);
  };

  // Visual replacement must not invalidate the durable financial intention.
  // Session/unmount invalidation also covers valuation, which has no creation receipt.
  useLayoutEffect(() => {
    const scope = { active: true };
    session.current = scope;
    const invalidate = () => { scope.active = false; };
    window.addEventListener("sessionExpired", invalidate);
    const unsubscribe = subscribeToSessionChange(invalidate);
    return () => { invalidate(); unsubscribe(); window.removeEventListener("sessionExpired", invalidate); };
  }, [user?.id]);

  useLayoutEffect(() => {
    const instance = { active: isOpen && !!asset?.id };
    visualInstance.current = instance;
    submitting.current = null;
    setIsLoading(false);
    return () => { instance.active = false; };
  }, [isOpen, asset?.id, user?.id]);

  const captureExecution = () => {
    const scope = session.current;
    const instance = visualInstance.current;
    return {
      sessionCurrent: () => scope.active && session.current === scope,
      visualCurrent: () => scope.active && session.current === scope &&
        instance.active && visualInstance.current === instance,
    };
  };
  const close = () => { visualInstance.current.active = false; onClose(); };
  const recoverOrRetry = async (action: () => ReturnType<typeof intent.recover>) => {
    const execution = captureExecution();
    const command = intent.pending?.command;
    const belongsToAsset = command && "investmentId" in command && command.investmentId === asset?.id;
    const outcome = await action();
    if (outcome === "confirmed" && execution.sessionCurrent()) {
      onSuccess();
      if (belongsToAsset && execution.visualCurrent()) close();
    }
  };

  const selectedAccountBalance =
    accounts.find((a) => a.id === accountId)?.balance || 0;
  const isFixedIncome =
    asset?.type === "FIXED_INCOME" || asset?.type === "TREASURY";

  useEffect(() => {
    if (!isOpen) {
      initializedAsset.current = null;
      return;
    }
    const assetKey = `${user?.id}:${asset?.id}`;
    if (!asset || initializedAsset.current === assetKey) return;
    initializedAsset.current = assetKey;
    if (isOpen && asset) {
      setActiveTab(isFixedIncome ? "UPDATE_BALANCE" : "BUY");
      setQuantity("");
      setPrice("");
      setTotalValue("");
      setReason(""); setFees("");
      setAccountId(accounts.length > 0 ? accounts[0].id : "");
      setDate(localDateString());
      setIsLoading(false);
    }
  }, [isOpen, asset, accounts, isFixedIncome, user?.id]);

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!asset || submitting.current || intent.pending || intent.blocked || intent.busy) return;
    const execution = captureExecution();
    if (!execution.visualCurrent()) return;
    const submission = Symbol("investment execution");
    submitting.current = submission;
    setIsLoading(true);

    try {
      if (activeTab === "UPDATE_BALANCE") {
        await investmentService.updateBalance({
          investmentId: asset.id,
          newBalance: Number(totalValue),
          date, source: "USER_PROVIDED", reason,
        });
      } else {
        let qtdFinal = 0;
        let priceFinal = 0;

        if (isFixedIncome && activeTab !== "DIVIDEND") {
          qtdFinal = Number(totalValue);
          priceFinal = 1;
        } else {
          qtdFinal = Number(quantity);
          priceFinal = Number(price);
          if (activeTab === "DIVIDEND") {
            qtdFinal = 1;
            priceFinal = Number(price);
          }
        }

        const success = await intent.start({
          investmentId: asset.id,
          amount: isFixedIncome && activeTab === "SELL" ? totalValue : undefined,
          type:
            activeTab === "DIVIDEND"
              ? "DIVIDEND"
              : (activeTab as InvestTransType),
          quantity: qtdFinal,
          price: priceFinal,
          date: date,
          accountId: accountId,
          fees: Number(fees || 0),
        }, send, `${asset.ticker} — ${activeTab}`);
        if (success !== "confirmed") {
          if (execution.sessionCurrent() && (success === "unknown" || success === "rejected")) await onReconcile?.();
          return;
        }
      }

      if (execution.sessionCurrent()) onSuccess();
      if (execution.visualCurrent()) close();
    } catch (error: unknown) {
      if (execution.visualCurrent()) toast.error(error instanceof Error ? error.message : "Erro ao realizar operação.");

      if (execution.sessionCurrent() && error instanceof ApiError && error.requiresReconciliation) {
        await onReconcile?.();
      }
    } finally {
      if (submitting.current === submission) submitting.current = null;
      if (execution.visualCurrent()) setIsLoading(false);
    }
  };

  if (!asset) return null;

  const renderFields = () => {
    if (activeTab === "DIVIDEND") return <div className="space-y-2">
      <label className="block text-sm">Valor bruto do provento (antes de retenções)
        <input required type="number" min="0.01" max="999999999999.99" step="0.01" value={price} onChange={e=>setPrice(e.target.value)} className="block w-full mt-1 bg-bg-base border border-border-divider rounded-xl p-3" />
      </label>
      <p className="text-xs text-text-muted">A retenção é parte do provento. A conta recebe apenas o líquido: {formatCurrency(Number(price||0)-Number(fees||0))}.</p>
    </div>;
    // 1. AJUSTE DE SALDO
    if (activeTab === "UPDATE_BALANCE") {
      return (
        <div>
          <label className="text-xs text-text-muted font-bold uppercase ml-1">
            Saldo Atualizado (Conforme Banco)
          </label>
          <div className="relative mt-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted font-bold">
              R$
            </span>
            <input
              required
              autoFocus
              type="number"
              step="0.01"
              min="0"
              value={totalValue}
              aria-label="Valor informado"
              onChange={(e) => setTotalValue(e.target.value)}
              className="w-full bg-bg-base border border-border-divider rounded-xl py-3 pl-10 pr-4 text-xl font-bold text-text-main focus:outline-none focus:border-blue-500"
              placeholder="0,00"
            />
          </div>
          <p className="text-[10px] text-text-muted mt-2 ml-1">
            Avaliação da posição, sem entrada de dinheiro ou renda realizada. Informe a data e o motivo da avaliação.
          </p>
          <label className="block mt-3">Motivo da avaliação<input required maxLength={500} value={reason} onChange={e=>setReason(e.target.value)} className="block w-full bg-bg-base rounded-lg border border-border-divider p-2" /></label>
        </div>
      );
    }

    // 2. RENDA FIXA (Aporte/Resgate)
    if (isFixedIncome) {
      return (
        <div>
          <label className="text-xs text-text-muted font-bold uppercase ml-1">
            Valor da Operação
          </label>
          <div className="relative mt-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted font-bold">
              R$
            </span>
            <input
              required
              autoFocus
              type="number"
              step="0.01"
              min="0"
              value={totalValue}
              aria-label="Valor informado"
              onChange={(e) => setTotalValue(e.target.value)}
              className="w-full bg-bg-base border border-border-divider rounded-xl py-3 pl-10 pr-4 text-xl font-bold text-text-main focus:outline-none focus:border-emerald-500"
              placeholder="0,00"
            />
          </div>
        </div>
      );
    }

    // 3. RENDA VARIÁVEL (Aporte/Resgate/Dividendo)
    return (
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-text-muted font-bold uppercase ml-1">
            Quantidade
          </label>
          <input
            required
            type="number"
            step="0.0000001"
            min="0"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full mt-1 bg-bg-base border border-border-divider rounded-xl py-3 px-4 text-text-main font-bold focus:outline-none focus:border-emerald-500"
            placeholder="0"
          />
        </div>
        <div>
          <label className="text-xs text-text-muted font-bold uppercase ml-1">
            Preço Unitário
          </label>
          <div className="relative mt-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-xs font-bold">
              R$
            </span>
            <input
              required
              type="number"
              step="0.01"
              value={price}
              min="0"
              onChange={(e) => setPrice(e.target.value)}
              className="w-full bg-bg-base border border-border-divider rounded-xl py-3 pl-8 pr-4 text-text-main font-bold focus:outline-none focus:border-emerald-500"
              placeholder="0,00"
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={close}
      title={`${asset.ticker} - Operação`}
    >
      <div className="space-y-5 mt-1">
        <CreationRecovery busy={intent.busy} message={intent.message} pending={intent.pending}
          recover={() => { void recoverOrRetry(intent.recover); }}
          retry={() => { void recoverOrRetry(() => intent.retry(send)); }} />
        <fieldset disabled={isLoading || intent.busy || !!intent.pending || intent.blocked} className="space-y-5">
        {/* TABS DE OPERAÇÃO */}
        <div className="flex bg-bg-base p-1 rounded-xl border border-border-divider overflow-x-auto custom-scroll">
          {isFixedIncome && (
            <button
              type="button"
              onClick={() => setActiveTab("UPDATE_BALANCE")}
              className={`flex-1 py-2 px-2 text-[10px] sm:text-xs font-bold rounded-lg transition whitespace-nowrap flex items-center justify-center gap-1 ${activeTab === "UPDATE_BALANCE" ? "bg-blue-500/10 text-blue-500 border border-blue-500/20" : "text-text-muted hover:text-text-main"}`}
            >
              <RefreshCw size={14} /> Ajustar Saldo
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab("BUY")}
            className={`flex-1 py-2 px-3 text-[10px] sm:text-xs font-bold rounded-lg transition whitespace-nowrap flex items-center justify-center gap-1 ${activeTab === "BUY" ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "text-text-muted hover:text-text-main"}`}
          >
            <TrendingUp size={14} /> {isFixedIncome ? "Aportar" : "Comprar"}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("SELL")}
            className={`flex-1 py-2 px-3 text-[10px] sm:text-xs font-bold rounded-lg transition whitespace-nowrap flex items-center justify-center gap-1 ${activeTab === "SELL" ? "bg-rose-500/10 text-rose-500 border border-rose-500/20" : "text-text-muted hover:text-text-main"}`}
          >
            <TrendingDown size={14} /> {isFixedIncome ? "Resgatar" : "Vender"}
          </button>

          {!isFixedIncome && (
            <button
              type="button"
              onClick={() => setActiveTab("DIVIDEND")}
              className={`flex-1 py-2 px-3 text-[10px] sm:text-xs font-bold rounded-lg transition whitespace-nowrap flex items-center justify-center gap-1 ${activeTab === "DIVIDEND" ? "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20" : "text-text-muted hover:text-text-main"}`}
            >
              <DollarSign size={14} /> Proventos
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {renderFields()}
          {activeTab === "UPDATE_BALANCE" && <label className="block">Data da avaliação<input type="date" required value={date} onChange={e=>setDate(e.target.value)} className="block w-full p-2 bg-bg-base border border-border-divider rounded-lg" /></label>}
          {activeTab !== "UPDATE_BALANCE" && <label className="block">Taxas / retenções<input type="number" min="0" step="0.01" value={fees} onChange={e=>setFees(e.target.value)} className="block w-full p-2 bg-bg-base border border-border-divider rounded-lg" /></label>}

          {/* CAMPOS COMUNS (Conta e Data) - Não exibe para Ajuste de Saldo */}
          {activeTab !== "UPDATE_BALANCE" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-text-muted font-bold uppercase ml-1">
                  Data
                </label>
                <div className="relative mt-1">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-bg-base border border-border-divider rounded-xl py-2.5 pl-10 pr-2 text-text-main text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-text-muted font-bold uppercase ml-1">
                  Conta
                </label>
                <div className="relative mt-1">
                  <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <select
                    required
                    value={accountId}
                    aria-label="Conta"
                    onChange={(e) => setAccountId(e.target.value)}
                    className="w-full bg-bg-base border border-border-divider rounded-xl py-2.5 pl-10 pr-4 text-text-main text-sm focus:outline-none focus:border-emerald-500 appearance-none cursor-pointer"
                  >
                    {accounts.map((acc) => (
                      <option
                        key={acc.id}
                        value={acc.id}
                        className="bg-bg-surface"
                      >
                        {acc.name}
                      </option>
                    ))}
                  </select>
                </div>
                {/* VISUALIZADOR DE SALDO */}
                {accountId && (
                  <p className="text-[10px] text-text-muted mt-1 ml-1 flex items-center justify-between">
                    <span>Disponível:</span>
                    <PrivacyBlur
                      className={
                        selectedAccountBalance < 0
                          ? "text-rose-500"
                          : "text-emerald-500"
                      }
                    >
                      {formatCurrency(selectedAccountBalance)}
                    </PrivacyBlur>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* BOTÃO DE SUBMIT */}
          <button
            disabled={isLoading || intent.busy || !!intent.pending || intent.blocked}
            type="submit"
            className={`w-full font-bold py-3.5 rounded-xl mt-2 flex justify-center items-center gap-2 transition cursor-pointer text-white shadow-lg
                    ${
                      activeTab === "BUY" || activeTab === "UPDATE_BALANCE"
                        ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/20"
                        : activeTab === "SELL"
                          ? "bg-rose-600 hover:bg-rose-500 shadow-rose-900/20"
                          : "bg-yellow-600 hover:bg-yellow-500 shadow-yellow-900/20"
                    }
                `}
          >
            {isLoading ? (
              <Loader2 className="animate-spin" />
            ) : (
              "Confirmar Operação"
            )}
          </button>
        </form>
        </fieldset>
      </div>
    </Modal>
  );
}
