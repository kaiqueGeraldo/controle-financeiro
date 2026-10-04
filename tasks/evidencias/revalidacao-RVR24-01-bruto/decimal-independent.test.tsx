import { act, renderHook } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { useCreationIntent } from "@/hooks/useCreationIntent";
import { validateCreationResult } from "@/services/creationResult";
import type { InvestmentOperationDTO } from "@/types";
const command: InvestmentOperationDTO = { investmentId:"asset", accountId:"account", type:"BUY", quantity:1, price:1.005, fees:0.01, date:"2027-01-15" };
const result = { id:"10000000-0000-4000-8000-000000000001", type:"BUY", quantity:1, price:1.005, totalValue:1.01, fees:0.01, date:"2027-01-15", dateOrigin:"USER_INPUT", costDelta:1.02, realizedResult:null };
vi.mock("@/hooks/useUser",()=>({useUser:()=>({user:{id:"limit-review"}})}));
test.each([[1,0.01499999,0.01],[1,0.015,0.02],[1,0.01500001,0.02],[0.33333333,3,1],[0.00000001,999999999999,10000]])("independent literal %s * %s => %s", (quantity,price,totalValue) => {
  for(const type of ["BUY","SELL","DIVIDEND","INTEREST"] as const){
    const c={...command,type,quantity,price,fees:0};
    const r={...result,type,quantity,price,totalValue,fees:0,costDelta:null};
    expect(()=>validateCreationResult(r,c)).not.toThrow();
    expect(()=>validateCreationResult({...r,totalValue:999},c)).toThrow(/Resultado financeiro inválido/);
  }
});
test.each(["BUY","SELL","DIVIDEND","INTEREST"] as const)("%s preserves gross before monetary fee",type=>{
  const c={...command,type}; const r={...result,type};
  expect(()=>validateCreationResult(r,c)).not.toThrow();
  for(const totalValue of [1,1.02]) expect(()=>validateCreationResult({...r,totalValue},c)).toThrow();
});
test.each(["SELL","DIVIDEND","INTEREST"] as const)("%s permits fee equal to positive gross",type=>{
  expect(()=>validateCreationResult({...result,type,fees:1.01}, {...command,type,fees:1.01})).not.toThrow();
});
test.each([[100000000,0.00000001,0.5,"0.50"],[0.00000001,99999999999999000000,999999999999.99,"999999999999.99"]] as const)("NG-01 authoritative monetary amount with derived fields %s",(quantity,price,totalValue,amount)=>{
  const c={...command,type:"SELL" as const,amount,fees:0};
  const r={...result,type:"SELL",quantity,price,totalValue,fees:0,costDelta:null};
  expect(()=>validateCreationResult(r,c)).not.toThrow();
  expect(()=>validateCreationResult({...r,totalValue:999},c)).toThrow();
});
test.each([Number.MIN_VALUE, Number.MAX_VALUE, Infinity, NaN, -1, 0.000000001])("invalid/excess precision magnitude %s rejects through controlled error",quantity=>{
  expect(()=>validateCreationResult({...result,quantity}, {...command,quantity})).toThrow(/Resultado financeiro inválido/);
});
test("maximum permitted product operands cannot confirm a small claimed gross",()=>{
  expect(()=>validateCreationResult({...result,quantity:999999999999,price:999999999999},{...command,quantity:999999999999,price:999999999999})).toThrow(/Resultado financeiro inválido/);
});
test("FIN-06 accepts maximum monetary gross but rejects one cent above ceiling",()=>{
  const c={...command,quantity:1000000,price:999999.99999999,fees:0};
  expect(()=>validateCreationResult({...result,quantity:c.quantity,price:c.price,totalValue:999999999999.99,fees:0,costDelta:null},c)).not.toThrow();
  expect(()=>validateCreationResult({...result,quantity:1000000,price:1000000,totalValue:1000000000000,fees:0,costDelta:null},{...c,price:1000000})).toThrow(/Resultado financeiro inválido/);
});
test.each(["POST","retry","GET"])("FIN-06 out-of-range gross preserves intent via %s",async path=>{
  sessionStorage.clear();
  const c={...command,quantity:1000000,price:1000000,fees:0};
  const bad={...result,quantity:c.quantity,price:c.price,totalValue:1000000000000,fees:0,costDelta:null};
  const hook=renderHook(()=>useCreationIntent("INVESTMENT_OPERATION"));
  const key="cf-creation:v1:limit-review:INVESTMENT_OPERATION";
  let outcome:unknown;
  if(path==="POST") await act(async()=>{outcome=await hook.result.current.start(c,async()=>({data:bad}));});
  else {
    await act(async()=>{await hook.result.current.start(c,async()=>{throw Error("response lost");});});
    const saved=sessionStorage.getItem(key)!;
    const frozen=JSON.parse(saved).command;
    if(path==="retry") {
      const send=vi.fn().mockResolvedValue({data:bad});
      await act(async()=>{outcome=await hook.result.current.retry(send);});
      expect(send).toHaveBeenCalledWith(frozen);
    } else {
      vi.stubGlobal("fetch",vi.fn().mockResolvedValue(new Response(JSON.stringify({operationId:frozen.operationId,kind:"INVESTMENT_OPERATION",result:bad}))));
      await act(async()=>{outcome=await hook.result.current.recover();});
    }
    expect.soft(sessionStorage.getItem(key)).toBe(saved);
  }
  expect.soft(outcome).toBe("unknown");
  expect.soft(hook.result.current.pending).not.toBeNull();
  expect.soft(sessionStorage.getItem(key)).not.toBeNull();
});
