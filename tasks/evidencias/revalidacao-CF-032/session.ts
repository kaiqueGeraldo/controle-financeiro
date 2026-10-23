// Appended only to the disposable journeys.spec.ts. New independent complement.
test("RV6 payment limit survives a genuinely new authenticated session",async({page})=>{
 const f=await e01(page,"review-paid-session");
 const form=await paymentForm(page,f.card,String(f.checking.id),"200.00");
 const response=page.waitForResponse(r=>new URL(r.url()).pathname===`/api/cards/${f.card.id}/pay`&&r.request().method()==="POST");
 await form.getByRole("button",{name:"Confirmar Pagamento",exact:true}).click();expect((await response).ok()).toBe(true);
 await expect(form).toHaveCount(0);
 const before=await sql(page,f.person.email,"RV6-before-session");
 expect(before.accountTotal).toBe("1100.00");expect(before.debt).toBe("150.00");
 await logout(page);await login(page,f.person);await page.goto("/cartoes");
 const displays=page.getByText("Disponível",{exact:true});await expect(displays).toHaveCount(2);
 for(let i=0;i<2;i++)await expect(displays.nth(i).locator("..")).toContainText("850,00");
 await expect(page.getByRole("meter",{name:"Limite comprometido"})).toHaveAttribute("aria-valuenow","15");
 const card=rows(await json(page,"/cards"))[0];expect(card.availableLimit).toBe(850);expect(card.committedLimit).toBe(150);
 expect(await sql(page,f.person.email,"RV6-after-session")).toEqual(before);
 await paint(page,displays.first().locator(".."),"RV6-new-session");
});
