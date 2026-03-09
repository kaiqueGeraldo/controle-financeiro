import { useState } from "react";
import { useToast } from "@/contexts/toastContext";

interface OptimisticMutationOptions<TData, TVariables> {
  mutationFn: (variables: TVariables) => Promise<any>;
  onMutate: (variables: TVariables) => TData;
  onError: (error: any, variables: TVariables, context: TData) => void;
  onSuccess?: (data: any, variables: TVariables) => void;
}

export function useOptimisticMutation<TData, TVariables>(
  options: OptimisticMutationOptions<TData, TVariables>,
) {
  const toast = useToast();
  const [isPending, setIsPending] = useState(false);

  const mutate = async (variables: TVariables) => {
    if (isPending) return;

    const previousState = options.onMutate(variables);

    setIsPending(true);

    try {
      const response = await options.mutationFn(variables);

      if (options.onSuccess) {
        options.onSuccess(response, variables);
      }
    } catch (error: any) {
      toast.error(
        error.message || "Ação falhou. As alterações foram desfeitas.",
      );
      options.onError(error, variables, previousState);
      window.dispatchEvent(new Event("refreshFinance"));
    } finally {
      setIsPending(false);
    }
  };

  return { mutate, isPending };
}
