"use client";
import { useId, type ReactNode } from "react";
import { useUser } from "@/hooks/useUser";
import { ownRecord } from "@/services/ownRecord";
import { type Choice, type Interview, type Issue, type Json, type Obj, type Ref, refKey, sections } from "@/services/onboarding/model";

export const controlClass = "w-full min-w-0 rounded-lg border border-border-divider bg-bg-surface px-3 py-2 text-text-main focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 disabled:opacity-60";
export const buttonClass = "rounded-lg border border-border-divider px-4 py-2 text-text-main hover:bg-bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 disabled:cursor-not-allowed disabled:opacity-50";
export const fieldId = (path: string) => `onboarding${path.replaceAll("/", "-")}`;
export type Option = { value: string; label: string };
export type FieldsProps = { issues: Issue[]; choices: Choice[]; draft: Interview };
type FieldProps = { label: string; path: string; value?: Json; onChange: (v: Json | undefined) => void; issues: Issue[]; type?: "text" | "money" | "quantity" | "date" | "number" | "checkbox" | "month"; options?: Option[]; help?: string; maxLength?: number };
export function Field({ label, path, value, onChange, issues, type = "text", options, help, maxLength }: FieldProps) {
  const { user } = useUser(); const id = fieldId(path); const helpId = useId();
  const errors = issues.filter(i => i.path === path); const errorId = id + "-error";
  const described = [help ? helpId : "", errors.length ? errorId : ""].filter(Boolean).join(" ") || undefined;
  const sensitive = type === "money" || type === "quantity";
  const str = typeof value === "string" || typeof value === "number" ? String(value) : "";
  return <div className="min-w-0 space-y-1">
    <label htmlFor={id} className={type === "checkbox" ? "flex items-start gap-3 text-sm text-text-main" : "block text-sm font-medium text-text-main"}>
      {type === "checkbox" && <input id={id} type="checkbox" className="mt-1 h-4 w-4 shrink-0" checked={value === true} onChange={e => onChange(e.target.checked)} aria-invalid={errors.length > 0 || undefined} aria-describedby={described} />}
      {label}
    </label>
    {type !== "checkbox" && (options ? <select id={id} className={controlClass} value={str} onChange={e => onChange(e.target.value || undefined)} aria-invalid={errors.length > 0 || undefined} aria-describedby={described}>
      <option value="">Ainda não informado</option>{options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select> : <input id={id} className={controlClass} type={sensitive ? user?.privacyMode ? "password" : "text" : type} inputMode={sensitive ? "decimal" : undefined} autoComplete="off" spellCheck={false} maxLength={maxLength ?? (sensitive ? 24 : undefined)}
      value={sensitive ? str.replace(".", ",") : str} onChange={e => { const raw = sensitive ? e.target.value.replace(",", ".") : e.target.value; onChange(raw === "" ? undefined : type === "number" ? Number(raw) : raw); }}
      aria-invalid={errors.length > 0 || undefined} aria-describedby={described} />)}
    {help && <p id={helpId} className="text-sm text-text-muted">{help}</p>}
    {errors.length > 0 && <p id={errorId} role="alert" className="text-sm text-red-500">{errors.map(e => e.message).join(" ")}</p>}
  </div>;
}
export function FactField({ label, path, value, onChange, issues, type = "money" }: Omit<FieldProps, "options"> & { type?: "money" | "quantity" | "date" | "text" }) {
  const fact = ownRecord(value, []) ? value as Obj : {};
  return <fieldset className="min-w-0 space-y-2 rounded-lg border border-border-divider p-3"><legend className="px-1 text-sm font-medium">{label}</legend>
    <Field label={`Informação de ${label.toLowerCase()}`} path={path + "/state"} value={fact.state} issues={issues} options={[{ value: "KNOWN", label: "Sei informar" }, { value: "UNKNOWN", label: "Não sei informar" }]} onChange={v => onChange(v ? { state: v } : undefined)} />
    {fact.state === "KNOWN" && <Field label={label} path={path + "/value"} value={fact.value} issues={issues} type={type} onChange={v => { const next = { ...fact }; if (v === undefined) delete next.value; else next.value = v; onChange(next); }} />}
  </fieldset>;
}
export function CompetenceField({ label, path, value, onChange, issues }: Omit<FieldProps, "type" | "options">) {
  const v = ownRecord(value, ["year", "month"]) ? `${String(value.year).padStart(4, "0")}-${String(value.month).padStart(2, "0")}` : undefined;
  return <Field label={label} path={path} issues={issues} type="month" value={v} onChange={v => { if (typeof v !== "string") onChange(undefined); else { const [year, month] = v.split("-").map(Number); onChange({ year, month }); } }} />;
}
export function availableRefs({ draft, choices }: Pick<FieldsProps, "draft" | "choices">, kinds: string[], monetaryOnly = false): { ref: Ref; label: string }[] {
  const byIdentity = new Map(choices.map(c => [`${c.kind}:${c.id}`, c]));
  const existing = choices.filter(c => kinds.includes(c.kind) && c.kind !== "CATEGORY" && (!monetaryOnly || c.type === "MONETARY")).map(c => ({ ref: { kind: c.kind as Ref["kind"], id: c.id }, label: c.label + " (existente)" }));
  const aliases = new Set<string>(); const proposed: { ref: Ref; label: string }[] = [];
  const kindsBySection: Record<string, Ref["kind"]> = { accounts: "ACCOUNT", cards: "CARD", investments: "INVESTMENT", goals: "GOAL" };
  for (const name of sections) {
    const kind = kindsBySection[name]; if (!kind || !kinds.includes(kind)) continue;
    for (const item of draft.sections[name].items) {
      if (ownRecord(item.ref, ["id"])) { if (item.action === "LINK" || String(item.action).startsWith("INITIALIZE")) aliases.add(`${kind}:${item.ref.id}`); }
      if (monetaryOnly && item.action === "CREATE" && item.type !== "MONETARY") continue;
      const linkedId = ownRecord(item.ref, []) ? item.ref.id : undefined;
      const linked = linkedId ? byIdentity.get(`${kind}:${linkedId}`) : undefined;
      if (monetaryOnly && item.action === "LINK" && linked?.type !== "MONETARY") continue;
      proposed.push({ ref: { kind, tempId: item.tempId }, label: typeof item.name === "string" ? item.name : typeof item.title === "string" ? item.title : linkedId ? linked?.label ?? "Vínculo a corrigir" : "Novo registro sem nome" });
    }
  }
  return [...existing.filter(c => !aliases.has(refKey(c.ref))), ...proposed];
}
export function RefField({ label, path, value, onChange, issues, choices, draft, kinds, persistent = false, monetaryOnly = false }: Omit<FieldProps, "type" | "options"> & FieldsProps & { kinds: string[]; persistent?: boolean; monetaryOnly?: boolean }) {
  const refs = persistent ? choices.filter(c => kinds.includes(c.kind) && c.kind !== "CATEGORY").map(c => ({ ref: { kind: c.kind as Ref["kind"], id: c.id }, label: c.label })) : availableRefs({ draft, choices }, kinds, monetaryOnly);
  const current = ownRecord(value, ["kind"]) ? `${value.kind}:${value.id ?? value.tempId}` : "";
  const options = refs.map(v => ({ value: refKey(v.ref), label: v.label }));
  if (current && !options.some(o => o.value === current)) options.unshift({ value: current, label: "Vínculo pendente ou removido — escolha outro" });
  return <Field label={label} path={path} issues={issues} options={options} value={current} onChange={v => { const found = refs.find(r => refKey(r.ref) === v); onChange(found ? { ...found.ref } : undefined); }} />;
}
export function Grid({ children }: { children: ReactNode }) { return <div className="grid min-w-0 gap-4 sm:grid-cols-2">{children}</div>; }
