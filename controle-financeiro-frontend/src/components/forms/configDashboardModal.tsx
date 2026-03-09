"use client";

import { Modal } from "@/components/ui/modal";
import { useToast } from "@/contexts/toastContext";
import { useUser } from "@/hooks/useUser";
import { userService } from "@/services/userService";
import { Reorder } from "framer-motion";
import { Columns, Eye, EyeOff, GripVertical, History, Landmark, LineChart, Loader2, Receipt, Target, TrendingUp, Wallet } from "lucide-react";
import { useEffect, useState } from "react";

interface ConfigDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export type DashboardCardConfig = {
  id: "BALANCE" | "FLOW" | "INVOICES" | "CHART" | "GOALS" | "RECENT_TX" | "ACCOUNTS";
  visible: boolean;
  span: number; // 1, 2 ou 3 colunas de largura
};

// Alturas proporcionais simulando o mundo real (h-12 = Baixo, h-20 = Médio, h-28 = Alto)
export const CARD_DEF = {
  BALANCE: { label: "Patrimônio", allowedSpans: [1, 2], height: "h-12", icon: <Wallet size={14}/>, color: "text-emerald-500", bg: "bg-emerald-500/10 border-emerald-500/20" },
  FLOW: { label: "Balanço Mês", allowedSpans: [1, 2], height: "h-12", icon: <TrendingUp size={14}/>, color: "text-blue-500", bg: "bg-blue-500/10 border-blue-500/20" },
  INVOICES: { label: "Faturas", allowedSpans: [1, 2], height: "h-20", icon: <Receipt size={14}/>, color: "text-purple-500", bg: "bg-purple-500/10 border-purple-500/20" },
  ACCOUNTS: { label: "Contas", allowedSpans: [1, 2], height: "h-20", icon: <Landmark size={14}/>, color: "text-cyan-500", bg: "bg-cyan-500/10 border-cyan-500/20" },
  RECENT_TX: { label: "Extrato", allowedSpans: [1, 2, 3], height: "h-20", icon: <History size={14}/>, color: "text-amber-500", bg: "bg-amber-500/10 border-amber-500/20" },
  CHART: { label: "Evolução", allowedSpans: [2, 3], height: "h-28", icon: <LineChart size={14}/>, color: "text-text-main", bg: "bg-bg-surface-hover border-border-divider" },
  GOALS: { label: "Metas", allowedSpans: [1, 2, 3], height: "h-28", icon: <Target size={14}/>, color: "text-rose-500", bg: "bg-rose-500/10 border-rose-500/20" },
};

export const DEFAULT_CONFIG: DashboardCardConfig[] = [
  { id: "BALANCE", visible: true, span: 1 },
  { id: "FLOW", visible: true, span: 1 },
  { id: "INVOICES", visible: true, span: 1 },
  { id: "CHART", visible: true, span: 2 },
  { id: "GOALS", visible: true, span: 1 },
  { id: "RECENT_TX", visible: true, span: 1 },
  { id: "ACCOUNTS", visible: true, span: 1 },
];

export function ConfigDashboardModal({ isOpen, onClose }: ConfigDashboardModalProps) {
  const { user, refetchUser } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [items, setItems] = useState<DashboardCardConfig[]>([]);
  const toast = useToast();
  
  const safeParseConfig = (rawConfig: string | undefined): DashboardCardConfig[] => {
    let parsed: any[] = [];
    if (rawConfig) {
      try {
        let clean = rawConfig;
        if (clean.startsWith('"') && clean.endsWith('"')) clean = JSON.parse(clean);
        clean = clean.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
        parsed = JSON.parse(clean);
      } catch (e) {
        parsed = [];
      }
    }
    
    const validIds = Object.keys(CARD_DEF);
    const result: DashboardCardConfig[] = [];
    
    parsed.filter(p => validIds.includes(p.id)).forEach(p => {
      const def = DEFAULT_CONFIG.find(d => d.id === p.id);
      result.push({ ...def, ...p, span: p.span || def?.span || 1 });
    });

    DEFAULT_CONFIG.forEach(def => {
      if (!result.find(r => r.id === def.id)) result.push(def);
    });

    return result;
  };

  useEffect(() => {
    if (isOpen) setItems(safeParseConfig(user?.dashboardConfig));
  }, [isOpen, user]);

  const toggleVisibility = (id: string) => {
    setItems(items.map(item => item.id === id ? { ...item, visible: !item.visible } : item));
  };

  const cycleSpan = (id: string) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const allowed = CARD_DEF[item.id as keyof typeof CARD_DEF].allowedSpans;
        const currentIndex = allowed.indexOf(item.span);
        const nextIndex = (currentIndex + 1) % allowed.length;
        return { ...item, span: allowed[nextIndex] };
      }
      return item;
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await userService.updatePreferences({ dashboardConfig: JSON.stringify(items) });
      await refetchUser();
      onClose();
    } catch (error) {
      toast.error("Erro ao salvar preferências.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Organizar Painel">
      
      {/* 1. VISUALIZADOR EM TEMPO REAL (O items-start reproduz os espaços vazios) */}
      <div className="mb-6">
        <p className="text-text-muted text-[10px] uppercase font-bold tracking-wider mb-2 text-center">
          Preview em Tempo Real (Alturas Reais)
        </p>
        <div className="bg-bg-base p-3 rounded-2xl border border-border-divider grid grid-cols-3 gap-2 grid-flow-dense items-start">
          {items.filter(i => i.visible).map(item => {
            const def = CARD_DEF[item.id as keyof typeof CARD_DEF];
            const colSpanClass = item.span === 3 ? "col-span-3" : item.span === 2 ? "col-span-2" : "col-span-1";
            
            return (
              <div 
                key={`preview-${item.id}`} 
                className={`rounded-lg flex flex-col items-center justify-center opacity-80 border ${def.bg} ${colSpanClass} ${def.height} transition-all duration-300 overflow-hidden px-1`}
              >
                <div className={`${def.color} opacity-80 mb-0.5`}>{def.icon}</div>
                <span className={`text-[8px] font-bold truncate w-full text-center ${def.color}`}>{def.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. LISTA ARRASTÁVEL COM CONTROLE DE TAMANHO */}
      <p className="text-text-muted text-[10px] uppercase font-bold tracking-wider mb-2 text-center">
        Tamanho e Ordem
      </p>
      <div className="max-h-[35vh] overflow-y-auto custom-scroll pr-1">
        <Reorder.Group axis="y" values={items} onReorder={setItems} className="space-y-2">
          {items.map((item) => {
            const def = CARD_DEF[item.id as keyof typeof CARD_DEF];
            return (
              <Reorder.Item key={item.id} value={item} className="relative cursor-grab active:cursor-grabbing">
                <div className={`flex items-center justify-between p-3 rounded-xl border transition-all ${item.visible ? 'bg-bg-surface border-border-divider' : 'bg-bg-base border-border-divider/50 grayscale opacity-50'}`}>
                  
                  <div className="flex items-center gap-3">
                    <GripVertical size={16} className="text-text-muted shrink-0" />
                    <span className="font-bold text-xs text-text-main">{def.label}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button 
                        type="button" 
                        onClick={() => cycleSpan(item.id)} 
                        disabled={!item.visible || def.allowedSpans.length === 1}
                        className="flex items-center gap-1 p-1.5 px-2 bg-bg-base border border-border-divider rounded-lg text-text-muted hover:text-text-main transition disabled:opacity-50 cursor-pointer"
                    >
                        <Columns size={12} />
                        <span className="text-[10px] font-bold">{item.span}x</span>
                    </button>

                    <div className="w-px h-6 bg-bg-surface-hover mx-1"></div>

                    <button type="button" onClick={() => toggleVisibility(item.id)} className="p-1.5 hover:bg-black/20 rounded-lg text-text-muted transition cursor-pointer">
                        {item.visible ? <Eye size={16} className="text-emerald-500" /> : <EyeOff size={16} />}
                    </button>
                  </div>

                </div>
              </Reorder.Item>
            );
          })}
        </Reorder.Group>
      </div>

      <button disabled={isLoading} onClick={handleSave} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl mt-6 flex justify-center items-center gap-2 transition cursor-pointer shadow-lg shadow-emerald-900/20">
        {isLoading ? <Loader2 className="animate-spin" /> : "Salvar Configuração"}
      </button>
    </Modal>
  );
}