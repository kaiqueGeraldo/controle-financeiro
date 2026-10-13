import {act, fireEvent, render, screen} from '@testing-library/react';
import {beforeEach, expect, test, vi} from 'vitest';
import {OperationModal} from '@/components/forms/operationModal';

const session = vi.hoisted(() => ({user:{id:'visual-owner'}}));
const toast = vi.hoisted(() => ({error:vi.fn()}));
vi.mock('@/hooks/useUser',()=>({useUser:()=>session}));
vi.mock('@/contexts/toastContext',()=>({useToast:()=>toast}));
vi.mock('@/hooks/useFinanceData',()=>({useFinanceData:()=>({accounts:[{id:'account',balance:1000}]})}));
const asset={id:'A',name:'Ativo A',ticker:'A',type:'OTHER' as const,quantity:0,averagePrice:0,currentPrice:0};
const key='cf-creation:v1:visual-owner:INVESTMENT_OPERATION';
function deferred() {let resolve!:(r:Response)=>void, reject!:(e:Error)=>void; const promise=new Promise<Response>((a,b)=>{resolve=a;reject=b;}); return {promise,resolve,reject};}
function receipt(command: {date:string}) {return {id:'10000000-0000-4000-8000-000000000002',type:'BUY',date:command.date,dateOrigin:'USER_INPUT',quantity:2,price:10,totalValue:20,fees:0,costDelta:20,realizedResult:null};}
function setup(fixed=false) {
  const callbacks={onClose:vi.fn(),onSuccess:vi.fn(),onReconcile:vi.fn()};
  const selected=fixed?{...asset,type:'FIXED_INCOME' as const}:asset;
  const view=render(<OperationModal isOpen asset={selected} {...callbacks}/>);
  const show=(id:string|null,owner='visual-owner')=>{session.user={id:owner};view.rerender(<OperationModal isOpen={id!==null} asset={id?{...selected,id,ticker:id}:null} {...callbacks}/>);};
  const submit=()=>act(()=>{fireEvent.submit(screen.getByRole('button',{name:'Confirmar Operação'}).closest('form')!);});
  if(fixed) fireEvent.change(screen.getByLabelText('Valor informado'),{target:{value:'20'}});
  else {fireEvent.change(screen.getByPlaceholderText('0'),{target:{value:'2'}});fireEvent.change(screen.getByPlaceholderText('0,00'),{target:{value:'10'}});}
  return {view,show,submit,...callbacks};
}
beforeEach(()=>{sessionStorage.clear();session.user={id:'visual-owner'};vi.clearAllMocks();});

test.each(['B','ABA','reopen','normal','unmount','owner','ownerABA','expired'])('RVR24-02 visual: late receipt %s',async mode=>{
  const d=deferred();const fetch=vi.fn().mockReturnValue(d.promise);vi.stubGlobal('fetch',fetch);
  const v=setup();v.submit();const saved=sessionStorage.getItem(key)!;const command=JSON.parse(saved).command;
  if(mode==='B') {v.show(null);v.show('B');}
  if(mode==='ABA') {v.show('B');v.show('A');}
  if(mode==='reopen') {v.show(null);v.show('A');}
  if(mode==='unmount') v.view.unmount();
  if(mode==='owner'||mode==='ownerABA') {v.show('B','other-owner');if(mode==='ownerABA')v.show('A');}
  if(mode==='expired') act(()=>window.dispatchEvent(new Event('sessionExpired')));
  await act(async()=>d.resolve(new Response(JSON.stringify(receipt(command)))));
  const invalidSession=['unmount','owner','ownerABA','expired'].includes(mode);
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(v.onSuccess).toHaveBeenCalledTimes(invalidSession?0:1);
  expect(v.onClose).toHaveBeenCalledTimes(mode==='normal'?1:0);
  expect(sessionStorage.getItem(key)).toBe(invalidSession?saved:null);
  if(['B','ABA','reopen'].includes(mode)) expect(screen.getByRole('dialog')).toBeDefined();
});

test.each(['recover','retry'])('RVR24-02 visual: unknown A survives; late %s resolves receipt without closing B',async action=>{
  const fetch=vi.fn().mockRejectedValueOnce(new Error('resposta perdida'));vi.stubGlobal('fetch',fetch);
  const v=setup();await act(async()=>v.submit());const saved=sessionStorage.getItem(key)!;const command=JSON.parse(saved).command;
  expect(v.onReconcile).toHaveBeenCalledTimes(1);
  const d=deferred();fetch.mockReturnValueOnce(d.promise);
  act(()=>fireEvent.click(screen.getByText(action==='recover'?'Consultar recibo':'Repetir a mesma intenção')));
  v.show(null);v.show('B');
  await act(async()=>d.resolve(new Response(JSON.stringify(action==='recover'?{operationId:command.operationId,kind:'INVESTMENT_OPERATION',result:receipt(command)}:receipt(command)))));
  expect(v.onSuccess).toHaveBeenCalledTimes(1);expect(v.onClose).not.toHaveBeenCalled();
  expect(sessionStorage.getItem(key)).toBeNull();expect(screen.getByRole('dialog',{name:'B - Operação'})).toBeDefined();
  if(action==='retry') expect(JSON.parse(fetch.mock.calls[1][1].body)).toEqual(command);
  else expect(fetch.mock.calls[1][0]).toBe(`/api/financial-intents/${command.operationId}`);
});

test('RVR24-02 visual: late error preserves unknown A and authenticated recovery from B',async()=>{
  const d=deferred();const fetch=vi.fn().mockReturnValueOnce(d.promise);vi.stubGlobal('fetch',fetch);
  const v=setup();v.submit();const saved=sessionStorage.getItem(key)!;const command=JSON.parse(saved).command;
  v.show(null);v.show('B');
  await act(async()=>d.reject(new Error('rede incerta')));
  expect(sessionStorage.getItem(key)).toBe(saved);expect(v.onClose).not.toHaveBeenCalled();expect(v.onReconcile).toHaveBeenCalledTimes(1);
  expect(screen.getByRole('alert').textContent).toContain('Operação anterior: A');
  expect((screen.getByRole('button',{name:'Confirmar Operação'}) as HTMLButtonElement).disabled).toBe(true);
  fetch.mockResolvedValueOnce(new Response(JSON.stringify({operationId:command.operationId,kind:'INVESTMENT_OPERATION',result:receipt(command)})));
  await act(async()=>fireEvent.click(screen.getByText('Consultar recibo')));
  expect(v.onSuccess).toHaveBeenCalledTimes(1);
  // Resolving A explicitly from B must not treat the result as B's success.
  expect(v.onClose).not.toHaveBeenCalled();expect(sessionStorage.getItem(key)).toBeNull();
  expect(fetch.mock.calls.filter(([,options])=>options.method==='POST')).toHaveLength(1);
});

test.each(['success','error'])('RVR24-02 visual: B draft/loading survive late valuation A %s',async outcome=>{
  const a=deferred(),b=deferred();const fetch=vi.fn().mockReturnValueOnce(a.promise).mockReturnValueOnce(b.promise);vi.stubGlobal('fetch',fetch);
  const v=setup(true);v.submit();v.show(null);v.show('B');
  const input=screen.getByLabelText('Valor informado');fireEvent.change(input,{target:{value:'47'}});v.submit();
  await act(async()=>outcome==='success'?a.resolve(new Response('{}')):a.reject(new Error('erro de A')));
  expect((input as HTMLInputElement).value).toBe('47');expect(screen.getByRole('dialog',{name:'B - Operação'})).toBeDefined();
  expect((input.closest('fieldset') as HTMLFieldSetElement).disabled).toBe(true);
  expect(v.onClose).not.toHaveBeenCalled();expect(toast.error).not.toHaveBeenCalled();
  await act(async()=>b.resolve(new Response('{}')));
  expect(v.onClose).toHaveBeenCalledTimes(1);expect(v.onSuccess).toHaveBeenCalledTimes(outcome==='success'?2:1);
  expect(fetch).toHaveBeenCalledTimes(2);
});

test.each(['owner','ownerABA','unmount','expired'])('RVR24-02 visual: valuation session boundary %s',async mode=>{
  const d=deferred();vi.stubGlobal('fetch',vi.fn().mockReturnValueOnce(d.promise));
  const v=setup(true);v.submit();
  if(mode==='unmount')v.view.unmount();
  else if(mode==='expired')act(()=>window.dispatchEvent(new Event('sessionExpired')));
  else {v.show('B','other-owner');if(mode==='ownerABA')v.show('A');}
  await act(async()=>d.resolve(new Response('{}')));
  expect(v.onSuccess).not.toHaveBeenCalled();expect(v.onClose).not.toHaveBeenCalled();expect(v.onReconcile).not.toHaveBeenCalled();
});

test('RVR24-02 visual: refetch with same entity preserves draft and normal completion',async()=>{
  const d=deferred();vi.stubGlobal('fetch',vi.fn().mockReturnValueOnce(d.promise));
  const v=setup();v.show('A');expect((screen.getByPlaceholderText('0') as HTMLInputElement).value).toBe('2');
  v.submit();const command=JSON.parse(sessionStorage.getItem(key)!).command;
  v.show('A');await act(async()=>d.resolve(new Response(JSON.stringify(receipt(command)))));
  expect(v.onClose).toHaveBeenCalledTimes(1);expect(v.onSuccess).toHaveBeenCalledTimes(1);
});

test('RVR24-02 visual: reconciliation A cannot release loading or replace B intention',async()=>{
  const a=deferred(),b=deferred();const fetch=vi.fn().mockReturnValueOnce(a.promise).mockReturnValueOnce(b.promise);vi.stubGlobal('fetch',fetch);
  const v=setup();let finishReconcile!:()=>void;
  v.onReconcile.mockImplementation(()=>new Promise<void>(r=>{finishReconcile=r;}));
  v.submit();const commandA=JSON.parse(sessionStorage.getItem(key)!).command;
  v.show(null);v.show('B');await act(async()=>a.resolve(new Response('{"message":"validation"}',{status:400})));
  expect(v.onReconcile).toHaveBeenCalledTimes(1);expect(sessionStorage.getItem(key)).toBeNull();
  fireEvent.change(screen.getByPlaceholderText('0'),{target:{value:'2'}});fireEvent.change(screen.getByPlaceholderText('0,00'),{target:{value:'10'}});
  v.submit();const savedB=sessionStorage.getItem(key)!;const commandB=JSON.parse(savedB).command;
  expect(commandB.investmentId).toBe('B');expect(commandB.operationId).not.toBe(commandA.operationId);
  await act(async()=>finishReconcile());
  expect(sessionStorage.getItem(key)).toBe(savedB);expect(v.onClose).not.toHaveBeenCalled();
  expect((screen.getByPlaceholderText('0').closest('fieldset') as HTMLFieldSetElement).disabled).toBe(true);
  await act(async()=>b.resolve(new Response(JSON.stringify(receipt(commandB)))));
  expect(v.onSuccess).toHaveBeenCalledTimes(1);expect(v.onClose).toHaveBeenCalledTimes(1);expect(fetch).toHaveBeenCalledTimes(2);
});
