import type { SavedCreation } from "@/services/creationIntent";
type Props = { busy: boolean; message: string; pending: SavedCreation | null; recover: () => void; retry: () => void };
export function CreationRecovery({ busy, message, pending, recover, retry }: Props) {
  if (!message) return null;
  return <div role="alert" className="space-y-2 text-sm">
    <p>{message}</p>
    {pending && <>
      <p>Operação anterior: {pending.label ?? ("description" in pending.command ? pending.command.description : "Investimento")} · {pending.command.date} · {"description" in pending.command ? `Valor ${pending.command.amount}` : `Quantidade ${pending.command.quantity}, preço ${pending.command.price}, taxas ${pending.command.fees ?? 0}`}.</p>
      <p>Fechar ou recarregar preserva esta intenção nesta aba. Perder o armazenamento exige conferir o histórico; a identidade perdida não pode ser recuperada automaticamente.</p>
      <button type="button" disabled={busy} onClick={recover} className="underline">Consultar recibo</button>
      <button type="button" disabled={busy} onClick={retry} className="block underline">Repetir a mesma intenção</button>
    </>}
  </div>;
}
