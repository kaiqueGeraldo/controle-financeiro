import React from "react";
import { ChevronRight } from "lucide-react";

// --- TOGGLE SUAVE ---
export const Toggle = ({ isOn, onToggle }: { isOn: boolean; onToggle: () => void }) => (
  <button
    type="button"
    role="switch"
    aria-checked={isOn}
    onClick={(e) => { 
        e.stopPropagation(); 
        onToggle(); 
    }}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none ${
      isOn ? 'bg-emerald-500' : 'bg-zinc-700'
    }`}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${
        isOn ? 'translate-x-6' : 'translate-x-1'
      }`}
    />
  </button>
);

interface ConfigItemProps {
  icon: React.ReactNode; 
  title: string; 
  description?: string; 
  rightElement?: React.ReactNode;
  onClick?: () => void; 
  isDanger?: boolean;
}

export const ConfigItem = ({ icon, title, description, rightElement, onClick, isDanger }: ConfigItemProps) => (
  <div 
    onClick={onClick} 
    className="flex items-center justify-between p-4 bg-bg-surface border border-border-divider first:rounded-t-2xl last:rounded-b-2xl border-b-0 last:border-b hover:bg-bg-surface-hover/50 transition-colors cursor-pointer group"
  >
    <div className="flex items-center gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDanger ? 'bg-rose-500/10 text-rose-500' : 'bg-bg-surface-hover text-text-muted group-hover:text-text-main'}`}>
        {icon}
      </div>
      <div>
        <p className={`font-medium ${isDanger ? 'text-rose-500' : 'text-text-main'}`}>{title}</p>
        {description && <p className="text-xs text-text-muted">{description}</p>}
      </div>
    </div>
    <div>
        {rightElement || <ChevronRight size={18} className="text-text-muted group-hover:text-text-muted" />}
    </div>
  </div>
);