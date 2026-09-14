import { ChevronRight } from "lucide-react";
import React from "react";

// --- TOGGLE SUAVE ---
export const Toggle = ({
  isOn,
  onToggle,
  label,
  disabled = false,
}: {
  isOn: boolean;
  onToggle: () => void;
  label: string;
  disabled?: boolean;
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={isOn}
    aria-label={label}
    disabled={disabled}
    onClick={(e) => { 
        e.stopPropagation(); 
        onToggle(); 
    }}
    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 ${
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
  disabled?: boolean;
}

export const ConfigItem = ({ icon, title, description, rightElement, onClick, isDanger, disabled = false }: ConfigItemProps) => {
  const content = <>
    <div className="flex min-w-0 items-start gap-4 text-left">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDanger ? 'bg-rose-500/10 text-rose-500' : 'bg-bg-surface-hover text-text-muted group-hover:text-text-main'}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className={`font-medium ${isDanger ? 'text-rose-500' : 'text-text-main'}`}>{title}</p>
        {description && <p className="text-xs text-text-muted break-words">{description}</p>}
      </div>
    </div>
    <div className="shrink-0">
        {rightElement || <ChevronRight size={18} className="text-text-muted group-hover:text-text-muted" />}
    </div>
  </>;

  const className = "flex w-full items-center justify-between gap-4 border border-border-divider border-b-0 bg-bg-surface p-4 transition-colors first:rounded-t-2xl last:rounded-b-2xl last:border-b";

  return onClick ? (
    <button type="button" onClick={onClick} disabled={disabled} className={`${className} group cursor-pointer hover:bg-bg-surface-hover/50 focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-emerald-500 disabled:cursor-not-allowed disabled:opacity-50`}>
      {content}
    </button>
  ) : (
    <div className={`${className} group`}>{content}</div>
  );
};
