"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Category, TransactionType } from "@/types";
import { useFinanceData } from "@/hooks/useFinanceData";
import {
  Loader2,
  Plus,
  Trash2,
  Pencil,
  ShoppingCart,
  Utensils,
  Car,
  Home,
  Briefcase,
  GraduationCap,
  HeartPulse,
  Gamepad2,
  Plane,
  TrendingUp,
  Banknote,
  Coffee,
  Smartphone,
  CreditCard,
  AlertCircle,
} from "lucide-react";
import { ConfirmationModal } from "../modals/confirmModal";

const ICONS = [
  { name: "ShoppingCart", icon: <ShoppingCart size={20} /> },
  { name: "Utensils", icon: <Utensils size={20} /> },
  { name: "Car", icon: <Car size={20} /> },
  { name: "Home", icon: <Home size={20} /> },
  { name: "Briefcase", icon: <Briefcase size={20} /> },
  { name: "GraduationCap", icon: <GraduationCap size={20} /> },
  { name: "HeartPulse", icon: <HeartPulse size={20} /> },
  { name: "Gamepad2", icon: <Gamepad2 size={20} /> },
  { name: "Plane", icon: <Plane size={20} /> },
  { name: "TrendingUp", icon: <TrendingUp size={20} /> },
  { name: "Banknote", icon: <Banknote size={20} /> },
  { name: "Coffee", icon: <Coffee size={20} /> },
  { name: "Smartphone", icon: <Smartphone size={20} /> },
  { name: "CreditCard", icon: <CreditCard size={20} /> },
];

const COLORS = [
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
  "#f43f5e",
  "#f59e0b",
  "#06b6d4",
  "#6366f1",
  "#a8a29e",
];

interface ManageCategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ManageCategoriesModal({
  isOpen,
  onClose,
}: ManageCategoriesModalProps) {
  const {
    categories,
    createCategory,
    updateCategory,
    deleteCategory,
    isLoading: isFinanceLoading,
  } = useFinanceData();
  const [view, setView] = useState<"LIST" | "FORM">("LIST");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    id: "",
    name: "",
    icon: "ShoppingCart",
    color: "#10b981",
    type: "EXPENSE" as TransactionType,
  });

  // Reseta o estado sempre que o modal abre
  useEffect(() => {
    if (isOpen) {
      setView("LIST");
      setErrorMessage(null);
    }
  }, [isOpen]);

  const handleOpenForm = (category?: Category) => {
    setErrorMessage(null);
    if (category) {
      setFormData({
        id: category.id,
        name: category.name,
        icon: category.icon,
        color: category.color,
        type: category.type,
      });
    } else {
      setFormData({
        id: "",
        name: "",
        icon: "ShoppingCart",
        color: "#10b981",
        type: "EXPENSE",
      });
    }
    setView("FORM");
  };

  const handleSave = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSaving(true);

    try {
      if (formData.id) {
        await updateCategory(formData.id, formData);
      } else {
        await createCategory(formData);
      }
      setView("LIST");
    } catch (error: any) {
      setErrorMessage("Erro ao salvar categoria.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;
    setErrorMessage(null);
    try {
      await deleteCategory(categoryToDelete);
      setCategoryToDelete(null);
    } catch (error: any) {
      setErrorMessage("Erro ao excluir categoria.");
    }
  };

  const renderIcon = (iconName: string, color: string) => {
    const found = ICONS.find((i) => i.name === iconName);
    return (
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center bg-bg-base border border-border-divider shrink-0"
        style={{ color }}
      >
        {found ? found.icon : <ShoppingCart size={20} />}
      </div>
    );
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Categorias">
        <div className="mt-4 min-h-87.5 max-h-[75vh] overflow-y-auto custom-scroll overscroll-contain px-1 pb-4">
          {/* MENSAGEM DE ERRO INLINE */}
          {errorMessage && (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 flex items-start gap-2 mb-4">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <p className="text-xs text-rose-400 font-medium">
                {errorMessage}
              </p>
            </div>
          )}

          {view === "LIST" ? (
            <div className="space-y-4">
              <button
                onClick={() => handleOpenForm()}
                className="w-full bg-bg-surface border border-dashed border-border-divider hover:border-emerald-500 hover:bg-emerald-500/5 text-text-muted hover:text-emerald-500 py-3 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Plus size={18} />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Nova Categoria
                </span>
              </button>

              {/* GRID COM 2 COLUNAS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="group relative flex items-center justify-between p-2.5 bg-bg-surface/80 hover:bg-bg-surface rounded-xl border border-border-divider hover:border-border-divider transition-all overflow-hidden"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {renderIcon(cat.icon, cat.color)}

                      <div className="min-w-0 pr-2">
                        <p
                          className="font-bold text-sm text-text-main truncate"
                          title={cat.name}
                        >
                          {cat.name}
                        </p>
                        <p
                          className={`text-[10px] uppercase font-bold tracking-wider mt-0.5 ${cat.type === "INCOME" ? "text-emerald-500" : "text-rose-500"}`}
                        >
                          {cat.type === "INCOME" ? "Receita" : "Despesa"}
                        </p>
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="flex gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        onClick={() => handleOpenForm(cat)}
                        className="p-1.5 text-text-muted hover:text-text-main bg-bg-base border border-border-divider rounded-lg transition cursor-pointer"
                        title="Editar"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        onClick={() => setCategoryToDelete(cat.id)}
                        className="p-1.5 text-text-muted hover:text-rose-500 hover:bg-rose-500/10 bg-bg-base border border-border-divider rounded-lg transition cursor-pointer"
                        title="Excluir"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {categories.length === 0 && !isFinanceLoading && (
                <p className="text-center text-text-muted text-sm py-10">
                  Nenhuma categoria cadastrada.
                </p>
              )}
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-5">
              {/* Toggle Tipo */}
              <div className="flex bg-bg-base p-1 rounded-xl border border-border-divider">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: "EXPENSE" })}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${formData.type === "EXPENSE" ? "bg-rose-500/10 text-rose-500 border border-rose-500/20" : "text-text-muted hover:text-text-main"}`}
                >
                  Despesa
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: "INCOME" })}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${formData.type === "INCOME" ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "text-text-muted hover:text-text-main"}`}
                >
                  Receita
                </button>
              </div>

              {/* Nome */}
              <div>
                <label className="text-xs text-text-muted font-bold uppercase ml-1">
                  Nome da Categoria
                </label>
                <input
                  required
                  autoFocus
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full mt-1 bg-bg-base border border-border-divider rounded-xl px-4 py-3 text-text-main focus:outline-none focus:border-emerald-500"
                  placeholder="Ex: Supermercado"
                />
              </div>

              {/* Ícones */}
              <div>
                <label className="text-xs text-text-muted font-bold uppercase ml-1">
                  Ícone
                </label>
                <div className="grid grid-cols-7 gap-2 mt-2">
                  {ICONS.map((item) => (
                    <div
                      key={item.name}
                      onClick={() =>
                        setFormData({ ...formData, icon: item.name })
                      }
                      className={`aspect-square rounded-xl flex items-center justify-center cursor-pointer transition-all border
                        ${formData.icon === item.name ? "bg-bg-surface-hover border-zinc-600 text-text-main shadow-md" : "bg-bg-base border-border-divider text-text-muted hover:bg-bg-surface hover:text-text-main"}`}
                    >
                      {item.icon}
                    </div>
                  ))}
                </div>
              </div>

              {/* Cores */}
              <div>
                <label className="text-xs text-text-muted font-bold uppercase ml-1">
                  Cor
                </label>
                <div className="flex gap-3 mt-2 flex-wrap">
                  {COLORS.map((c) => (
                    <div
                      key={c}
                      onClick={() => setFormData({ ...formData, color: c })}
                      className={`w-8 h-8 rounded-full cursor-pointer border-2 transition-transform hover:scale-110 ${formData.color === c ? "border-white scale-110 shadow-lg" : "border-transparent"}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setView("LIST")}
                  className="flex-1 py-3 bg-bg-surface-hover text-text-main font-bold rounded-xl hover:bg-bg-button-hover transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition cursor-pointer flex justify-center items-center shadow-lg shadow-emerald-900/20 disabled:opacity-50"
                >
                  {isSaving ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    "Salvar Categoria"
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </Modal>

      {/* Modal de Confirmação de Exclusão Aninhado */}
      <ConfirmationModal
        isOpen={!!categoryToDelete}
        onClose={() => setCategoryToDelete(null)}
        onConfirm={handleDelete}
        title="Excluir Categoria"
        message="As transações atreladas a esta categoria não serão apagadas, mas ficarão sem categoria. Confirma a exclusão?"
        confirmText="Excluir"
        confirmColor="bg-rose-600 hover:bg-rose-700 text-white"
      />
    </>
  );
}
