import { localDateString } from "@/utils/date";

export type Json = null | string | number | boolean | Json[] | { [key: string]: Json };
export type Obj = { [key: string]: Json };
export const sections = ["accounts", "cards", "investments", "goals", "allocations", "forecasts"] as const;
export type SectionName = typeof sections[number];
export const steps = ["CONTEXT", "ACCOUNTS", "CARDS", "INVESTMENTS", "GOALS", "ALLOCATIONS", "FORECASTS", "REVIEW"] as const;
export type Step = typeof steps[number];
export type Answer = "UNANSWERED" | "NONE" | "PROVIDED" | "DEFERRED";
export type Item = Obj & { tempId: string };
export type Interview = {
  context: Obj & { currency: "BRL" };
  currentStep: Step;
  sections: Record<SectionName, { answer: Answer; items: Item[] }>;
  reservationConfirmations?: Obj[];
};
export type Issue = { path: string; code: string; message: string };
export type Ref = { kind: "ACCOUNT" | "INVESTMENT" | "CARD" | "GOAL"; id?: string; tempId?: string };
export type SummaryAmount = { state: "KNOWN" | "PARTIAL" | "UNKNOWN" | "NOT_APPLICABLE"; value: string | null; knownSubtotal: string | null; outsideIndividualRange: boolean | null; missingPaths: string[] };
export type Fact = { state: "KNOWN"; value: string } | { state: "UNKNOWN" | "NOT_APPLICABLE" };
export const metricLabels = {
  accountsSigned: "Saldo das contas", investmentsValue: "Investimentos", cardCredit: "Crédito nos cartões",
  cardDebt: "Dívida dos cartões", netWorth: "Patrimônio", reservedAccounts: "Reservas em contas",
  reservedInvestments: "Reservas em investimentos", freeAccountCash: "Caixa livre gerencial",
  unallocatedInvestments: "Investimentos não destinados",
} as const;
export type Summary = {
  baseDate: string; existingAsOf: string; scope: "SELECTED_AND_EXISTING";
  coverage: { dimension: string; complete: boolean; missingPaths: string[] }[];
  metrics: Record<keyof typeof metricLabels, SummaryAmount>;
  bySource: { ref: Ref; value: Fact; reserved: SummaryAmount; free: SummaryAmount; newAllocationCapacity: SummaryAmount }[];
  byCard: { ref: Ref; debt: Fact; credit: Fact; committed: SummaryAmount; availableLimit: SummaryAmount }[];
  byGoal: { ref: Ref; type: "MONETARY" | "NUMERIC"; progress: SummaryAmount; covered: SummaryAmount }[];
  deferredSections: string[];
  reservationReview?: { reservations: Obj[]; evidence: Obj[]; decisions: { source: Ref; blockingReservationIds: string[]; state: "ALLOWED" | "BLOCKED"; reason: string | null }[]; confirmations: Obj[] };
  allocationChanges?: Obj[]; reservationChanges?: Obj[];
};
export type MappingPreview = { tempId: string; kind: string; action: string; existingId: string | null };
export type Prepared = {
  contractVersion: 1; operationId: string; kind: "ONBOARDING_COMPLETE"; sessionId: string;
  draftVersion: string; contentHash: string; reviewHash: string;
  sourceSnapshot: { inventoryToken: string; sources: { kind: string; id: string; revision: string; token: string }[] };
  summary: Summary; mappingPreview: MappingPreview[]; preparedAt: string;
};
export type Receipt = Omit<Prepared, "sourceSnapshot" | "mappingPreview" | "preparedAt"> & {
  status: "COMPLETED"; completedAt: string; mapping: { tempId: string; kind: string; action: string; id: string }[];
};
export type Session = {
  contractVersion: 1; sessionId: string | null; version: string;
  status: "NOT_STARTED" | "IN_PROGRESS" | "SKIPPED" | "COMPLETED";
  mode: "NEW" | "COMPLEMENT"; payload: Interview | null; issues: Issue[];
  updatedAt: string | null; pendingIntent: Prepared | null; completedReceipt: Receipt | null;
};
export type Operation = { contractVersion: 1; operationId: string; kind: "ONBOARDING_COMPLETE"; sessionId: string; state: "PREPARED" | "CANCELLED" | "COMPLETED"; prepared: Prepared; receipt: Receipt | null };
export type Choice = { id: string; kind: Ref["kind"] | "CATEGORY"; label: string; type?: string };
export const sectionLabels: Record<SectionName, string> = { accounts: "Contas", cards: "Cartões e dívidas", investments: "Investimentos", goals: "Metas", allocations: "Reservas vinculadas", forecasts: "Previsões opcionais" };
export function emptyInterview(): Interview {
  return { context: { currency: "BRL", baseDate: localDateString(), browserZone: Intl.DateTimeFormat().resolvedOptions().timeZone, boundaryAcknowledged: false, cashOnlyAcknowledged: false }, currentStep: "CONTEXT",
    sections: { accounts: { answer: "UNANSWERED", items: [] }, cards: { answer: "UNANSWERED", items: [] }, investments: { answer: "UNANSWERED", items: [] }, goals: { answer: "UNANSWERED", items: [] }, allocations: { answer: "UNANSWERED", items: [] }, forecasts: { answer: "UNANSWERED", items: [] } } };
}
export const refKey = (r: Ref) => `${r.kind}:${r.id ?? r.tempId}`;
export function newItem(name: SectionName): Item {
  const tempId = crypto.randomUUID();
  switch (name) {
    case "accounts": return { tempId, action: "CREATE", type: "CHECKING", deficitAcknowledged: false, distinctCashConfirmed: false };
    case "cards": return { tempId, action: "CREATE", opening: { futureInstallments: [], creditNotNettedAcknowledged: false } };
    case "investments": return { tempId, action: "CREATE", type: "FIXED_INCOME", positionMode: "MONETARY", quantity: { state: "NOT_APPLICABLE" } };
    case "goals": return { tempId, action: "CREATE", type: "MONETARY" };
    default: return { tempId };
  }
}
