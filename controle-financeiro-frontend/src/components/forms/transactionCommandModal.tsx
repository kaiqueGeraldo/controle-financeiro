"use client";

import {useRef,useState} from "react";
import {Modal} from "@/components/ui/modal";
import {transactionService,type FinancialTransactionCommand} from "@/services/transactionService";
import {ApiError} from "@/services/api";
import {type Transaction} from "@/types";
import {localDateString} from "@/utils/date";
import {formatCurrency} from "@/utils/format";

export type TransactionCommandKind="settle"|"reverse"|"realizeTransfer";
type SavedIntent={command:FinancialTransactionCommand;confirmed:boolean};
function loadIntent(key:string):SavedIntent|null {
  try {const value=JSON.parse(sessionStorage.getItem(key)??"null") as SavedIntent|null;
    return value?.command && typeof value.command.operationId==="string" && typeof value.command.date==="string" ? value:null;
  } catch {return null;}
}

export function TransactionCommandModal({transaction,kind,ownerId,onClose,onSuccess}: {
  transaction:Transaction;kind:TransactionCommandKind;ownerId:string;onClose:()=>void;onSuccess:()=>Promise<unknown>;
}) {
  const storageKey=`financial-command:${ownerId}:${transaction.id}:${kind}`;
  const [saved,setSaved]=useState<SavedIntent|null>(()=>loadIntent(storageKey));
  const pending=useRef<FinancialTransactionCommand|null>(saved?.command??null);
  const [amount,setAmount]=useState(saved?.command.amount??String(transaction.remainingAmount??transaction.amount));
  const [date,setDate]=useState(saved?.command.date??localDateString());
  const [time,setTime]=useState(saved?.command.time??"");
  const [reason,setReason]=useState(saved?.command.reason??"");
  const [busy,setBusy]=useState(false);
  const [retryAllowed,setRetryAllowed]=useState(false);
  const [error,setError]=useState<string|null>(saved?"Uma intenção aguarda recuperação. Consulte o recibo antes de repetir.":null);
  const dispatching=useRef(false);
  const title=kind==="settle"?"Baixar previsão":kind==="reverse"?"Estornar lançamento":"Realizar transferência prevista";
  function remember(command:FinancialTransactionCommand,confirmed:boolean) {
    const value={command,confirmed};sessionStorage.setItem(storageKey,JSON.stringify(value));setSaved(value);
  }
  async function refreshConfirmed() {
    await onSuccess();sessionStorage.removeItem(storageKey);onClose();
  }
  async function reconcile() {
    if(dispatching.current||!pending.current)return;
    dispatching.current=true;setBusy(true);setError(null);
    try {
      if(!saved?.confirmed) {
        await transactionService.receipt(pending.current.operationId);remember(pending.current,true);
      }
      await refreshConfirmed();
    } catch(failure:unknown) {
      if(failure instanceof ApiError && failure.status===404) {setRetryAllowed(true);setError("Recibo ainda não localizado. Você pode repetir exatamente a intenção salva.");}
      else setError("A recuperação falhou. Atualize os dados novamente; nenhuma operação foi reenviada.");
    } finally {dispatching.current=false;setBusy(false);}
  }
  async function submit(e:React.SyntheticEvent) {
    e.preventDefault();if(dispatching.current)return;
    if(saved?.confirmed){await reconcile();return;}
    if(saved&&!retryAllowed){await reconcile();return;}
    dispatching.current=true;setBusy(true);setError(null);let confirmed=false;
    try {
      pending.current??={operationId:crypto.randomUUID(),date,time:time||null,
        ...(kind!=="realizeTransfer"?{amount}:{}),...(kind!=="settle"?{reason}:{})};
      // Persist the exact command before dispatch. Closing/reloading never creates a retry.
      remember(pending.current,false);
      await transactionService[kind](transaction.id,pending.current);
      confirmed=true;remember(pending.current,true);await refreshConfirmed();
    } catch(failure:unknown) {
      if(confirmed)setError("Operação confirmada. Atualize os dados; ela não será reenviada.");
      else if(failure instanceof ApiError && !failure.requiresReconciliation && failure.status>=400 && failure.status<500 && failure.status!==409) {
        sessionStorage.removeItem(storageKey);pending.current=null;setSaved(null);setError(failure.message);
      } else {setRetryAllowed(false);setError("Resultado desconhecido. Consulte o recibo para recuperar esta mesma intenção.");}
    } finally {dispatching.current=false;setBusy(false);}
  }
  const input="block w-full bg-bg-base border border-border-divider rounded-lg p-2";
  return <Modal isOpen onClose={()=>{if(!busy)onClose();}} title={title}>
    <form onSubmit={submit} className="space-y-4">
      <p className="text-sm">O registro original e seus vínculos permanecem no histórico.</p>
      <p className="text-sm">{kind==="reverse"?"Restante reversível":"Restante previsto"}: {formatCurrency(transaction.remainingAmount??transaction.amount)}</p>
      {kind==="realizeTransfer"&&<p className="text-sm">As duas contas e a taxa serão realizadas juntas. A previsão conserva o vencimento original.</p>}
      <fieldset disabled={busy||saved!==null} className="space-y-3">
        {kind!=="realizeTransfer"&&<label className="block">Valor {kind==="reverse"?"do estorno":"da baixa"}<input className={input} type="number" min="0.01" max={transaction.remainingAmount??transaction.amount} step="0.01" required value={amount} onChange={e=>setAmount(e.target.value)}/></label>}
        <label className="block">Data efetiva<input className={input} type="date" required value={date} onChange={e=>setDate(e.target.value)}/></label>
        <label className="block">Horário informado (opcional)<input className={input} type="time" step="1" value={time} onChange={e=>setTime(e.target.value)}/></label>
        {kind!=="settle"&&<label className="block">Motivo<textarea className={input} required maxLength={500} value={reason} onChange={e=>setReason(e.target.value)}/></label>}
      </fieldset>
      {error&&<p role="alert" className="text-sm text-amber-400">{error}</p>}
      <button type="submit" disabled={busy} className="w-full p-3 bg-emerald-600 rounded-xl text-white">{busy?"Processando…":saved?.confirmed?"Atualizar dados":saved?retryAllowed?"Repetir mesma intenção":"Consultar recibo":kind==="settle"?"Confirmar baixa":kind==="reverse"?"Confirmar estorno":"Confirmar realização"}</button>
      {saved&&!saved.confirmed&&retryAllowed&&<button type="button" disabled={busy} onClick={reconcile} className="w-full p-2">Consultar recibo novamente</button>}
    </form>
  </Modal>;
}
