import {act, render, renderHook, screen} from '@testing-library/react';
import {afterEach, expect, test, vi} from 'vitest';
import {BrowserTodayProvider, useBrowserToday} from '@/contexts/browserTodayContext';
import {InvoiceDetails} from '@/components/screens/cards/invoiceDetails';
import type {CreditCard} from '@/services/cardService';

afterEach(() => vi.useRealTimers());
const card: CreditCard = {id:'c', name:'Calendário', last4Digits:'4242', limit:1000, closingDay:31, dueDay:5, brand:'VISA', color:'#333', currentInvoiceValue:120};
function Invoice({paid = false}: {paid?: boolean}) {
  const referenceDay = useBrowserToday();
  return <InvoiceDetails card={card} referenceDay={referenceDay} isOpen onClose={() => {}}
    invoiceData={{month:1,year:2027,status:paid ? 'PAID':'OPEN',payableAmount:paid ? 0:100,totalAmount:120,closingDate:'2027-01-31',dueDate:'2027-02-05',transactions:[]}}
    isLoadingInvoice={false} viewDateFormatted="janeiro de 2027" onChangeMonth={() => {}}
    onPay={() => {}} onDelete={() => {}} onUpdateLimit={async () => {}}/>;
}

test.each(['focus', 'visibilitychange', 'timer'] as const)('RF15-04: atualização por %s sem mudar período nem datas', event => {
  vi.useFakeTimers({toFake:['Date','setTimeout','clearTimeout']});
  vi.setSystemTime(new Date('2027-02-05T23:59:59'));
  render(<BrowserTodayProvider><Invoice/></BrowserTodayProvider>);
  expect(screen.getByRole('button',{name:'Adiantar Fatura'})).toBeDefined();
  act(() => {
    if (event === 'timer') vi.advanceTimersByTime(1000);
    else {
      vi.setSystemTime(new Date('2027-02-06T00:00:00'));
      if (event === 'focus') window.dispatchEvent(new Event('focus'));
      else document.dispatchEvent(new Event('visibilitychange'));
    }
  });
  expect(screen.getByRole('button',{name:'Pagar Atrasada'})).toBeDefined();
  expect(screen.getByText('janeiro de 2027')).toBeDefined();
  expect(screen.getByText('Fecha: 31 de jan')).toBeDefined();
  expect(screen.getByText('Vence: 05 de fev')).toBeDefined();
});

test('RF15-04: paga continua desabilitada depois da virada', () => {
  vi.useFakeTimers({toFake:['Date','setTimeout','clearTimeout']});
  vi.setSystemTime(new Date('2027-02-05T23:59:59'));
  render(<BrowserTodayProvider><Invoice paid/></BrowserTodayProvider>);
  act(() => vi.advanceTimersByTime(1000));
  expect((screen.getByRole('button',{name:'Fatura Paga'}) as HTMLButtonElement).disabled).toBe(true);
  expect(screen.queryByRole('button',{name:'Pagar Atrasada'})).toBeNull();
});

test('RF15-04: calendário compartilha um timer e remove callbacks ao desmontar', () => {
  vi.useFakeTimers({toFake:['Date','setTimeout','clearTimeout']});
  vi.setSystemTime(new Date('2027-02-05T23:59:59'));
  const addWindow = vi.spyOn(window,'addEventListener'), removeWindow = vi.spyOn(window,'removeEventListener');
  const addDocument = vi.spyOn(document,'addEventListener'), removeDocument = vi.spyOn(document,'removeEventListener');
  const r = renderHook(() => [useBrowserToday(),useBrowserToday()], {wrapper:BrowserTodayProvider});
  expect(r.result.current).toEqual(['2027-02-05','2027-02-05']);
  expect(vi.getTimerCount()).toBe(1);
  act(() => {window.dispatchEvent(new Event('focus')); document.dispatchEvent(new Event('visibilitychange'));});
  expect(vi.getTimerCount()).toBe(1);
  const focus = addWindow.mock.calls.find(([type]) => type === 'focus')![1];
  const visibility = addDocument.mock.calls.find(([type]) => type === 'visibilitychange')![1];
  r.unmount();
  expect(removeWindow).toHaveBeenCalledWith('focus',focus);
  expect(removeDocument).toHaveBeenCalledWith('visibilitychange',visibility);
  expect(vi.getTimerCount()).toBe(0);
});
