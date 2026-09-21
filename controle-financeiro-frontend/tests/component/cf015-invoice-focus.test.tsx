import { fireEvent, render, screen, within, waitFor } from "@testing-library/react";
import { useState } from "react";
import { expect, test, vi } from "vitest";
import { InvoiceDetails } from "@/components/screens/cards/invoiceDetails";
import { Modal } from "@/components/ui/modal";
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

test("R08: Tab fica no diálogo superior, Escape fecha só o filho e foco retorna", async () => {
  function Harness() {
    const [open, setOpen] = useState(false), [child, setChild] = useState(false);
    return <><button onClick={() => setOpen(true)}>Abrir fatura</button>
      <InvoiceDetails isOpen={open} onClose={() => setOpen(false)}
        card={{ id: "nested", name: "Sintético", last4Digits: "4242", limit: 1000, closingDay: 20, dueDay: 28, color: "#111", brand: "VISA", currentInvoiceValue: 100 }}
        invoiceData={{ month: 9, year: 2026, status: "OPEN", totalAmount: 100, transactions: [] }}
        isLoadingInvoice={false} viewDateFormatted="setembro de 2026" onChangeMonth={vi.fn()}
        onPay={() => setChild(true)} onDelete={vi.fn()} onUpdateLimit={async () => undefined} />
      <Modal isOpen={child} onClose={() => setChild(false)} title="Pagamento filho"><button>Última ação</button></Modal>
    </>;
  }
  render(<Harness />);
  const opener = screen.getByRole("button", { name: "Abrir fatura" });
  opener.focus(); fireEvent.click(opener);
  const parent = screen.getByRole("dialog");
  const pay = within(parent).getByRole("button", { name: /^(Pagar|Adiantar)/ });
  pay.focus(); fireEvent.click(pay);
  const child = screen.getByRole("dialog", { name: "Pagamento filho" });
  const close = within(child).getByRole("button", { name: "Fechar modal" });
  expect(document.activeElement).toBe(close);
  fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
  expect(document.activeElement).toBe(within(child).getByRole("button", { name: "Última ação" }));
  fireEvent.keyDown(document, { key: "Tab" });
  expect(document.activeElement).toBe(close);
  fireEvent.keyDown(document, { key: "Escape" });
  await waitFor(() => expect(screen.queryByRole("dialog", { name: "Pagamento filho" })).toBeNull());
  expect(document.activeElement).toBe(pay);
  expect(document.body.style.overflow).toBe("hidden");
  fireEvent.keyDown(document, { key: "Escape" });
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(document.activeElement).toBe(opener);
  expect(document.body.style.overflow).not.toBe("hidden");
});
