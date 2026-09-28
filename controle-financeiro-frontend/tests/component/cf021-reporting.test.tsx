import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { AnnualInvestments } from "@/components/screens/annual-summary/annualInvestments";
import { BalanceCard } from "@/components/screens/dashboard/balanceCard";
import { summarizeInvestmentPosition } from "@/contexts/investmentsContext";

vi.mock("@/hooks/useUser", () => ({ useUser: () => ({ user: { privacyMode: false } }) }));

describe("CF-021: apresentação de posições", () => {
  test("consolidação de investimento usa custo persistido e avaliação, sem recompor pelo preço médio", () => {
    const asset = {
      id: "asset", ticker: "TEST3", name: "Ativo", type: "STOCK" as const,
      quantity: 10, averagePrice: 39.99999999, currentPrice: 60,
      totalCost: 400, valuationAmount: 500,
    };
    expect(summarizeInvestmentPosition([asset])).toEqual({
      totalInvestido: 500, valuationComplete: true, lucroTotal: 100, rentabilidadeGeral: 25,
    });
    expect(summarizeInvestmentPosition([asset, { ...asset, id: "missing", valuationAmount: null }]))
      .toMatchObject({ totalInvestido: 500, valuationComplete: false, lucroTotal: null, rentabilidadeGeral: null });
  });
  test("custo 400 e avaliação 500 são linhas distintas; destinação não entra no total", () => {
    render(<AnnualInvestments totalCost={400} totalValue={500}
      positionDateLabel="Posição atual, sem fechamento histórico"
      items={[{ name: "Ativo sintético", value: 500, type: "ASSET", color: "BLUE" }]} />);

    expect(screen.getByText("Custo investido")).toBeDefined();
    expect(screen.getByText("R$ 400,00")).toBeDefined();
    expect(screen.getAllByText("R$ 500,00")).toHaveLength(2);
    expect(screen.queryByText("R$ 700,00")).toBeNull();
  });

  test("cotação ausente não vira zero nem custo como avaliação", () => {
    render(<AnnualInvestments totalCost={400} totalValue={null}
      positionDateLabel="Posição atual, sem fechamento histórico"
      items={[{ name: "Ativo sem cotação", value: null, type: "ASSET", color: "BLUE" }]} />);

    expect(screen.getAllByText("Avaliação indisponível")).toHaveLength(2);
    expect(screen.queryByText("R$ 0,00")).toBeNull();
  });

  test("subtotal do dashboard informa dívida excluída e avaliação incompleta", () => {
    render(<BalanceCard saldoTotal={1000} saldoContas={1000} saldoInvestimentos={0}
      valuationComplete={false} />);

    expect(screen.getByText("Subtotal de ativos conhecidos")).toBeDefined();
    expect(screen.getByText(/total completo indisponível/)).toBeDefined();
    expect(screen.getByText(/Dívida e crédito de cartões não incluídos/)).toBeDefined();
  });
});
