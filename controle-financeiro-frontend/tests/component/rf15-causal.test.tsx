import { fireEvent, render, screen, within, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { InvoiceDetails } from '@/components/screens/cards/invoiceDetails';
import { PrivacyBlur } from '@/components/ui/privacyBlur';
import { TransactionDetails } from '@/components/screens/extract/transactionDetails';
import { Modal } from '@/components/ui/modal';
import type { CardInvoiceDetails, CreditCard } from '@/services/cardService';
import type { Transaction } from '@/types';
const user=vi.hoisted(()=>({privacyMode:false}));
vi.mock('@/hooks/useUser',()=>({useUser:()=>({user})}));
afterEach(()=>{vi.useRealTimers();user.privacyMode=false;});
const card:CreditCard={id:'rf15',name:'Cartão',last4Digits:'4242',limit:1000,closingDay:31,dueDay:5,color:'#333',brand:'VISA',currentInvoiceValue:120};
const invoice:CardInvoiceDetails={id:'rf15-invoice',month:1,year:2027,status:'OPEN',totalAmount:120,payableAmount:120,closingDate:'2027-01-31',dueDate:'2027-02-05',transactions:[]};
function view(data:CardInvoiceDetails){return <InvoiceDetails card={card} isOpen onClose={()=>{}} invoiceData={data} isLoadingInvoice={false} viewDateFormatted="janeiro de 2027" onChangeMonth={()=>{}} onPay={()=>{}} onDelete={()=>{}} onUpdateLimit={async()=>{}}/>;}
test.each([
  [2027,1,'2027-01-31','2027-02-05','31 de jan','05 de fev'],
  [2027,2,'2027-02-28','2027-03-05','28 de fev','05 de mar'],
  [2028,2,'2028-02-29','2028-03-05','29 de fev','05 de mar'],
  [2027,12,'2027-12-31','2028-01-05','31 de dez','05 de jan'],
] as const)('RF15-04: datas civis da API %i/%i', (year,month,closingDate,dueDate,closing,due)=>{
  vi.useFakeTimers({toFake:['Date']});vi.setSystemTime(new Date('2027-01-15T12:00:00Z'));
  render(view({...invoice,year,month,closingDate,dueDate}));
  expect(screen.getByText(`Fecha: ${closing}`)).toBeDefined();
  expect(screen.getByText(`Vence: ${due}`)).toBeDefined();
  expect(screen.queryByRole('button',{name:'Pagar Atrasada'})).toBeNull();
});
test.each([
  ['2027-02-05T23:59:59',120,'CLOSED','Pagar Fatura'],
  ['2027-02-06T00:00:00',100,'CLOSED','Pagar Atrasada'],
  ['2027-02-06T00:00:00',0,'OPEN','Fatura Zerada'],
  ['2027-02-06T00:00:00',0,'PAID','Fatura Paga'],
] as const)('RF15-04: prazo civil/saldo %s %i %s', (now,payableAmount,status,label)=>{
  vi.useFakeTimers({toFake:['Date']});vi.setSystemTime(new Date(now));
  render(view({...invoice,payableAmount,status}));
  expect(screen.getByRole('button',{name:label})).toBeDefined();
});
test('RF15-04: ausente/inválida não afirma data nem atraso; competência atualiza',()=>{
  vi.useFakeTimers({toFake:['Date']});vi.setSystemTime(new Date('2027-03-01T12:00:00Z'));
  const result=render(view({...invoice,closingDate:null,dueDate:'2027-02-31'}));
  expect(screen.getByText('Fecha: —')).toBeDefined();expect(screen.getByText('Vence: —')).toBeDefined();
  expect(screen.queryByRole('button',{name:'Pagar Atrasada'})).toBeNull();
  result.rerender(view({...invoice,month:2,closingDate:'2027-02-28',dueDate:'2027-03-05'}));
  expect(screen.getByText('Fecha: 28 de fev')).toBeDefined();expect(screen.getByText('Vence: 05 de mar')).toBeDefined();
});
test('RF15-02: máscara preserva geometria mas remove valor da árvore acessível e alterna',()=>{
  const r=render(<PrivacyBlur>R$ 1.234,56</PrivacyBlur>);
  expect(screen.getByText('R$ 1.234,56').getAttribute('aria-hidden')).toBeNull();
  user.privacyMode=true;r.rerender(<PrivacyBlur>R$ 1.234,56</PrivacyBlur>);
  expect(screen.getByText('R$ 1.234,56').getAttribute('aria-hidden')).toBe('true');
  expect(screen.getByText('Valor oculto')).toBeDefined();
  user.privacyMode=false;r.rerender(<PrivacyBlur>R$ 1.234,56</PrivacyBlur>);
  expect(screen.getByText('R$ 1.234,56').getAttribute('aria-hidden')).toBeNull();
});
const transaction:Transaction={createdAt:'2027-01-15T12:00:00Z',id:'tx',description:'Receita sintética',amount:1300,type:'INCOME',date:'2027-01-15',isPaid:true,accountId:'a',categoryId:'c'};
test('RF15-03: foco, controle com Escape próprio, aninhamento e cleanup',async()=>{
  function Harness(){const [open,setOpen]=useState(false),[child,setChild]=useState(false);return <>
    <button onClick={()=>setOpen(true)}>Abrir detalhe</button>
    <TransactionDetails transaction={{...transaction,status:'SETTLED',remainingAmount:1300}} categories={[]} accounts={[]} isOpen={open} onClose={()=>setOpen(false)} onUpdate={async()=>{}} onDelete={()=>{}} onCommand={()=>setChild(true)}/>
    <Modal isOpen={child} title="Filho" onClose={()=>setChild(false)}><input aria-label="Controle próprio" onKeyDown={e=>{if(e.key==='Escape')e.preventDefault();}}/></Modal>
  </>;}
  render(<Harness/>);const opener=screen.getByRole('button',{name:'Abrir detalhe'});opener.focus();fireEvent.click(opener);
  const dialog=screen.getByRole('dialog',{name:'Detalhes de Receita sintética'});
  expect(document.activeElement).toBe(within(dialog).getByRole('button',{name:'Fechar detalhes do lançamento'}));
  const command=within(dialog).getByRole('button',{name:'Estornar parcial ou total'});command.focus();fireEvent.click(command);
  const own=screen.getByLabelText('Controle próprio');own.focus();fireEvent.keyDown(own,{key:'Escape'});
  expect(screen.getAllByRole('dialog')).toHaveLength(2);
  fireEvent.keyDown(document,{key:'Escape'});await waitFor(()=>expect(screen.queryByRole('dialog',{name:'Filho'})).toBeNull());expect(document.activeElement).toBe(command);
  fireEvent.keyDown(document,{key:'Escape'});await waitFor(()=>expect(screen.queryByRole('dialog')).toBeNull());expect(document.activeElement).toBe(opener);
  fireEvent.keyDown(document,{key:'Tab'});expect(document.body.style.overflow).not.toBe('hidden');
});
