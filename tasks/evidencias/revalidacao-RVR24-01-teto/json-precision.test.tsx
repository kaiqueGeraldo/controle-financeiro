import { act, renderHook } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { useCreationIntent } from "@/hooks/useCreationIntent";
import { investmentService } from "@/services/investmentService";
import { validateCreationResult } from "@/services/creationResult";
import type { InvestmentOperationDTO } from "@/types";
vi.mock("@/hooks/useUser",()=>({useUser:()=>({user:{id:"json-review"}})}));
// Raw JSON lexemes reach the same apiRequest/JSON.parse as actual HTTP responses.
const validRedemption='{"id":"10000000-0000-4000-8000-000000000001","type":"SELL","date":"2027-01-15","quantity":999999999999.99999999,"price":0.00000000,"totalValue":1.00,"fees":0.00,"costDelta":1.00,"realizedResult":0.00,"dateOrigin":"USER_INPUT"}';
const incompatibleQuantity='{"id":"10000000-0000-4000-8000-000000000001","type":"BUY","date":"2027-01-15","quantity":999999999999.00010001,"price":0.00000001,"totalValue":10000.00,"fees":0.00,"costDelta":10000.00,"realizedResult":null,"dateOrigin":"USER_INPUT"}';
const sell: InvestmentOperationDTO={investmentId:"asset",accountId:"account",type:"SELL",quantity:1,price:1,fees:0,amount:"1.00",date:"2027-01-15"};
const buy: InvestmentOperationDTO={investmentId:"asset",accountId:"account",type:"BUY",quantity:999999999999.0001,price:0.00000001,fees:0,date:"2027-01-15"};
const key="cf-creation:v1:json-review:INVESTMENT_OPERATION";
test("raw quantity maximum loses digits before BigInt, despite legal FIN-06 and NG-01",()=>{
  const parsed=JSON.parse(validRedemption);
  expect(parsed.quantity).toBe(1000000000000);
  expect(()=>validateCreationResult(parsed,sell)).not.toThrow();
});
test.each(["POST","retry","GET"])("valid authoritative redemption must complete through %s",async route=>{
  sessionStorage.clear();const hook=renderHook(()=>useCreationIntent("INVESTMENT_OPERATION"));
  const fetch=vi.fn().mockImplementation(async()=>new Response(validRedemption));vi.stubGlobal("fetch",fetch);
  let outcome:unknown;
  if(route==="POST")await act(async()=>{outcome=await hook.result.current.start(sell,c=>investmentService.operation(c as InvestmentOperationDTO));});
  else {
    await act(async()=>{await hook.result.current.start(sell,async()=>{throw Error("response lost");});});
    const frozen=JSON.parse(sessionStorage.getItem(key)!).command;
    if(route==="retry")await act(async()=>{outcome=await hook.result.current.retry(c=>investmentService.operation(c as InvestmentOperationDTO));});
    else {
      fetch.mockImplementation(async()=>new Response('{"operationId":"'+frozen.operationId+'","kind":"INVESTMENT_OPERATION","result":'+validRedemption+'}'));
      await act(async()=>{outcome=await hook.result.current.recover();});
    }
  }
  expect.soft(outcome).toBe("confirmed");expect.soft(sessionStorage.getItem(key)).toBeNull();expect.soft(hook.result.current.pending).toBeNull();
});
test.each(["POST","GET"])("different but legal raw quantity must not confirm same command via %s",async route=>{
  sessionStorage.clear();const hook=renderHook(()=>useCreationIntent("INVESTMENT_OPERATION"));
  expect(JSON.parse(incompatibleQuantity).quantity).toBe(buy.quantity);
  const fetch=vi.fn().mockImplementation(async()=>new Response(incompatibleQuantity));vi.stubGlobal("fetch",fetch);
  let outcome:unknown;
  if(route==="POST")await act(async()=>{outcome=await hook.result.current.start(buy,c=>investmentService.operation(c as InvestmentOperationDTO));});
  else {
    await act(async()=>{await hook.result.current.start(buy,async()=>{throw Error("response lost");});});
    const frozen=JSON.parse(sessionStorage.getItem(key)!).command;
    fetch.mockImplementation(async()=>new Response('{"operationId":"'+frozen.operationId+'","kind":"INVESTMENT_OPERATION","result":'+incompatibleQuantity+'}'));
    await act(async()=>{outcome=await hook.result.current.recover();});
  }
  expect.soft(outcome).toBe("unknown");expect.soft(sessionStorage.getItem(key)).not.toBeNull();
});
test("valid raw money at inclusive ceiling retains cents and authoritative amount",()=>{
  for(const raw of ["999999999999.98","999999999999.99","0.01","1.00"]){
    const response=JSON.parse(validRedemption.replace('999999999999.99999999','100000000').replace('"totalValue":1.00','"totalValue":'+raw));
    expect(()=>validateCreationResult(response,{...sell,amount:raw})).not.toThrow();
  }
  const above=JSON.parse(validRedemption.replace('999999999999.99999999','100000000').replace('"totalValue":1.00','"totalValue":1000000000000.00'));
  expect(()=>validateCreationResult(above,{...sell,amount:"1000000000000.00"})).toThrow();
});
