import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, test, vi } from "vitest";

import { Modal } from "@/components/ui/modal";
import InputField from "@/components/ui/input";

vi.mock("framer-motion", async () => {
  const React = await import("react");

  const MotionDiv = ({
    children,
    initial: _initial,
    animate: _animate,
    exit: _exit,
    transition: _transition,
    ...props
  }: React.HTMLAttributes<HTMLDivElement> & {
    initial?: unknown;
    animate?: unknown;
    exit?: unknown;
    transition?: unknown;
  }) => <div {...props}>{children}</div>;

  return {
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    motion: { div: MotionDiv },
  };
});

function LongModalFixture() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setIsOpen(true)}>
        Abrir formulário longo
      </button>
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Revisar lançamento">
        <form>
          <label htmlFor="synthetic-value">Valor sintético</label>
          <input id="synthetic-value" />
          <p>{"Descrição sintética muito longa. ".repeat(80)}</p>
          <button type="submit">Confirmar lançamento</button>
        </form>
      </Modal>
    </>
  );
}

describe("componentes compartilhados: modal", () => {
  test("mantém diálogo longo acessível, fecha por Escape e retorna foco ao gatilho", async () => {
    const user = userEvent.setup();
    render(<LongModalFixture />);

    const trigger = screen.getByRole("button", { name: "Abrir formulário longo" });
    await user.click(trigger);

    const dialog = screen.getByRole("dialog", { name: "Revisar lançamento" });
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(screen.getByRole("button", { name: "Confirmar lançamento" })).toBeDefined();

    await waitFor(() => {
      expect(document.activeElement).toBe(
        screen.getByRole("button", { name: "Fechar modal" }),
      );
    });

    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
      expect(document.activeElement).toBe(trigger);
    });
  });

  test("impede Tab de escapar do diálogo enquanto está aberto", async () => {
    const user = userEvent.setup();
    render(<LongModalFixture />);

    await user.click(screen.getByRole("button", { name: "Abrir formulário longo" }));
    const closeButton = screen.getByRole("button", { name: "Fechar modal" });
    await waitFor(() => expect(document.activeElement).toBe(closeButton));

    await user.keyboard("{Shift>}{Tab}{/Shift}");
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "Confirmar lançamento" }),
    );

    fireEvent.click(screen.getByLabelText("Fechar modal"));
  });
});

describe("componentes compartilhados: campo com erro", () => {
  test("associa a mensagem de erro ao campo e sinaliza a invalidez", () => {
    render(
      <InputField
        label="Descrição"
        name="description"
        value=""
        onChange={() => undefined}
        error="A descrição é obrigatória."
      />,
    );

    const field = screen.getByRole("textbox", { name: "Descrição" });
    expect(field.getAttribute("aria-invalid")).toBe("true");
    expect(field.getAttribute("aria-describedby")).toBe("description-error");
    expect(screen.getByRole("alert").textContent).toBe(
      "A descrição é obrigatória.",
    );
  });
});
