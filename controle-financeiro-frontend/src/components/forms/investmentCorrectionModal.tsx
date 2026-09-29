"use client";

import {useRef,useState} from "react";
import {Modal} from "@/components/ui/modal";
import {investmentService, type InvestmentCorrectionCommand} from "@/services/investmentService";
import {ApiError} from "@/services/api";
import {type InvestTransaction} from "@/types";
import {localDateString} from "@/utils/date";

export function InvestmentCorrectionModal({transaction,onClose,onSuccess}: {
  transaction: InvestTransaction; onClose:()=>void; onSuccess:()=>Promise<unknown>;
}) {
  const [date,setDate]=useState(localDateString());
  const [reason,setReason]=useState("");
  const [fees,setFees]=useState("0.00");
  const [replace,setReplace]=useState(false);
  const [quantity,setQuantity]=useState(String(transaction.quantity));
  const [price,setPrice]=useState(String(transaction.price));
  const [newFees,setNewFees]=useState("0.00");
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState<string|null>(null);
  const [confirmed,setConfirmed]=useState(false);
  const [unknown,setUnknown]=useState(false);
  const pending=useRef<InvestmentCorrectionCommand|null>(null);
  const dispatching=useRef(false);
  const reconcile=async()=>{await onSuccess();onClose();};
  const submit=async(e:React.SyntheticEvent)=>{
    e.preventDefault();if(dispatching.current)return;
    dispatching.current=true;setBusy(true);setError(null);
    let accepted=confirmed;
    try {
      if(!accepted){
        pending.current??={operationId:crypto.randomUUID(),date,reason,returnedFees:fees,
          replacementQuantity:replace?quantity:null,replacementPrice:replace?price:null,replacementFees:replace?newFees:null};
        await investmentService.correct(transaction.id,pending.current);
        accepted=true;setConfirmed(true);setUnknown(false);
      }
      await reconcile();
    } catch(failure:unknown){
      if(accepted)setError("Compensação confirmada. Atualize os dados; ela não será reenviada.");
      else if(failure instanceof ApiError && !failure.requiresReconciliation && failure.status>=400 && failure.status<500){
        pending.current=null;setUnknown(false);setError(failure.message);
      } else {setUnknown(true);setError("Resultado desconhecido. Recuperar repetirá a mesma identificação e conteúdo, sem duplicar a compensação.");}
    } finally {dispatching.current=false;setBusy(false);}
  };
  const input="block w-full bg-bg-base border border-border-divider rounded-lg p-2";
  return <Modal isOpen onClose={()=>{if(!busy&&!unknown)onClose();}} title="Compensar operação">
    <form onSubmit={submit} className="space-y-4">
      <p className="text-sm">O registro original permanece. O caixa será compensado na conta original e os custos das operações dependentes serão recalculados. Taxas só retornam no valor informado abaixo.</p>
      <fieldset disabled={busy||confirmed||unknown} className="space-y-3">
        <label className="block">Data efetiva<input className={input} type="date" required value={date} onChange={e=>setDate(e.target.value)}/></label>
        <label className="block">Motivo<textarea className={input} required maxLength={500} value={reason} onChange={e=>setReason(e.target.value)}/></label>
        <label className="block">Taxas devolvidas<input className={input} type="number" min="0" step="0.01" required value={fees} onChange={e=>setFees(e.target.value)}/></label>
        <label className="flex gap-2"><input type="checkbox" checked={replace} onChange={e=>setReplace(e.target.checked)}/>Registrar operação substituta</label>
        {replace&&<>
          <label className="block">Quantidade corrigida<input className={input} type="number" min="0.00000001" step="0.00000001" required value={quantity} onChange={e=>setQuantity(e.target.value)}/></label>
          <label className="block">Preço corrigido<input className={input} type="number" min="0.00000001" step="0.00000001" required value={price} onChange={e=>setPrice(e.target.value)}/></label>
          <label className="block">Taxas da substituição<input className={input} type="number" min="0" step="0.01" required value={newFees} onChange={e=>setNewFees(e.target.value)}/></label>
        </>}
      </fieldset>
      {error&&<p role="alert" className="text-amber-400 text-sm">{error}</p>}
      <button type="submit" disabled={busy} className="w-full p-3 rounded-lg bg-emerald-600 text-white">{busy?"Processando…":confirmed?"Atualizar dados":unknown?"Recuperar compensação":"Confirmar compensação"}</button>
    </form>
  </Modal>;
}
