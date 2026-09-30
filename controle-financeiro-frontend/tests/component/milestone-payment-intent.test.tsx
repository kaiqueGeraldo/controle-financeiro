import {fireEvent,render,screen,waitFor} from "@testing-library/react";
import {afterEach,expect,test,vi} from "vitest";
import {PayInvoiceModal} from "@/components/forms/payInvoiceModal";
import {cardService} from "@/services/cardService";
import {ApiError} from "@/services/api";

afterEach(()=>{sessionStorage.clear();vi.restoreAllMocks();});
const props={isOpen:true,onClose:vi.fn(),onSuccess:async()=>{},cardId:"intent-card",cardName:"Cartão",ownerId:"intent-owner",
 currentInvoiceValue:100,month:9,year:2026,accounts:[{id:"account",name:"Conta",balance:1000,type:"CHECKING" as const,color:"BLUE",isArchived:false}]};

test("unknown outcome survives reopen and retries the exact stored command only after explicit recovery",async()=>{
 const pay=vi.spyOn(cardService,"payInvoice").mockRejectedValueOnce(new ApiError("Resposta perdida",502,{requiresReconciliation:true})).mockResolvedValue({status:200,data:{id:"receipt"}});
 const receipt=vi.spyOn(cardService,"paymentReceipt").mockRejectedValue(new ApiError("Não localizado",404));
 const first=render(<PayInvoiceModal {...props}/>);
 fireEvent.click(screen.getByRole("button",{name:"Confirmar Pagamento"}));
 await waitFor(()=>expect(pay).toHaveBeenCalledTimes(1));
 const command=pay.mock.calls[0][1];expect(command.operationId).toMatch(/^[0-9a-f-]{36}$/);
 await screen.findByRole("button",{name:"Atualizar dados sem repetir pagamento"});
 first.unmount();
 render(<PayInvoiceModal {...props} currentInvoiceValue={50}/>);
 expect((screen.getByLabelText("Valor do Pagamento") as HTMLInputElement).value).toBe("100");
 expect((screen.getByLabelText("Valor do Pagamento") as HTMLInputElement).closest("fieldset")?.disabled).toBe(true);
 expect(pay).toHaveBeenCalledTimes(1);
 fireEvent.click(screen.getByRole("button",{name:"Atualizar dados sem repetir pagamento"}));
 await screen.findByRole("button",{name:"Repetir a mesma intenção"});expect(receipt).toHaveBeenCalledTimes(1);expect(pay).toHaveBeenCalledTimes(1);
 fireEvent.click(screen.getByRole("button",{name:"Repetir a mesma intenção"}));
 await waitFor(()=>expect(pay).toHaveBeenCalledTimes(2));expect(pay.mock.calls[1][1]).toEqual(command);
 await waitFor(()=>expect(sessionStorage.getItem("invoice-payment:intent-owner:intent-card:2026:9")).toBeNull());
});

test("a located receipt reconciles the screen without a second payment request",async()=>{
 const pay=vi.spyOn(cardService,"payInvoice").mockRejectedValue(new ApiError("Resposta perdida",502,{requiresReconciliation:true}));
 vi.spyOn(cardService,"paymentReceipt").mockResolvedValue({status:200,data:{id:"receipt",operationId:"operation",amount:100}});
 const closed=vi.fn();render(<PayInvoiceModal {...props} onClose={closed}/>);
 fireEvent.click(screen.getByRole("button",{name:"Confirmar Pagamento"}));
 fireEvent.click(await screen.findByRole("button",{name:"Atualizar dados sem repetir pagamento"}));
 await waitFor(()=>expect(closed).toHaveBeenCalledOnce());expect(pay).toHaveBeenCalledOnce();
});
