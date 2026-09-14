import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";

import { OverlayMobile } from "@/components/sidebar/overlayMobile";
import { SidebarTopbarMobile } from "@/components/sidebar/topbarMobile";

const setSidebarOpen = vi.fn();

vi.mock("@/hooks/useSidebar", () => ({
  useSidebar: () => ({ sidebarOpen: false, setSidebarOpen, scrolled: false }),
}));

describe("componentes compartilhados: navegação móvel", () => {
  test("expõe gatilhos nomeados para abrir e fechar o menu pelo teclado", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<SidebarTopbarMobile />);

    await user.click(screen.getByRole("button", { name: "Abrir menu de navegação" }));
    expect(setSidebarOpen).toHaveBeenCalledWith(true);

    const onClose = vi.fn();
    rerender(<OverlayMobile onClose={onClose} />);
    await user.click(screen.getByRole("button", { name: "Fechar menu de navegação" }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
