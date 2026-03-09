import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Modal } from "../ui/modal";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: string;
  cancelColor?: string;
  isLoading?: boolean;
  hideCancel?: boolean;
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Tem certeza?",
  message = "Essa ação não poderá ser desfeita.",
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  confirmColor = "bg-emerald-600 hover:bg-emerald-700 text-white",
  cancelColor = "bg-bg-surface-hover text-text-muted hover:bg-bg-button-hover",
  isLoading = false,
  hideCancel = false,
}: ConfirmationModalProps) {
  const [internalLoading, setInternalLoading] = useState(false);

  const handleConfirmClick = async () => {
    setInternalLoading(true);
    try {
      await onConfirm();
    } finally {
      setInternalLoading(false);
    }
  };

  const isButtonDisabled = isLoading || internalLoading;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="flex flex-col gap-2">
        <p className="text-text-modal text-sm">{message}</p>

        <div className="flex justify-end gap-4 mt-4">
          {!hideCancel && (
            <button
              onClick={onClose}
              disabled={isButtonDisabled}
              className={`w-1/3 py-2 rounded-md transition duration-200 font-medium cursor-pointer ${cancelColor} ${isButtonDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={handleConfirmClick}
            disabled={isButtonDisabled}
            className={`py-2 rounded-md transition duration-200 font-medium cursor-pointer ${confirmColor} ${hideCancel ? "w-full" : "w-1/3"} ${
              isButtonDisabled ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {isButtonDisabled ? (
              <Loader2 className="w-5 h-5 animate-spin mx-auto" />
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
