import { useCallback, useLayoutEffect, useMemo, useRef } from "react";

export interface CoordinatedRequest {
  signal: AbortSignal;
  isCurrent: () => boolean;
  finish: () => void;
}

export function isAbortError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    error.name === "AbortError"
  );
}

/**
 * Coordinates independent request lanes and invalidates every lane when the
 * authenticated owner changes. Abort is an optimization; the revision and
 * scope checks are the correctness boundary when a client ignores the signal.
 */
export function useRequestCoordinator(scopeKey: string | null | undefined) {
  const normalizedScope = scopeKey ?? null;
  const scopeRef = useRef<string | null>(normalizedScope);
  const revisionsRef = useRef(new Map<string, number>());
  const controllersRef = useRef(new Map<string, AbortController>());

  const invalidate = useCallback((lane?: string) => {
    if (lane) {
      const nextRevision = (revisionsRef.current.get(lane) ?? 0) + 1;
      revisionsRef.current.set(lane, nextRevision);
      controllersRef.current.get(lane)?.abort();
      controllersRef.current.delete(lane);
      return;
    }

    for (const activeLane of new Set([
      ...revisionsRef.current.keys(),
      ...controllersRef.current.keys(),
    ])) {
      const nextRevision = (revisionsRef.current.get(activeLane) ?? 0) + 1;
      revisionsRef.current.set(activeLane, nextRevision);
    }
    for (const controller of controllersRef.current.values()) {
      controller.abort();
    }
    controllersRef.current.clear();
  }, []);

  const begin = useCallback((lane: string): CoordinatedRequest => {
    controllersRef.current.get(lane)?.abort();

    const controller = new AbortController();
    const revision = (revisionsRef.current.get(lane) ?? 0) + 1;
    const requestScope = scopeRef.current;

    revisionsRef.current.set(lane, revision);
    controllersRef.current.set(lane, controller);

    const isCurrent = () =>
      !controller.signal.aborted &&
      scopeRef.current === requestScope &&
      revisionsRef.current.get(lane) === revision;

    return {
      signal: controller.signal,
      isCurrent,
      finish: () => {
        if (controllersRef.current.get(lane) === controller) {
          controllersRef.current.delete(lane);
        }
      },
    };
  }, []);

  useLayoutEffect(() => {
    scopeRef.current = normalizedScope;
    invalidate();
    return () => invalidate();
  }, [normalizedScope, invalidate]);

  return useMemo(() => ({ begin, invalidate }), [begin, invalidate]);
}
