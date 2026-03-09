import { useState } from "react";
import { StickyNote, Pencil, Save, Loader2 } from "lucide-react";
import { PrivacyBlur } from "@/components/ui/privacyBlur";

interface AnnualNotepadProps {
  year: number;
  content: string;
  isSaving: boolean;
  onContentChange: (content: string) => void;
  onSave: () => Promise<void>;
}

export function AnnualNotepad({ year, content, isSaving, onContentChange, onSave }: AnnualNotepadProps) {
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = async () => {
    await onSave();
    setIsEditing(false);
  };

  return (
    <div className="bg-text-notepad-two/5 border border-yellow-500/20 rounded-3xl p-6 h-full flex flex-col relative group min-h-100">
        <div className="flex items-center justify-between mb-4 text-text-notepad/80 shrink-0">
            <div className="flex items-center gap-2">
              <StickyNote className="w-5 h-5" />
              <h3 className="text-sm font-bold uppercase tracking-wider">Bloco de Notas {year}</h3>
            </div>
            <button 
              onClick={isEditing ? handleSave : () => setIsEditing(true)}
              disabled={isSaving}
              className="p-2 hover:bg-yellow-500/10 rounded-lg transition cursor-pointer text-text-notepad"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : (isEditing ? <Save className="w-4 h-4" /> : <Pencil className="w-4 h-4" />)}
            </button>
        </div>

        {isEditing ? (
          <textarea 
            value={content}
            onChange={(e) => onContentChange(e.target.value)}
            className="w-full flex-1 min-h-0 bg-transparent resize-none focus:outline-none text-text-notepad-two/90 font-medium leading-relaxed custom-scroll pr-2"
            autoFocus
            placeholder="Escreva suas anotações do ano aqui..."
          />
        ) : (
          <div 
            onDoubleClick={() => setIsEditing(true)}
            className="w-full flex-1 min-h-0 text-text-notepad-two/80 font-medium leading-relaxed whitespace-pre-line overflow-y-auto custom-scroll cursor-text pr-2"
          >
            {content ? <PrivacyBlur>{content}</PrivacyBlur> : <span className="opacity-50 italic">Clique no lápis para adicionar notas.</span>}
          </div>
        )}
        
        <div className="mt-4 pt-4 border-t border-yellow-500/10 text-[10px] text-text-notepad/40 text-center uppercase tracking-widest font-bold shrink-0">
          Notas salvas para {year}
        </div>
    </div>
  );
}