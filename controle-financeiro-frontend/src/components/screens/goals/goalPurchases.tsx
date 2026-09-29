"use client";
import { useEffect, useState } from "react";
import { goalService, type GoalPurchase } from "@/services/goalService";
import { type Goal } from "@/types";
import { formatCurrency } from "@/utils/format";

export function GoalPurchases({goals}: {goals: Goal[]}) {
  const [purchases,setPurchases]=useState<GoalPurchase[]>([]);
  const [revision,setRevision]=useState(0);
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState<string | null>(null);
  useEffect(()=>{
    const controller=new AbortController();setLoading(true);setError("");
    goalService.getPurchases(controller.signal).then(data=>{
      if(!controller.signal.aborted)setPurchases(data);
    }).catch(()=>{if(!controller.signal.aborted)setError("Não foi possível carregar as compras.");})
      .finally(()=>{if(!controller.signal.aborted)setLoading(false);});
    return ()=>controller.abort();
  },[goals,revision]);
  const refund=async(id:string)=>{
    if(busy)return;setBusy(id);setError("");
    try {
      await goalService.refundItem(id);
      setRevision(n=>n+1);
      window.dispatchEvent(new Event("refreshFinance"));
      window.dispatchEvent(new Event("refreshCards"));
    } catch(e) {setError(e instanceof Error ? e.message : "Não foi possível confirmar o reembolso. Atualize as compras antes de tentar novamente.");}
    finally {setBusy(null);}
  };
  return <section className="my-8 space-y-3" aria-label="Histórico de compras">
    <h2 className="text-lg font-semibold">Histórico de compras</h2>
    <p className="text-sm text-text-muted">Compras permanecem aqui mesmo após excluir o item ou a meta. Reembolso no cartão reduz a dívida e devolve o excedente como crédito no cartão.</p>
    {error && <p role="alert">{error}</p>}
    <button onClick={()=>setRevision(n=>n+1)} disabled={loading || !!busy} className="underline">Atualizar compras</button>
    {loading ? <p role="status">Carregando compras…</p> : purchases.length===0 ? <p>Nenhuma compra registrada.</p> : purchases.map(p=><article key={p.itemId} className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border border-border-divider">
      <div><h3>{p.name}</h3><p>{formatCurrency(p.amount)} · {p.cardTransactionId ? "Cartão" : "Conta"}</p></div>
      {p.refundedAt ? <span>Reembolsada</span> : <button disabled={!!busy} onClick={()=>refund(p.itemId)} className="px-3 py-2 bg-bg-surface-hover rounded-lg">{busy===p.itemId ? "Reembolsando…" : "Reembolsar compra"}</button>}
    </article>)}
  </section>;
}
