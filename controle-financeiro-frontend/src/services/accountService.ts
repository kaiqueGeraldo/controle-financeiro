import { apiRequest } from "./api";
import { Account, CreateAccountDTO } from "@/types";

export const accountService = {
  getAll: async () => {
    return apiRequest("/accounts", { method: "GET" });
  },
  create: async (data: CreateAccountDTO) => {
    return apiRequest("/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  },
  update: async (id: string, data: Partial<CreateAccountDTO>) => {
    return apiRequest(`/accounts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  },
  delete: async (id: string) => {
    return apiRequest(`/accounts/${id}`, { method: "DELETE" });
  },

  reorder: async (orderedIds: string[]) => {
    return apiRequest("/accounts/reorder", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderedIds),
    });
  },
};