"use client";
import { useEffect, useLayoutEffect, useMemo, useSyncExternalStore } from "react";
import { notifyOnboardingCompleted } from "@/contexts/financeContext";
import { subscribeToSessionChange } from "@/actions/sessionBoundary";
import { createOnboardingFlow } from "@/services/onboarding/flow";

export function useOnboarding(owner: string) {
  const flow = useMemo(() => createOnboardingFlow(undefined, owner), [owner]);
  const state = useSyncExternalStore(flow.subscribe, flow.snapshot, flow.snapshot);
  useLayoutEffect(() => {
    flow.activate(); void flow.load();
    const invalidate = () => flow.invalidate();
    const unsubscribe = subscribeToSessionChange(invalidate);
    window.addEventListener("sessionExpired", invalidate);
    return () => { unsubscribe(); window.removeEventListener("sessionExpired", invalidate); flow.invalidate(); };
  }, [flow]);
  const operationId = state.receipt?.operationId;
  useEffect(() => {
    if (operationId) notifyOnboardingCompleted(owner, operationId);
  }, [owner, operationId]);

  return { flow, state };
}
