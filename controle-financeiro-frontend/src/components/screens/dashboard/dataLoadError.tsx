import { AlertCircle, RefreshCw } from "lucide-react";

interface DataLoadErrorProps {
  onRetry: () => Promise<void> | void;
  isRetrying?: boolean;
}

export function DataLoadError({ onRetry, isRetrying = false }: DataLoadErrorProps) {
  return (
    <div className="flex min-h-75 flex-col items-center justify-center px-6 text-center">
      <AlertCircle className="mb-4 h-9 w-9 text-rose-500" aria-hidden="true" />
      <h2 className="text-lg font-bold text-text-main">Não foi possível carregar os dados.</h2>
      <p className="mt-1 max-w-sm text-sm text-text-muted">
        Seus dados não foram alterados. Tente novamente para atualizar esta tela.
      </p>
      <button
        type="button"
        onClick={() => void onRetry()}
        disabled={isRetrying}
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <RefreshCw className={`h-4 w-4 ${isRetrying ? "animate-spin" : ""}`} aria-hidden="true" />
        Tentar novamente
      </button>
    </div>
  );
}
