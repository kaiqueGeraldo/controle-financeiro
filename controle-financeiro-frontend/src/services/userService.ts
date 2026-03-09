import { apiRequest } from "./api";

export const userService = {
  updateProfile: async (nome: string, email: string) => {
    return apiRequest("/users/me/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, email }),
    });
  },
  changePassword: async (senhaAtual: string, novaSenha: string) => {
    return apiRequest("/users/me/password", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ senhaAtual, novaSenha }),
    });
  },
  updatePreferences: async (preferences: { darkMode?: boolean; privacyMode?: boolean, notifContas?: boolean, notifSemanal?: boolean, dashboardConfig?: string }) => {
    return apiRequest("/users/me/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(preferences),
    });
  },
  deleteAccount: async () => {
    return apiRequest("/users/me", { method: "DELETE" });
  }
};