import { ApiError } from "../api";
import { check, interviewRule, normalizeInterview } from "./input";
import { canonicalString } from "./result";
import { emptyInterview, type Choice, type Interview, type Issue, type Prepared, type Receipt, type Session, type Step, type Summary } from "./model";
import { onboardingClient, type DraftAction, type OnboardingClient, type PrepareCommand } from "./client";

export type FlowState = {
  session: Session | null; draft: Interview | null; choices: Choice[]; choicesError: string;
  busy: boolean; loading: boolean; blocked: boolean; dirty: boolean; message: string; issues: Issue[];
  remote: Session | null; prepared: Prepared | null; receipt: Receipt | null;
  unknown: boolean; saveUnknown: boolean; prepareAttempt: PrepareCommand | null;
  reviewForEditing: Summary | null;
};
const initial = (): FlowState => ({ session: null, draft: null, choices: [], choicesError: "", busy: false, loading: true, blocked: false, dirty: false, message: "", issues: [], remote: null, prepared: null, receipt: null, unknown: false, saveUnknown: false, prepareAttempt: null, reviewForEditing: null });
const messages: Record<string, string> = {
  VERSION_CONFLICT: "Outra aba salvou respostas diferentes. Consulte e compare o rascunho; suas alterações continuam nesta tela.",
  SOURCE_CHANGED: "Os dados vinculados mudaram. Consulte o resultado antes de cancelar esta revisão e preparar outra.",
  DEFAULT_NOT_PRISTINE: "Esta carteira já foi usada ou não é a carteira automática. Use o vínculo existente, sem reinicializar seu saldo.",
  INTENT_PENDING: "Existe uma revisão pendente no servidor. Consulte para retomá-la.",
  ALREADY_COMPLETED: "A entrevista já pode ter sido concluída. Consulte o resultado no servidor.",
};
function errorMessage(e: unknown) { return e instanceof ApiError ? messages[e.code ?? ""] ?? (e.status === 401 ? "Sua sessão expirou. Entre novamente com o mesmo usuário para recuperar o rascunho e o resultado." : e.status >= 500 || e.status === 0 ? "Não foi possível confirmar a resposta do servidor. Suas alterações continuam nesta tela; consulte antes de repetir." : e.message) : e instanceof Error ? e.message : "Não foi possível continuar. Consulte o servidor."; }
const uncertain = (e: unknown) => !(e instanceof ApiError) || e.requiresReconciliation || e.status === 0 || e.status >= 500;

/** Per mounted owner: serialized mutations, immutable operation identity and generation-guarded completion.
 * No financial browser storage. Aborting HTTP is only cleanup, never server rollback. */
export function createOnboardingFlow(client: OnboardingClient = onboardingClient, ownerScope = "") {
  let state = initial(), active = true, generation = 0;
  let controller: AbortController | null = null;
  let attemptedSave: { payload: Interview; version: string; sessionId: string | null; status: Session["status"] } | null = null;
  let prepareSession: Session | null = null;
  const listeners = new Set<() => void>();
  const update = (patch: Partial<FlowState>) => { state = { ...state, ...patch }; listeners.forEach(l => l()); };
  const adopt = (s: Session) => update({ session: s, draft: s.payload ?? emptyInterview(), issues: s.issues, prepared: s.pendingIntent, receipt: s.completedReceipt, dirty: false, remote: null, unknown: s.pendingIntent !== null, saveUnknown: false, prepareAttempt: null });
  const run = async (work: (signal: AbortSignal, current: () => boolean) => Promise<void>) => {
    if (!active || state.busy || state.blocked) return false;
    const started = generation; controller = new AbortController(); const signal = controller.signal;
    const current = () => active && generation === started && !signal.aborted;
    update({ busy: true, message: "" });
    try { await work(signal, current); return current(); }
    catch (e) { if (current()) update({ message: errorMessage(e), issues: e instanceof ApiError ? Object.entries(e.fields).flatMap(([path, values]) => values.map(message => ({ path, code: "SERVER", message }))) : state.issues }); return false; }
    finally { if (current()) update({ busy: false, loading: false }); }
  };
  const saveInside = async (action: DraftAction, draft: Interview, signal: AbortSignal, current: () => boolean, expected = state.session) => {
    if (!expected) throw new Error("Consulte a entrevista antes de salvar.");
    const issues = action === "DISCARD" ? [] : check(interviewRule, draft);
    if (issues.length) { update({ issues }); throw new Error("Revise os campos destacados. Nenhum valor foi arredondado ou substituído."); }
    const payload = action === "DISCARD" ? draft : normalizeInterview(draft);
    attemptedSave = { payload, version: (BigInt(expected.version) + BigInt(1)).toString(), sessionId: expected.sessionId, status: action === "PAUSE" || action === "DISCARD" || action === "SAVE" && expected.status === "SKIPPED" && expected.payload !== null ? "SKIPPED" : "IN_PROGRESS" };
    try { const s = await client.save(expected, action, payload, signal); if (current()) { adopt(s); attemptedSave = null; } return s; }
    catch (e) { if (current()) update({ saveUnknown: uncertain(e), remote: null }); throw e; }
  };
  const locked = () => !!state.prepared || state.unknown || state.saveUnknown || !!state.prepareAttempt || !!state.receipt;
  return {
    ownerScope,
    snapshot: () => state,
    subscribe: (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; },
    activate: () => { active = true; if (state.blocked) update(initial()); },
    invalidate: () => { active = false; generation++; controller?.abort(); attemptedSave = null; prepareSession = null; state = { ...initial(), loading: false, blocked: true }; listeners.forEach(l => l()); },
    load: () => run(async (signal, current) => {
      const results = await Promise.allSettled([client.get(signal), client.choices(signal)]);
      if (!current()) return;
      if (results[1].status === "fulfilled") update({ choices: results[1].value, choicesError: "" });
      else update({ choicesError: "Cadastros existentes indisponíveis. Tente carregar novamente antes de selecionar vínculos." });
      if (results[0].status === "rejected") throw results[0].reason;
      adopt(results[0].value); if (results[0].value.pendingIntent) update({ reviewForEditing: results[0].value.pendingIntent.summary });
    }),
    reloadChoices: () => run(async (signal, current) => { const choices = await client.choices(signal); if (current()) update({ choices, choicesError: "" }); }),
    edit: (draft: Interview) => { if (active && !state.busy && !state.blocked && !locked()) update({ draft, dirty: true, issues: [] }); },
    go: (step: Step) => { if (state.draft && active && !state.busy && !locked()) update({ draft: { ...state.draft, currentStep: step }, dirty: true }); },
    save: (action: DraftAction = "SAVE", next?: Step) => run(async (signal, current) => {
      if (!state.draft || locked()) return;
      await saveInside(action, { ...state.draft, currentStep: next ?? state.draft.currentStep }, signal, current);
      if (current()) update({ message: action === "DISCARD" ? "Respostas descartadas no servidor. Nenhum saldo foi alterado." : "Rascunho salvo. O diagnóstico corresponde a este salvamento, sem revalidar a situação financeira atual." });
    }),
    prepare: () => run(async (signal, current) => {
      if (!state.draft || locked() || !state.session || state.session.status === "SKIPPED") return;
      const saved = await saveInside("SAVE", { ...state.draft, currentStep: "REVIEW" }, signal, current);
      if (!current()) return;
      if (saved.issues.length || !saved.sessionId) { update({ message: "Corrija as pendências do rascunho antes de preparar a revisão." }); return; }
      const command: PrepareCommand = { contractVersion: 1, sessionId: saved.sessionId, expectedVersion: saved.version, operationId: crypto.randomUUID() };
      prepareSession = saved; update({ prepareAttempt: command });
      try { const prepared = await client.prepare(command, saved, signal); if (current()) update({ prepared, unknown: false, prepareAttempt: null, reviewForEditing: prepared.summary }); }
      catch (e) { if (current() && e instanceof ApiError && [400, 403, 404, 413].includes(e.status)) update({ prepareAttempt: null }); throw e; }
    }),
    retryPrepare: () => run(async (signal, current) => {
      const command = state.prepareAttempt; if (!command || !prepareSession) return;
      try { const prepared = await client.prepare(command, prepareSession, signal); if (current()) update({ prepared, unknown: false, prepareAttempt: null, reviewForEditing: prepared.summary }); }
      catch (e) { if (current() && e instanceof ApiError && ["VERSION_CONFLICT", "INTENT_CANCELLED"].includes(e.code ?? "")) update({ prepareAttempt: null }); throw e; }
    }),
    confirm: () => run(async (signal, current) => {
      if (!state.prepared || state.receipt) return;
      const p = state.prepared;
      // Before sending, retain the same frozen review even if transport or parsing fails.
      update({ unknown: true }); const receipt = await client.complete(p, signal);
      if (current()) update({ receipt, prepared: null, unknown: false, dirty: false, message: "Entrevista concluída. As posições foram registradas uma única vez." });
    }),
    recover: () => run(async (signal, current) => {
      const p = state.prepared;
      if (p) {
        try {
          const operation = await client.recover(p, signal); if (!current()) return;
          if (operation.state === "COMPLETED" && operation.receipt) { update({ receipt: operation.receipt, prepared: null, unknown: false, message: "Conclusão confirmada pelo recibo do servidor." }); return; }
          if (operation.state === "PREPARED") { update({ unknown: true, message: "Revisão ainda pendente. Isso não prova que uma confirmação anterior falhou. Você pode consultar ou repetir a mesma confirmação." }); return; }
        } catch (e) { if (!(e instanceof ApiError) || e.status !== 404) throw e; }
      }
      const s = await client.get(signal); if (!current()) return;
      if (s.pendingIntent || s.completedReceipt) { adopt(s); if (s.pendingIntent) update({ reviewForEditing: s.pendingIntent.summary }); return; }
      if (state.prepareAttempt) { update({ session: s, message: "A preparação ainda não foi localizada. Repita somente a mesma preparação ou consulte novamente." }); return; }
      if (state.saveUnknown && attemptedSave && s.version === attemptedSave.version && s.status === attemptedSave.status && (attemptedSave.sessionId === null || s.sessionId === attemptedSave.sessionId) && canonicalString(s.payload) === canonicalString(attemptedSave.payload)) { adopt(s); attemptedSave = null; update({ message: "Salvamento confirmado pela releitura do servidor." }); return; }
      // A fresh GET is a comparison, never last-write-wins over a local edit.
      if (state.dirty || state.saveUnknown || state.prepared) update({ remote: s, saveUnknown: false, unknown: false, prepared: null, message: "Compare as respostas antes de escolher qual rascunho manter." });
      else adopt(s);
    }),
    useRemote: () => { if (active && !state.busy && state.remote) adopt(state.remote); },
    saveLocalOverCompared: () => run(async (signal, current) => {
      if (state.remote && state.draft && !state.remote.pendingIntent && !state.remote.completedReceipt) await saveInside("SAVE", state.draft, signal, current, state.remote);
    }),
    cancel: () => run(async (signal, current) => {
      if (!state.prepared || state.receipt) return;
      const p = state.prepared;
      const operation = await client.cancel(p, signal); if (!current()) return;
      if (operation.state === "COMPLETED" && operation.receipt) { update({ receipt: operation.receipt, prepared: null, unknown: false }); return; }
      if (operation.state !== "CANCELLED") throw new Error("Cancelamento ainda não confirmado. Consulte o resultado.");
      const s = await client.get(signal); if (current()) { adopt(s); update({ reviewForEditing: p.summary, message: "Revisão cancelada. Você pode corrigir respostas; os valores anteriores são apenas referência da captura cancelada." }); }
    }),
  };
}
export type OnboardingFlow = ReturnType<typeof createOnboardingFlow>;
