"use client";

import { Modal } from "@/components/ui/modal";
import { useToast } from "@/contexts/toastContext";
import { useFinanceData } from "@/hooks/useFinanceData";
import { investmentService } from "@/services/investmentService";
import { Investment, InvestTransType } from "@/types";
import { formatCurrency } from "@/utils/format";
import {
  Calendar,
  DollarSign,
  Loader2,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useEffect, useState } from "react";
import { PrivacyBlur } from "../ui/privacyBlur";

interface OperationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  asset: Investment | null;
}

type TabType = "BUY" | "SELL" | "DIVIDEND" | "UPDATE_BALANCE";

export function OperationModal({
  isOpen,
  onClose,
  onSuccess,
  asset,
}: OperationModalProps) {
  const { accounts } = useFinanceData();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("BUY");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [totalValue, setTotalValue] = useState("");
  const [date, setDate] = useState("");
  const [accountId, setAccountId] = useState("");
  const toast = useToast();

  const selectedAccountBalance =
    accounts.find((a) => a.id === accountId)?.balance || 0;
  const isFixedIncome =
    asset?.type === "FIXED_INCOME" || asset?.type === "TREASURY";

  useEffect(() => {
    if (isOpen && asset) {
      setActiveTab(isFixedIncome ? "UPDATE_BALANCE" : "BUY");
      setQuantity("");
      setPrice("");
      setTotalValue("");
      setAccountId(accounts.length > 0 ? accounts[0].id : "");
      setDate(new Date().toISOString().split("T")[0]);
      setIsLoading(false);
    }
  }, [isOpen, asset, accounts, isFixedIncome]);

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!asset) return;
    setIsLoading(true);

    try {
      if (activeTab === "UPDATE_BALANCE") {
        await investmentService.updateBalance({
          investmentId: asset.id,
          newBalance: Number(totalValue),
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
          if (activeTab === "DIVIDEND" && !quantity && price) {
            qtdFinal = 1;
            priceFinal = Number(price);
          }
        }

        await investmentService.operation({
          investmentId: asset.id,
          type:
            activeTab === "DIVIDEND"
              ? "DIVIDEND"
              : (activeTab as InvestTransType),
          quantity: qtdFinal,
          price: priceFinal,
          date: date,
          accountId: accountId,
          fees: 0,
        });
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Erro ao realizar operação.");

      if (error.status === 409) {
        onSuccess();
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!asset) return null;

  const renderFields = () => {
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
              onChange={(e) => setTotalValue(e.target.value)}
              className="w-full bg-bg-base border border-border-divider rounded-xl py-3 pl-10 pr-4 text-xl font-bold text-text-main focus:outline-none focus:border-blue-500"
              placeholder="0,00"
            />
          </div>
          <p className="text-[10px] text-text-muted mt-2 ml-1">
            O sistema calculará a diferença e lançará como "Rendimento".
          </p>
        </div>
      );
    }

    // 2. RENDA FIXA (Aporte/Resgate)
    if (isFixedIncome && activeTab !== "DIVIDEND") {
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
            {activeTab === "DIVIDEND"
              ? "Valor Total Recebido"
              : "Preço Unitário"}
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
      onClose={onClose}
      title={`${asset.ticker} - Operação`}
    >
      <div className="space-y-5 mt-1">
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

          {/* CAMPOS COMUNS (Conta e Data) - Não exibe para Ajuste de Saldo */}
          {activeTab !== "UPDATE_BALANCE" && (
            <div className="grid grid-cols-2 gap-4">
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
            disabled={isLoading}
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
      </div>
    </Modal>
  );
}
