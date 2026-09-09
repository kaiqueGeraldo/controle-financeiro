import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { useToast } from "@/contexts/toastContext";

interface OptimisticMutationOptions<TContext, TVariables, TResponse> {
  mutationFn: (variables: TVariables) => Promise<TResponse>;
  onMutate: (variables: TVariables) => TContext;
  onError: (
    error: unknown,
    variables: TVariables,
    context: TContext,
  ) => void | Promise<void>;
  onSuccess?: (
    data: TResponse,
    variables: TVariables,
    context: TContext,
  ) => void | Promise<void>;
  getMutationKey?: (variables: TVariables) => string;
  scopeKey?: string | null;
}

interface ActiveMutation<TResponse> {
  token: symbol;
  promise: Promise<TResponse>;
}

export function useOptimisticMutation<
  TContext,
  TVariables,
  TResponse = unknown,
>(
  options: OptimisticMutationOptions<TContext, TVariables, TResponse>,
) {
  const toast = useToast();
  const [pendingCount, setPendingCount] = useState(0);
  const activeKeysRef = useRef(new Map<string, ActiveMutation<TResponse>>());
  const optionsRef = useRef(options);
  const scopeRef = useRef(options.scopeKey ?? null);
  const generationRef = useRef(0);

  optionsRef.current = options;

  useLayoutEffect(() => {
    scopeRef.current = options.scopeKey ?? null;
    generationRef.current += 1;
    activeKeysRef.current.clear();
    setPendingCount(0);
    return () => {
      generationRef.current += 1;
      activeKeysRef.current.clear();
    };
  }, [options.scopeKey]);

  const mutate = useCallback(
    (variables: TVariables): Promise<TResponse> => {
      const currentOptions = optionsRef.current;
      const mutationKey =
        currentOptions.getMutationKey?.(variables) ?? "default";
      const activeMutation = activeKeysRef.current.get(mutationKey);

      // A ref closes the same-tick gap left by React state. Reusing the
      // in-flight promise avoids both a second HTTP call and false success.
      if (activeMutation) return activeMutation.promise;

      const token = Symbol(mutationKey);
      const mutationScope = scopeRef.current;
      const mutationGeneration = generationRef.current;
      const isCurrent = () => scopeRef.current === mutationScope &&
        generationRef.current === mutationGeneration;
      let resolveMutation!: (response: TResponse) => void;
      let rejectMutation!: (error: unknown) => void;
      const promise = new Promise<TResponse>((resolve, reject) => {
        resolveMutation = resolve;
        rejectMutation = reject;
      });

      activeKeysRef.current.set(mutationKey, { token, promise });
      setPendingCount(activeKeysRef.current.size);

      void (async () => {
        let context: TContext | undefined;

        try {
          context = currentOptions.onMutate(variables);
        } catch (error: unknown) {
          rejectMutation(error);
          releaseMutation(activeKeysRef.current, mutationKey, token, setPendingCount);
          return;
        }

        let response: TResponse;
        try {
          response = await currentOptions.mutationFn(variables);
        } catch (error: unknown) {
          if (isCurrent()) {
            if (!isAbortError(error)) {
              toast.error(errorMessage(error));
            }

            try {
              await optionsRef.current.onError(error, variables, context);
            } catch (reconciliationError: unknown) {
              console.error(
                "Erro ao reconciliar mutação otimista",
                reconciliationError,
              );
            }
          }

          rejectMutation(error);
          releaseMutation(activeKeysRef.current, mutationKey, token, setPendingCount);
          return;
        }

        try {
          if (isCurrent()) {
            await optionsRef.current.onSuccess?.(response, variables, context);
          }

          resolveMutation(response);
        } catch (error: unknown) {
          rejectMutation(error);
        } finally {
          releaseMutation(activeKeysRef.current, mutationKey, token, setPendingCount);
        }
      })();

      return promise;
    },
    [toast],
  );

  return {
    mutate,
    isPending: pendingCount > 0,
    isPendingFor: (key: string) => activeKeysRef.current.has(key),
  };
}

function releaseMutation<TResponse>(
  activeMutations: Map<string, ActiveMutation<TResponse>>,
  mutationKey: string,
  token: symbol,
  setPendingCount: (count: number) => void,
) {
  if (activeMutations.get(mutationKey)?.token === token) {
    activeMutations.delete(mutationKey);
    setPendingCount(activeMutations.size);
  }
}

function isAbortError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    error.name === "AbortError"
  );
}

function errorMessage(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }
  return "Ação falhou. As alterações foram desfeitas.";
}
