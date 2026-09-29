"use client";
import {useEffect,useState} from "react";
import {investmentService,type InvestmentCorrection} from "@/services/investmentService";
import {formatCurrency} from "@/utils/format";
import {formatCalendarDate} from "@/utils/date";

export function InvestmentCorrections({investmentId}:{investmentId:string}) {
  const [rows,setRows]=useState<InvestmentCorrection[]>([]);
  const [failed,setFailed]=useState(false);
  useEffect(()=>{
    const controller=new AbortController();
    investmentService.corrections(investmentId,controller.signal).then(r=>{
      if(!controller.signal.aborted){setRows(r.data);setFailed(false);}
    }).catch(()=>{if(!controller.signal.aborted)setFailed(true);});
    return()=>controller.abort();
  },[investmentId]);
  return <section aria-label="Compensações registradas" className="mt-4 space-y-3">
    <h4 className="font-bold">Compensações registradas</h4>
    {failed?<p role="alert">Não foi possível carregar as compensações. Reabra o detalhe para tentar novamente.</p>:rows.length===0?<p className="text-sm text-text-muted">Nenhuma compensação registrada.</p>:rows.map(row=><article key={row.id} className="p-3 border border-border-divider rounded-lg text-sm break-words">
      <p>{formatCalendarDate(row.effectiveDate)} · {row.reason}</p>
      <p>Caixa: {formatCurrency(row.cashDelta)} · Ajuste do resultado: {formatCurrency(row.realizedDelta)}</p>
      <p>Taxas devolvidas: {formatCurrency(Number(row.returnedFees))}</p>
      <p className="text-xs text-text-muted break-all">Operação original: {row.originalId}</p>
    </article>)}
  </section>;
}
