import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Save,
  Trash2,
  Calendar,
  Tag,
  Wallet,
  Clock,
  Lock,
  Loader2,
} from "lucide-react";
import { Transaction, Category, Account } from "@/types";
import { formatCurrency } from "@/utils/format";

interface TransactionDetailsProps {
  transaction: Transaction | undefined;
  categories: Category[];
  accounts: Account[];
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: string, data: any) => Promise<void>;
  onDelete: (id: string) => void;
}

export function TransactionDetails({
  transaction,
  categories,
  accounts,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
}: TransactionDetailsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    const dateObj = new Date(
      transaction?.createdAt || transaction?.date || Date.now(),
    );
    const timeString = dateObj.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    if (transaction && isOpen) {
      setFormData({
        description: transaction.description,
        amount: Number(transaction.amount),
        categoryId: transaction.categoryId || transaction.category?.id || "",
        accountId: transaction.accountId || transaction.account?.id || "",
        date: transaction.date,
        time: timeString,
        type: transaction.type,
        isPaid: transaction.isPaid,
      });
      setIsEditing(false);
    }
  }, [transaction, isOpen]);

  const categoriaDisplay =
    categories.find((c) => c.id === formData.categoryId)?.name ||
    transaction?.categoryName ||
    transaction?.category?.name ||
    "Sem Categoria";

  const contaDisplay =
    accounts.find((a) => a.id === formData.accountId)?.name ||
    transaction?.accountName ||
    transaction?.account?.name ||
    "Conta Desconhecida";

  const handleSave = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!transaction) return;
    setIsSaving(true);
    try {
      await onUpdate(transaction.id, formData);
      setIsEditing(false);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const isSystemManaged = transaction?.isSystemManaged === true;

  return (
    <AnimatePresence>
      {isOpen && transaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-bg-base/80 backdrop-blur-sm cursor-pointer"
          />

          <motion.form
            layoutId={`extract-card-container-${transaction.id}`}
            onSubmit={handleSave}
            className="w-full max-w-lg bg-bg-surface border border-border-divider rounded-3xl overflow-hidden shadow-2xl relative z-10 flex flex-col max-h-[90vh]"
          >
            <div className="p-6 border-b border-border-divider relative bg-bg-surface">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full text-text-main transition cursor-pointer z-20"
              >
                <X size={20} />
              </button>

              <div className="flex gap-5">
                <motion.div
                  layoutId={`extract-icon-${transaction.id}`}
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 ${transaction.type === "INCOME" ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"}`}
                >
                  {transaction.type === "INCOME" ? "+" : "-"}
                </motion.div>

                <div className="flex-1 pt-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-text-muted text-xs uppercase font-bold tracking-wider">
                      {transaction.type === "INCOME" ? "Entrada" : "Saída"}
                    </p>
                    {isSystemManaged && (
                      <span className="flex items-center gap-1 text-[9px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">
                        <Lock size={10} /> Automático
                      </span>
                    )}
                  </div>

                  {isEditing && !isSystemManaged ? (
                    <input
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      className="bg-bg-base border border-border-divider text-text-main text-xl font-bold rounded-lg px-2 py-1 w-full focus:outline-none focus:border-emerald-500"
                      autoFocus
                      required
                    />
                  ) : (
                    <motion.h3
                      layoutId={`extract-title-${transaction.id}`}
                      className="text-2xl font-bold text-text-main leading-tight"
                    >
                      {transaction.description}
                    </motion.h3>
                  )}
                </div>
              </div>

              <div className="mt-6">
                <p className="text-text-muted text-xs uppercase font-bold mb-1">
                  Valor
                </p>
                {isEditing && !isSystemManaged ? (
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted font-bold">
                      R$
                    </span>
                    <input
                      type="number"
                      value={formData.amount}
                      min="0"
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          amount: e.target.value,
                        })
                      }
                      className="bg-bg-base border border-border-divider text-text-main text-3xl font-bold rounded-lg pl-10 pr-2 py-1 w-full focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                ) : (
                  <motion.p
                    layoutId={`extract-amount-${transaction.id}`}
                    className={`text-4xl font-bold ${transaction.type === "INCOME" ? "text-emerald-500" : "text-text-main"}`}
                  >
                    {formatCurrency(
                      Number(formData.amount || transaction.amount),
                    )}
                  </motion.p>
                )}
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.1 }}
              className="p-6 space-y-4 overflow-y-auto custom-scroll flex-1 bg-bg-base/50"
            >
              <div className="flex gap-4">
                <div className="flex-1 flex items-center justify-between p-3 bg-bg-surface rounded-xl border border-border-divider transition-colors hover:border-border-divider">
                  <div className="flex items-center gap-3 text-text-muted">
                    <Calendar size={18} />
                    <span className="text-sm font-medium">Data</span>
                  </div>
                  {isEditing ? (
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) =>
                        setFormData({ ...formData, date: e.target.value })
                      }
                      className="bg-bg-base border border-border-divider text-text-main rounded px-2 py-1 text-sm cursor-pointer w-28"
                      required
                    />
                  ) : (
                    <span className="text-text-main font-bold text-sm">
                      {new Date(
                        formData.date + "T12:00:00",
                      ).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <div className="flex-1 flex items-center justify-between p-3 bg-bg-surface rounded-xl border border-border-divider transition-colors hover:border-border-divider">
                  <div className="flex items-center gap-3 text-text-muted">
                    <Clock size={18} />
                    <span className="text-sm font-medium">Hora</span>
                  </div>
                  {isEditing ? (
                    <input
                      type="time"
                      value={formData.time}
                      onChange={(e) =>
                        setFormData({ ...formData, time: e.target.value })
                      }
                      className="bg-bg-base border border-border-divider text-text-main rounded px-2 py-1 text-sm cursor-pointer w-24"
                      required
                    />
                  ) : (
                    <span className="text-text-main font-bold text-sm">
                      {formData.time}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-bg-surface rounded-xl border border-border-divider transition-colors hover:border-border-divider">
                <div className="flex items-center gap-3 text-text-muted">
                  <Tag size={18} />
                  <span className="text-sm font-medium">Categoria</span>
                </div>
                {isEditing ? (
                  <select
                    value={formData.categoryId}
                    onChange={(e) =>
                      setFormData({ ...formData, categoryId: e.target.value })
                    }
                    className="bg-bg-base border border-border-divider text-text-main rounded px-2 py-1 text-sm w-40 cursor-pointer outline-none"
                    required
                  >
                    <option value="">Sem Categoria</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="text-text-main font-bold text-sm">
                    {categoriaDisplay}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between p-3 bg-bg-surface rounded-xl border border-border-divider transition-colors hover:border-border-divider">
                <div className="flex items-center gap-3 text-text-muted">
                  <Wallet size={18} />
                  <span className="text-sm font-medium">Conta</span>
                </div>
                {isEditing ? (
                  <select
                    value={formData.accountId}
                    onChange={(e) =>
                      setFormData({ ...formData, accountId: e.target.value })
                    }
                    className="bg-bg-base border border-border-divider text-text-main rounded px-2 py-1 text-sm w-40 cursor-pointer outline-none"
                    required
                  >
                    <option value="" disabled>
                      Selecione
                    </option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="text-text-main font-bold text-sm">
                    {contaDisplay}
                  </span>
                )}
              </div>
            </motion.div>
            <div className="p-6 border-t border-border-divider bg-bg-surface grid grid-cols-2 gap-4">
              {isSystemManaged ? (
                <div className="col-span-2 text-center text-xs text-text-muted py-3 bg-bg-base/50 rounded-xl border border-border-divider border-dashed">
                  Transação gerenciada por outro módulo. Para alterar ou
                  excluir, vá até a tela de origem (Cartões, Metas ou
                  Investimentos).
                </div>
              ) : isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="py-3 rounded-xl font-bold text-text-muted hover:bg-bg-button-hover transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="py-3 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <>
                        <Save size={18} /> Salvar
                      </>
                    )}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => onDelete(transaction.id)}
                    className="py-3 rounded-xl font-bold text-rose-500 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Trash2 size={18} /> Excluir
                  </button>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="py-3 rounded-xl font-bold bg-bg-surface-hover hover:bg-bg-button-hover text-text-main transition cursor-pointer"
                  >
                    Editar
                  </button>
                </>
              )}
            </div>
          </motion.form>
        </div>
      )}
    </AnimatePresence>
  );
}
