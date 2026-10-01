"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import { useUser } from "./useUser";
import { subscribeToSessionChange } from "@/actions/sessionBoundary";
import { ApiError } from "@/services/api";
import { CreationCommand, CreationKind, parseSavedCreation, recoverCreation, SavedCreation } from "@/services/creationIntent";

type State = { pending: SavedCreation | null; busy: boolean; message: string; blocked: boolean };
const empty: State = { pending: null, busy: false, message: "", blocked: true };
const uncertain = "Não foi possível confirmar a operação. Consulte o recibo ou repita somente a mesma intenção.";

function creationStore(ownerId: string | undefined, kind: CreationKind) {
  const key = `cf-creation:v1:${ownerId}:${kind}`;
  let active = true;
  let state: State = { ...empty, blocked: !ownerId };
  const listeners = new Set<() => void>();
  const update = (patch: Partial<State>) => { state = { ...state, ...patch }; listeners.forEach(listener => listener()); };
  if (ownerId && typeof window !== "undefined") {
    try {
      const raw = sessionStorage.getItem(key);
      if (raw) state = { ...state, pending: parseSavedCreation(raw, ownerId, kind), message: uncertain };
    } catch { state = { ...state, blocked: true, message: "Não foi possível ler a intenção salva. Confira o histórico antes de uma nova operação." }; }
  }
  const complete = () => {
    if (!active) return false;
    // A failure to remove storage keeps the same intention recoverable; never unlock an unpersisted replacement.
    sessionStorage.removeItem(key);
    update({ pending: null, message: "", blocked: false });
    return true;
  };
  const run = async (work: () => Promise<boolean>) => {
    if (!active || !ownerId || state.busy || state.blocked) return false;
    update({ busy: true });
    try { return await work(); }
    catch (error) {
      if (active) update({ message: error instanceof ApiError && error.status === 404 ? "Recibo ainda não localizado. A operação pode estar em andamento; repita apenas a mesma intenção." : error instanceof Error ? `${state.pending ? `${uncertain} ` : ""}${error.message}` : uncertain });
      return false;
    } finally { if (active) update({ busy: false }); }
  };
  return {
    snapshot: () => state,
    subscribe: (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; },
    activate: () => { active = true; },
    invalidate: () => { active = false; },
    start: (command: CreationCommand, send: (command: CreationCommand) => Promise<unknown>, label?: string) => run(async () => {
      if (state.pending) return false;
      const saved: SavedCreation = { version: 1, ownerId: ownerId!, kind, label, command: { ...command, operationId: crypto.randomUUID() } };
      // Persist before any financial HTTP request. Serialization also freezes the exact JSON body.
      const raw = JSON.stringify(saved);
      sessionStorage.setItem(key, raw);
      const frozen = parseSavedCreation(raw, ownerId!, kind);
      update({ pending: frozen, message: uncertain });
      try { await send(frozen.command); }
      catch (error) {
        // Only a first, definitive rejection permits editing into a new intention.
        if (active && error instanceof ApiError && [400, 403, 422].includes(error.status) && !error.requiresReconciliation) complete();
        throw error;
      }
      return complete();
    }),
    recover: () => run(async () => { if (!state.pending) return false; await recoverCreation(state.pending); return complete(); }),
    retry: (send: (command: CreationCommand) => Promise<unknown>) => run(async () => {
      if (!state.pending) return false;
      await send(state.pending.command);
      return complete();
    }),
  };
}

/** A small shared lifecycle prevents the two CF-024 consumers from diverging on unknown outcomes. */
export function useCreationIntent(kind: CreationKind) {
  const { user } = useUser();
  const store = useMemo(() => creationStore(user?.id, kind), [user?.id, kind]);
  const state = useSyncExternalStore(store.subscribe, store.snapshot, () => empty);
  useEffect(() => {
    store.activate();
    const invalidate = () => store.invalidate();
    window.addEventListener("sessionExpired", invalidate);
    const unsubscribe = subscribeToSessionChange(invalidate);
    return () => { store.invalidate(); unsubscribe(); window.removeEventListener("sessionExpired", invalidate); };
  }, [store]);
  return { ...state, start: store.start, recover: store.recover, retry: store.retry };
}
