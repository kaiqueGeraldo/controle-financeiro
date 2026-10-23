// Runtime-only independent probe: establish API versus export precision directly.
test("R3 horário original, resposta API, releitura e XLSX",async({page})=>{
 const f=await e01(page,"review-time-api");
 const category=rows(await json(page,"/categories?type=INCOME"))[0];
 const input={description:"R3 segundos explícitos",amount:1.23,date:day,time:"12:34:56",type:"INCOME",accountId:f.checking.id,categoryId:category.id,isPaid:true,operationId:randomUUID()};
 const response=await post(page,"/transactions",input);
 const list=await json(page,"/transactions?month=10&year=2026&size=100");
 const line=rows(at(list,"content")).find(t=>t.description===input.description);
 await save("R3-api",{input,response,line});
 expect(line?.time).toBe("12:34:56");
 const state=await sql(page,f.person.email,"R3-time");
 expect(rows(state.transactions).find(t=>t.description===input.description)?.time).toBe("12:34:56");
 const book=await download(page,"R3-time.xlsx");
 const lineExport=(book["Extrato Financeiro"] as unknown[][]).find(row=>row[2]===input.description);
 expect(lineExport?.[1]).toBe("12:34:56");
});
