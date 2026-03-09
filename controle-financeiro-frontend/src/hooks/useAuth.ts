import { useEffect, useState } from "react";
import { login, logout, register } from "@/services/authService";
import { useRouter, useSearchParams } from "next/navigation";
import {
  validarEmail,
  validarSenha,
  validarNome,
} from "@/validators/inputValidator";
import { useUser } from "./useUser";
import { removeAuthCookie, setAuthCookie } from "@/actions/authActions";
import { useAuthModals } from "@/contexts/modals/authModalContext";

export function useAuth() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refetchUser, clearUser } = useUser();

  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    senha: "",
    confirmarSenha: "",
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const { closeSessionExpired } = useAuthModals();

  useEffect(() => {
    const modo = searchParams.get("modo");

    if (modo === "login") setIsLogin(true);
    if (modo === "cadastro") setIsLogin(false);
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
    setApiError(null);
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    const emailError = validarEmail(formData.email);
    if (emailError) newErrors.email = emailError;

    if (!isLogin) {
      const nomeError = validarNome(formData.nome);
      if (nomeError) newErrors.nome = nomeError;

      const senhaErrors = validarSenha(
        formData.senha,
        formData.confirmarSenha,
        "senha",
      );
      Object.assign(newErrors, senhaErrors);
    }

    return newErrors;
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      setIsLoading(true);
      setApiError(null);

      if (isLogin) {
        const response = await login(formData.email, formData.senha);
        await setAuthCookie(response?.data.token);
      } else {
        await register(formData.nome, formData.email, formData.senha);
        const response = await login(formData.email, formData.senha);
        await setAuthCookie(response?.data.token);
      }

      closeSessionExpired();

      await refetchUser();
      router.push("/");
    } catch (error: unknown) {
      console.log(error);

      if (typeof error === "object" && error !== null && "message" in error) {
        const err = error as { message: string; status?: number };

        if (isLogin) {
          if (err.status === 404 || err.status === 401) {
            setErrors({
              email: "Credenciais inválidas",
              senha: "Credenciais inválidas",
            });
          } else {
            setApiError(err.message || "Erro desconhecido");
          }
        } else {
          if (err.status === 400 && err.message.includes("E-mail")) {
            setErrors({ email: err.message });
          } else {
            setApiError(err.message || "Erro ao registrar");
          }
        }
      } else {
        setApiError("Erro inesperado");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fecharModal = async () => {
    await refetchUser();
    router.push("/");
  };

  const toggleMode = () => {
    setIsLogin((prev) => !prev);
    setFormData({
      nome: "",
      email: "",
      senha: "",
      confirmarSenha: "",
    });
    setErrors({});
    setApiError(null);
  };

  const handleLogout = async (onClose?: () => void) => {
    try {
      await logout();
    } catch (error: unknown) {
      console.log("Aviso: Não foi possível invalidar o token na API.", error);
    } finally {
      await removeAuthCookie();
      clearUser();
      if (onClose) onClose();
      router.push("/auth");
    }
  };

  return {
    isLogin,
    setIsLogin,
    isLoading,
    formData,
    errors,
    apiError,
    handleChange,
    handleSubmit,
    toggleMode,
    handleLogout,
    fecharModal,
  };
}
