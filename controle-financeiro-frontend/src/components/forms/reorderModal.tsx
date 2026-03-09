import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Reorder } from "framer-motion";
import { GripVertical, Loader2 } from "lucide-react";
import { useToast } from "@/contexts/toastContext";

interface ReorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  items: any[];
  onSave: (orderedIds: string[]) => Promise<void>;
  renderItem: (item: any) => React.ReactNode;
}

export function ReorderModal({ isOpen, onClose, title, items, onSave, renderItem }: ReorderModalProps) {
  const [orderedItems, setOrderedItems] = useState(items);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (isOpen) setOrderedItems(items);
  }, [isOpen, items]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await onSave(orderedItems.map(i => i.id));
      onClose();
    } catch (error) {
      toast.error("Erro ao reordenar itens.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="mt-4 space-y-4">
        <Reorder.Group axis="y" values={orderedItems} onReorder={setOrderedItems} className="space-y-2 max-h-[60vh] overflow-y-auto custom-scroll pr-1">
          {orderedItems.map((item, index) => (
            <Reorder.Item key={item.id || index} value={item} className="relative cursor-grab active:cursor-grabbing bg-bg-surface border border-border-divider rounded-xl p-3 flex items-center gap-3 hover:border-border-divider transition-colors">
              <GripVertical size={18} className="text-text-muted shrink-0" />
              <div className="flex-1 min-w-0 pointer-events-none">
                {renderItem(item)}
              </div>
            </Reorder.Item>
          ))}
        </Reorder.Group>

        <button
          disabled={isLoading}
          onClick={handleSave}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl flex justify-center items-center gap-2 transition cursor-pointer shadow-lg shadow-emerald-900/20 mt-2"
        >
          {isLoading ? <Loader2 className="animate-spin" /> : "Salvar Nova Ordem"}
        </button>
      </div>
    </Modal>
  );
}