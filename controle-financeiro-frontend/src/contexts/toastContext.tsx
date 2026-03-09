"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  useMemo,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextData {
  toast: {
    success: (msg: string) => void;
    error: (msg: string) => void;
    info: (msg: string) => void;
  };
}

const ToastContext = createContext<ToastContextData | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto-remover após 4 segundos
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const toastHelpers = useMemo(
    () => ({
      success: (msg: string) => addToast(msg, "success"),
      error: (msg: string) => addToast(msg, "error"),
      info: (msg: string) => addToast(msg, "info"),
    }),
    [addToast],
  );

  return (
    <ToastContext.Provider value={{ toast: toastHelpers }}>
      {children}

      {/* Toast Container*/}
      <div className="fixed top-6 right-1/2 translate-x-1/2 md:translate-x-0 md:right-6 z-9999 flex flex-col gap-3 w-[90%] max-w-sm pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-2xl backdrop-blur-md ${
                t.type === "success"
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
                  : t.type === "error"
                    ? "bg-rose-500/10 border-rose-500/30 text-rose-500"
                    : "bg-blue-500/10 border-blue-500/30 text-blue-500"
              }`}
            >
              {t.type === "success" && (
                <CheckCircle2 className="shrink-0 mt-0.5" size={20} />
              )}
              {t.type === "error" && (
                <AlertCircle className="shrink-0 mt-0.5" size={20} />
              )}
              {t.type === "info" && (
                <Info className="shrink-0 mt-0.5" size={20} />
              )}

              <p className="text-sm font-medium flex-1 text-text-main">
                {t.message}
              </p>

              <button
                onClick={() =>
                  setToasts((prev) => prev.filter((item) => item.id !== t.id))
                }
                className="text-text-muted hover:text-text-main transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context)
    throw new Error("useToast deve ser usado dentro de ToastProvider");
  return context.toast;
};
