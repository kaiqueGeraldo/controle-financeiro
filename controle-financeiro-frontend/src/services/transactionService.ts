import { apiRequest } from "./api";
import { CreateTransactionDTO, TransactionType } from "@/types";

export const transactionService = {
  getAll: async (params?: { 
    page?: number; 
    size?: number; 
    accountId?: string; 
    type?: TransactionType | "todos"; 
    month?: number; 
    year?: number;
    signal?: AbortSignal;
  }) => {
    const queryParams = new URLSearchParams();
    
    if (params) {
      if (params.page !== undefined) queryParams.append("page", params.page.toString());
      if (params.size !== undefined) queryParams.append("size", params.size.toString());
      if (params.accountId && params.accountId !== "todas") queryParams.append("accountId", params.accountId);
      if (params.type && params.type !== "todos") queryParams.append("type", params.type);
      if (params.month !== undefined) queryParams.append("month", params.month.toString());
      if (params.year !== undefined) queryParams.append("year", params.year.toString());
    }

    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : "";
    return apiRequest(`/transactions${queryString}`, { 
      method: "GET",
      signal: params?.signal
    });
  },
  create: async (data: CreateTransactionDTO) => {
    return apiRequest("/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  },
  update: async (id: string, data: Partial<CreateTransactionDTO>) => {
    return apiRequest(`/transactions/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  },
  delete: async (id: string) => {
    return apiRequest(`/transactions/${id}`, { method: "DELETE" });
  },
  exportExcel: async () => {
    return apiRequest("/transactions/export", { method: "GET", isBlob: true });
  },
};