import { apiRequest } from "./api";
import { normalizeTransaction } from "./temporal";
import { CreateTransactionDTO, PageResponse, Transaction, TransactionType } from "@/types";

export const transactionService = {
  getSummary: async (params: { month: number; year: number; type?: TransactionType | "todos"; accountId?: string; signal?: AbortSignal }) => {
    const query = new URLSearchParams({ month: String(params.month), year: String(params.year) });
    if (params.type && params.type !== "todos") query.set("type", params.type);
    if (params.accountId && params.accountId !== "todas") query.set("accountId", params.accountId);
    return apiRequest<{ entries: number; exits: number; balance: number }>(`/transactions/summary?${query}`, {
      method: "GET", signal: params.signal,
    });
  },
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
    return apiRequest<PageResponse<Transaction>>(`/transactions${queryString}`, {
      method: "GET",
      signal: params?.signal
    }).then((response) => ({ ...response, data: { ...response.data, content: response.data.content.map(normalizeTransaction) } }));
  },
  create: async (data: CreateTransactionDTO) => {
    return apiRequest<Transaction>("/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((response) => ({ ...response, data: normalizeTransaction(response.data) }));
  },
  update: async (id: string, data: Partial<CreateTransactionDTO>) => {
    return apiRequest<Transaction>(`/transactions/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((response) => ({ ...response, data: normalizeTransaction(response.data) }));
  },
  delete: async (id: string) => {
    return apiRequest(`/transactions/${id}`, { method: "DELETE" });
  },
  exportExcel: async () => {
    return apiRequest<Blob>("/transactions/export", {
      method: "GET", isBlob: true,
      expectedContentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
  },
};
