import {test,expect} from "@playwright/test";
import {randomUUID} from "node:crypto";
import {register,json,post,rows,at,request,sql,save,paint,login,logout} from "../cf032/support";
import {setCivilDateOnly} from "../e2e/support/civil-date-clock";

// Runs through the accepted disposable Java/Next harness. Only external mail and
// quotes are doubled. No financial response is intercepted or manufactured.
export function registerCf033Probes(){
 test("N3 CF033 default local difere de UTC e preserva campo editado",async({page})=>{
  await register(page,"cf033-midnight");
  await setCivilDateOnly(page,new Date("2026-10-22T10:00:00Z"));
  await page.goto("/extrato");await page.getByRole("button",{name:"Lançar",exact:true}).click();
  const modal=page.getByRole("dialog",{name:"Nova Transação",exact:true});
  await expect(modal.getByLabel("Data do lançamento")).toHaveValue("2026-10-23");
  await modal.getByLabel("Data do lançamento").fill("2026-12-31");
  await page.evaluate(()=>window.dispatchEvent(new Event("focus")));
  await expect(modal.getByLabel("Data do lançamento")).toHaveValue("2026-12-31");
  await paint(page,modal.getByLabel("Data do lançamento"),"N3-local-day");
  await save("N3-clock",await page.evaluate(()=>({instant:new Date().toISOString(),localDay:new Date().getDate(),zone:Intl.DateTimeFormat().resolvedOptions().timeZone})));
 });
 test("N1 CF033 troca A B A no mesmo contexto conserva isolamento e recibo",async({page})=>{
  const a=await register(page,"cf033-session-a");
  const source=rows(await json(page,"/accounts"))[0];
  const category=rows(await json(page,"/categories?type=INCOME"))[0];
  const key=randomUUID();
  const body={description:"CF033 segredo sintético A",amount:42.17,date:"2026-10-22",time:"23:59:58",type:"INCOME",accountId:source.id,categoryId:category.id,isPaid:true,operationId:key};
  const created=await post(page,"/transactions",body);
  await page.goto("/extrato");await expect(page.getByText(body.description,{exact:true})).toBeVisible();
  const before=await sql(page,a.email,"N1-A-before");expect(before.accountTotal).toBe("42.17");
  await logout(page);
  const b=await register(page,"cf033-session-b","B");
  await page.goto("/extrato");await page.reload();
  await expect(page.getByText(body.description,{exact:true})).toHaveCount(0);
  expect(rows(await json(page,"/accounts")).every(v=>v.id!==source.id)).toBe(true);
  const foreign=await request(page).get(`/api/financial-intents/${key}`);expect(foreign.status()).toBe(404);
  const stateB=await sql(page,b.email,"N1-B");expect(stateB.accountTotal).toBe("0.00");expect(rows(stateB.transactions)).toHaveLength(0);
  await logout(page);await login(page,a);await page.goto("/extrato");await page.reload();
  await expect(page.getByText(body.description,{exact:true})).toBeVisible();
  expect(await post(page,"/transactions",body)).toEqual(created);
  expect(await sql(page,a.email,"N1-A-after")).toEqual(before);
  await paint(page,page.getByText(body.description,{exact:true}),"N1-A-restored");
  await save("N1-session",{foreignStatus:foreign.status(),a:before.accountTotal,b:stateB.accountTotal,operation:key});
 });

 test("N2 CF033 civil e segundos em UTC mais 14 sobrevivem ao reload e XLSX",async({page})=>{
  const person=await register(page,"cf033-zone");
  const account=rows(await json(page,"/accounts"))[0],category=rows(await json(page,"/categories?type=INCOME"))[0];
  await post(page,"/transactions",{description:"CF033 virada civil",amount:0.05,date:"2026-12-31",time:"23:59:58",type:"INCOME",accountId:account.id,categoryId:category.id,isPaid:true,operationId:randomUUID()});
  await page.goto("/extrato");await page.getByRole("button",{name:"Lançar",exact:true}).click();
  const modal=page.getByRole("dialog",{name:"Nova Transação",exact:true});
  // Date-only clock is 2026-10-22T09Z, which is 23:00 on that civil date in +14.
  expect(await page.evaluate(()=>Intl.DateTimeFormat().resolvedOptions().timeZone)).toBe("Pacific/Kiritimati");
  await expect(modal.getByLabel("Data do lançamento")).toHaveValue("2026-10-22");
  await page.keyboard.press("Escape");await expect(modal).toHaveCount(0);
  await page.reload();
  const api=rows(at(await json(page,"/transactions?month=12&year=2026"),"content"));
  const row=api.find(v=>v.description==="CF033 virada civil");expect(row).toMatchObject({date:"2026-12-31",time:"23:59:58",amount:0.05});
  const state=await sql(page,person.email,"N2-after");expect(state.accountTotal).toBe("0.05");
  expect(rows(state.transactions)[0]).toMatchObject({date:"2026-12-31",time:"23:59:58",amount:"0.05"});
  const exported=await page.evaluate(async()=>{
   const response=await fetch("/api/transactions/export?month=12&year=2026",{credentials:"same-origin"});
   return {status:response.status,bytes:Array.from(new Uint8Array(await response.arrayBuffer()))};
  });
  expect(exported.status).toBe(200);
  const {writeFile}=await import("node:fs/promises"),path=await import("node:path");
  await writeFile(path.join(process.env.CF032_EVIDENCE!,"N2-year.xlsx"),Buffer.from(exported.bytes));
  const analysis=await page.request.get(`${process.env.CF032_OBSERVER}/xlsx?file=N2-year.xlsx`);expect(analysis.ok()).toBe(true);
  const text=JSON.stringify(await analysis.json());expect(text).toContain("31/12/2026");expect(text).toContain("23:59:58");
  await save("N2-api",row);await save("N2-zone",await page.evaluate(()=>({zone:Intl.DateTimeFormat().resolvedOptions().timeZone,now:new Date().toISOString(),nativeTimers:setTimeout.toString().includes("[native code]")})));
 });
}
