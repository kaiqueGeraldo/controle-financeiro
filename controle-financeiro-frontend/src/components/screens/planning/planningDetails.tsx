import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Save, Trash2, Tag, Loader2 } from "lucide-react";
import { PlanItem, Category } from "@/types";
import { formatCurrency, formatDate } from "@/utils/format";

interface PlanningDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  item: PlanItem | undefined;
  categories: Category[];
  onUpdate: (id: string, data: any) => Promise<void>;
  onDelete: (id: string) => void;
}

export function PlanningDetails({
  isOpen,
  onClose,
  item,
  categories,
  onUpdate,
  onDelete,
}: PlanningDetailsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<any>({});

  const isInvoice = item && !!item.cardId;

  useEffect(() => {
    if (item && isOpen) {
      setFormData({
        description: item.description,
        amount: Number(item.amount),
        dueDate: item.dueDate,
        categoryId: item.categoryId,
      });
      setIsEditing(false);
    }
  }, [item, isOpen]);

  const handleSave = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!item) return;
    setIsSaving(true);
    try {
      await onUpdate(item.id, formData);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const categoryDisplay =
    categories.find((c) => c.id === formData.categoryId)?.name ||
    item?.categoryName ||
    "Geral";

  return (
    <AnimatePresence>
      {isOpen && item && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* BACKDROP COM FADE */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-bg-base/80 backdrop-blur-sm cursor-pointer"
          />

          {/* CARD EXPANDIDO */}
          <motion.form
            layoutId={`plan-card-${item.id}`}
            onSubmit={handleSave}
            className="w-full max-w-lg bg-bg-surface border border-border-divider rounded-3xl overflow-hidden shadow-2xl relative z-10 flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="p-6 border-b border-border-divider relative bg-bg-surface">
              <button
                type="button"
                onClick={onClose}
                className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full text-text-main transition cursor-pointer z-20"
              >
                <X size={20} />
              </button>

              <div className="flex gap-5">
                {/* ÍCONE EXPANDIDO */}
                <motion.div
                  layoutId={`plan-icon-${item.id}`}
                  className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 bg-bg-surface-hover text-text-muted"
                >
                  <Calendar size={32} />
                </motion.div>

                <div className="flex-1 pt-1">
                  <p className="text-text-muted text-xs uppercase font-bold tracking-wider mb-1">
                    Detalhes do Planejamento
                  </p>

                  {isEditing && !isInvoice ? (
                    <input
                      required
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      className="bg-bg-base border border-border-divider text-text-main text-xl font-bold rounded-lg px-2 py-1 w-full focus:outline-none focus:border-emerald-500"
                      autoFocus
                    />
                  ) : (
                    /* TÍTULO EXPANDIDO */
                    <motion.h3
                      layoutId={`plan-title-${item.id}`}
                      className="text-2xl font-bold text-text-main leading-tight"
                    >
                      {item.description}
                    </motion.h3>
                  )}

                  {isInvoice && (
                    <span className="text-[10px] text-purple-400 mt-1 block">
                      Vinculado à Fatura do Cartão
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-6">
                <p className="text-text-muted text-xs uppercase font-bold mb-1">
                  Valor Previsto
                </p>
                {isEditing && !isInvoice ? (
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted font-bold">
                      R$
                    </span>
                    <input
                      required
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
                    />
                  </div>
                ) : (
                  /* VALOR EXPANDIDO */
                  <motion.p
                    layoutId={`plan-amount-${item.id}`}
                    className="text-4xl font-bold text-text-main"
                  >
                    {formatCurrency(Number(formData.amount || item.amount))}
                  </motion.p>
                )}
              </div>
            </div>

            {/* Conteúdo do Corpo (Fade In) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.1 }}
              className="p-6 space-y-4 overflow-y-auto custom-scroll flex-1 bg-bg-base/50"
            >
              {/* Data de Vencimento */}
              <div className="flex items-center justify-between p-3 bg-bg-surface rounded-xl border border-border-divider transition-colors hover:border-border-divider">
                <div className="flex items-center gap-3 text-text-muted">
                  <Calendar size={18} />
                  <span className="text-sm font-medium">Vencimento</span>
                </div>
                {isEditing ? (
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) =>
                      setFormData({ ...formData, dueDate: e.target.value })
                    }
                    className="bg-bg-base border border-border-divider text-text-main rounded px-2 py-1 text-sm scheme-dark cursor-pointer"
                    required
                  />
                ) : (
                  <span className="text-text-main font-bold text-sm">
                    {formatDate(formData.dueDate)}
                  </span>
                )}
              </div>

              {/* Categoria */}
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
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="text-text-main font-bold text-sm">
                    {categoryDisplay}
                  </span>
                )}
              </div>
            </motion.div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-border-divider bg-bg-surface grid grid-cols-2 gap-4">
              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="py-3 rounded-xl font-bold text-text-muted hover:bg-zinc-200 transition cursor-pointer"
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
                  {isInvoice ? (
                    <div className="col-span-2 text-center text-xs text-text-muted py-3 bg-bg-base/50 rounded-xl border border-border-divider border-dashed">
                      Este item é gerenciado pela fatura do cartão.
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => onDelete(item.id)}
                        className="py-3 rounded-xl font-bold text-rose-500 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Trash2 size={18} /> Excluir
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        className="py-3 rounded-xl font-bold bg-bg-surface-hover hover:bg-zinc-200 text-text-main transition cursor-pointer"
                      >
                        Editar
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          </motion.form>
        </div>
      )}
    </AnimatePresence>
  );
}
