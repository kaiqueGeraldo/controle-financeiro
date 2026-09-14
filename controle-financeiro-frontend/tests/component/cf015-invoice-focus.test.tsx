import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { expect, test, vi } from "vitest";
import { InvoiceDetails } from "@/components/screens/cards/invoiceDetails";
vi.mock("@/hooks/useUser", () => ({ useUser: () => ({ user: { privacyMode: false } }) }));

test("CF015-R08: abrir detalhe da fatura por teclado leva foco para o diálogo", () => {
  function Harness() {
    const [open, setOpen] = useState(false);
    return <><button onClick={() => setOpen(true)}>Abrir fatura</button>
      <InvoiceDetails isOpen={open} onClose={() => setOpen(false)}
        card={{ id: "cf015-card", name: "Sintético", last4Digits: "4242", limit: 1000, closingDay: 20, dueDay: 28,
          color: "#111", brand: "VISA", currentInvoiceValue: 100 }}
        invoiceData={{ month: 9, year: 2026, status: "OPEN", totalAmount: 100, transactions: [] }}
        isLoadingInvoice={false} viewDateFormatted="setembro de 2026" onChangeMonth={vi.fn()}
        onPay={vi.fn()} onDelete={vi.fn()} onUpdateLimit={async () => undefined} /></>;
  }
  render(<Harness />);
  screen.getByRole("button", { name: "Abrir fatura" }).focus();
  fireEvent.click(screen.getByRole("button", { name: "Abrir fatura" }));
  expect(screen.getByRole("dialog").contains(document.activeElement)).toBe(true);
});
