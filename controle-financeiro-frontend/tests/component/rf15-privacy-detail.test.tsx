import {render,screen} from '@testing-library/react';
import {isInaccessible} from '@testing-library/dom';
import {expect,test,vi} from 'vitest';
import {TransactionDetails} from '@/components/screens/extract/transactionDetails';
import {TransactionItem} from '@/components/screens/extract/transactionItem';
import type {Transaction} from '@/types';
const user=vi.hoisted(()=>({privacyMode:false}));
vi.mock('@/hooks/useUser',()=>({useUser:()=>({user})}));
const tx:Transaction={id:'privacy-detail',accountId:'synthetic-account',createdAt:'2027-01-15T12:00:00Z',description:'Lançamento protegido',amount:1300,cashAmount:1200,cashDelta:1200,remainingAmount:100,type:'INCOME',date:'2027-01-15',isPaid:true};
test('RF15-02: lista/detalhe não anunciam valor, caixa, bruto ou restante no modo privado',()=>{
 const view=()=> <><TransactionItem item={tx} accounts={[]} onClick={()=>{}} isLast/><TransactionDetails transaction={tx} accounts={[]} categories={[]} isOpen onClose={()=>{}} onUpdate={async()=>{}} onDelete={()=>{}}/></>;
 const r=render(view());
 for(const node of screen.getAllByText(/R\$.*(?:1\.300,00|1\.200,00|100,00)/))expect(isInaccessible(node)).toBe(false);
 user.privacyMode=true;r.rerender(view());
 for(const node of screen.getAllByText(/R\$.*(?:1\.300,00|1\.200,00|100,00)/))expect(isInaccessible(node)).toBe(true);
 expect(screen.getAllByText('Valor oculto').length).toBeGreaterThanOrEqual(5);
 user.privacyMode=false;r.rerender(view());
 for(const node of screen.getAllByText(/R\$.*(?:1\.300,00|1\.200,00|100,00)/))expect(isInaccessible(node)).toBe(false);
});
