import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { PlanningDetails } from "@/components/screens/planning/planningDetails";
import { planningService } from "@/services/planningService";
import type { PlanItem } from "@/types";

const item: PlanItem = { id: "synthetic-plan", description: "Plano sintético", amount: 25,
  dueDate: "2027-01-30", categoryId: "category-a", status: "SAVED" };
const response = (status = 200) => new Response(JSON.stringify(status === 200 ? { ...item, amount: 35.5 } : {
  status, message: "Vencimento deve permanecer na competência do planejamento.", fields: { dueDate: ["Competência inválida."] },
}), { status, headers: { "content-type": "application/json" } });
function setup(status = 200) {
  const fetchMock = vi.fn().mockResolvedValue(response(status));
  vi.stubGlobal("fetch", fetchMock);
  render(<PlanningDetails isOpen item={item} categories={[]} onClose={vi.fn()}
    onDelete={vi.fn()} onUpdate={async (id, data) => { await planningService.update(id, data); }} />);
  fireEvent.click(screen.getByRole("button", { name: "Editar" }));
  return fetchMock;
}

test("P03: consumidor envia PUT tipado, só campos editáveis e mantém data literal", async () => {
  const fetchMock = setup();
  fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "35.50" } });
  fireEvent.submit(screen.getByRole("button", { name: "Salvar" }).closest("form")!);
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
  expect(fetchMock.mock.calls[0][0]).toBe("/api/planning/synthetic-plan");
  expect(fetchMock.mock.calls[0][1].method).toBe("PUT");
  expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ description: "Plano sintético",
    amount: 35.5, dueDate: "2027-01-30", categoryId: "category-a" });
  await waitFor(() => expect(screen.getByRole("button", { name: "Editar" })).toBeDefined());
});

test("falha de edição mantém formulário, entrada e erro visível sem sucesso", async () => {
  setup(400);
  fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "35.50" } });
  fireEvent.submit(screen.getByRole("button", { name: "Salvar" }).closest("form")!);
  expect((await screen.findByRole("alert")).textContent).toContain("Vencimento");
  expect((screen.getByRole("spinbutton") as HTMLInputElement).value).toBe("35.50");
  expect(screen.getByRole("button", { name: "Salvar" })).toBeDefined();
});

test("item gerenciado por fatura não oferece edição", () => {
  render(<PlanningDetails isOpen item={{ ...item, cardId: "card-synthetic" }} categories={[]}
    onClose={vi.fn()} onDelete={vi.fn()} onUpdate={vi.fn()} />);
  expect(screen.queryByRole("button", { name: "Editar" })).toBeNull();
  expect(screen.getByText("Este item é gerenciado pela fatura do cartão.")).toBeDefined();
  expect(screen.getByText("30/01/2027")).toBeDefined();
});
