import { expect, test } from "@playwright/test";
import { registerSyntheticUser, syntheticUser } from "C:/Users/Aluga.com/Documents/Projetos/pessoal/controle-financeiro/controle-financeiro-frontend/tests/e2e/support/synthetic-auth";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
test("NG-01 legitimate maximum quantity redemption can confirm and recover",async({page})=>{
  const out=process.env.CF_REVIEW_EVIDENCE!;
  const tag=`${process.env.CF_E2E_NAMESPACE}-precision`;
  await page.clock.setFixedTime(new Date("2027-01-15T12:00:00Z"));
  await registerSyntheticUser(page,syntheticUser("A",tag));
  const accountResponse=await page.request.post("/api/accounts",{data:{name:tag,type:"CHECKING",initialBalance:1000,color:"BLUE"}});
  expect(accountResponse.ok()).toBe(true); const account=await accountResponse.json();
  const assetResponse=await page.request.post("/api/investments",{data:{name:tag,ticker:"NGMAX",type:"FIXED_INCOME",openingQuantity:"999999999999.99999999",openingCost:"1.00",openingValue:"1.00",valuationDate:"2027-01-15",valuationSource:"SYNTHETIC"}});
  writeFileSync(join(out,"opening-raw.json"),await assetResponse.text());
  expect(assetResponse.ok()).toBe(true);
  await page.goto("/investimentos");await page.getByText("NGMAX",{exact:true}).click();
  await page.getByRole("button",{name:"Aportar",exact:true}).click();
  const modal=page.getByRole("dialog",{name:"NGMAX - Operação",exact:true});
  await modal.getByRole("button",{name:"Resgatar",exact:true}).click();
  await modal.getByLabel("Valor informado").fill("1.00");
  await modal.getByLabel("Conta",{exact:true}).selectOption(account.id);
  let posts=0;let original:Record<string,unknown>={};
  page.on("request",r=>{if(r.url().endsWith("/api/investments/operation")&&r.method()==="POST"){posts++;original=r.postDataJSON();}});
  const pendingResponse=page.waitForResponse(r=>r.url().endsWith("/api/investments/operation")&&r.request().method()==="POST");
  await modal.getByRole("button",{name:"Confirmar Operação",exact:true}).click();
  const actual=await pendingResponse;const raw=await actual.text();writeFileSync(join(out,"operation-raw.json"),raw);
  expect(actual.ok()).toBe(true);expect(raw).toContain('"quantity":999999999999.99999999');
  expect(JSON.parse(raw).quantity).toBe(1000000000000);
  const receiptResponse=await page.request.get(`/api/financial-intents/${original.operationId}`);
  const receiptRaw=await receiptResponse.text();writeFileSync(join(out,"receipt-raw.json"),receiptRaw);
  expect(receiptResponse.ok()).toBe(true);expect(receiptRaw).toContain('"quantity":999999999999.99999999');
  // If the legitimate response was rejected, exercise actual UI recovery, without modifying any response.
  if(await modal.getByRole("button",{name:"Consultar recibo"}).isVisible()){
    const recovery=page.waitForResponse(r=>r.url().endsWith(`/api/financial-intents/${original.operationId}`));
    await modal.getByRole("button",{name:"Consultar recibo"}).click();await recovery;
  }
  const state=await(await page.request.get("/api/rv24-probe/state")).json();
  expect(state.accounts).toEqual([{balance:1001}]);
  expect(state.operations).toHaveLength(1);expect(state.operations[0].total_value).toBe(1);
  expect(state.receipts).toEqual([{id:original.operationId,gross:1}]);
  expect(posts).toBe(1);
  const saved=await page.evaluate(()=>Object.entries(sessionStorage).filter(([k])=>k.startsWith("cf-creation:")));
  writeFileSync(join(out,"precision-state.json"),JSON.stringify({original,posts,state,saved,parsedQuantity:JSON.parse(raw).quantity},null,2));
  await page.screenshot({path:join(out,"legitimate-pending.png"),fullPage:true});
  expect.soft(saved).toHaveLength(0);
  await expect.soft(modal).toHaveCount(0);
});
