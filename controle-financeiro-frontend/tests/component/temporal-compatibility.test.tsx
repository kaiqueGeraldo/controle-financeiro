import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { TransactionItem } from "@/components/screens/extract/transactionItem";
import { TransactionDetails } from "@/components/screens/extract/transactionDetails";
import type { Transaction } from "@/types";
import { normalizeTransaction, normalizeInvestmentHistory, compareOperationTime, compactWallTime } from "@/services/temporal";
import { InvestmentDetails } from "@/components/screens/investments/investmentDetails";

vi.mock("@/hooks/useUser", () => ({ useUser: () => ({ user: { privacyMode: false } }) }));
const legacy: Transaction = { id: "legacy-synthetic", description: "Legado sintético", amount: 10,
  date: "2026-09-07", createdAt: "2026-09-07T23:30:00", type: "EXPENSE", isPaid: false, accountId: "account" };

test("P02: extrato não apresenta hora legada sem proveniência como informada", () => {
  render(<TransactionItem item={legacy} accounts={[]} isLast onClick={vi.fn()} />);
  expect(screen.getByLabelText("Horário não informado").textContent).toBe("—");
  expect(screen.queryByText("23:30")).toBeNull();
});

test("P02: detalhe preserva bruto desconhecido e editar não preenche hora artificial", () => {
  render(<TransactionDetails transaction={legacy} accounts={[]} categories={[]} isOpen onClose={vi.fn()}
    onUpdate={vi.fn()} onDelete={vi.fn()} />);
  expect(screen.getByText(/Fuso desconhecido/)).toBeDefined();
  expect(screen.getByText(/2026-09-07T23:30:00/)).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: "Editar" }));
  expect((screen.getByLabelText("Horário informado") as HTMLInputElement).value).toBe("");
});

test.each(["2026-09-07T00:00:00", "2026-09-07T23:30:45.123456"])("P01: nenhuma inferência pelo bruto %s", (raw) => {
  const row = { id: "history", type: "BUY" as const, date: raw, quantity: 1, price: 10, totalValue: 10, fees: 0 };
  expect(normalizeInvestmentHistory(row)).toMatchObject({ date: null, dateOrigin: "UNKNOWN", legacyDateRaw: raw });
  render(<InvestmentDetails isOpen asset={{ id: "asset", ticker: "SINT3", name: "Sintético", type: "STOCK", quantity: 1, averagePrice: 10, currentPrice: 10 }}
    history={[row]} isHistoryLoading={false} onClose={vi.fn()} onOperation={vi.fn()} onDeleteAsset={vi.fn()} onDeleteHistory={vi.fn()} />);
  expect(screen.getByLabelText("Data indisponível").textContent).toBe("—");
  expect(screen.getByText(`${raw} · Fuso desconhecido`)).toBeDefined();
});

test("P01: origem explícita conserva civil válida; inválido não vira hoje", () => {
  const row = { id: "history", type: "BUY" as const, date: "2026-09-07", dateOrigin: "USER_INPUT" as const, quantity: 1, price: 10, totalValue: 10, fees: 0 };
  expect(normalizeInvestmentHistory(row).date).toBe("2026-09-07");
  expect(normalizeInvestmentHistory({ ...row, dateOrigin: "PRODUCT_CALENDAR" }).date).toBe("2026-09-07");
  expect(normalizeInvestmentHistory({ ...row, date: "2026-02-29" }).date).toBeNull();
  expect(normalizeInvestmentHistory({ ...row, dateOrigin: undefined }).date).toBeNull();
});

test("P02: meia-noite explícita é conhecida; auditoria sem offset não é instante", () => {
  expect(compactWallTime("23:30:00")).toBe("23:30");
  expect(compactWallTime("23:30:45")).toBe("23:30:45");
  const known = { ...legacy, time: "00:00:00", timeOrigin: "USER_INPUT" as const };
  render(<TransactionItem item={known} accounts={[]} isLast onClick={vi.fn()} />);
  expect(screen.getByLabelText("Horário informado").textContent).toBe("00:00");
  expect(normalizeTransaction({ ...known, recordedAt: legacy.createdAt }).recordedAt).toBeNull();
  expect(normalizeTransaction({ ...known, recordedAt: "2026-09-08T03:10:00.123456Z" }).recordedAt).toBe("2026-09-08T03:10:00.123456Z");
  expect(normalizeTransaction({ ...known, timeOrigin: undefined }).time).toBeNull();
  expect(normalizeTransaction({ ...known, time: "24:00" }).time).toBeNull();
});

test.each([false, true])("P02: edição distingue omissão de remoção explícita, remover=%s", async (clear) => {
  const update = vi.fn().mockResolvedValue(undefined);
  const row = { ...legacy, time: "00:00:00", timeOrigin: "USER_INPUT" as const };
  const view = render(<TransactionDetails transaction={row} accounts={[]} categories={[]} isOpen onClose={vi.fn()} onUpdate={update} onDelete={vi.fn()} />);
  fireEvent.click(screen.getByRole("button", { name: "Editar" }));
  expect((screen.getByLabelText("Horário informado") as HTMLInputElement).value).toBe("00:00:00");
  if (clear) fireEvent.change(screen.getByLabelText("Horário informado"), { target: { value: "" } });
  fireEvent.submit(view.container.querySelector("form")!);
  await waitFor(() => expect(update).toHaveBeenCalledTimes(1));
  const payload = update.mock.calls[0][1];
  expect(payload.date).toBe("2026-09-07");
  if (clear) expect(payload.time).toBeNull();
  else expect(payload).not.toHaveProperty("time");
  expect(payload).not.toHaveProperty("recordedAt");
  expect(payload).not.toHaveProperty("createdAt");
});

test("P02: ordem usa hora conhecida e ID, independentemente do bruto", () => {
  const rows = [{ ...legacy, id: "a" }, { ...legacy, id: "b" },
    { ...legacy, id: "midnight", time: "00:00", timeOrigin: "USER_INPUT" as const },
    { ...legacy, id: "evening", time: "23:30:45", timeOrigin: "USER_INPUT" as const }];
  expect(rows.sort(compareOperationTime).map((row) => row.id)).toEqual(["evening", "midnight", "b", "a"]);
});
