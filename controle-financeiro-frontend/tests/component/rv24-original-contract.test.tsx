import { act, fireEvent, render } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { NewTransactionModal } from "@/components/forms/newTransactionModal";
import { ApiError } from "@/services/api";
import { transactionService } from "@/services/transactionService";
vi.mock("@/hooks/useUser",()=>({useUser:()=>({user:{id:"original-probe-owner"}})}));
vi.mock("@/components/ui/modal",()=>({Modal:({children}:{children:React.ReactNode})=><div>{children}</div>}));
vi.mock("@/contexts/toastContext",()=>({useToast:()=>({error:vi.fn(),info:vi.fn(),success:vi.fn()})}));
vi.mock("@/services/transactionService",()=>({transactionService:{create:vi.fn()}}));

test("RV24-01: unknown creation must be reconciled before an unkeyed second send",async()=>{
  sessionStorage.clear();
  vi.spyOn(console,"error").mockImplementation(()=>undefined);
  vi.mocked(transactionService.create).mockRejectedValueOnce(new ApiError("Unknown outcome",502,{kind:"unavailable",requiresReconciliation:true}));
  vi.mocked(transactionService.create).mockResolvedValueOnce({status:200,data:{}} as never);
  const account={id:"synthetic-account",name:"Conta",type:"CHECKING" as const,balance:1000,color:"BLUE",isArchived:false};
  const category={id:"synthetic-category",name:"Categoria",type:"EXPENSE" as const,icon:"Tag",color:"BLUE"};
  const view=render(<NewTransactionModal isOpen onClose={vi.fn()} onSuccess={vi.fn()} accounts={[account]} categories={[category]} />);
  fireEvent.change(view.getByPlaceholderText("0,00"),{target:{value:"25.00"}});
  fireEvent.change(view.getByPlaceholderText("Ex: Mercado, Salário..."),{target:{value:"Review"}});
  const selects=view.container.querySelectorAll("select");
  fireEvent.change(selects[0],{target:{value:category.id}});fireEvent.change(selects[1],{target:{value:account.id}});
  await act(async()=>{fireEvent.submit(view.container.querySelector("form")!);});
  expect(transactionService.create).toHaveBeenCalledTimes(1);
  expect(vi.mocked(transactionService.create).mock.calls[0][0].operationId).toMatch(/^[0-9a-f-]{36}$/);
  await act(async()=>{fireEvent.submit(view.container.querySelector("form")!);});
  // UI observation only. The separate PostgreSQL legacy probe proves repeated money.
  expect(transactionService.create).toHaveBeenCalledTimes(1);
});
