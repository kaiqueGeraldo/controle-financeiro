import { act, fireEvent, render } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import { NewTransactionModal } from "@/components/forms/newTransactionModal";
import { OperationModal } from "@/components/forms/operationModal";
import { ApiError } from "@/services/api";
import { transactionService } from "@/services/transactionService";
const session=vi.hoisted(()=>({user:{id:"review-A"}}));
vi.mock("@/hooks/useUser",()=>({useUser:()=>session}));
vi.mock("@/components/ui/modal",()=>({Modal:({children}:{children:React.ReactNode})=><div>{children}</div>}));
vi.mock("@/contexts/toastContext",()=>({useToast:()=>({error:vi.fn()})}));
vi.mock("@/hooks/useFinanceData",()=>({useFinanceData:()=>({accounts:[{id:"account",balance:1000}]})}));
vi.mock("@/services/transactionService",()=>({transactionService:{create:vi.fn()}}));
const unknown=new ApiError("Unknown",502,{requiresReconciliation:true});
beforeEach(()=>{vi.clearAllMocks();sessionStorage.clear();session.user={id:"review-A"};vi.mocked(transactionService.create).mockRejectedValue(unknown);});
function transaction(){
 const onSuccess=vi.fn(); const view=render(<NewTransactionModal isOpen onClose={vi.fn()} onSuccess={onSuccess}
  accounts={[{id:"account",name:"Account",type:"CHECKING",balance:1000,color:"BLUE",isArchived:false}]}
  categories={[{id:"category",name:"Category",type:"EXPENSE",icon:"Tag",color:"BLUE"}]} />);
 fireEvent.change(view.getByPlaceholderText("0,00"),{target:{value:"25.00"}});
 fireEvent.change(view.getByPlaceholderText("Ex: Mercado, Salário..."),{target:{value:"review"}});
 fireEvent.change(view.getByLabelText("Categoria do lançamento"),{target:{value:"category"}});
 fireEvent.change(view.getByLabelText("Conta do lançamento"),{target:{value:"account"}});
 return {view,onSuccess};
}
test("review: empty result is not a valid financial receipt",async()=>{
 const {view,onSuccess}=transaction(); await act(async()=>fireEvent.submit(view.container.querySelector("form")!));
 const saved=sessionStorage.getItem("cf-creation:v1:review-A:TRANSACTION_CREATE")!;
 const command=JSON.parse(saved).command;
 vi.stubGlobal("fetch",vi.fn().mockResolvedValue(new Response(JSON.stringify({operationId:command.operationId,kind:"TRANSACTION_CREATE",result:{}}))));
 await act(async()=>fireEvent.click(view.getByText("Consultar recibo")));
 expect(onSuccess).not.toHaveBeenCalled();
 expect(sessionStorage.getItem("cf-creation:v1:review-A:TRANSACTION_CREATE")).toBe(saved);
});
test("review: removal failure preserves the original identity",async()=>{
 const {view,onSuccess}=transaction(); await act(async()=>fireEvent.submit(view.container.querySelector("form")!));
 const saved=sessionStorage.getItem("cf-creation:v1:review-A:TRANSACTION_CREATE");
 vi.spyOn(Storage.prototype,"removeItem").mockImplementation(()=>{throw Error("storage unavailable");});
 vi.mocked(transactionService.create).mockResolvedValue({status:200,data:{}} as never);
 await act(async()=>fireEvent.click(view.getByText("Repetir a mesma intenção")));
 expect(onSuccess).not.toHaveBeenCalled();expect(sessionStorage.getItem("cf-creation:v1:review-A:TRANSACTION_CREATE")).toBe(saved);
});
const asset={id:"asset",name:"Asset",ticker:"REVIEW",type:"STOCK" as const,quantity:10,averagePrice:100,currentPrice:100};
function investment(){
 const onSuccess=vi.fn(),onReconcile=vi.fn(),onClose=vi.fn();
 const view=render(<OperationModal isOpen asset={asset} onSuccess={onSuccess} onReconcile={onReconcile} onClose={onClose}/>);
 fireEvent.change(view.getByPlaceholderText("0"),{target:{value:"2"}});
 fireEvent.change(view.getByPlaceholderText("0,00"),{target:{value:"100"}});
 return {view,onSuccess,onReconcile,onClose};
}
test.each([{label:"null",value:null},{label:"array",value:[]}])("review: invalid investment POST result $label cannot confirm unknown money",async ({value:result})=>{
 vi.stubGlobal("fetch",vi.fn().mockResolvedValue(new Response(JSON.stringify(result))));
 const {view,onSuccess}=investment(); await act(async()=>fireEvent.submit(view.container.querySelector("form")!));
 expect(onSuccess).not.toHaveBeenCalled();
 expect(sessionStorage.getItem("cf-creation:v1:review-A:INVESTMENT_OPERATION")).not.toBeNull();
});
test.each(["unmount","owner-switch"])("review: late investment response after %s cannot run reconciliation callback",async mode=>{
 let finish!:(response:Response)=>void;
 vi.stubGlobal("fetch",vi.fn().mockReturnValue(new Promise<Response>(resolve=>{finish=resolve;})));
 const {view,onSuccess,onReconcile,onClose}=investment();
 act(()=>fireEvent.submit(view.container.querySelector("form")!));
 const saved=sessionStorage.getItem("cf-creation:v1:review-A:INVESTMENT_OPERATION");
 if(mode==="unmount")view.unmount();
 else {session.user={id:"review-B"};view.rerender(<OperationModal isOpen asset={asset} onSuccess={onSuccess} onReconcile={onReconcile} onClose={onClose}/>);}
 await act(async()=>finish(new Response(JSON.stringify({id:"confirmed-operation"}))));
 expect(onSuccess).not.toHaveBeenCalled();
 expect(sessionStorage.getItem("cf-creation:v1:review-A:INVESTMENT_OPERATION")).toBe(saved);
 expect(onReconcile).not.toHaveBeenCalled();
});
