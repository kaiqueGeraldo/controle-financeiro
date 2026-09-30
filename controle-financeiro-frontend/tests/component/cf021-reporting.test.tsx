import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { AnnualInvestments } from "@/components/screens/annual-summary/annualInvestments";
import { BalanceCard } from "@/components/screens/dashboard/balanceCard";
import { summarizeInvestmentPosition } from "@/contexts/investmentsContext";
import { ExtractSummary } from "@/components/screens/extract/extractSummary";
import { formatObservedMoney } from "@/components/ui/reportingCoverage";
import { monetaryAggregate } from "@/utils/monetaryAggregate";
import { InvoicesCard } from "@/components/screens/dashboard/invoicesCard";

vi.mock("@/hooks/useUser", () => ({ useUser: () => ({ user: { privacyMode: false } }) }));

describe("CF-021: apresentação de posições", () => {
  test("faturas fora da faixa não apresentam total monetário truncado", () => {
    render(<InvoicesCard total={null} lista={[{id:"card",nome:"Cartão",valor:999999999999.99,vencimento:"28",cor:""}]}/>);
    expect(screen.getByText("Total fora da faixa")).toBeDefined();
    expect(screen.getByText("R$ 999.999.999.999,99")).toBeDefined();
  });
  test("período sem cobertura não apresenta observado zero como total completo", () => {
    render(<ExtractSummary entries={null} exits={null} balance={null}
      coverage={{state:"UNAVAILABLE",requestedFrom:"2026-07-01",requestedThrough:"2026-07-31",knownFrom:"2026-08-01",knownThrough:"2026-09-30",unknownSources:0,reason:"Período fora da cobertura conhecida."}}
      observed={{entries:"0.00",exits:"0.00",balance:"0.00"}}/>);
    expect(screen.getAllByText("Indisponível")).toHaveLength(3);
    expect(screen.getByText(/não representam o total completo/)).toBeDefined();
    expect(screen.getByText("Total do período indisponível")).toBeDefined();
  });
  test("período vazio coberto apresenta zero conhecido", () => {
    render(<ExtractSummary entries={0} exits={0} balance={0}
      coverage={{state:"COMPLETE",requestedFrom:"2026-09-01",requestedThrough:"2026-09-30",knownFrom:"2026-08-01",knownThrough:"2026-09-30",unknownSources:0,reason:"Período coberto."}}/>);
    expect(screen.getAllByText("R$ 0,00")).toHaveLength(3);
    expect(screen.queryByText("Indisponível")).toBeNull();
  });
  test("subtotal acima da faixa preserva centavos sem conversão para Number", () => {
    expect(formatObservedMoney("1999999999999.98")).toBe("R$ 1.999.999.999.999,98");
    expect(monetaryAggregate([999999999999.99,0.01])).toBeNull();
    expect(monetaryAggregate([1.005])).toBeNull();
    expect(monetaryAggregate([0.1,0.2,-0.01])).toBe(0.29);
  });
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
