"use client";

import { useState, useEffect, useRef } from "react";
import { Modal } from "@/components/ui/modal";
import { userService } from "@/services/userService";
import { useUser } from "@/hooks/useUser";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, AlertTriangle, AlertCircle } from "lucide-react";
import { validarEmail, validarNome } from "@/validators/inputValidator";
import { getErrorMessage } from "@/utils/errors";

export function EditProfileModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { user, refetchUser } = useUser();
  const { handleLogout } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ nome: "", email: "" });
  const [error, setError] = useState<string | null>(null);
  const initializedUser = useRef<string | null>(null);

  useEffect(() => {
    if (!isOpen || !user) {
      initializedUser.current = null;
      return;
    }
    if (initializedUser.current !== user.id) {
      initializedUser.current = user.id;
      setFormData({ nome: user.nome, email: user.email });
      setError(null);
    }
  }, [user, isOpen]);

  const emailMudou = user && formData.email !== user.email;

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validarNome(formData.nome) || validarEmail(formData.email);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);

    try {
      await userService.updateProfile(formData.nome, formData.email);

      if (emailMudou) {
        handleLogout(() => onClose());
      } else {
        await refetchUser();
        onClose();
      }
    } catch (error: unknown) {
      setError(getErrorMessage(error, "Erro ao atualizar perfil."));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar Informações">
      <form onSubmit={handleSubmit} className="space-y-4 mt-2">
        {error && (
          <div role="alert" className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-xl flex items-start gap-2 text-sm font-medium">
            <AlertCircle size={18} className="shrink-0 mt-0.5" /> {error}
          </div>
        )}

        {emailMudou && (
          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500 p-3 rounded-xl flex items-start gap-3">
            <AlertTriangle size={20} className="shrink-0" />
            <div className="text-sm">
              <p className="font-bold">Atenção!</p>
              <p className="text-amber-500/80 text-xs mt-0.5">
                Ao alterar seu e-mail, você será desconectado e precisará fazer
                login novamente com a nova credencial.
              </p>
            </div>
          </div>
        )}

        <div>
          <label htmlFor="profile-name" className="text-xs text-text-muted font-bold uppercase ml-1">
            Nome
          </label>
          <input
            id="profile-name"
            required
            value={formData.nome}
            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            className="w-full mt-1 bg-bg-base border border-border-divider rounded-xl px-4 py-3 text-text-main focus:outline-none focus:border-emerald-500"
          />
        </div>
        <div>
          <label htmlFor="profile-email" className="text-xs text-text-muted font-bold uppercase ml-1">
            E-mail
          </label>
          <input
            id="profile-email"
            type="email"
            required
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            className="w-full mt-1 bg-bg-base border border-border-divider rounded-xl px-4 py-3 text-text-main focus:outline-none focus:border-emerald-500"
          />
        </div>

        <button
          disabled={isLoading}
          type="submit"
          className={`w-full font-bold py-3.5 rounded-xl mt-4 flex justify-center items-center transition-colors ${emailMudou ? "bg-amber-600 hover:bg-amber-500 text-white" : "bg-emerald-600 hover:bg-emerald-500 text-white"}`}
        >
          {isLoading ? (
            <Loader2 className="animate-spin" />
          ) : emailMudou ? (
            "Salvar e Sair"
          ) : (
            "Salvar Alterações"
          )}
        </button>
      </form>
    </Modal>
  );
}
