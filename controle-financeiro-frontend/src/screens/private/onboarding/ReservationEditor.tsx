"use client";
import { ownRecord } from "@/services/ownRecord";
import { setPath } from "@/services/onboarding/input";
import { type Interview, type Json, type Obj, type Summary } from "@/services/onboarding/model";
import { buttonClass, Field, Grid, RefField, type FieldsProps } from "./Fields";
import { type ConfirmChange } from "./ItemEditor";
import { FinancialReview } from "./Review";

export function ReservationEditor({ previous, onChange, confirm, ...props }: FieldsProps & { previous: Summary | null; onChange: (v: Interview) => void; confirm: ConfirmChange }) {
  const commands = props.draft.reservationConfirmations ?? [];
  const reservations = previous?.reservationReview?.reservations ?? commands.map(c => ({ reservationId: c.reservationId, revision: c.expectedRevision }));
  if (!reservations.length && !props.draft.reservationConfirmations?.length) return <p className="text-sm text-text-muted">Reservas anteriores e impedimentos de origem serão apresentados na revisão do servidor. Para corrigi-los, cancele a revisão preparada e volte a esta etapa. Manter pendência não inventa origem nem exige zerar os valores.</p>;
  const update = (id: string, value?: Obj) => onChange({ ...props.draft, reservationConfirmations: [...commands.filter(c => c.reservationId !== id), ...(value ? [value] : [])] });
  return <section className="space-y-4"><h3 className="text-lg font-semibold">Declarações atuais de reservas anteriores</h3><p className="text-sm text-text-muted">A captura abaixo pertence à revisão anterior. Não é uma nova validação financeira. Declarar a situação atual não fabrica prova histórica; o servidor reavalia origem, versão e capacidade ao preparar novamente.</p>
    {reservations.map((r, index) => {
      const id = String(r.reservationId); const command = commands.find(c => c.reservationId === id); const commandIndex = commands.findIndex(c => c.reservationId === id); const path = `/reservationConfirmations/${commandIndex}`;
      const change = previous?.reservationChanges?.find(c => c.reservationId === id);
      const priorRevision = command?.expectedRevision ?? (ownRecord(change?.previous, ["revision"]) ? change.previous.revision as Json : r.revision);
      const set = (key: string, v: Json | undefined) => { if (command) update(id, setPath(command, key.split("/"), v)); };
      const parts = command && Array.isArray(command.parts) ? command.parts.filter((v): v is Obj => ownRecord(v, [])) : [];
      return <fieldset key={id} className="min-w-0 space-y-4 rounded-xl border border-border-divider p-4"><legend>Reserva anterior {index + 1}</legend>
        <Field label={`Situação atual da reserva ${index + 1}`} path={`/reservation-choice/${index}`} value={typeof command?.action === "string" ? command.action : "KEEP"} issues={props.issues} options={[{ value: "KEEP", label: "Manter pendente, sem nova declaração" }, { value: "ASSIGN", label: "Declarar todas as fontes e valores atuais" }, { value: "CLOSE", label: "Declarar que esta reserva não existe atualmente" }]} onChange={v => { if (!v || v === command?.action) return; confirm("Esta escolha substitui a declaração deste rascunho. Não modifica os saldos antes da confirmação final.", () => update(id, v === "KEEP" ? undefined : { reservationId: id, expectedRevision: priorRevision, action: v, currentSituationConfirmed: false, ...(v === "ASSIGN" ? { parts: [] } : {}) })); }} />
        {command?.action === "ASSIGN" && <><RefField label="Meta financeira da reserva anterior" path={path + "/goal"} value={command.goal} onChange={v => set("goal", v)} {...props} kinds={["GOAL"]} monetaryOnly />
          {parts.map((part, i) => <fieldset key={i} className="space-y-3 rounded-lg border border-border-divider p-3"><legend>Parte atual {i + 1}</legend><Grid><RefField label={`Fonte da parte ${i + 1}`} path={`${path}/parts/${i}/source`} value={part.source} onChange={v => { const next = [...parts]; next[i] = setPath(part, ["source"], v); set("parts", next); }} {...props} kinds={["ACCOUNT", "INVESTMENT"]} /><Field label={`Valor da parte ${i + 1}`} path={`${path}/parts/${i}/amount`} value={part.amount} onChange={v => { const next = [...parts]; next[i] = setPath(part, ["amount"], v); set("parts", next); }} issues={props.issues} type="money" /></Grid><button type="button" className={buttonClass} onClick={() => confirm("Remover esta parte da declaração atual?", () => set("parts", parts.filter((_, n) => n !== i)))}>Remover parte {i + 1}</button></fieldset>)}
          <button type="button" className={buttonClass} disabled={parts.length >= 200} onClick={() => set("parts", [...parts, {}])}>Adicionar fonte à declaração</button></>}
        {command && <Field label={command.action === "CLOSE" ? "Confirmo que esta reserva não existe atualmente; isso não encerra outras reservas" : "Confirmo todas as fontes e valores atuais desta reserva, sem outras partes"} type="checkbox" path={path + "/currentSituationConfirmed"} value={command.currentSituationConfirmed} onChange={v => set("currentSituationConfirmed", v)} issues={props.issues} />}
      </fieldset>;
    })}
    {previous && <details><summary className="cursor-pointer">Consultar captura anterior e impedimentos das fontes</summary><FinancialReview summary={previous} draft={props.draft} choices={props.choices} /></details>}
  </section>;
}
