import { apiRequest } from "./api";
import { normalizeInvestmentHistory } from "./temporal";
import {
  CreateInvestmentDTO,
  InvestmentOperationDTO,
  UpdateBalanceDTO,
  Investment,
  InvestTransaction,
} from "@/types";

export interface InvestmentCorrectionCommand {
  operationId: string;
  date: string;
  reason: string;
  returnedFees: string;
  replacementQuantity: string | null;
  replacementPrice: string | null;
  replacementFees: string | null;
}
export interface InvestmentCorrection {
  id: string;
  originalId: string;
  effectiveDate: string;
  accountId: string;
  cashDelta: number;
  realizedDelta: number;
  recordedAt: string;
  reason: string;
  returnedFees: number;
  replacementQuantity: number | null;
  replacementPrice: number | null;
  replacementFees: number | null;
}

export const investmentService = {
  correct: (id: string, data: InvestmentCorrectionCommand) => apiRequest<InvestmentCorrection>(`/investments/operation/${id}/corrections`, {
    method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify(data),
  }),
  corrections: (id: string, signal?: AbortSignal) => apiRequest<InvestmentCorrection[]>(`/investments/${id}/corrections`, {method:"GET",signal}),
  getAll: async (signal?: AbortSignal) => {
    return apiRequest<Investment[]>("/investments", { method: "GET", signal });
  },

  create: async (data: CreateInvestmentDTO) => {
    return apiRequest<Investment>("/investments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  },

  operation: async (data: InvestmentOperationDTO) => {
    return apiRequest("/investments/operation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  },

  updateBalance: async (data: UpdateBalanceDTO) => {
    return apiRequest("/investments/update-balance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  },

  getHistory: async (id: string, signal?: AbortSignal) => {
    return apiRequest<InvestTransaction[]>(`/investments/${id}/history`, {
      method: "GET",
      signal,
    }).then((response) => ({ ...response, data: response.data.map(normalizeInvestmentHistory) }));
  },

  delete: async (id: string) => {
    return apiRequest(`/investments/${id}`, { method: "DELETE" });
  },
  
  deleteHistory: async (transactionId: string) => {
    return apiRequest(`/investments/operation/${transactionId}`, {
      method: "DELETE",
    });
  },
};
