import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import {
  X,
  History,
  ArrowUpCircle,
  Plus,
  Loader2,
  Trash2,
  Pencil,
  Check,
  ListTodo,
  CheckCircle2,
  Circle,
  ShoppingCart,
  GripVertical,
  Wallet,
  Landmark,
  Sparkles,
} from "lucide-react";
import { Goal, GoalHistory, Account, GoalItem } from "@/types";
import { CreditCard } from "@/services/cardService";
import {
  getGoalColorClass,
  getGoalIcon,
  formatarValorMeta,
  ProgressBar,
  StatusBadge,
} from "./goalItem";
import { useInvestmentsContext } from "@/contexts/investmentsContext";
import { goalService } from "@/services/goalService";
import { useGoalsContext } from "@/contexts/goalsContext";
import { PrivacyBlur } from "@/components/ui/privacyBlur";
import { formatCurrency } from "@/utils/format";
import { ConfirmationModal } from "@/components/modals/confirmModal";
import { useHabitsContext } from "@/contexts/habitsContext";
import { useToast } from "@/contexts/toastContext";
import { useGoalModals } from "@/contexts/modals/goalModalContext";

interface GoalDetailsProps {
  isOpen: boolean;
  goal: Goal | undefined;
  accounts: Account[];
  cards: CreditCard[];
  history: GoalHistory[];
  isHistoryLoading: boolean;
  onClose: () => void;
  onDelete: (goal: Goal) => void;
  onDeposit: (goal: Goal) => void;
}

export function GoalDetails({
  isOpen,
  goal,
  accounts,
  cards,
  history,
  isHistoryLoading,
  onClose,
  onDelete,
  onDeposit,
}: GoalDetailsProps) {
  const { refreshGoals } = useGoalsContext();
  const { investments } = useInvestmentsContext();
  const { habits } = useHabitsContext();
  const { openDeleteHistory } = useGoalModals();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<"CHECKLIST" | "HISTORY">(
    "HISTORY",
  );
  const [isEditing, setIsEditing] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    targetValue: "",
    deadline: "",
  });

  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemForm, setNewItemForm] = useState({
    name: "",
    suggestedModel: "",
    estimatedPrice: "",
  });

  const [buyingItemId, setBuyingItemId] = useState<string | null>(null);
  const [paidPrice, setPaidPrice] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<string>("");
  const [installments, setInstallments] = useState<number>(1);

  const [orderedItems, setOrderedItems] = useState<GoalItem[]>([]);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (goal) {
      setEditForm({
        title: goal.title,
        targetValue: goal.targetValue.toString(),
        deadline: goal.deadline,
      });
      setActiveTab(goal.useChecklist ? "CHECKLIST" : "HISTORY");

      const sorted = [...(goal.items || [])].sort(
        (a, b) => a.orderIndex - b.orderIndex,
      );
      setOrderedItems(sorted);
    }
  }, [goal, isOpen]);

  const handleReorder = async (newOrder: GoalItem[]) => {
    setOrderedItems(newOrder);
    if (!goal) return;
    try {
      await goalService.reorderItems(
        goal.id,
        newOrder.map((i) => i.id),
      );
    } catch (error) {
      toast.error("Erro ao reordenar itens.");
    }
  };

  const handleSaveEdit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!goal) return;
    setIsSavingEdit(true);
    try {
      await goalService.update(goal.id, {
        title: editForm.title,
        targetValue: Number(editForm.targetValue),
        deadline: editForm.deadline,
      });
      refreshGoals();
      setIsEditing(false);
    } catch (error) {
      toast.error("Erro ao atualizar a meta.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleAddItem = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!goal) return;
    try {
      await goalService.addItem(goal.id, {
        name: newItemForm.name,
        suggestedModel: newItemForm.suggestedModel,
        estimatedPrice: Number(newItemForm.estimatedPrice),
      });
      refreshGoals();
      setNewItemForm({ name: "", suggestedModel: "", estimatedPrice: "" });
      setIsAddingItem(false);
    } catch (error) {
      toast.error("Erro ao adicionar item.");
    }
  };

  const handlePurchaseItem = async (itemId: string) => {
    let accountId = undefined;
    let cardId = undefined;

    if (selectedPaymentMethod.startsWith("ACC_"))
      accountId = selectedPaymentMethod.replace("ACC_", "");
    if (selectedPaymentMethod.startsWith("CARD_"))
      cardId = selectedPaymentMethod.replace("CARD_", "");

    try {
      await goalService.purchaseItem(itemId, {
        paidPrice: Number(paidPrice),
        accountId,
        cardId,
        installments: cardId ? installments : undefined,
      });
      refreshGoals();
      setBuyingItemId(null);
      setPaidPrice("");
      setSelectedPaymentMethod("");
      setInstallments(1);
    } catch (error: any) {
      toast.error(error.message || "Erro ao confirmar compra.");
    }
  };

  const handleDeleteItem = async () => {
    if (!itemToDelete) return;
    try {
      await goalService.deleteItem(itemToDelete);
      refreshGoals();
      setItemToDelete(null);
      window.dispatchEvent(new Event("refreshFinance"));
      window.dispatchEvent(new Event("refreshCards"));
    } catch (error) {
      toast.error("Erro ao excluir item.");
    }
  };

  const isLinkedToInvestment = goal
    ? investments.some((inv) => (inv.goalId || inv.goal?.id) === goal.id)
    : false;
  const isLinkedToHabit = goal
    ? habits.some((h) => h.goalId === goal.id)
    : false;
  const spentInGoal = orderedItems
    .filter((i) => i.status === "PURCHASED" && i.usedGoalBalance)
    .reduce((acc, curr) => acc + (curr.paidPrice || 0), 0);
  const availableGoalBalance = goal ? goal.currentValue - spentInGoal : 0;

  const pendingItems = orderedItems.filter((i) => i.status === "PENDING");
  const purchasedItems = orderedItems.filter((i) => i.status === "PURCHASED");
  const isCreditCardSelected = selectedPaymentMethod.startsWith("CARD_");

  const isLocked = isLinkedToInvestment || isLinkedToHabit;
  const lockMessage = isLinkedToInvestment
    ? "Aportes devem ser feitos pela tela de Investimentos"
    : isLinkedToHabit
      ? "O progresso desta meta é controlado pela aba de Hábitos"
      : "";

  return (
    <AnimatePresence>
      {isOpen && goal && (
        <div
          key="goal-modal-wrapper"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-bg-base/90 backdrop-blur-md cursor-pointer"
          />

          <motion.div
            key={`goals-card-container-${goal.id}`}
            layoutId={`goals-card-container-${goal.id}`}
            className="w-full max-w-lg bg-bg-surface border border-border-divider rounded-3xl overflow-hidden shadow-2xl relative max-h-[90vh] flex flex-col pointer-events-auto z-10"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full text-text-main transition z-20 cursor-pointer"
            >
              <X size={20} />
            </button>

            {/* HEADER DA META */}
            <div className="p-8 pb-6 border-b border-border-divider bg-bg-surface z-10 shrink-0">
              <div className="flex gap-5 mb-6">
                <motion.div
                  layoutId={`goals-icon-${goal.id}`}
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center ${getGoalColorClass(goal.color).split(" ")[0]} ${getGoalColorClass(goal.color).split(" ")[1]}`}
                >
                  {React.cloneElement(
                    getGoalIcon(goal.icon) as React.ReactElement<any>,
                    { size: 32 },
                  )}
                </motion.div>
                <div className="flex-1">
                  <p className="text-text-muted text-xs uppercase tracking-wider font-bold mb-1">
                    {goal.category || "Geral"}
                  </p>
                  {isEditing ? (
                    <form onSubmit={handleSaveEdit} className="space-y-2">
                      <input
                        value={editForm.title}
                        onChange={(e) =>
                          setEditForm({ ...editForm, title: e.target.value })
                        }
                        className="bg-bg-base border border-border-divider text-text-main font-bold rounded-lg px-2 py-1 w-full outline-none focus:border-emerald-500"
                      />
                      <div className="flex gap-2">
                        <input
                          type="number"
                          step="0.01"
                          value={editForm.targetValue}
                          min="0"
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              targetValue: e.target.value,
                            })
                          }
                          className="bg-bg-base border border-border-divider text-text-main text-sm rounded-lg px-2 py-1 w-24 outline-none focus:border-emerald-500"
                        />
                        <input
                          type="date"
                          value={editForm.deadline}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              deadline: e.target.value,
                            })
                          }
                          className="bg-bg-base border border-border-divider text-text-main text-sm rounded-lg px-2 py-1 w-full outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div className="flex gap-2 mt-2">
                        <button
                          type="submit"
                          disabled={isSavingEdit}
                          className="flex items-center justify-center bg-emerald-500 hover:bg-emerald-400 text-zinc-900 px-3 py-1 rounded text-xs font-bold cursor-pointer transition disabled:opacity-50"
                        >
                          {isSavingEdit ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            "Salvar"
                          )}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <motion.h3
                          layoutId={`goals-title-${goal.id}`}
                          className="text-2xl font-bold text-text-main leading-tight pr-2"
                        >
                          {goal.title}
                        </motion.h3>
                        <button
                          onClick={() => setIsEditing(true)}
                          className="text-text-muted hover:text-text-main transition p-1 cursor-pointer shrink-0"
                        >
                          <Pencil size={14} />
                        </button>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <StatusBadge goal={goal} />
                        <PrivacyBlur className="text-text-muted text-xs">
                          Alvo:{" "}
                          {formatarValorMeta(
                            goal.targetValue,
                            goal.type,
                            goal.unit,
                          )}
                        </PrivacyBlur>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <div className="flex justify-between items-end mb-2">
                  <p className="text-text-muted text-sm">Progresso Atual</p>
                  <PrivacyBlur className="text-3xl font-bold text-text-main">
                    {formatarValorMeta(goal.currentValue, goal.type, goal.unit)}
                  </PrivacyBlur>
                </div>
                <ProgressBar
                  layoutId={`goals-progress-${goal.id}`}
                  atual={goal.currentValue}
                  total={goal.targetValue}
                  gradiente={getGoalColorClass(goal.color)}
                />

                {/* DISPLAY DE SALDO LIVRE E RASTREIO */}
                {goal.useChecklist && (
                  <div className="flex justify-between items-center mt-3 p-3 bg-bg-base rounded-xl border border-border-divider">
                    <div className="flex items-center gap-2 text-text-muted">
                      <Landmark size={16} />
                      <span className="text-xs font-medium">
                        Saldo Livre na Meta:
                      </span>
                    </div>
                    <PrivacyBlur className="text-emerald-400 font-bold">
                      {formatCurrency(availableGoalBalance)}
                    </PrivacyBlur>
                  </div>
                )}
              </div>

              {/* TABS SÓ APARECEM SE A META USAR CHECKLIST */}
              {goal.useChecklist && (
                <div className="flex bg-bg-base p-1 rounded-xl border border-border-divider mt-6">
                  <button
                    onClick={() => setActiveTab("CHECKLIST")}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-2 cursor-pointer ${activeTab === "CHECKLIST" ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-sm" : "text-text-muted hover:text-text-main"}`}
                  >
                    <ListTodo size={14} /> Checklist
                  </button>
                  <button
                    onClick={() => setActiveTab("HISTORY")}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-2 cursor-pointer ${activeTab === "HISTORY" ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-sm" : "text-text-muted hover:text-text-main"}`}
                  >
                    <History size={14} /> Histórico
                  </button>
                </div>
              )}
            </div>

            {/* CONTEÚDO TABS */}
            <div className="bg-bg-base flex-1 overflow-y-auto custom-scroll relative">
              {/* CHECKLIST */}
              {activeTab === "CHECKLIST" && goal.useChecklist && (
                <div className="p-6 space-y-4">
                  {isAddingItem ? (
                    <form
                      onSubmit={handleAddItem}
                      className="bg-bg-surface border border-border-divider rounded-xl p-4 space-y-3 shadow-md"
                    >
                      <input
                        required
                        autoFocus
                        placeholder="Nome do item (ex: Processador)"
                        value={newItemForm.name}
                        onChange={(e) =>
                          setNewItemForm({
                            ...newItemForm,
                            name: e.target.value,
                          })
                        }
                        className="w-full bg-bg-base border border-border-divider text-text-main rounded-lg px-3 py-2 text-sm focus:border-emerald-500 outline-none"
                      />
                      <div className="flex gap-2">
                        <input
                          placeholder="Modelo (Opcional)"
                          value={newItemForm.suggestedModel}
                          onChange={(e) =>
                            setNewItemForm({
                              ...newItemForm,
                              suggestedModel: e.target.value,
                            })
                          }
                          className="w-full bg-bg-base border border-border-divider text-text-main rounded-lg px-3 py-2 text-sm focus:border-emerald-500 outline-none"
                        />
                        <input
                          required
                          type="number"
                          step="0.01"
                          placeholder="Valor Est."
                          value={newItemForm.estimatedPrice}
                          onChange={(e) =>
                            setNewItemForm({
                              ...newItemForm,
                              estimatedPrice: e.target.value,
                            })
                          }
                          className="w-32 bg-bg-base border border-border-divider text-text-main rounded-lg px-3 py-2 text-sm focus:border-emerald-500 outline-none"
                        />
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button
                          type="submit"
                          className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2 rounded-lg transition cursor-pointer"
                        >
                          Adicionar
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsAddingItem(false)}
                          className="flex-1 bg-bg-surface-hover hover:bg-zinc-700 text-text-main text-xs font-bold py-2 rounded-lg transition cursor-pointer"
                        >
                          Cancelar
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button
                      onClick={() => setIsAddingItem(true)}
                      className="w-full border border-dashed border-border-divider hover:border-emerald-500/50 hover:bg-emerald-500/5 text-text-muted hover:text-emerald-500 py-3 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer text-sm font-bold"
                    >
                      <Plus size={16} /> Adicionar Item
                    </button>
                  )}

                  <Reorder.Group
                    axis="y"
                    values={pendingItems}
                    onReorder={handleReorder}
                    className="space-y-2"
                  >
                    {pendingItems.map((item, index) => (
                      <Reorder.Item
                        key={item.id || `pending-${index}`}
                        value={item}
                        className="relative cursor-grab active:cursor-grabbing"
                      >
                        <div
                          className={`p-3 rounded-xl border flex flex-col justify-center transition-all ${buyingItemId === item.id ? "bg-bg-surface border-emerald-500/50 shadow-md" : "bg-bg-surface border-border-divider hover:border-border-divider"} group/item`}
                        >
                          {buyingItemId === item.id ? (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2 text-emerald-500 border-b border-border-divider pb-2">
                                <ShoppingCart size={16} />{" "}
                                <span className="text-xs font-bold">
                                  Comprar {item.name}
                                </span>
                              </div>

                              <div>
                                <label className="text-[10px] text-text-muted uppercase font-bold ml-1">
                                  Como você pagou?
                                </label>
                                <div className="relative mt-1">
                                  <Wallet className="absolute left-3 top-2.5 w-4 h-4 text-text-muted" />
                                  <select
                                    value={selectedPaymentMethod}
                                    onChange={(e) =>
                                      setSelectedPaymentMethod(e.target.value)
                                    }
                                    className="w-full bg-bg-base border border-border-divider text-text-main text-sm rounded-lg py-2 pl-9 pr-2 outline-none focus:border-emerald-500 cursor-pointer appearance-none"
                                  >
                                    <option value="">
                                      Selecione uma opção
                                    </option>
                                    <option
                                      value="GOAL_BALANCE"
                                      className="font-bold text-emerald-400"
                                    >
                                      Usar Saldo da Meta (Livre: R${" "}
                                      {availableGoalBalance.toFixed(2)})
                                    </option>
                                    <optgroup label="Contas">
                                      {accounts.map((acc, idx) => (
                                        <option
                                          key={acc.id || `acc-${idx}`}
                                          value={`ACC_${acc.id}`}
                                        >
                                          {acc.name} (R${" "}
                                          {acc.balance.toFixed(2)})
                                        </option>
                                      ))}
                                    </optgroup>
                                    {cards.length > 0 && (
                                      <optgroup label="Cartões de Crédito">
                                        {cards.map((card, idx) => (
                                          <option
                                            key={card.id || `card-${idx}`}
                                            value={`CARD_${card.id}`}
                                          >
                                            Cartão {card.name}
                                          </option>
                                        ))}
                                      </optgroup>
                                    )}
                                  </select>
                                </div>
                              </div>

                              <div className="flex gap-2">
                                <div className="flex-1">
                                  <label className="text-[10px] text-text-muted uppercase font-bold ml-1">
                                    Valor
                                  </label>
                                  <input
                                    autoFocus
                                    type="number"
                                    step="0.01"
                                    placeholder={item.estimatedPrice.toString()}
                                    value={paidPrice}
                                    onChange={(e) =>
                                      setPaidPrice(e.target.value)
                                    }
                                    className="w-full mt-1 bg-bg-base border border-border-divider text-text-main rounded-lg px-3 py-2 text-sm focus:border-emerald-500 outline-none font-bold"
                                  />
                                </div>

                                {/* Select de Parcelas aparece se for Cartão */}
                                {isCreditCardSelected && (
                                  <div className="w-24">
                                    <label className="text-[10px] text-text-muted uppercase font-bold ml-1">
                                      Parcelas
                                    </label>
                                    <select
                                      value={installments}
                                      onChange={(e) =>
                                        setInstallments(Number(e.target.value))
                                      }
                                      className="w-full mt-1 bg-bg-base border border-border-divider text-text-main rounded-lg px-2 py-2 text-sm focus:border-emerald-500 outline-none font-bold"
                                    >
                                      <option value={1}>1x</option>
                                      {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(
                                        (n) => (
                                          <option key={n} value={n}>
                                            {n}x
                                          </option>
                                        ),
                                      )}
                                    </select>
                                  </div>
                                )}
                              </div>

                              <div className="flex gap-2 pt-1">
                                <button
                                  onClick={() => handlePurchaseItem(item.id)}
                                  disabled={
                                    !selectedPaymentMethod || !paidPrice
                                  }
                                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-lg font-bold cursor-pointer transition disabled:opacity-50 flex items-center justify-center gap-1"
                                >
                                  <Check size={16} /> Confirmar
                                </button>
                                <button
                                  onClick={() => {
                                    setBuyingItemId(null);
                                    setSelectedPaymentMethod("");
                                  }}
                                  className="px-4 bg-bg-surface-hover hover:bg-zinc-700 text-text-main rounded-lg cursor-pointer transition flex items-center justify-center"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3">
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="text-zinc-700 hover:text-text-muted cursor-grab active:cursor-grabbing transition-colors p-1 -ml-1"
                              >
                                <GripVertical size={16} />
                              </div>
                              <button
                                onClick={() => {
                                  setBuyingItemId(item.id);
                                  setPaidPrice(item.estimatedPrice.toString());
                                }}
                                className="shrink-0 text-text-muted hover:text-emerald-500 transition-colors cursor-pointer"
                              >
                                <Circle size={20} />
                              </button>

                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-text-main truncate">
                                  {item.name}
                                </p>
                                {item.suggestedModel && (
                                  <p className="text-[10px] text-text-muted truncate">
                                    {item.suggestedModel}
                                  </p>
                                )}
                              </div>

                              <div className="text-right shrink-0 flex items-center gap-3">
                                <PrivacyBlur className="text-sm font-bold text-text-main">
                                  {formatCurrency(item.estimatedPrice)}
                                </PrivacyBlur>
                                <button
                                  onClick={() => setItemToDelete(item.id)}
                                  className="opacity-0 group-hover/item:opacity-100 p-1.5 text-text-muted hover:text-rose-500 hover:bg-rose-500/10 rounded transition cursor-pointer"
                                  title="Remover item"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </Reorder.Item>
                    ))}
                  </Reorder.Group>

                  {purchasedItems.length > 0 && (
                    <div className="mt-6 space-y-2">
                      <h4 className="text-[10px] font-bold uppercase text-text-muted tracking-wider mb-2">
                        Comprados
                      </h4>
                      {purchasedItems.map((item, index) => (
                        <div
                          key={item.id || `purchased-${index}`}
                          className="p-3 rounded-xl border bg-bg-surface/40 border-border-divider/50 opacity-70 group/item flex items-center gap-3"
                        >
                          <div className="pl-6">
                            <CheckCircle2
                              size={20}
                              className="text-emerald-500"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-text-muted line-through truncate">
                              {item.name}
                            </p>
                            <p className="text-[10px] text-emerald-500/70 truncate">
                              {item.usedGoalBalance
                                ? "Usou Saldo da Meta"
                                : "Pagamento Externo"}
                            </p>
                          </div>
                          <div className="text-right shrink-0 flex items-center gap-3">
                            <div>
                              <PrivacyBlur className="text-sm font-bold text-text-muted">
                                {formatCurrency(item.paidPrice || 0)}
                              </PrivacyBlur>
                              {item.paidPrice !== item.estimatedPrice && (
                                <p
                                  className={`text-[9px] font-medium ${item.paidPrice! > item.estimatedPrice ? "text-rose-500" : "text-blue-400"}`}
                                >
                                  Est: {formatCurrency(item.estimatedPrice)}
                                </p>
                              )}
                            </div>
                            <button
                              onClick={() => setItemToDelete(item.id)}
                              className="opacity-0 group-hover/item:opacity-100 p-1.5 text-text-muted hover:text-rose-500 hover:bg-rose-500/10 rounded transition cursor-pointer"
                              title="Remover e Estornar"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* HISTÓRICO */}
              {activeTab === "HISTORY" && (
                <div className="p-6">
                  <div className="space-y-0 relative">
                    <div className="absolute left-4 top-2 bottom-4 w-px bg-bg-surface-hover"></div>
                    {isHistoryLoading ? (
                      <div className="py-4 text-center">
                        <Loader2 className="animate-spin mx-auto text-emerald-500" />
                      </div>
                    ) : history.length > 0 ? (
                      history.map((item, index) => (
                        <div
                          key={item.id || `history-${index}`}
                          className="relative flex gap-4 pb-6 last:pb-0 group"
                        >
                          <div className="relative z-10 w-8 h-8 mt-1 rounded-full bg-bg-surface border-2 border-border-divider flex items-center justify-center shrink-0 group-hover:border-emerald-500/50 transition-colors">
                            {item.amount === 0 ? (
                              <ShoppingCart
                                size={14}
                                className="text-emerald-500"
                              />
                            ) : (
                              <ArrowUpCircle
                                size={14}
                                className="text-emerald-500"
                              />
                            )}
                          </div>

                          {/* Wrapper do Item para suportar o Protocolo abaixo */}
                          <div className="flex-1 space-y-2">
                            {/* O CARD DO HISTÓRICO PADRÃO */}
                            <div className="bg-bg-surface/50 border border-border-divider/50 rounded-xl p-3 hover:bg-bg-surface transition-colors flex justify-between items-start group/item">
                              <div>
                                <p className="text-text-main font-medium text-sm">
                                  {item.note || "Aporte"}
                                </p>
                                <p className="text-text-muted text-[10px] mt-0.5">
                                  {new Date(item.date).toLocaleDateString()} às{" "}
                                  {new Date(item.date).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </p>
                              </div>
                              <div className="flex items-center gap-3">
                                <PrivacyBlur className="text-emerald-400 font-bold text-sm whitespace-nowrap">
                                  {item.amount === 0
                                    ? ""
                                    : item.amount > 0
                                      ? "+ "
                                      : "- "}
                                  {formatarValorMeta(
                                    Math.abs(item.amount),
                                    goal.type,
                                    goal.unit,
                                  )}
                                </PrivacyBlur>

                                {item.amount > 0 &&
                                  !isLinkedToHabit &&
                                  !isLinkedToInvestment &&
                                  item.note !== "Check via Hábito" && (
                                    <button
                                      onClick={() =>
                                        openDeleteHistory(item, goal)
                                      }
                                      className="opacity-0 group-hover/item:opacity-100 p-1.5 text-text-muted hover:text-rose-500 hover:bg-rose-500/10 rounded transition cursor-pointer"
                                      title="Estornar"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  )}
                              </div>
                            </div>

                            {/* O RENDER DO PROTOCOLO (SE EXISTIR) */}
                            {item.protocol && (
                              <div className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-4 mt-2">
                                <div className="flex items-center gap-2 mb-3 text-purple-400 border-b border-purple-500/10 pb-2">
                                  <Sparkles size={14} />
                                  <span className="text-xs font-bold uppercase tracking-wider">
                                    Protocolo de Evolução
                                  </span>
                                </div>
                                <div className="space-y-3">
                                  {item.protocol.essence && (
                                    <div>
                                      <p className="text-[10px] font-bold text-purple-500/70 uppercase">
                                        A Essência
                                      </p>
                                      <p className="text-xs text-text-main mt-0.5 leading-relaxed">
                                        {item.protocol.essence}
                                      </p>
                                    </div>
                                  )}
                                  {item.protocol.personalConnection && (
                                    <div>
                                      <p className="text-[10px] font-bold text-purple-500/70 uppercase">
                                        Conexão Pessoal
                                      </p>
                                      <p className="text-xs text-text-main mt-0.5 leading-relaxed">
                                        {item.protocol.personalConnection}
                                      </p>
                                    </div>
                                  )}
                                  {item.protocol.systemEngineering && (
                                    <div>
                                      <p className="text-[10px] font-bold text-purple-500/70 uppercase">
                                        Plano de Ação
                                      </p>
                                      <p className="text-xs text-text-main mt-0.5 leading-relaxed">
                                        {item.protocol.systemEngineering}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-10 text-text-muted text-sm">
                        <p>Nenhum histórico registrado.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* FOOTER AÇÕES EXTRAS */}
            <div className="p-6 border-t border-border-divider bg-bg-surface shrink-0 grid grid-cols-2 gap-3">
              <button
                onClick={() => onDelete(goal)}
                className="flex items-center justify-center gap-2 bg-bg-surface-hover hover:bg-rose-500/10 hover:text-rose-500 text-text-main py-3 rounded-xl font-medium transition cursor-pointer text-sm"
              >
                Deletar Meta
              </button>

              <button
                onClick={() => onDeposit(goal)}
                disabled={isLocked}
                title={lockMessage}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition text-sm ${isLocked ? "bg-bg-surface-hover text-text-muted cursor-not-allowed shadow-none" : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20 cursor-pointer"}`}
              >
                <Plus size={16} />{" "}
                {goal.type === "MONETARY" ? "Aporte Avulso" : "Registrar"}
              </button>
            </div>
          </motion.div>

          {itemToDelete && (
            <div onClick={(e) => e.stopPropagation()}>
              <ConfirmationModal
                isOpen={!!itemToDelete}
                onClose={() => setItemToDelete(null)}
                title="Excluir Sub-item"
                message="Tem certeza? Se este item foi pago externamente (Conta ou Cartão), a transação vinculada será estornada e apagada automaticamente do seu extrato/fatura."
                confirmText="Confirmar"
                confirmColor="bg-rose-600 hover:bg-rose-700 text-white"
                onConfirm={handleDeleteItem}
              />
            </div>
          )}
        </div>
      )}
    </AnimatePresence>
  );
}
