import { apiRequest } from "./api";

export interface CreditCard {
  id: string;
  name: string;
  last4Digits: string;
  limit: number;
  closingDay: number;
  dueDay: number;
  color: string;
  brand: "MASTERCARD" | "VISA";
  currentInvoiceValue: number;
}

export interface CreateCardDTO {
  name: string;
  limit: number;
  closingDay: number;
  dueDay: number;
  color: string;
  brand: string;
  last4Digits: string;
}

export interface UpdateCardDTO {
  name?: string;
  limit?: number;
  closingDay?: number;
  dueDay?: number;
  color?: string;
}

export interface CreateCardTransactionDTO {
  description: string;
  amount: number;
  date: string;
  time: string;
  categoryId: string;
  cardId: string;
  totalInstallments: number;
}

export const cardService = {
  getAll: async () => {
    return apiRequest("/cards", { method: "GET" });
  },
  create: async (data: CreateCardDTO) => {
    return apiRequest("/cards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  },
  createTransaction: async (data: CreateCardTransactionDTO) => {
    return apiRequest("/cards/transaction", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  },
  update: async (id: string, data: UpdateCardDTO) => {
    return apiRequest(`/cards/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  },
  delete: async (id: string) => {
    return apiRequest(`/cards/${id}`, { method: "DELETE" });
  },
  getInvoiceDetails: async (
    cardId: string,
    month: number,
    year: number,
    signal?: AbortSignal,
  ) => {
    return apiRequest(`/cards/${cardId}/invoice?month=${month}&year=${year}`, {
      method: "GET",
      signal,
    });
  },
  payInvoice: async (cardId: string, data: any) => {
    return apiRequest(`/cards/${cardId}/pay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  },
  updateTransaction: async (
    id: string,
    data: { description?: string; categoryId?: string },
  ) => {
    return apiRequest(`/cards/transaction/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  },
  deleteTransaction: async (id: string) => {
    return apiRequest(`/cards/transaction/${id}`, { method: "DELETE" });
  },
  reorder: async (orderedIds: string[]) => {
    return apiRequest("/cards/reorder", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderedIds),
    });
  },
};
