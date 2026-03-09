"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Modal } from "@/components/ui/modal";
import { goalService } from "@/services/goalService";
import { Account, Goal } from "@/types";
import {
  Loader2,
  PiggyBank,
  Wallet,
  Plus,
  BookOpen,
  AlertCircle,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useGoalsContext } from "@/contexts/goalsContext";

interface DepositGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  goal: Goal | null;
  accounts: Account[];
}

export function DepositGoalModal({
  isOpen,
  onClose,
  onSuccess,
  goal,
  accounts,
}: DepositGoalModalProps) {
  const { depositOptimistic } = useGoalsContext();
  const [isLoading, setIsLoading] = useState(false);
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState("");
  const [note, setNote] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Estados do Protocolo de Evolução
  const [showProtocol, setShowProtocol] = useState(false);
  const [protocol, setProtocol] = useState({
    essence: "",
    personalConnection: "",
    systemEngineering: "",
  });

  if (!goal) return null;

  const isMonetary = goal.type === "MONETARY";
  const amountNumber = Number(amount);

  const handleDeposit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      if (isMonetary) {
        const selectedAccount = accounts.find((a) => a.id === accountId);
        if (selectedAccount && selectedAccount.balance < amountNumber) {
          throw new Error(
            `A conta ${selectedAccount.name} não tem saldo suficiente.`,
          );
        }
      }

      // Prepara o payload
      const payload: any = {
        amount: amountNumber,
        note: note || (isMonetary ? "Aporte Manual" : "Registro de Progresso"),
      };

      if (isMonetary) payload.accountId = accountId;

      if (
        !isMonetary &&
        showProtocol &&
        (protocol.essence ||
          protocol.personalConnection ||
          protocol.systemEngineering)
      ) {
        payload.protocol = protocol;
      }

      await depositOptimistic(goal.id, payload);

      onSuccess();
      handleClose();
    } catch (error: any) {
      const msg =
        error.response?.data?.message ||
        error.message ||
        "Erro ao realizar operação.";
      setErrorMessage(msg);

      if (error.status === 409) {
        onSuccess();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setAmount("");
    setAccountId("");
    setNote("");
    setErrorMessage(null);
    setShowProtocol(false);
    setProtocol({ essence: "", personalConnection: "", systemEngineering: "" });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isMonetary ? `Guardar Dinheiro` : `Registrar Progresso`}
    >
      <div className="mb-4 text-center">
        <p className="text-text-muted text-sm">
          Meta: <span className="text-text-main font-bold">{goal.title}</span>
        </p>
      </div>

      <form
        onSubmit={handleDeposit}
        className="space-y-4 max-h-[75vh] overflow-y-auto custom-scroll pr-1"
      >
        {/* INPUT DE VALOR */}
        <div>
          <label className="text-xs text-text-muted font-bold uppercase ml-1">
            {isMonetary
              ? "Valor do Aporte"
              : `Quantidade (${goal.unit || "un"})`}
          </label>
          <div className="relative mt-1">
            {isMonetary ? (
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted font-bold">
                R$
              </span>
            ) : (
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted font-bold">
                <Plus size={16} />
              </span>
            )}

            <input
              required
              autoFocus
              type="number"
              step={isMonetary ? "0.01" : "1"}
              value={amount}
              min="0"
              onChange={(e) => {
                setAmount(e.target.value);
                setErrorMessage(null);
              }}
              className={`w-full bg-bg-base border border-border-divider rounded-xl py-3 pr-4 text-xl font-bold text-text-main focus:outline-none focus:border-emerald-500 pl-10 transition-colors ${errorMessage ? "border-rose-500/50" : ""}`}
              placeholder="0"
            />
          </div>
        </div>

        {/* SELEÇÃO DE CONTA (APENAS SE FOR MONETÁRIA) */}
        {isMonetary && (
          <div>
            <label className="text-xs text-text-muted font-bold uppercase ml-1">
              Retirar de
            </label>
            <div className="relative mt-1">
              <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <select
                required
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full bg-bg-base border border-border-divider rounded-xl py-3 pl-10 pr-4 text-text-main text-sm focus:outline-none focus:border-emerald-500 appearance-none cursor-pointer"
              >
                <option value="" disabled>
                  Selecione a conta
                </option>
                {accounts.map((acc) => {
                  const hasBalance = acc.balance >= amountNumber;
                  const isDisabled = amountNumber > 0 && !hasBalance;

                  return (
                    <option
                      key={acc.id}
                      value={acc.id}
                      disabled={isDisabled}
                      className={
                        isDisabled
                          ? "text-text-muted bg-bg-surface"
                          : "text-text-main bg-bg-surface"
                      }
                    >
                      {acc.name} (R$ {acc.balance.toFixed(2)}){" "}
                      {isDisabled ? " - Saldo Insuficiente" : ""}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        )}

        {/* NOTA OPCIONAL */}
        <div>
          <label className="text-xs text-text-muted font-bold uppercase ml-1">
            Nota (Opcional)
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full bg-bg-base border border-border-divider rounded-xl px-4 py-3 text-text-main text-sm focus:outline-none focus:border-emerald-500 transition-colors mt-1"
            placeholder={
              isMonetary ? "Ex: Economia do salário" : "Ex: Hábitos Atômicos"
            }
          />
        </div>

        {/* ACORDEÃO DO PROTOCOLO DE EVOLUÇÃO (Apenas Numéricas) */}
        {!isMonetary && (
          <div className="mt-4 border border-border-divider rounded-xl overflow-hidden bg-bg-surface">
            <button
              type="button"
              onClick={() => setShowProtocol(!showProtocol)}
              className="w-full p-3 flex justify-between items-center bg-bg-surface-hover/50 hover:bg-bg-surface-hover transition cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-purple-500" />
                <span className="text-sm font-bold text-purple-400">
                  Protocolo de Evolução (Opcional)
                </span>
              </div>
              {showProtocol ? (
                <ChevronUp size={16} className="text-text-muted" />
              ) : (
                <ChevronDown size={16} className="text-text-muted" />
              )}
            </button>

            <AnimatePresence>
              {showProtocol && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="p-4 space-y-4 border-t border-border-divider"
                >
                  <div>
                    <label className="text-[10px] uppercase font-bold text-text-muted">
                      1. A Essência (O "Download")
                    </label>
                    <textarea
                      rows={3}
                      value={protocol.essence}
                      onChange={(e) =>
                        setProtocol({ ...protocol, essence: e.target.value })
                      }
                      className="w-full bg-bg-base border border-border-divider text-sm text-text-main rounded-lg px-3 py-2 mt-1 focus:border-purple-500 outline-none custom-scroll resize-none"
                      placeholder="A grande ideia e os top aprendizados..."
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-text-muted">
                      2. Conexão Pessoal
                    </label>
                    <textarea
                      rows={2}
                      value={protocol.personalConnection}
                      onChange={(e) =>
                        setProtocol({
                          ...protocol,
                          personalConnection: e.target.value,
                        })
                      }
                      className="w-full bg-bg-base border border-border-divider text-sm text-text-main rounded-lg px-3 py-2 mt-1 focus:border-purple-500 outline-none custom-scroll resize-none"
                      placeholder="Como isso muda minha visão atual?"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-text-muted">
                      3. Engenharia de Sistemas (Ação)
                    </label>
                    <textarea
                      rows={3}
                      value={protocol.systemEngineering}
                      onChange={(e) =>
                        setProtocol({
                          ...protocol,
                          systemEngineering: e.target.value,
                        })
                      }
                      className="w-full bg-bg-base border border-border-divider text-sm text-text-main rounded-lg px-3 py-2 mt-1 focus:border-purple-500 outline-none custom-scroll resize-none"
                      placeholder="O que eu vou aplicar na minha rotina a partir de amanhã?"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {errorMessage && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <p className="text-xs text-rose-400 font-medium">{errorMessage}</p>
          </div>
        )}

        <button
          disabled={isLoading}
          type="submit"
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl mt-2 flex justify-center items-center gap-2 transition cursor-pointer shadow-lg shadow-emerald-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <Loader2 className="animate-spin" />
          ) : (
            <>
              {isMonetary ? <PiggyBank size={18} /> : <BookOpen size={18} />}
              {isMonetary ? "Confirmar Aporte" : "Registrar"}
            </>
          )}
        </button>
      </form>
    </Modal>
  );
}
