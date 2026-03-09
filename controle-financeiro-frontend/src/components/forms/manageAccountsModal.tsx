"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { accountService } from "@/services/accountService";
import { cardService } from "@/services/cardService";
import { Account, AccountType } from "@/types";
import {
  Loader2,
  Plus,
  Trash2,
  Wallet,
  Building2,
  PiggyBank,
  Banknote,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/contexts/toastContext";

interface ManageAccountsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export function ManageAccountsModal({
  isOpen,
  onClose,
  onUpdate,
}: ManageAccountsModalProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const toast = useToast();

  // --- FORMULÁRIO DE CONTA ---
  const [accName, setAccName] = useState("");
  const [accType, setAccType] = useState<AccountType>("CHECKING");
  const [accBalance, setAccBalance] = useState("");

  // --- FORMULÁRIO DE CARTÃO ---
  const [hasCreditCard, setHasCreditCard] = useState(false);
  const [cardLimit, setCardLimit] = useState("");
  const [cardClosingDay, setCardClosingDay] = useState("");
  const [cardDueDay, setCardDueDay] = useState("");
  const [cardBrand, setCardBrand] = useState("MASTERCARD");
  const [cardLast4, setCardLast4] = useState("");
  const [cardColor, setCardColor] = useState("#820AD1");

  const fetchAccounts = async () => {
    setIsLoading(true);
    try {
      const res = await accountService.getAll();
      if (res?.data) setAccounts(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchAccounts();
  }, [isOpen]);

  const handleCreate = async (e: React.SyntheticEvent) => {
    e.preventDefault();

    if (hasCreditCard) {
      if (!/^\d{4}$/.test(cardLast4)) {
        toast.error("Os 4 últimos dígitos devem conter exatamente 4 números.");
        return;
      }

      const cDay = Number(cardClosingDay);
      const dDay = Number(cardDueDay);
      if (cDay < 1 || cDay > 31 || dDay < 1 || dDay > 31) {
        toast.error(
          "Os dias de fechamento e vencimento devem ser entre 1 e 31.",
        );
        return;
      }

      if (Number(cardLimit) <= 0) {
        toast.error("O limite do cartão deve ser maior que zero.");
        return;
      }
    }

    setIsCreating(true);
    let accountCreated = false;

    try {
      await accountService.create({
        name: accName,
        type: accType,
        initialBalance: Number(accBalance || 0),
        color: "#3b82f6",
      });

      accountCreated = true;

      if (hasCreditCard) {
        await cardService.create({
          name: accName,
          limit: Number(cardLimit),
          closingDay: Number(cardClosingDay),
          dueDay: Number(cardDueDay),
          brand: cardBrand,
          color: cardColor,
          last4Digits: cardLast4,
        });
      }

      toast.success(
        hasCreditCard ? "Conta e Cartão criados!" : "Conta criada com sucesso!",
      );
      setAccName("");
      setAccBalance("");
      setHasCreditCard(false);
      setCardLimit("");
      setCardLast4("");
      setCardClosingDay("");
      setCardDueDay("");
    } catch (error: any) {
      if (accountCreated) {
        setAccName("");
        setAccBalance("");
        setHasCreditCard(false);
        toast.error(
          "Conta criada, mas erro ao vincular cartão. Adicione o cartão na tela de Cartões.",
        );
      } else {
        toast.error(
          error?.message || "Erro ao criar conta. Verifique os dados.",
        );
      }
    } finally {
      if (accountCreated) {
        fetchAccounts();
        onUpdate();
      }
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza? Isso pode afetar seu histórico.")) return;
    try {
      await accountService.delete(id);
      fetchAccounts();
      onUpdate();
    } catch (error) {
      toast.error("Erro ao excluir conta.");
    }
  };

  const getIcon = (type: AccountType) => {
    switch (type) {
      case "CASH":
        return <Banknote size={18} />;
      case "INVESTMENT":
        return <Building2 size={18} />;
      case "SAVINGS":
        return <PiggyBank size={18} />;
      default:
        return <Wallet size={18} />;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Gerenciar Contas">
      <div className="space-y-6 max-h-[80vh] overflow-y-auto custom-scroll px-1">
        {/* Formulário de Criação */}
        <form
          onSubmit={handleCreate}
          className="bg-bg-base p-4 rounded-xl border border-border-divider space-y-4"
        >
          <h3 className="text-xs font-bold text-emerald-500 uppercase flex items-center gap-2">
            <Plus size={14} /> Adicionar Nova Conta
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <input
              placeholder="Nome (ex: Nubank)"
              value={accName}
              onChange={(e) => setAccName(e.target.value)}
              required
              className="bg-bg-surface border border-border-divider rounded-lg px-3 py-2 text-text-main text-sm focus:border-emerald-500 outline-none"
            />
            <select
              value={accType}
              onChange={(e) => {
                const val = e.target.value as AccountType;
                setAccType(val);
                if (val === "CASH") setHasCreditCard(false);
              }}
              className="bg-bg-surface border border-border-divider rounded-lg px-3 py-2 text-text-main text-sm focus:border-emerald-500 outline-none cursor-pointer"
            >
              <option value="CHECKING">Conta Corrente</option>
              <option value="CASH">Dinheiro / Carteira Física</option>
            </select>
          </div>

          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-xs">
              R$
            </span>
            <input
              type="number"
              step="0.01"
              placeholder="Saldo Atual"
              value={accBalance}
              onChange={(e) => setAccBalance(e.target.value)}
              className="w-full bg-bg-surface border border-border-divider rounded-lg pl-8 pr-3 py-2 text-text-main text-sm focus:border-emerald-500 outline-none"
            />
          </div>

          {/* TOGGLE CARTÃO DE CRÉDITO */}
          {accType !== "CASH" && (
            <div className="pt-2">
              <button
                type="button"
                role="switch"
                aria-checked={hasCreditCard}
                onClick={() => setHasCreditCard(!hasCreditCard)}
                className="flex items-center gap-2 cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-purple-500 rounded-md p-1 -ml-1"
              >
                <div
                  className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${hasCreditCard ? "bg-purple-500 border-purple-500" : "border-zinc-600 bg-transparent"}`}
                >
                  {hasCreditCard && (
                    <Plus size={10} className="text-black" strokeWidth={4} />
                  )}
                </div>
                <span
                  className={`text-sm ${hasCreditCard ? "text-purple-400 font-bold" : "text-text-muted"}`}
                >
                  Vincular Cartão de Crédito
                </span>
              </button>

              <AnimatePresence>
                {hasCreditCard && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 p-3 bg-purple-500/5 border border-purple-500/20 rounded-lg space-y-3">
                      <div className="flex gap-3">
                        <div className="flex-1 relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-xs">
                            R$
                          </span>
                          <input
                            placeholder="Limite"
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={cardLimit}
                            onChange={(e) => setCardLimit(e.target.value)}
                            required={hasCreditCard}
                            className="w-full bg-bg-surface border border-border-divider rounded-lg pl-8 pr-3 py-2 text-text-main text-sm focus:border-purple-500 outline-none"
                          />
                        </div>
                        <select
                          value={cardBrand}
                          onChange={(e) => setCardBrand(e.target.value)}
                          className="bg-bg-surface border border-border-divider rounded-lg px-3 py-2 text-text-main text-sm focus:border-purple-500 outline-none"
                        >
                          <option value="MASTERCARD">Mastercard</option>
                          <option value="VISA">Visa</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] text-text-muted uppercase font-bold ml-1">
                            4 Últ. Dígitos
                          </label>
                          <input
                            placeholder="Ex: 4512"
                            type="text"
                            inputMode="numeric"
                            pattern="\d{4}"
                            maxLength={4}
                            value={cardLast4}
                            onChange={(e) => {
                              const onlyNumbers = e.target.value.replace(
                                /\D/g,
                                "",
                              );
                              setCardLast4(onlyNumbers);
                            }}
                            required={hasCreditCard}
                            className="w-full bg-bg-surface border border-border-divider rounded-lg px-3 py-2 text-text-main text-sm focus:border-purple-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-text-muted uppercase font-bold ml-1">
                            Cor
                          </label>
                          <div className="flex gap-2 mt-1">
                            {[
                              "#820AD1",
                              "#009EE3",
                              "#FF6800",
                              "#EF4444",
                              "#10B981",
                            ].map((c) => (
                              <div
                                key={c}
                                onClick={() => setCardColor(c)}
                                className={`w-6 h-6 rounded-full cursor-pointer border-2 ${cardColor === c ? "border-white" : "border-transparent"}`}
                                style={{ backgroundColor: c }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] text-text-muted uppercase font-bold ml-1">
                            Dia Fechamento
                          </label>
                          <input
                            placeholder="Ex: 05"
                            type="number"
                            min="1"
                            max="31"
                            value={cardClosingDay}
                            onChange={(e) => setCardClosingDay(e.target.value)}
                            required={hasCreditCard}
                            className="w-full bg-bg-surface border border-border-divider rounded-lg px-3 py-2 text-text-main text-sm focus:border-purple-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-text-muted uppercase font-bold ml-1">
                            Dia Vencimento
                          </label>
                          <input
                            placeholder="Ex: 12"
                            type="number"
                            value={cardDueDay}
                            onChange={(e) => setCardDueDay(e.target.value)}
                            required={hasCreditCard}
                            className="w-full bg-bg-surface border border-border-divider rounded-lg px-3 py-2 text-text-main text-sm focus:border-purple-500 outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          <button
            disabled={isCreating}
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold text-sm transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isCreating ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              "Salvar"
            )}
          </button>
        </form>

        {/* Lista de Contas Existentes */}
        <div className="space-y-2 pt-2">
          <h3 className="text-xs font-bold text-text-muted uppercase ml-1">
            Suas Contas
          </h3>
          {isLoading ? (
            <div className="text-center py-4">
              <Loader2 className="animate-spin mx-auto text-emerald-500" />
            </div>
          ) : (
            accounts.map((acc) => (
              <div
                key={acc.id}
                className="flex justify-between items-center p-3 bg-bg-surface rounded-xl border border-border-divider"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-bg-surface-hover rounded-lg text-text-muted">
                    {getIcon(acc.type)}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-text-main">
                      {acc.name}
                    </p>
                    <p className="text-xs text-text-muted capitalize">
                      {acc.type.toLowerCase()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-mono text-text-main">
                    {acc.balance.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </span>
                  <button
                    onClick={() => handleDelete(acc.id)}
                    className="text-text-muted hover:text-rose-500 transition"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
}
