"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useId } from "react";
import { createPortal } from "react-dom";
import { useDialogFocus } from "@/hooks/useDialogFocus";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const dialogRef = useDialogFocus(isOpen, onClose);
  const titleId = useId();

  return typeof document === "undefined" ? null : createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-xs"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            aria-label={title ? undefined : "Diálogo"}
            tabIndex={-1}
            className="relative flex max-h-[calc(100dvh-2rem)] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-bg-surface shadow-lg"
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <div className="flex shrink-0 items-start justify-between gap-4 px-4 pb-3 pt-4 sm:px-6 sm:pt-6">
              {title && (
                <h2 id={titleId} className="min-w-0 pr-2 text-xl font-bold text-text-main sm:text-2xl [overflow-wrap:anywhere]">
                  {title}
                </h2>
              )}
              <button
                data-dialog-close
                type="button"
                onClick={onClose}
                className="shrink-0 rounded-md p-1 text-text-main transition hover:bg-bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
                aria-label="Fechar modal"
              >
                <X className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>

            <div className="min-h-0 overflow-y-auto px-4 pb-4 sm:px-6 sm:pb-6">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>, document.body
  );
}
