import { Usuario } from "@/models/usuarioModel";
import { getUserFromToken } from "@/services/authService";
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
  const [user, setUser] = useState<Usuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refetchUser = useCallback(async () => {
    try {
      const response = await getUserFromToken();
      const userData = response?.data;

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
      setUser(null);
      window.dispatchEvent(new Event("sessionExpired"));
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearUser = () => {
    setUser(null);
  };

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
    [user, isLoading, refetchUser],
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
