import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
const [run,oracleFile]=process.argv.slice(2);
if(!run||!oracleFile)throw new Error('Usage: reconcile.mjs evidence-run oracle.json');
const read=async name=>JSON.parse(await readFile(path.join(run,name),'utf8'));
const oracle=JSON.parse(await readFile(oracleFile,'utf8'));
function cents(value){
 assert.equal(typeof value,'string','SQL/export money must be an explicit decimal string');
 assert.match(value,/^-?\d+(?:\.\d{1,2})?$/);
 const negative=value.startsWith('-'),[whole,fraction='']=value.replace(/^-/,'').split('.');
 const amount=BigInt(whole)*100n+BigInt(fraction.padEnd(2,'0'));
 return negative?-amount:amount;
}
const equalMoney=(observed,expected)=>assert.equal(cents(observed),cents(expected));
const initial=await read('A-applied-sql.json'),final=await read('B-final-sql.json');
for(const [field,key] of [['accountTotal','accountsTotal'],['investmentTotal','investmentsValue'],['debt','debt'],['netWorth','netWorth']]){
 equalMoney(initial[field],oracle.e01[key]);equalMoney(final[field],oracle.dailyFinal[key]);
}
assert.equal(initial.applications,16);assert.equal(initial.transactions.length,1);
assert.equal(initial.receipts.length,1);assert.equal(initial.investments.find(i=>i.position_mode==='MONETARY').total_cost,null);
assert.equal(final.transactions.length,8);assert.equal(final.receipts.length,5);assert.equal(final.payments.length,1);
assert.equal(final.cardLines.length,7);assert.equal(final.investments.length,2);assert.equal(final.goals.length,3);assert.equal(final.allocations.length,3);
const reservedAccounts=final.allocations.filter(a=>a.account_id!==null).reduce((sum,a)=>sum+cents(a.amount),0n);
const reservedInvestments=final.allocations.filter(a=>a.investment_id!==null).reduce((sum,a)=>sum+cents(a.amount),0n);
assert.equal(reservedAccounts,cents(oracle.dailyFinal.reservedAccounts));assert.equal(reservedInvestments,cents(oracle.dailyFinal.reservedInvestments));
assert.equal(cents(final.accountTotal)-reservedAccounts,cents(oracle.dailyFinal.freeCash));
for(const [name,key] of [['Carteira Física','wallet'],['Corrente sintética','checking'],['Poupança sintética','savings']])equalMoney(final.accounts.find(a=>a.name===name).balance,oracle.dailyFinal.accounts[key]);
assert.deepEqual(final,await read('B-new-session-sql.json'));
const report=await read('C-api.json'),book=await read('C-october.xlsx.analysis.json'),sql=await read('C-exported-sql.json');
equalMoney(report.annual.balance.observed.income,'250.10');equalMoney(report.annual.balance.observed.expense,'162.20');equalMoney(report.annual.balance.observed.balance,'87.90');
equalMoney(report.cash.observed.balance,'-13.10');assert.equal(cents(sql.accountTotal)-cents('1300.00'),cents('-13.10'));
assert.equal(report.annual.balance.coverage.state,'PARTIAL');assert.equal(report.annual.balance.totalIncome,null);assert.equal(report.annual.investments.totalCost,null);
const sheet=book['Extrato Financeiro'];
for(const [label,expected] of [['Receitas realizadas:','250.10'],['Consumo e encargos (inclui cartão):','162.20'],['Resultado gerencial (não saldo bancário):','87.90']])equalMoney(sheet.find(r=>r[0]===label)[2],expected);
const purchaseRows=book['Consumo cartão'].slice(1);assert.equal(purchaseRows.reduce((sum,r)=>sum+cents(r[3]),0n),cents('120.00'));
assert.ok(purchaseRows.every(r=>r[0]==='15/10/2026'));
assert.equal(sql.transactions.find(t=>t.description==='CF032 receita').time,'12:34:56');
const lost=await read('G-reloaded-sql.json'),protocol=await read('G-protocol.json');
equalMoney(lost.accountTotal,'1100.00');equalMoney(lost.debt,'150.00');equalMoney(lost.netWorth,'1451.00');
assert.equal(lost.payments.length,1);assert.equal(lost.transactions.filter(t=>t.origin==='INVOICE_PAYMENT').length,1);assert.deepEqual(protocol.receipt,protocol.replay);
const legacy=await read('E-receipt.json');assert.equal(legacy.summary.metrics.freeAccountCash.state,'UNKNOWN');assert.equal(legacy.summary.metrics.freeAccountCash.value,null);
const sourceAfter=await read('E2-after-attempt-sql.json');assert.equal(sourceAfter.allocations.length,1);equalMoney(sourceAfter.allocations[0].amount,'0.01');
const names=await read('L-api-versus-ui.json'),limits=await read('K-api-versus-ui.json');
const cases=[];
function walk(suites){for(const suite of suites){for(const spec of suite.specs??[])for(const test of spec.tests??[])cases.push({title:spec.title,status:test.results.at(-1)?.status});walk(suite.suites??[]);}}
walk((await read('playwright.json')).suites);
const result={
 financialSubsetVerified:true,fullJourneyApproved:false,integerCents:true,
 final:{accounts:'1286.90',investments:'501.67',debt:'270.00',netWorth:'1518.57',reservedAccounts:'450.00',reservedInvestments:'200.00',freeCash:'836.90',bankRows:8,creationReceipts:5,paymentReceipts:1,cardLines:7},
 reporting:{observedIncome:'250.10',observedExpense:'162.20',observedResult:'87.90',cashDelta:'-13.10',coverage:'PARTIAL',unknownCostPreserved:true,wallTimeSQL:'12:34:56',wallTimeExport:sheet.find(r=>r[2]==='CF032 receita')[1]},
 lostResponse:{postAttempts:protocol.totalPostAttempts,effects:1,sameReceipt:true,commitObservedBeforeResponseAbort:true},
 knownViolations:{sourceAllocationAccepted:'0.01',apiAvailable:limits.api.availableLimit,uiAvailable:limits.globalText,missingIdentifierNames:names.accessibleInvestmentNames},
 cases,overlap:'Reruns, supplementary Java cases and mutants are not summed as distinct E2E cases'
};
await writeFile(path.join(run,'reconciliation.json'),JSON.stringify(result,null,2));
console.log(JSON.stringify({financialSubsetVerified:true,fullJourneyApproved:false,cases:cases.length,passed:cases.filter(c=>c.status==='passed').length,failed:cases.filter(c=>c.status==='failed').length}));
