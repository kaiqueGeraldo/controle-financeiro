import {fireEvent,render,screen,waitFor} from "@testing-library/react";
import {afterEach,expect,test,vi} from "vitest";
import {PayInvoiceModal} from "@/components/forms/payInvoiceModal";
import {cardService} from "@/services/cardService";
import {ApiError} from "@/services/api";

afterEach(()=>{sessionStorage.clear();vi.restoreAllMocks();});

test("switching owner never recovers the previous owner's command; successful reconciliation clears only its scope",async()=>{
  const command={operationId:"6b0a43ba-7c58-4b15-8fa4-2380f93a9cf1",accountId:"account-a",amount:20,
    date:"2027-01-15",time:null,month:1,year:2027,isPrepayment:false,description:"Pagamento de Fatura"};
  const keyA="invoice-payment:owner-a:card-a:2027:1";
  sessionStorage.setItem(keyA,"unknown");
  sessionStorage.setItem(`${keyA}:intent`,JSON.stringify({version:1,command}));
  const pay=vi.spyOn(cardService,"payInvoice").mockResolvedValue({status:200,data:{id:"new-receipt"}});
  const receipt=vi.spyOn(cardService,"paymentReceipt").mockRejectedValue(new ApiError("Ainda ausente",404));
  const shared={isOpen:true,onClose:vi.fn(),onSuccess:async()=>{},cardName:"Cartão",month:1,year:2027,
    accounts:[{id:"account-b",name:"Conta B",balance:1000,type:"CHECKING" as const,color:"BLUE",isArchived:false}]};
  const view=render(<PayInvoiceModal {...shared} ownerId="owner-b" cardId="card-b" currentInvoiceValue={100}/>);
  expect(screen.queryByRole("button",{name:"Atualizar dados sem repetir pagamento"})).toBeNull();
  expect((screen.getByLabelText("Valor do Pagamento") as HTMLInputElement).value).toBe("100.00");
  fireEvent.click(screen.getByRole("button",{name:"Confirmar Pagamento"}));
  await waitFor(()=>expect(shared.onClose).toHaveBeenCalledOnce());
  expect(pay).toHaveBeenCalledOnce();
  expect(pay.mock.calls[0][0]).toBe("card-b");
  expect(pay.mock.calls[0][1].operationId).not.toBe(command.operationId);
  expect(receipt).not.toHaveBeenCalled();
  expect(sessionStorage.getItem(keyA)).toBe("unknown");
  expect(sessionStorage.getItem("invoice-payment:owner-b:card-b:2027:1")).toBeNull();
  expect(sessionStorage.getItem("invoice-payment:owner-b:card-b:2027:1:intent")).toBeNull();
  view.rerender(<PayInvoiceModal {...shared} ownerId="owner-a" cardId="card-a" currentInvoiceValue={80}/>);
  expect((screen.getByLabelText("Valor do Pagamento") as HTMLInputElement).value).toBe("20");
  expect((screen.getByLabelText("Valor do Pagamento") as HTMLInputElement).closest("fieldset")?.disabled).toBe(true);
  fireEvent.click(screen.getByRole("button",{name:"Atualizar dados sem repetir pagamento"}));
  await screen.findByRole("button",{name:"Repetir a mesma intenção"});
  expect(receipt.mock.calls[0].slice(0,2)).toEqual(["card-a",command.operationId]);
  expect(pay).toHaveBeenCalledOnce();
});
