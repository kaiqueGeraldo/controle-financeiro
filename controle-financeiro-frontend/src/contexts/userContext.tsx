import { Usuario } from "@/models/usuarioModel";
import { getUserFromToken } from "@/services/authService";
import { ApiError } from "@/services/api";
import { useToast } from "./toastContext";
import {
  isAbortError,
  useRequestCoordinator,
} from "@/hooks/useRequestCoordinator";
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from "react";

type UserContextType = {
  user: Usuario | null;
  isLoading: boolean;
  refetchUser: () => Promise<void>;
  clearUser: () => void;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const toast = useToast();
  const [user, setUser] = useState<Usuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const requests = useRequestCoordinator("authenticated-user");

  const refetchUser = useCallback(async () => {
    const request = requests.begin("current-user");
    setIsLoading(true);

    try {
      const response = await getUserFromToken(request.signal);
      const userData = response?.data;

      if (!request.isCurrent()) return;

      setUser({
        id: userData.id,
        nome: userData.nome,
        email: userData.email,
        privacyMode: userData.privacyMode || false,
        darkMode: userData.darkMode ?? true,
        notifContas: userData.notifContas ?? true,
        notifSemanal: userData.notifSemanal ?? true,
        dashboardConfig: userData.dashboardConfig,
      });

      if (userData.darkMode !== false) {
        document.documentElement.classList.add("dark");
        localStorage.setItem("theme-preference", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("theme-preference", "light");
      }
    } catch (error: unknown) {
      if (!request.isCurrent() || isAbortError(error)) return;

      if (error instanceof ApiError && error.status === 401) {
        // The HTTP client owns the single sessionExpired event.
        setUser(null);
      } else {
        toast.error(error instanceof Error ? error.message : "Não foi possível atualizar o perfil. Tente novamente.");
      }
    } finally {
      if (request.isCurrent()) setIsLoading(false);
      request.finish();
    }
  }, [requests, toast]);

  const clearUser = useCallback(() => {
    requests.invalidate("current-user");
    setUser(null);
    setIsLoading(false);
  }, [requests]);

  useEffect(() => {
    refetchUser();
  }, [refetchUser]);

  const contextValue = useMemo(
    () => ({
      user,
      isLoading,
      refetchUser,
      clearUser,
    }),
    [user, isLoading, refetchUser, clearUser],
  );

  return (
    <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>
  );
};

export const useUserContext = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser deve ser usado dentro de um UserProvider");
  }
  return context;
};
