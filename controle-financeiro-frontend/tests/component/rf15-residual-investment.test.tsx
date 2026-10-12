import {fireEvent, render, screen, within} from '@testing-library/react';
import {useState} from 'react';
import {expect, test, vi} from 'vitest';
import InvestmentsScreen from '@/screens/private/investments/investmentsScreen';
import {Modal} from '@/components/ui/modal';

const fixture = vi.hoisted(() => ({loading:false, error:null as Error | null, openOperation:vi.fn()}));
vi.mock('@/hooks/useSidebar',()=>({useSidebar:()=>({scrolled:false})}));
vi.mock('@/hooks/useUser',()=>({useUser:()=>({user:{privacyMode:false}})}));
vi.mock('@/hooks/useFinanceData',()=>({useFinanceData:()=>({refresh:vi.fn()})}));
vi.mock('@/services/investmentService',()=>({investmentService:{corrections:vi.fn().mockResolvedValue({data:[]})}}));
vi.mock('@/contexts/modals/investmentModalContext',()=>({useInvestmentModals:()=>({openNewAsset:vi.fn(),openOperation:fixture.openOperation})}));
vi.mock('@/hooks/useInvestments',()=>({useInvestments:()=>{
  const asset = {id:'i',ticker:'TEST',name:'Ativo sintético',type:'OTHER',quantity:8,averagePrice:10,currentPrice:10,totalCost:80,valuationAmount:80};
  return {investments:[asset],selectedInvestment:asset,selectedInvestmentId:'i',setSelectedInvestmentId:vi.fn(),history:[],isHistoryLoading:false,isLoading:fixture.loading,error:fixture.error,totalInvestido:80,lucroTotal:0,rentabilidadeGeral:0,valuationComplete:true,refreshInvestments:vi.fn()};
}}));

test('CF014: releitura não remonta detalhe sobre a operação nem perde Aportar', () => {
  function View() {
    const [open,setOpen] = useState(false);
    fixture.openOperation.mockImplementation(() => setOpen(true));
    return <><InvestmentsScreen/><Modal isOpen={open} title="Operação sintética" onClose={() => setOpen(false)}><button>Confirmar</button></Modal></>;
  }
  const r = render(<View/>);
  const action = screen.getByRole('button',{name:/^Aportar$/});
  action.focus(); fireEvent.click(action);
  const operation = screen.getByRole('dialog',{name:'Operação sintética'});
  const close = within(operation).getByRole('button',{name:'Fechar modal'});
  expect(document.activeElement).toBe(close);
  fixture.loading = true; r.rerender(<View/>);
  expect(screen.queryByRole('dialog',{name:'Detalhes do investimento TEST'})).not.toBeNull();
  fixture.loading = false; r.rerender(<View/>);
  expect(document.activeElement).toBe(close);
  fixture.error = new Error('Releitura indisponível'); r.rerender(<View/>);
  expect(screen.queryByRole('dialog',{name:'Detalhes do investimento TEST'})).not.toBeNull();
  expect(screen.getByRole('alert')).toBeDefined();
  fixture.error = null; r.rerender(<View/>);
  expect(document.activeElement).toBe(close);
  fireEvent.keyDown(document,{key:'Escape'});
  expect(document.activeElement).toBe(action);
});
