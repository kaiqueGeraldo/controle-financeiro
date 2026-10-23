import { act, render, renderHook, screen, waitFor } from "@testing-library/react";
import { createElement } from "react";
import { beforeEach, expect, test, vi } from "vitest";
import { useCards } from "@/hooks/useCards";
import { CreditCardItem } from "@/components/screens/cards/creditCardItem";
import { cardService, type CreditCard } from "@/services/cardService";

const state=vi.hoisted(()=>({privacy:false,refresh:vi.fn().mockResolvedValue(undefined)}));
vi.mock("@/hooks/useUser",()=>({useUser:()=>({user:{id:"cf032-owner",privacyMode:state.privacy},isLoading:false})}));
vi.mock("@/hooks/useFinanceData",()=>({useFinanceData:()=>({accounts:[],categories:[],refresh:state.refresh})}));
vi.mock("next/image",()=>({default:(props:React.ImgHTMLAttributes<HTMLImageElement>)=>createElement("img",props)}));

const card:CreditCard={id:"card",name:"Sintético",last4Digits:"4242",limit:1000,
  closingDay:20,dueDay:27,color:"#111",brand:"VISA",currentInvoiceValue:50,
  committedLimit:344,availableLimit:656,creditBalance:0};
beforeEach(()=>{state.privacy=false;vi.restoreAllMocks();});

test("future principal, not current invoice, defines summary; refresh reads new authoritative metrics",async()=>{
  const get=vi.spyOn(cardService,"getAll").mockResolvedValue({status:200,data:[card]});
  const {result}=renderHook(()=>useCards());
  await waitFor(()=>expect(result.current.summary.available).toBe(656));
  get.mockResolvedValue({status:200,data:[{...card,currentInvoiceValue:0,committedLimit:270,availableLimit:730}]});
  await act(async()=>{await result.current.refreshAll(false);});
  expect(result.current.summary.available).toBe(730);
  expect(result.current.summary.totalInvoice).toBe(0);
});

test("a multi-card aggregate uses available metrics, including negative capacity and credit",async()=>{
  vi.spyOn(cardService,"getAll").mockResolvedValue({status:200,data:[card,{...card,id:"b",limit:100,
    committedLimit:120,availableLimit:-20,currentInvoiceValue:999,creditBalance:50}]});
  const {result}=renderHook(()=>useCards());
  await waitFor(()=>expect(result.current.summary.available).toBe(636));
  expect(result.current.summary.totalLimit).toBe(1100);
});

test("loading and failed reads do not manufacture available zero",async()=>{
  let reject!:(reason:Error)=>void;
  vi.spyOn(cardService,"getAll").mockReturnValue(new Promise((_,r)=>{reject=r;}));
  const {result}=renderHook(()=>useCards());
  expect(result.current.isLoading).toBe(true);expect(result.current.summary.available).toBeNull();
  await act(async()=>{reject(new Error("synthetic network failure"));});
  await waitFor(()=>expect(result.current.error?.message).toBe("synthetic network failure"));
  expect(result.current.summary.available).toBeNull();
});

test.each([undefined,null,NaN,Infinity,0.001])("missing or invalid available %s stays unavailable in card and aggregate",async(value)=>{
  const invalid={...card,availableLimit:value};
  vi.spyOn(cardService,"getAll").mockResolvedValue({status:200,data:[invalid]});
  const {result}=renderHook(()=>useCards());
  await waitFor(()=>expect(result.current.isLoading).toBe(false));
  expect(result.current.summary.available).toBeNull();
  render(<CreditCardItem card={invalid} onClick={vi.fn()}/>);
  expect(screen.getByText("Indisponível")).toBeDefined();
  expect(document.body.textContent).not.toContain("NaN");
});

test.each([[0,0,0,0],[100,120,-20,100],[1000,344,656,34.4]])("limit %s, principal %s and available %s render without invoice arithmetic",(limit,committed,available,percentage)=>{
  render(<CreditCardItem card={{...card,limit,committedLimit:committed,availableLimit:available}} onClick={vi.fn()}/>);
  const meter=screen.getByRole("meter",{name:"Limite comprometido"});
  expect(meter.getAttribute("aria-valuenow")).toBe(String(percentage));
  expect(document.body.textContent).toContain(available.toLocaleString("pt-BR",{style:"currency",currency:"BRL"}));
});

test("privacy hides the authoritative amount and usage bar",()=>{
  state.privacy=true;render(<CreditCardItem card={card} onClick={vi.fn()}/>);
  expect(screen.getByRole("button").hasAttribute("disabled")).toBe(true);
  const meter=screen.getByRole("meter");
  expect(meter.hasAttribute("aria-valuenow")).toBe(false);
  expect(meter.getAttribute("aria-valuetext")).toBe("Valor oculto");
  expect(screen.getAllByText("Valor oculto").length).toBeGreaterThan(0);
});
