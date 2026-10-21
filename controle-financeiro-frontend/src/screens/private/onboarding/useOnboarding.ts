"use client";
import { useLayoutEffect, useMemo, useSyncExternalStore } from "react";
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
  return { flow, state };
}
