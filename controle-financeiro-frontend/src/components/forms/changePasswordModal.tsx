"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { userService } from "@/services/userService";
import { Loader2, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";
import { validarSenha } from "@/validators/inputValidator";

export function ChangePasswordModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    current: "",
    newPass: "",
    confirm: "",
  });

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const valid = validarSenha(formData.newPass, formData.confirm, "novaSenha");
    if (Object.keys(valid).length > 0) {
      setError(valid.novaSenha || valid.confirmarNovaSenha);
      return;
    }

    setIsLoading(true);
    try {
      await userService.changePassword(formData.current, formData.newPass);
      setSuccess(true);
      setFormData({ current: "", newPass: "", confirm: "" });

      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);
    } catch (error: any) {
      setError(
        error.message || "Erro ao alterar senha. Verifique sua senha atual.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Alterar Senha">
      <form onSubmit={handleSubmit} className="space-y-4 mt-2">
        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-xl flex items-center gap-2 text-sm font-medium">
            <CheckCircle2 size={18} /> Senha alterada com sucesso!
          </div>
        )}

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-xl flex items-center gap-2 text-sm font-medium">
            <AlertCircle size={18} className="shrink-0" /> {error}
          </div>
        )}

        <div>
          <label className="text-xs text-text-muted font-bold uppercase ml-1">
            Senha Atual
          </label>
          <div className="relative mt-1">
            <input
              type={showCurrent ? "text" : "password"}
              required
              value={formData.current}
              onChange={(e) =>
                setFormData({ ...formData, current: e.target.value })
              }
              className="w-full bg-bg-base border border-border-divider rounded-xl py-3 pl-4 pr-12 text-text-main focus:outline-none focus:border-emerald-500"
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-4 top-3.5 text-text-muted hover:text-text-main"
            >
              {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div>
          <label className="text-xs text-text-muted font-bold uppercase ml-1">
            Nova Senha
          </label>
          <div className="relative mt-1">
            <input
              type={showNew ? "text" : "password"}
              required
              value={formData.newPass}
              onChange={(e) =>
                setFormData({ ...formData, newPass: e.target.value })
              }
              className="w-full bg-bg-base border border-border-divider rounded-xl py-3 pl-4 pr-12 text-text-main focus:outline-none focus:border-emerald-500"
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-4 top-3.5 text-text-muted hover:text-text-main"
            >
              {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div>
          <label className="text-xs text-text-muted font-bold uppercase ml-1">
            Confirmar Nova Senha
          </label>
          <input
            type={showNew ? "text" : "password"}
            required
            value={formData.confirm}
            onChange={(e) =>
              setFormData({ ...formData, confirm: e.target.value })
            }
            className="w-full mt-1 bg-bg-base border border-border-divider rounded-xl px-4 py-3 text-text-main focus:outline-none focus:border-emerald-500"
          />
        </div>

        <button
          disabled={isLoading}
          type="submit"
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl mt-4 flex justify-center items-center"
        >
          {isLoading ? <Loader2 className="animate-spin" /> : "Atualizar Senha"}
        </button>
      </form>
    </Modal>
  );
}
