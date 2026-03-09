"use client";

import { createContext, useContext, useState, ReactNode, useMemo } from "react";
import { CreditCard } from "@/services/cardService";

export type PayInvoiceData = {
  card: CreditCard;
  invoiceTotal: number;
  month: number;
  year: number;
} | null;

interface CardModalContextType {
  isNewCardOpen: boolean;
  newCardTransactionCardId: string | undefined;
  payInvoiceData: PayInvoiceData;
  cardToDeleteId: string | null;
  
  openNewCard: () => void;
  closeNewCard: () => void;
  openNewCardTransaction: (cardId?: string) => void;
  closeNewCardTransaction: () => void;
  openPayInvoice: (data: PayInvoiceData) => void;
  closePayInvoice: () => void;
  openDeleteCard: (id: string) => void;
  closeDeleteCard: () => void;
}

const CardModalContext = createContext<CardModalContextType | undefined>(undefined);

export function CardModalProvider({ children }: { children: ReactNode }) {
  const [isNewCardOpen, setIsNewCardOpen] = useState(false);
  const [isNewCardTransactionOpen, setIsNewCardTransactionOpen] = useState(false);
  const [newCardTransactionCardId, setNewCardTransactionCardId] = useState<string | undefined>(undefined);
  const [payInvoiceData, setPayInvoiceData] = useState<PayInvoiceData>(null);
  const [cardToDeleteId, setCardToDeleteId] = useState<string | null>(null);

  const value = useMemo(() => ({
    isNewCardOpen,
    newCardTransactionCardId: isNewCardTransactionOpen ? newCardTransactionCardId : undefined,
    payInvoiceData,
    cardToDeleteId,
    
    openNewCard: () => setIsNewCardOpen(true),
    closeNewCard: () => setIsNewCardOpen(false),
    openNewCardTransaction: (id?: string) => { setNewCardTransactionCardId(id); setIsNewCardTransactionOpen(true); },
    closeNewCardTransaction: () => { setIsNewCardTransactionOpen(false); setNewCardTransactionCardId(undefined); },
    openPayInvoice: (data: PayInvoiceData) => setPayInvoiceData(data),
    closePayInvoice: () => setPayInvoiceData(null),
    openDeleteCard: (id: string) => setCardToDeleteId(id),
    closeDeleteCard: () => setCardToDeleteId(null),
  }), [isNewCardOpen, isNewCardTransactionOpen, newCardTransactionCardId, payInvoiceData, cardToDeleteId]);

  return <CardModalContext.Provider value={value}>{children}</CardModalContext.Provider>;
}

export const useCardModals = () => {
  const context = useContext(CardModalContext);
  if (!context) throw new Error("useCardModals deve ser usado dentro do CardModalProvider");
  return context;
};