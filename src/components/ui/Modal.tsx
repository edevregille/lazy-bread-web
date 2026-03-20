"use client";

import React, { useEffect, useId, useRef } from "react";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) => !el.hasAttribute("disabled") && el.offsetParent !== null
  );
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  /** Used when `title` is omitted (screen reader dialog name). */
  ariaLabel?: string;
  /** Appended to the dialog panel (e.g. `max-w-md w-full` for narrow forms). */
  panelClassName?: string;
  /** Root stacking (default z-50). Use z-[9999] when opening over other modals. */
  stackClassName?: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  ariaLabel,
  panelClassName = "",
  stackClassName = "z-50",
  children,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const reactId = useId();
  const titleId = title ? `modal-title-${reactId.replace(/:/g, "")}` : undefined;
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    previouslyFocusedRef.current = document.activeElement as HTMLElement;

    const panel = panelRef.current;
    if (!panel) return;

    const focusFirst = () => {
      const list = getFocusableElements(panel);
      if (list.length > 0) {
        list[0].focus();
      } else {
        panel.focus();
      }
    };

    const t = window.setTimeout(focusFirst, 0);

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !panel) return;
      const list = getFocusableElements(panel);
      if (list.length === 0) {
        e.preventDefault();
        panel.focus();
        return;
      }
      const first = list[0];
      const last = list[list.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.addEventListener("keydown", handleTab);
    document.body.style.overflow = "hidden";

    return () => {
      window.clearTimeout(t);
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("keydown", handleTab);
      document.body.style.overflow = "unset";
      previouslyFocusedRef.current?.focus?.();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const labelledBy = title ? titleId : undefined;
  const label = !title ? ariaLabel ?? "Dialog" : undefined;

  return (
    <div className={`fixed inset-0 flex items-center justify-center p-4 ${stackClassName}`}>
      <div
        role="presentation"
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-label={label}
        tabIndex={-1}
        className={`relative z-10 bg-white rounded-lg shadow-xl w-[95vw] max-w-none max-h-[90vh] overflow-y-auto outline-none ${panelClassName}`.trim()}
      >
        {title && (
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 id={titleId} className="text-xl font-semibold text-gray-900 font-body">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-600 hover:text-gray-800 transition-colors p-1 rounded focus:outline-none focus:ring-2 focus:ring-bakery-primary focus:ring-offset-2"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};
