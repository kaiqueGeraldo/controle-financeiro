import { Account, AccountPosition, CreateAccountDTO } from "@/types";
import { apiRequest } from "./api";

export const accountService = {
  getPosition: (signal?:AbortSignal)=>apiRequest<AccountPosition>("/accounts/position",{method:"GET",signal}),
  getAll: async (signal?: AbortSignal) => {
    return apiRequest<Account[]>("/accounts", { method: "GET", signal });
  },
  create: async (data: CreateAccountDTO) => {
    return apiRequest<Account>("/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  },
  update: async (id: string, data: Partial<CreateAccountDTO>) => {
    return apiRequest<Account>(`/accounts/${id}`, {
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
