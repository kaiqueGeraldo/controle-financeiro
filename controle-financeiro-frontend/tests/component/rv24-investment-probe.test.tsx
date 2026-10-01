import { act, fireEvent, render } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { OperationModal } from "@/components/forms/operationModal";
import { ApiError } from "@/services/api";
import { investmentService } from "@/services/investmentService";
vi.mock("@/components/ui/modal", () => ({ Modal: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock("@/contexts/toastContext", () => ({ useToast: () => ({ error: vi.fn() }) }));
vi.mock("@/hooks/useUser", () => ({ useUser: () => ({ user: { id: "probe-owner" } }) }));
vi.mock("@/hooks/useFinanceData", () => ({ useFinanceData: () => ({ accounts: [{ id: "account", balance: 1000 }] }) }));
vi.mock("@/services/investmentService", () => ({ investmentService: { operation: vi.fn() } }));
test("RV24-01: investment unknown outcome blocks a new submission", async () => {
  vi.mocked(investmentService.operation).mockRejectedValue(new ApiError("Unknown", 502, { requiresReconciliation: true }));
  const view = render(<OperationModal isOpen onClose={vi.fn()} onSuccess={vi.fn()} asset={{ id: "asset", name: "Asset", ticker: "TEST3", type: "STOCK", quantity: 10, averagePrice: 100, currentPrice: 100 }} />);
  fireEvent.change(view.getByPlaceholderText("0"), { target: { value: "2" } });
  fireEvent.change(view.getByPlaceholderText("0,00"), { target: { value: "100" } });
  await act(async () => fireEvent.submit(view.container.querySelector("form")!));
  await act(async () => fireEvent.submit(view.container.querySelector("form")!));
  expect(investmentService.operation).toHaveBeenCalledTimes(1);
});
