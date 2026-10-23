// Append to the runtime-only journeys.spec.ts; original tests remain unchanged.
test("R1 controle positivo de reserva conhecida e débito real com legado incerto",async({page})=>{
 const f=await e01(page,"review-known");
 const goal=record(await post(page,"/goals",{title:"Reserva independente conhecida",targetValue:600,deadline:"2027-06-30",type:"MONETARY",useChecklist:false,color:"BLUE"}));
 const before=await sql(page,f.person.email,"R1-known-before");
 const allowed=await request(page).put(`/api/goals/${goal.id}/allocations`,{data:{accountId:f.checking.id,amount:"0.01"}});
 expect(allowed.status()).toBe(204);
 const after=await sql(page,f.person.email,"R1-known-after");
 expect(after.accountTotal).toBe(before.accountTotal);expect(after.netWorth).toBe(before.netWorth);
 expect(after.reservedAccounts).toBe("350.01");
 await logout(page);
 const person=await register(page,"review-unknown-debit");
 expect((await page.request.post(`${process.env.CF032_OBSERVER}/legacy?email=${encodeURIComponent(person.email)}`)).ok()).toBe(true);
 const legacy=await sql(page,person.email,"R1-legacy-before");
 await transaction(page,String(rows(legacy.accounts)[0].id),"EXPENSE","Débito real não é nova reserva","1.00");
 const spent=await sql(page,person.email,"R1-legacy-after");
 expect(spent.accountTotal).toBe("999.00");expect(spent.legacyReservations).toEqual(legacy.legacyReservations);
 expect(rows(spent.allocations)).toHaveLength(0);
});

test("R2 nova sessão do cartão e seleção das duas posições sem ticker",async({page})=>{
 const f=await e01(page,"review-session");
 await logout(page);await login(page,f.person);await page.goto("/cartoes");
 const card=rows(await json(page,"/cards"))[0];
 const available=page.getByText("Disponível",{exact:true}).first().locator("..");
 await paint(page,available,"R2-card-session");
 await save("R2-card-session",{card,visible:await available.innerText()});
 await expect.soft(available).toContainText("656,00");
 const positions=rows(await json(page,"/investments"));
 expect(positions).toHaveLength(2);expect(positions.every(p=>p.ticker===null)).toBe(true);
 const visits:unknown[]=[];
 for(let index=0;index<2;index++){
  await page.goto("/investimentos");
  const buttons=page.getByRole("button",{name:"Ver detalhes do investimento null",exact:true});
  await expect(buttons).toHaveCount(2);
  const history=page.waitForResponse(r=>/\/api\/investments\/[^/]+\/history$/.test(new URL(r.url()).pathname));
  await buttons.nth(index).click();const response=await history;
  expect(response.status()).toBe(200);
  const id=new URL(response.url()).pathname.split("/")[3];
  expect(positions.some(p=>p.id===id)).toBe(true);
  const dialog=page.getByRole("dialog",{name:"Detalhes do investimento null",exact:true});
  await expect(dialog).toBeVisible();
  visits.push({id,name:positions.find(p=>p.id===id)?.name,dialog:await dialog.innerText()});
 }
 expect(new Set(visits.map(v=>record(v).id)).size).toBe(2);
 await save("R2-selection",{positions,visits,sql:await sql(page,f.person.email,"R2-selection")});
});
