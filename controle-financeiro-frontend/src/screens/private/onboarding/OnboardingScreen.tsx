"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useUser } from "@/hooks/useUser";
import { Modal } from "@/components/ui/modal";
import { newItem, sectionLabels, steps, type Interview, type Json, type SectionName } from "@/services/onboarding/model";
import { buttonClass, Field, fieldId, Grid } from "./Fields";
import { ItemEditor, type ConfirmChange } from "./ItemEditor";
import { AnswersReview, FinancialReview } from "./Review";
import { ReservationEditor } from "./ReservationEditor";
import { useOnboarding } from "./useOnboarding";

const stepLabels = ["Contexto", "Contas", "Cartões e dívidas", "Investimentos", "Metas", "Reservas", "Previsões", "Revisão"];
export default function OnboardingScreen() {
  const { user, isLoading } = useUser();
  if (isLoading) return <p role="status" className="p-6">Carregando sua sessão…</p>;
  if (!user) return <div className="p-6"><p>Sua sessão terminou. O último rascunho salvo continua no servidor.</p><Link href="/auth" className={buttonClass}>Entrar para retomar</Link></div>;
  return <OwnerInterview key={user.id} owner={user.id} />;
}
function OwnerInterview({ owner }: { owner: string }) {
  const router = useRouter(); const { flow, state } = useOnboarding(owner);
  const [confirmation, setConfirmation] = useState<{ message: string; action: () => void; exit?: boolean } | null>(null);
  const title = useRef<HTMLHeadingElement>(null); const [focusPath, setFocusPath] = useState("");
  const draft = state.draft; const step = draft?.currentStep ?? "CONTEXT"; const index = steps.indexOf(step);
  const locked = state.busy || state.blocked || state.unknown || state.saveUnknown || !!state.prepareAttempt || !!state.prepared || !!state.receipt;
  const paused = state.session?.status === "SKIPPED";
  const confirm: ConfirmChange = (message, action) => setConfirmation({ message, action });
  useEffect(() => {
    const element = focusPath ? document.getElementById(fieldId(focusPath)) : title.current;
    if (element) { element.focus(); element.scrollIntoView?.({ block: "nearest" }); }
  }, [step, focusPath, state.prepared, state.receipt]);
  useEffect(() => {
    if (!state.dirty) return;
    const beforeUnload = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", beforeUnload); return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [state.dirty]);
  const edit = (next: Interview) => flow.edit(next);
  const exit = () => {
    if (state.dirty) setConfirmation({ message: "Há respostas ainda não salvas. Ao sair sem salvar, só o último rascunho confirmado poderá ser retomado.", action: () => router.push("/"), exit: true });
    else router.push("/");
  };
  const moveToIssue = (path: string) => {
    const section = path.split("/")[2]; const target = path.startsWith("/context") ? "CONTEXT" : path.startsWith("/reservationConfirmations") ? "ALLOCATIONS" : section?.toUpperCase();
    if (steps.includes(target as typeof steps[number])) flow.go(target as typeof steps[number]);
    setFocusPath(path);
  };
  const common = draft ? { draft, choices: state.choices, issues: state.issues } : null;
  return <div className="mx-auto w-full max-w-6xl space-y-6 p-4 pb-12 text-text-main sm:p-6 lg:p-8">
    <header className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm text-text-muted">Configuração inicial voluntária</p><h1 className="text-2xl font-bold sm:text-3xl">Organize seu ponto de partida</h1><p className="mt-2 max-w-3xl text-sm text-text-muted">Registre o que já existe na data-base. Salvar respostas não altera saldos; somente a confirmação final registra as posições.</p></div><button type="button" className={buttonClass} disabled={state.busy} onClick={exit}>Ir ao dashboard</button></header>
    {state.loading && <p role="status">Carregando entrevista e cadastros existentes…</p>}
    {state.message && <div role="alert" className="rounded-xl border border-border-divider bg-bg-surface p-4">{state.message}</div>}
    {state.prepared && state.issues.length > 0 && <div role="alert" className="space-y-2 rounded-xl border border-red-500 p-4"><p>O servidor indicou campos para revisão. Consulte o resultado e cancele a revisão para corrigir as respostas.</p><ul className="list-inside list-disc">{state.issues.map((issue, i) => <li key={i}>{issue.message}</li>)}</ul></div>}
    {state.choicesError && <div role="alert" className="space-y-2 rounded-xl border border-border-divider p-4"><p>{state.choicesError}</p><button type="button" className={buttonClass} disabled={state.busy} onClick={() => void flow.reloadChoices()}>Carregar cadastros novamente</button></div>}
    {!state.loading && !state.session && !state.blocked && <button type="button" className={buttonClass} disabled={state.busy} onClick={() => void flow.load()}>Tentar carregar entrevista</button>}
    {state.session?.mode === "COMPLEMENT" && !state.receipt && <aside className="space-y-2 rounded-xl border border-border-divider bg-bg-surface p-4"><h2 className="font-semibold">Seus registros atuais serão preservados</h2><p className="text-sm">Este é um complemento voluntário. Use vínculos para registros já existentes; não reaplique saldo de abertura. Nenhum cadastro será reinicializado automaticamente.</p><details><summary className="cursor-pointer">Consultar cadastros existentes</summary><ul className="mt-2 space-y-1 break-words">{state.choices.filter(c => c.kind !== "CATEGORY").map(c => <li key={`${c.kind}:${c.id}`}>{c.label}</li>)}</ul></details></aside>}
    {state.receipt && draft && <><h2 ref={title} tabIndex={-1} className="text-xl font-semibold">Entrevista concluída</h2><p>Recibo confirmado pelo servidor. Este resumo preserva a captura aceita; correções posteriores devem ser feitas nos módulos regulares.</p><FinancialReview summary={state.receipt.summary} draft={draft} choices={state.choices} /><Link href="/" className={buttonClass + " inline-block"}>Entrar no dashboard</Link></>}
    {state.prepared && draft && !state.receipt && <><h2 ref={title} tabIndex={-1} className="text-xl font-semibold">{state.unknown ? "Confirmação pendente de verificação" : "Confira antes de registrar"}</h2>
      {state.unknown && <p role="status">O resultado ainda não foi confirmado. Uma falha de rede ou consulta sem recibo não prova que a operação falhou.</p>}
      <FinancialReview summary={state.prepared.summary} draft={draft} choices={state.choices} />
      <details><summary className="cursor-pointer">Conferir todas as respostas salvas</summary><AnswersReview draft={draft} choices={state.choices} /></details>
      <div className="flex flex-wrap gap-3"><button type="button" className={buttonClass + " bg-emerald-700 text-white!"} disabled={state.busy} onClick={() => void flow.confirm()}>{state.unknown ? "Repetir a mesma confirmação" : "Confirmar informações e registrar posições"}</button><button type="button" className={buttonClass} disabled={state.busy} onClick={() => void flow.recover()}>Consultar resultado</button><button type="button" className={buttonClass} disabled={state.busy} onClick={() => confirm("Cancelar esta revisão para corrigir as respostas? O servidor verificará se a confirmação já foi concluída. Isso não desfaz posições já registradas.", () => { void flow.cancel(); })}>Cancelar revisão para corrigir</button></div></>}
    {state.prepareAttempt && !state.prepared && !state.receipt && <section className="space-y-3 rounded-xl border border-border-divider p-4"><h2 ref={title} tabIndex={-1} className="text-xl font-semibold">Preparação pendente</h2><p>Consulte o servidor ou repita a mesma preparação. As respostas ficam preservadas enquanto o estado é verificado.</p><div className="flex flex-wrap gap-3"><button type="button" className={buttonClass} disabled={state.busy} onClick={() => void flow.recover()}>Consultar preparação</button><button type="button" className={buttonClass} disabled={state.busy} onClick={() => void flow.retryPrepare()}>Repetir a mesma preparação</button></div></section>}
    {state.saveUnknown && <section className="space-y-3 rounded-xl border border-border-divider p-4"><h2 className="font-semibold">Salvamento pendente de verificação</h2><p>Suas respostas continuam nesta tela. Consulte o servidor antes de salvar novamente.</p><button type="button" className={buttonClass} disabled={state.busy} onClick={() => void flow.recover()}>Verificar salvamento</button></section>}
    {state.remote && draft && <section className="space-y-4 rounded-xl border border-border-divider p-4" aria-label="Comparar rascunhos"><h2 className="text-xl font-semibold">Escolha após comparar</h2><div className="grid min-w-0 gap-4 lg:grid-cols-2"><div className="min-w-0"><h3 className="font-semibold">Suas respostas nesta tela</h3><AnswersReview draft={draft} choices={state.choices} /></div><div className="min-w-0"><h3 className="font-semibold">Último rascunho do servidor</h3>{state.remote.payload ? <AnswersReview draft={state.remote.payload} choices={state.choices} /> : <p>Respostas descartadas ou entrevista ainda não iniciada.</p>}</div></div><div className="flex flex-wrap gap-3"><button type="button" className={buttonClass} disabled={state.busy} onClick={() => confirm("Substituir as respostas desta tela pelo rascunho do servidor?", flow.useRemote)}>Usar respostas do servidor</button><button type="button" className={buttonClass} disabled={state.busy} onClick={() => confirm("Salvar suas respostas como nova versão sobre o rascunho comparado? Nenhuma mesclagem será feita; outra alteração concorrente ainda poderá causar conflito.", () => { void flow.saveLocalOverCompared(); })}>Salvar minhas respostas como nova versão</button></div></section>}
    {draft && common && !state.receipt && !state.prepared && <>
      <nav aria-label="Etapas da entrevista"><ol className="grid grid-cols-2 gap-2 sm:grid-cols-4">{steps.map((s, i) => <li key={s}><button type="button" disabled={locked || paused} aria-current={step === s ? "step" : undefined} className={buttonClass + " w-full text-left text-sm " + (step === s ? "border-emerald-500! bg-bg-surface-hover" : "")} onClick={() => { setFocusPath(""); flow.go(s); }}>{i + 1}. {stepLabels[i]}</button></li>)}</ol></nav>
      {paused && <section className="space-y-3 rounded-xl border border-border-divider p-4"><h2 className="font-semibold">Entrevista pausada</h2><p>As respostas salvas foram preservadas. Retome para editar e preparar a revisão.</p><button type="button" className={buttonClass} disabled={state.busy || locked} onClick={() => void flow.save("RESUME")}>Retomar entrevista</button></section>}
      {state.issues.length > 0 && <section role="alert" className="space-y-2 rounded-xl border border-red-500 p-4"><h2 className="font-semibold">Revise as informações indicadas</h2><p className="text-sm">O diagnóstico recuperado é do último salvamento. A próxima preparação reavalia os dados atuais.</p><ul className="list-inside list-disc space-y-2">{state.issues.map((issue, i) => <li key={`${issue.path}:${i}`}><button type="button" className="text-left underline" disabled={locked} onClick={() => moveToIssue(issue.path)}>{stepLabels[issue.path.startsWith("/context") ? 0 : Math.max(0, steps.indexOf(issue.path.split("/")[2]?.toUpperCase() as typeof steps[number]))]}: {issue.message}</button></li>)}</ul></section>}
      <h2 ref={title} tabIndex={-1} className="text-xl font-semibold outline-none">Etapa {index + 1} de {steps.length}: {stepLabels[index]}</h2>
      <fieldset disabled={locked || paused || !!state.remote} className="min-w-0 space-y-6 disabled:opacity-75">
        {step === "CONTEXT" ? <ContextStep {...common} onChange={edit} /> : step === "REVIEW" ? <><p className="text-sm text-text-muted">Confira as respostas. Preparar salva esta etapa e consulta os valores autoritativos sem aplicar posições financeiras. O próximo passo apresenta o resumo para confirmação explícita.</p><AnswersReview draft={draft} choices={state.choices} /></> : <>
          <SectionStep name={step.toLowerCase() as SectionName} {...common} onChange={edit} confirm={confirm} />
          {step === "ALLOCATIONS" && <ReservationEditor previous={state.reviewForEditing} {...common} onChange={edit} confirm={confirm} />}
        </>}
      </fieldset>
      <footer className="space-y-3 border-t border-border-divider pt-4"><p role="status" className="text-sm text-text-muted">{state.busy ? "Aguardando resposta do servidor…" : state.dirty ? "Há respostas não salvas. Ao recarregar, só o último salvamento confirmado será retomado." : "Últimas respostas confirmadas no servidor."}</p>
        <div className="flex flex-wrap gap-3"><button type="button" className={buttonClass} disabled={locked || paused || index === 0 || !!state.remote} onClick={() => { setFocusPath(""); flow.go(steps[index - 1]); }}>Voltar</button>
          <button type="button" className={buttonClass} disabled={locked || paused || !!state.remote} onClick={() => void flow.save()}>Salvar rascunho</button>
          {index < steps.length - 1 ? <button type="button" className={buttonClass + " bg-emerald-700 text-white!"} disabled={locked || paused || !!state.remote} onClick={() => { setFocusPath(""); void flow.save("SAVE", steps[index + 1]); }}>Salvar e continuar</button> : <button type="button" className={buttonClass + " bg-emerald-700 text-white!"} disabled={locked || paused || !!state.remote} onClick={() => void flow.prepare()}>Preparar revisão financeira</button>}
          <button type="button" className={buttonClass} disabled={locked || paused || !!state.remote} onClick={() => { void flow.save("PAUSE").then(saved => { if (saved) router.push("/"); }); }}>Salvar e pausar</button>
          <button type="button" className={buttonClass} disabled={locked || !!state.remote} onClick={() => confirm("Descartar todas as respostas deste rascunho no servidor? A identidade da entrevista será mantida e nenhum saldo financeiro será alterado.", () => { void flow.save("DISCARD"); })}>Descartar respostas</button>
          <button type="button" className={buttonClass} disabled={state.busy || !!state.prepareAttempt || state.saveUnknown} onClick={() => void flow.recover()}>Consultar rascunho do servidor</button>
        </div>
      </footer>
    </>}
    <Modal isOpen={confirmation !== null} title={confirmation?.exit ? "Sair da entrevista" : "Confirmar alteração"} onClose={() => { if (!state.busy) setConfirmation(null); }}><div className="space-y-4"><p>{confirmation?.message}</p><div className="flex flex-wrap gap-3"><button type="button" className={buttonClass} disabled={state.busy} onClick={() => { const action = confirmation?.action; setConfirmation(null); action?.(); }}>{confirmation?.exit ? "Sair sem salvar alterações" : "Confirmar alteração"}</button>{confirmation?.exit && <button type="button" className={buttonClass} onClick={() => { setConfirmation(null); void flow.save("PAUSE").then(saved => { if (saved) router.push("/"); }); }}>Salvar e sair</button>}<button type="button" className={buttonClass} onClick={() => setConfirmation(null)}>Continuar editando</button></div></div></Modal>
  </div>;
}
function ContextStep({ draft, issues, onChange }: { draft: Interview; issues: import("@/services/onboarding/model").Issue[]; onChange: (v: Interview) => void }) {
  const set = (key: string, v: Json | undefined) => { const context = { ...draft.context }; if (v === undefined) delete context[key]; else context[key] = v; onChange({ ...draft, context }); };
  return <div className="space-y-4"><p>Moeda: real brasileiro (BRL). Saldo inicial é uma posição, não uma receita. Não informe como saldo os movimentos que você vai registrar novamente.</p><Grid>
    <Field label="Data-base das aberturas" path="/context/baseDate" type="date" value={draft.context.baseDate} onChange={v => set("baseDate", v)} issues={issues} help="Data civil, sem horário. A sugestão usa o dia do navegador; se for amanhã em São Paulo, escolha conscientemente uma data aceita pelo servidor." />
    <Field label="Nome preferido (opcional)" path="/context/preferredName" value={draft.context.preferredName} onChange={v => set("preferredName", v)} issues={issues} maxLength={80} />
    <Field label="Objetivo inicial (opcional)" path="/context/objective" value={draft.context.objective} onChange={v => set("objective", v)} issues={issues} maxLength={200} />
  </Grid><Field label="Confirmo que os saldos não incluem movimentos que registrarei novamente" path="/context/boundaryAcknowledged" type="checkbox" value={draft.context.boundaryAcknowledged} onChange={v => set("boundaryAcknowledged", v)} issues={issues} />
    <Field label="Confirmo que o caixa da corretora não inclui o valor dos ativos aplicados" path="/context/cashOnlyAcknowledged" type="checkbox" value={draft.context.cashOnlyAcknowledged} onChange={v => set("cashOnlyAcknowledged", v)} issues={issues} />
    <p className="text-sm text-text-muted">Você pode salvar respostas parciais ou sair sem concluir. Não guardamos estas informações financeiras no armazenamento local do navegador.</p></div>;
}
function SectionStep({ name, draft, issues, choices, onChange, confirm }: { name: SectionName; draft: Interview; issues: import("@/services/onboarding/model").Issue[]; choices: import("@/services/onboarding/model").Choice[]; onChange: (v: Interview) => void; confirm: ConfirmChange }) {
  const section = draft.sections[name]; const path = `/sections/${name}`; const limits = { accounts: 50, cards: 20, investments: 50, goals: 100, allocations: 200, forecasts: 120 };
  const update = (next: typeof section) => onChange({ ...draft, sections: { ...draft.sections, [name]: next } });
  return <div className="min-w-0 space-y-5"><Field label={`Resposta para ${sectionLabels[name].toLowerCase()}`} path={path + "/answer"} value={section.answer} issues={issues} options={[{ value: "UNANSWERED", label: "Ainda não respondi" }, { value: "PROVIDED", label: "Quero informar itens" }, { value: "NONE", label: name === "allocations" ? "Nenhuma nova destinação; conservar reservas anteriores" : "Nenhum novo item a informar" }, ...(name === "accounts" ? [] : [{ value: "DEFERRED", label: "Deixar para depois, sem declarar zero" }])]} onChange={v => {
    if (v !== "UNANSWERED" && v !== "PROVIDED" && v !== "NONE" && v !== "DEFERRED") return;
    const apply = () => update({ answer: v, items: v === "NONE" || v === "DEFERRED" ? [] : section.items });
    if (section.items.length && (v === "NONE" || v === "DEFERRED")) confirm("Esta resposta remove os itens desta etapa. Referências nas reservas serão conservadas para correção. Continuar?", apply); else apply();
  }} />
  {name === "accounts" && <p className="text-sm text-text-muted">Sem novos itens, a carteira existente é preservada. Para acrescentar uma conta já usada no app, escolha um vínculo.</p>}
  {section.items.map((item, i) => <fieldset key={item.tempId} className="min-w-0 space-y-4 rounded-xl border border-border-divider bg-bg-surface p-4"><legend className="max-w-full break-words px-1 font-semibold">{sectionLabels[name]} — item {i + 1}</legend><ItemEditor name={name} item={item} path={`${path}/items/${i}`} draft={draft} choices={choices} issues={issues} confirm={confirm} onChange={next => update({ ...section, items: section.items.map(row => row.tempId === item.tempId ? next : row) })} /><button type="button" className={buttonClass} onClick={() => confirm("Remover este item do rascunho? Referências dependentes continuarão pendentes para correção.", () => update({ ...section, items: section.items.filter(row => row.tempId !== item.tempId) }))}>Remover item {i + 1}</button></fieldset>)}
  {(section.answer === "PROVIDED" || section.answer === "UNANSWERED") && <button type="button" className={buttonClass} disabled={section.items.length >= limits[name]} onClick={() => update({ answer: "PROVIDED", items: [...section.items, newItem(name)] })}>Adicionar {sectionLabels[name].toLowerCase()}</button>}
  </div>;
}
