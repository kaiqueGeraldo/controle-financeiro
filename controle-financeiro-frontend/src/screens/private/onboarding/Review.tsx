"use client";
import { useMemo } from "react";
import { PrivacyBlur } from "@/components/ui/privacyBlur";
import { formatCalendarDate, isCalendarDatePast } from "@/utils/date";
import { formatExact } from "@/services/onboarding/input";
import { ownRecord } from "@/services/ownRecord";
import { metricLabels, ownReferenceIdentity, refKey, sectionLabels, sections, type Choice, type Interview, type Json, type Ref, type Summary, type SummaryAmount } from "@/services/onboarding/model";

export function Amount({ value, numeric = false }: { value: SummaryAmount; numeric?: boolean }) {
  return <PrivacyBlur className="min-w-0 break-words"><span>
    {value.state === "KNOWN" ? formatExact(value.value!, !numeric) : value.state === "PARTIAL" ? `Subtotal conhecido ${formatExact(value.knownSubtotal!, !numeric)}; total indisponível` : value.state === "NOT_APPLICABLE" ? "Não se aplica" : "Não reconciliado / indisponível"}
    {value.outsideIndividualRange === true && <span className="block text-sm">Total exato; excede a faixa de uma operação individual.</span>}
    {value.missingPaths.length > 0 && <span className="block text-sm">Há {value.missingPaths.length} informação(ões) pendente(s) nesta medida.</span>}
  </span></PrivacyBlur>;
}
function referenceLabels(draft: Interview, choices: Choice[]): Map<string, string> {
  const result = new Map(choices.map(c => [`${c.kind}:${c.id}`, c.label]));
  const kinds = { accounts: "ACCOUNT", cards: "CARD", investments: "INVESTMENT", goals: "GOAL" } as const;
  for (const section of ["accounts", "cards", "investments", "goals"] as const) for (const item of draft.sections[section].items) {
    const kind = kinds[section]; const linkedId = ownRecord(item.ref, ["id"]) ? ownReferenceIdentity(item.ref) : undefined;
    const existing = linkedId !== undefined ? result.get(`${kind}:${linkedId}`) : undefined;
    result.set(`${kind}:${item.tempId}`, typeof item.name === "string" ? item.name : typeof item.title === "string" ? item.title : existing ?? "Vínculo a corrigir");
  }
  return result;
}
function labelForRef(ref: Ref, refLabels: ReadonlyMap<string, string>): string {
  return refLabels.get(refKey(ref)) ?? { ACCOUNT: "Conta existente", INVESTMENT: "Investimento existente", CARD: "Cartão existente", GOAL: "Meta existente" }[ref.kind];
}
export function FinancialReview({ summary, draft, choices }: { summary: Summary; draft: Interview; choices: Choice[] }) {
  const refLabels = useMemo(() => referenceLabels(draft, choices), [draft, choices]);
  const decisions = useMemo(() => new Map(summary.reservationReview?.decisions.map(d => [refKey(d.source), d])), [summary]);
  const selectedGoals = useMemo(() => new Map(draft.sections.goals.items.map(g => [g.tempId, g])), [draft]);
  const label = (ref: Ref) => labelForRef(ref, refLabels);
  return <section className="space-y-6" aria-label="Revisão financeira preparada">
    <div className="space-y-2 rounded-xl border border-border-divider p-4"><h2 className="text-xl font-semibold">Revisão financeira</h2><p>Aberturas na data-base: {formatCalendarDate(summary.baseDate)}. Registros existentes na revisão: {new Date(summary.existingAsOf).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })} (São Paulo).</p><p className="text-sm text-text-muted">Esta captura inclui os registros existentes uma vez. Não reconstrói posição histórica. Reservas não somam patrimônio; dívida e crédito são mostrados separadamente. Investimento livre não é caixa.</p></div>
    <dl className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3">{Object.entries(metricLabels).map(([key, label]) => <div key={key} className="min-w-0 rounded-xl border border-border-divider bg-bg-surface p-4"><dt className="text-sm text-text-muted">{label}</dt><dd className="mt-2 min-w-0 font-semibold"><Amount value={summary.metrics[key as keyof typeof metricLabels]} /></dd></div>)}</dl>
    {summary.bySource.map(s => {
      const decision = decisions.get(refKey(s.ref));
      return <section key={refKey(s.ref)} className="min-w-0 space-y-2 rounded-xl border border-border-divider p-4"><h3 className="break-words font-semibold">{label(s.ref)}</h3><dl className="grid gap-3 sm:grid-cols-2"><div><dt>Saldo informado</dt><dd><PrivacyBlur>{s.value.state === "KNOWN" ? formatExact(s.value.value) : "Desconhecido"}</PrivacyBlur></dd></div><div><dt>Reserva comprovada e pendências</dt><dd><Amount value={s.reserved} /></dd></div><div><dt>Valor livre</dt><dd><Amount value={s.free} /></dd></div><div><dt>Capacidade para nova destinação</dt><dd><Amount value={s.newAllocationCapacity} /></dd></div></dl>
      {decision && <p className="text-sm">{decision.state === "ALLOWED" ? "Nova destinação permitida até a capacidade apresentada." : decision.reason === "RESERVATION_UNCERTAIN" ? "Disponibilidade não confirmada. Confirme a origem ou o encerramento da reserva para destinar mais desta fonte." : decision.reason === "SOURCE_INELIGIBLE" ? "Esta fonte está indisponível para aumentar reservas." : "Esta fonte não tem capacidade confirmada para aumentar reservas."}</p>}</section>;
    })}
    {summary.byCard.map(c => <section key={refKey(c.ref)} className="space-y-2 rounded-xl border border-border-divider p-4"><h3 className="font-semibold">{label(c.ref)}</h3><dl className="grid gap-3 sm:grid-cols-2"><div><dt>Dívida corrente e futura</dt><dd><PrivacyBlur>{c.debt.state === "KNOWN" ? formatExact(c.debt.value) : "Desconhecida"}</PrivacyBlur></dd></div><div><dt>Crédito separado</dt><dd><PrivacyBlur>{c.credit.state === "KNOWN" ? formatExact(c.credit.value) : "Desconhecido"}</PrivacyBlur></dd></div><div><dt>Principal comprometido</dt><dd><Amount value={c.committed} /></dd></div><div><dt>Limite disponível (pode ser negativo)</dt><dd><Amount value={c.availableLimit} /></dd></div></dl></section>)}
    {summary.byGoal.map(g => {
      const identity = ownReferenceIdentity(g.ref);
      const item = Object.hasOwn(g.ref, "tempId") && identity !== undefined ? selectedGoals.get(identity) : undefined;
      const overdue = item && typeof item.deadline === "string" && isCalendarDatePast(item.deadline);
      return <section key={refKey(g.ref)} className="space-y-2 rounded-xl border border-border-divider p-4"><h3 className="font-semibold">{label(g.ref)} — {g.type === "NUMERIC" ? "numérica" : "financeira"}</h3><dl><dt>Progresso {g.type === "NUMERIC" && typeof item?.unit === "string" ? `(${item.unit})` : "por reservas"}</dt><dd><Amount value={g.progress} numeric={g.type === "NUMERIC"} /></dd><dt>Cobertura financeira comprovada</dt><dd><Amount value={g.covered} /></dd></dl>{overdue && <p className="text-sm">Prazo original vencido. Se o progresso não atingir o alvo, a meta está atrasada.</p>}</section>;
    })}
    {summary.allocationChanges?.map(c => <section key={String(c.tempId)} className="space-y-2 rounded-xl border border-border-divider p-4"><h3 className="font-semibold">Alteração de reserva existente</h3><PrivacyBlur><span>Anterior: {String(c.previousAmount)}; final: {String(c.amount)}; diferença: {String(c.delta)} BRL.</span></PrivacyBlur><p className="text-sm">Destinação atual; não cria transferência ou nova receita.</p></section>)}
    {summary.reservationReview && <section className="space-y-3" aria-label="Reservas anteriores"><h3 className="font-semibold">Reservas anteriores, contadas uma vez</h3>{summary.reservationReview.reservations.map((r, i) => <div key={String(r.reservationId)} className="space-y-1 rounded-lg border border-border-divider p-3"><p>Reserva anterior {i + 1}</p>{ownRecord(r.nominal, []) && <Amount value={r.nominal as SummaryAmount} />}<p className="text-sm">{ownRecord(r.attribution, []) && r.attribution.state === "CLOSED" ? "Encerramento atual comprovado." : ownRecord(r.attribution, []) && r.attribution.state === "CONFIRMED" ? "Origem atribuída; valores desconhecidos continuam pendentes." : "Origem ainda não confirmada. O valor nominal não é progresso monetário autorizado."}</p></div>)}</section>}
    {summary.reservationChanges?.map((c, i) => <section key={String(c.reservationId)} className="space-y-2 rounded-lg border border-border-divider p-3"><h3>Declaração atual {i + 1}: {c.action === "CLOSE" ? "encerramento" : "origem completa"}</h3><p className="text-sm">Correção declarada da situação atual. Não é documentação de movimentação histórica.</p><PrivacyBlur><AnswerValue value={c.previous} label="Antes" refLabels={refLabels} /><AnswerValue value={c.proposed} label="Depois" refLabels={refLabels} /></PrivacyBlur></section>)}
    {summary.deferredSections.length > 0 && <p>Adiado para os módulos regulares: {summary.deferredSections.map(s => sectionLabels[s as keyof typeof sectionLabels] ?? "Informação pendente").join(", ")}. A cobertura continuará incompleta.</p>}
  </section>;
}
const labels: Record<string, string> = {
  currency: "Moeda", baseDate: "Data-base", preferredName: "Nome preferido", objective: "Objetivo", browserZone: "Fuso do navegador", boundaryAcknowledged: "Fronteira com movimentos posteriores", cashOnlyAcknowledged: "Caixa sem ativos aplicados",
  name: "Nome", title: "Meta", type: "Tipo", action: "Forma de inclusão", ref: "Cadastro vinculado", balance: "Saldo", deficitAcknowledged: "Ciência do déficit", distinctCashConfirmed: "Espécie distinta da carteira", color: "Cor",
  last4Digits: "Final do cartão", brand: "Bandeira", limit: "Limite", closingDay: "Dia de fechamento", dueDay: "Dia de vencimento", opening: "Dívida de abertura", currentCompetence: "Competência corrente", year: "Ano", month: "Mês", currentOutstanding: "Restante corrente", currentPrincipal: "Principal corrente", currentCharges: "Encargos correntes", dueDateOverride: "Vencimento declarado", credit: "Crédito separado", creditNotNettedAcknowledged: "Crédito não compensado", futureInstallments: "Parcelas futuras", competence: "Competência", amount: "Valor final", principal: "Principal", charges: "Encargos", description: "Descrição",
  identifier: "Identificador", institution: "Instituição", positionMode: "Posição", quantity: "Quantidade", cost: "Custo", valuation: "Avaliação", acquisitionDate: "Aquisição", historicalSource: "Origem comprovada", basis: "Forma de avaliação", price: "Preço", date: "Data", source: "Fonte", note: "Observação", target: "Alvo", deadline: "Prazo original", unit: "Unidade", initialProgress: "Progresso inicial", goal: "Meta vinculada", account: "Conta", category: "Categoria", direction: "Direção", dueDate: "Vencimento", recurrenceLabel: "Descrição da recorrência", parts: "Partes da reserva", currentSituationConfirmed: "Confirmação da situação atual", nominal: "Nominal", attribution: "Origem", sources: "Fontes", excluded: "Fontes excluídas por prova", state: "Conhecimento", value: "Valor", knownSubtotal: "Subtotal conhecido", outsideIndividualRange: "Excede faixa individual", missingPaths: "Informações pendentes",
};
const values: Record<string, string> = { CREATE: "Cadastrar posição existente fora do app", LINK: "Usar cadastro existente", INITIALIZE_DEFAULT: "Abertura da carteira automática", INITIALIZE_EMPTY: "Abertura de cartão vazio", CHECKING: "Conta corrente", SAVINGS: "Poupança", INVESTMENT: "Caixa de corretora", CASH: "Dinheiro em espécie", MONETARY: "Financeira / monetária", NUMERIC: "Numérica", UNIT: "Quantidade de unidades", FIXED_INCOME: "Renda fixa", TREASURY: "Tesouro", STOCK: "Ação", FII: "Fundo imobiliário", CRYPTO: "Criptoativo", OTHER: "Outro", TOTAL: "Valor total", PRICE: "Preço unitário", USER_DECLARED: "Declaração atual", INCOME: "Receita", EXPENSE: "Despesa", ASSIGN: "Declarar origem atual completa", CLOSE: "Declarar encerramento atual", CONFIRMED: "Origem confirmada", CANDIDATES: "Fontes possíveis comprovadas", UNBOUNDED: "Origem não delimitada", CLOSED: "Encerrada atualmente" };
function AnswerValue({ value, label, refLabels }: { value: Json | undefined; label: string; refLabels: ReadonlyMap<string, string> }) {
  if (value === undefined) return <p>{label}: ainda não preenchido</p>;
  if (Array.isArray(value)) return <div className="space-y-1"><p>{label}: {value.length ? "" : "nenhum item"}</p>{value.map((v, i) => <AnswerValue key={i} value={v} label={`${label} ${i + 1}`} refLabels={refLabels} />)}</div>;
  if (ownRecord(value, [])) {
    if (value.state === "UNKNOWN") return <p>{label}: desconhecido / indisponível</p>;
    if (value.state === "NOT_APPLICABLE") return <p>{label}: não se aplica</p>;
    if (Object.hasOwn(value, "kind") && ownReferenceIdentity(value) !== undefined) return <p>{label}: {labelForRef(value as Ref, refLabels)}</p>;
    if (Object.hasOwn(value, "id") && typeof value.id === "string" && !Object.hasOwn(value, "kind")) return <p>{label}: {refLabels.get(`CATEGORY:${value.id}`) ?? "Categoria vinculada"}</p>;
    return <div className="min-w-0 space-y-1"><p className="font-medium">{label}</p><dl className="ml-2 space-y-1 border-l border-border-divider pl-3">{Object.entries(value).filter(([key]) => Object.hasOwn(labels, key)).map(([key, v]) => <div key={key}><dt className="sr-only">{labels[key]}</dt><dd><AnswerValue value={v} label={labels[key]} refLabels={refLabels} /></dd></div>)}</dl></div>;
  }
  const str = typeof value === "boolean" ? value ? "Confirmado" : "Não confirmado" : typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? formatCalendarDate(value) : typeof value === "string" && /^-?\d+\.\d+$/.test(value) ? formatExact(value, false) : typeof value === "string" ? values[value] ?? value : String(value ?? "Não informado");
  return <p className="break-words">{label}: {str}</p>;
}
export function AnswersReview({ draft, choices }: { draft: Interview; choices: Choice[] }) {
  const refLabels = useMemo(() => referenceLabels(draft, choices), [draft, choices]);
  const answers = { UNANSWERED: "Ainda não respondido", NONE: "Nenhum novo item declarado", DEFERRED: "Adiado, sem declarar zero", PROVIDED: "Itens informados" };
  return <div className="min-w-0 space-y-4"><PrivacyBlur><AnswerValue label="Contexto" value={draft.context} refLabels={refLabels} /></PrivacyBlur>{sections.map(s => <section key={s} className="min-w-0 space-y-2 rounded-lg border border-border-divider p-3"><h3 className="font-semibold">{sectionLabels[s]} — {answers[draft.sections[s].answer]}</h3><PrivacyBlur className="block!">{draft.sections[s].items.map((i, index) => <AnswerValue key={i.tempId} value={i} label={`Item ${index + 1}`} refLabels={refLabels} />)}</PrivacyBlur></section>)}{draft.reservationConfirmations?.length ? <PrivacyBlur><AnswerValue label="Declarações da situação atual" value={draft.reservationConfirmations} refLabels={refLabels} /></PrivacyBlur> : null}</div>;
}
