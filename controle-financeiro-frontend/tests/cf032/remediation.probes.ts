import {test,expect} from "@playwright/test";
import {randomUUID} from "node:crypto";
import {readFile} from "node:fs/promises";
import path from "node:path";
import {day,record,rows,at,json,post,save,register,sql,paint,e01,download,login,logout,request,paymentForm} from "./support";

/** Registered by an appended import in the disposable copy, so original probes
 * and their expected values remain byte-for-byte intact in the repository. */
export function registerRemediationProbes() {
  test("S2 R2 observer adapted to legitimate names, same 656 and two UUIDs",async({page})=>{
    const f=await e01(page,"remediation-session");
    await logout(page);await login(page,f.person);await page.goto("/cartoes");
    const card=rows(await json(page,"/cards"))[0];
    const available=page.getByText("Disponível",{exact:true}).first().locator("..");
    await paint(page,available,"S2-card-session");
    await save("S2-card-session",{card,visible:await available.innerText()});
    await expect(available).toContainText("656,00");
    const positions=rows(await json(page,"/investments"));
    expect(positions).toHaveLength(2);expect(positions.every(p=>p.ticker===null)).toBe(true);
    const visits:unknown[]=[];
    for(const position of positions) {
      await page.goto("/investimentos");
      await expect(page.getByRole("button",{name:/^Ver detalhes do investimento /})).toHaveCount(2);
      const button=page.getByRole("button",{name:`Ver detalhes do investimento ${position.name}`,exact:true});
      const history=page.waitForResponse(r=>new URL(r.url()).pathname===`/api/investments/${position.id}/history`);
      await button.click();const response=await history;expect(response.status()).toBe(200);
      const id=new URL(response.url()).pathname.split("/")[3];expect(id).toBe(position.id);
      const dialog=page.getByRole("dialog",{name:`Detalhes do investimento ${position.name}`,exact:true});
      await expect(dialog).toBeVisible();await expect(dialog.getByText(String(position.name),{exact:true})).toBeVisible();
      visits.push({id,name:position.name,dialog:await dialog.innerText()});
    }
    expect(new Set(visits.map(v=>record(v).id)).size).toBe(2);
    await save("S2-selection",{positions,visits,sql:await sql(page,f.person.email,"S2-selection")});
  });

  test("S3 same-type tickerless positions, ticker control, long name, operation and reload",async({page})=>{
    await page.setViewportSize({width:360,height:800});
    const person=await register(page,"remediation-identity");
    const accounts=rows(await json(page,"/accounts")),categories=rows(await json(page,"/categories?type=INCOME"));
    const example=record(JSON.parse(await readFile(path.join(process.env.CF032_RUNTIME!,"e01.json"),"utf8")));
    const draft=record(JSON.parse(JSON.stringify(example.draft)
      .replaceAll("00000000-0000-4000-8000-000000000901",String(accounts[0].id))
      .replaceAll("00000000-0000-4000-8000-000000000902",String(categories[0].id))));
    const items=rows(at(draft,"payload","sections","investments","items"));
    const original=items.find(i=>i.type==="STOCK")!;
    const longName="Posição independente sem ticker "+"patrimonio".repeat(6);
    const second={...original,tempId:randomUUID(),name:longName};
    const control={...original,tempId:randomUUID(),name:"Controle com identificador",identifier:"SANE3"};
    record(at(draft,"payload","sections","investments")).items=[...items,second,control];
    draft.expectedVersion=at(await json(page,"/onboarding"),"data","version");
    const saved=await request(page).put("/api/onboarding/draft",{data:draft});expect(saved.status(),await saved.text()).toBe(200);
    await page.goto("/onboarding");await page.getByRole("button",{name:"Preparar revisão financeira"}).click();
    await expect(page.getByRole("heading",{name:"Confira antes de registrar"})).toBeVisible();
    const pending=at(await json(page,"/onboarding"),"data","pendingIntent");
    expect(at(pending,"summary","metrics","netWorth","value")).toBe("1453.00");
    await page.getByRole("button",{name:"Confirmar informações e registrar posições"}).click();
    await expect(page.getByRole("heading",{name:"Entrevista concluída",exact:true})).toBeVisible();
    const positions=rows(await json(page,"/investments"));expect(positions).toHaveLength(4);
    const stock=positions.find(p=>p.name===original.name)!,long=positions.find(p=>p.name===longName)!;
    expect(stock.ticker).toBeNull();expect(long.ticker).toBeNull();expect(stock.type).toBe(long.type);
    for(const [position,label] of [[stock,String(stock.name)],[long,longName],[positions.find(p=>p.ticker==="SANE3")!,"SANE3"]] as const) {
      await page.goto("/investimentos");
      const action=page.getByRole("button",{name:`Ver detalhes do investimento ${label}`,exact:true});
      await expect(action.getByTitle(label)).toBeVisible();
      await paint(page,action,"S3-position-"+(position.id===long.id?"long":position.id===stock.id?"first":"ticker"));
      const response=page.waitForResponse(r=>new URL(r.url()).pathname===`/api/investments/${position.id}/history`);
      await action.click();expect((await response).status()).toBe(200);
      const detail=page.getByRole("dialog",{name:`Detalhes do investimento ${label}`,exact:true});
      await expect(detail).toBeVisible();
    }
    await page.goto("/investimentos");
    await page.getByRole("button",{name:`Ver detalhes do investimento ${longName}`,exact:true}).click();
    await page.getByRole("button",{name:"Aportar",exact:true}).click();
    const longModal=page.getByRole("dialog",{name:`${longName} - Operação`,exact:true});
    await paint(page,longModal.getByRole("heading",{name:`${longName} - Operação`,exact:true}),"S3-long-operation");
    await longModal.getByRole("button",{name:"Fechar modal",exact:true}).click();
    await page.goto("/investimentos");
    await page.getByRole("button",{name:`Ver detalhes do investimento ${stock.name}`,exact:true}).click();
    await page.getByRole("button",{name:"Aportar",exact:true}).click();
    const modal=page.getByRole("dialog",{name:`${stock.name} - Operação`,exact:true});
    await modal.getByPlaceholder("0",{exact:true}).fill("1");await modal.getByPlaceholder("0,00",{exact:true}).fill("1");
    const checking=rows(await json(page,"/accounts")).find(a=>a.balance===1000)!;
    await modal.getByLabel("Conta",{exact:true}).selectOption(String(checking.id));
    const applied=page.waitForResponse(r=>new URL(r.url()).pathname==="/api/investments/operation"&&r.request().method()==="POST");
    await modal.getByRole("button",{name:"Confirmar Operação",exact:true}).click();expect((await applied).ok()).toBe(true);
    await expect(modal).toHaveCount(0);await page.reload();
    const state=await sql(page,person.email,"S3-after-operation");
    const updated=rows(state.investments).find(p=>p.id===stock.id)!;
    expect(Number(updated.quantity)).toBe(4);expect(rows(state.investments).find(p=>p.id===long.id)?.quantity).toBe("3.00000000");
    const history=rows(await json(page,`/investments/${stock.id}/history`));expect(history).toHaveLength(1);
    expect(rows(state.transactions).some(t=>t.description===`Aporte: ${stock.name}`)).toBe(true);
    await expect(page.getByRole("button",{name:`Ver detalhes do investimento ${stock.name}`,exact:true})).toBeVisible();
    await save("S3-identity",{positions,stockId:stock.id,longId:long.id,longName,history,state});
  });

  test("S4 XLSX preserves seconds, zero seconds and missing time with civil dates",async({page})=>{
    const f=await e01(page,"remediation-time-borders");
    const category=rows(await json(page,"/categories?type=INCOME"))[0];
    for(const [description,time] of [["S4 exact seconds","12:34:56"],["S4 zero seconds","12:34:00"],["S4 missing time",null]] as const) {
      const input={description,amount:1.23,date:day,time,type:"INCOME",accountId:f.checking.id,categoryId:category.id,isPaid:true,operationId:randomUUID()};
      await post(page,"/transactions",input);
    }
    const entries=rows(at(await json(page,"/transactions?month=10&year=2026&size=100"),"content"));
    const state=await sql(page,f.person.email,"S4-time");
    expect(state.accountTotal).toBe("1303.69");
    const book=await download(page,"S4-time.xlsx");
    for(const [description,time,cell] of [["S4 exact seconds","12:34:56","12:34:56"],["S4 zero seconds","12:34:00","12:34:00"],["S4 missing time",null,"—"]] as const) {
      expect(entries.find(t=>t.description===description)?.time).toBe(time);
      expect(rows(state.transactions).find(t=>t.description===description)?.time).toBe(time);
      const line=(book["Extrato Financeiro"] as unknown[][]).find(row=>row[2]===description)!;
      expect(line[0]).toBe("22/10/2026");expect(line[1]).toBe(cell);expect(line[6]).toBe("1.23");
    }
    await save("S4-time-evidence",{entries,state,book});
  });

  test("S5 available limit refreshes after real payment and survives reload",async({page})=>{
    const f=await e01(page,"remediation-card-refresh");
    await page.goto("/cartoes");
    await expect(page.getByText("Disponível",{exact:true}).first().locator("..")).toContainText("656,00");
    const modal=await paymentForm(page,f.card,String(f.checking.id),"200.00");
    const applied=page.waitForResponse(r=>new URL(r.url()).pathname===`/api/cards/${f.card.id}/pay`&&r.request().method()==="POST");
    await modal.getByRole("button",{name:"Confirmar Pagamento",exact:true}).click();expect((await applied).ok()).toBe(true);
    await expect(modal).toHaveCount(0);
    await page.getByRole("button",{name:"Fechar detalhes da fatura",exact:true}).click();
    const displays=page.getByText("Disponível",{exact:true});await expect(displays).toHaveCount(2);
    await expect(displays.first().locator("..")).toContainText("850,00");
    await expect(displays.nth(1).locator("..")).toContainText("850,00");
    await paint(page,displays.first().locator(".."),"S5-before-reload");
    await page.reload();
    const available=page.getByText("Disponível",{exact:true}).first().locator("..");
    await expect(available).toContainText("850,00");
    await expect(page.locator('[role="meter"][aria-label="Limite comprometido"]')).toHaveAttribute("aria-valuenow","15");
    const card=rows(await json(page,"/cards"))[0];expect(card.committedLimit).toBe(150);expect(card.availableLimit).toBe(850);
    const state=await sql(page,f.person.email,"S5-payment");expect(state.accountTotal).toBe("1100.00");expect(state.debt).toBe("150.00");expect(rows(state.payments)).toHaveLength(1);
    await paint(page,available,"S5-after-payment");await save("S5-refresh",{card,state});
  });
}
