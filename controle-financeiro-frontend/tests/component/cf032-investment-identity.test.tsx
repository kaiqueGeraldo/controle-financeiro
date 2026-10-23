import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import { InvestmentItem } from "@/components/screens/investments/investmentItem";
import { InvestmentDetails } from "@/components/screens/investments/investmentDetails";
import type { Investment } from "@/types";
import { investmentService } from "@/services/investmentService";

const state=vi.hoisted(()=>({privacy:false}));
vi.mock("@/hooks/useUser",()=>({useUser:()=>({user:{id:"owner",privacyMode:state.privacy}})}));
const asset:Investment={id:"9ee0f024-17cd-40a2-9974-801ec592f001",ticker:null,name:"Reserva A",type:"STOCK",
  quantity:3,averagePrice:0.2,currentPrice:1,totalCost:0.6,valuationAmount:1};
beforeEach(()=>{state.privacy=false;vi.spyOn(investmentService,"corrections").mockResolvedValue({status:200,data:[]});});

test("two same-type positions without ticker keep meaningful distinct names and UUID selection",()=>{
  const onClick=vi.fn();const other={...asset,id:"9ee0f024-17cd-40a2-9974-801ec592f002",name:"Reserva B"};
  render(<><InvestmentItem asset={asset} totalPortfolioValue={2} onClick={onClick}/><InvestmentItem asset={other} totalPortfolioValue={2} onClick={onClick}/></>);
  fireEvent.click(screen.getByRole("button",{name:"Ver detalhes do investimento Reserva A"}));
  fireEvent.keyDown(screen.getByRole("button",{name:"Ver detalhes do investimento Reserva B"}),{key:"Enter"});
  expect(onClick.mock.calls).toEqual([[asset.id],[other.id]]);
  expect(screen.getByText("Reserva A")).toBeDefined();expect(screen.getByText("Reserva B")).toBeDefined();
});

test.each([["ABCD3","Nome descritivo","ABCD3"],[null,"Nome sem ticker","Nome sem ticker"],["   ","Nome longo ".repeat(20),"Nome longo ".repeat(20).trim()],[null,"","Investimento sem identificação"]])("label %s / %s remains complete and accessible",(ticker,name,label)=>{
  render(<InvestmentItem asset={{...asset,ticker,name}} totalPortfolioValue={1} onClick={vi.fn()}/>);
  expect(screen.getByRole("button",{name:`Ver detalhes do investimento ${label}`})).toBeDefined();
  expect(screen.getByTitle(label).textContent).toBe(label);
});

test("detail uses the same fallback and preserves the UUID in operations",()=>{
  const operation=vi.fn();render(<InvestmentDetails isOpen asset={asset} history={[]} isHistoryLoading={false}
    onClose={vi.fn()} onOperation={operation} onDeleteAsset={vi.fn()} onDeleteHistory={vi.fn()}/>);
  expect(screen.getByRole("dialog",{name:"Detalhes do investimento Reserva A"})).toBeDefined();
  fireEvent.click(screen.getByRole("button",{name:"Aportar"}));
  expect(operation).toHaveBeenCalledWith(asset);
});

test("privacy keeps descriptive identity but prevents access to financial detail",()=>{
  state.privacy=true;const onClick=vi.fn();render(<InvestmentItem asset={asset} totalPortfolioValue={1} onClick={onClick}/>);
  const button=screen.getByRole("button",{name:"Ver detalhes do investimento Reserva A"});fireEvent.click(button);
  expect(onClick).not.toHaveBeenCalled();expect(button.getAttribute("aria-disabled")).toBe("true");
  expect(button.getAttribute("tabindex")).toBe("-1");
});
