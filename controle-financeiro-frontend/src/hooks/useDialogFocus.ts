import { useEffect, useRef } from "react";

const dialogs: HTMLElement[] = [];
let previousOverflow = "";
const selector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function useDialogFocus<T extends HTMLElement = HTMLDivElement>(isOpen: boolean, onClose: () => void) {
  const dialogRef = useRef<T>(null);
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; }, [onClose]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!isOpen || !dialog) return;
    const previous = document.activeElement as HTMLElement | null;
    if (dialogs.length === 0) {
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }
    dialogs.push(dialog);
    const focusable = () => Array.from(dialog.querySelectorAll<HTMLElement>(selector))
      .filter(element => !element.closest('[hidden], [inert], [aria-hidden="true"]') && getComputedStyle(element).display !== "none" && getComputedStyle(element).visibility !== "hidden");
    (dialog.querySelector<HTMLElement>('[data-dialog-close]') ?? focusable()[0] ?? dialog).focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (dialogs.at(-1) !== dialog || event.defaultPrevented) return;
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopImmediatePropagation();
        closeRef.current();
      } else if (event.key === "Tab") {
        const elements = focusable();
        const first = elements[0];
        const last = elements.at(-1);
        const active = document.activeElement;
        if (!first) { event.preventDefault(); dialog.focus(); }
        else if (event.shiftKey && (active === first || active === dialog || !dialog.contains(active))) {
          event.preventDefault(); last?.focus();
        } else if (!event.shiftKey && (active === last || !dialog.contains(active))) {
          event.preventDefault(); first.focus();
        }
      }
    };
    const containFocus = (event: FocusEvent) => {
      if (dialogs.at(-1) === dialog && !dialog.contains(event.target as Node)) (focusable()[0] ?? dialog).focus();
    };
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("focusin", containFocus);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("focusin", containFocus);
      const wasTop = dialogs.at(-1) === dialog;
      const index = dialogs.indexOf(dialog);
      if (index >= 0) dialogs.splice(index, 1);
      if (dialogs.length === 0) document.body.style.overflow = previousOverflow;
      if (wasTop) {
        if (previous?.isConnected && !previous.matches(":disabled")) previous.focus();
        else {
          const parent = dialogs.at(-1);
          (parent?.querySelector<HTMLElement>('[data-dialog-close]') ?? parent)?.focus();
        }
      }
    };
  }, [isOpen]);
  return dialogRef;
}
