"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

import { ConfirmDialog } from "./confirm-dialog";

type FormSurfaceMode = "modal" | "drawer";

type FormSurfaceFooterControls = {
  requestClose: () => void;
};

type FormSurfaceProps = {
  open: boolean;
  title: string;
  description?: string;
  mode?: FormSurfaceMode;
  isDirty?: boolean;
  widthClassName?: string;
  children: ReactNode;
  footer?: ReactNode | ((controls: FormSurfaceFooterControls) => ReactNode);
  onClose: () => void;
};

const TRANSITION_MS = 240;

export function FormSurface({
  open,
  title,
  description,
  mode = "modal",
  isDirty = false,
  widthClassName,
  children,
  footer,
  onClose,
}: FormSurfaceProps) {
  const [shouldRender, setShouldRender] = useState(open);
  const [isActive, setIsActive] = useState(open);
  const [showDirtyConfirm, setShowDirtyConfirm] = useState(false);
  const closeTimerRef = useRef<number | null>(null);
  const shouldConfirmBeforeClose = isDirty;

  useEffect(() => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    if (open) {
      setShouldRender(true);
      setIsActive(false);
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          setIsActive(true);
        });
      });
      return;
    }

    setIsActive(false);
    closeTimerRef.current = window.setTimeout(() => {
      setShouldRender(false);
    }, TRANSITION_MS);
  }, [open]);

  useEffect(() => {
    if (!shouldRender) {
      setShowDirtyConfirm(false);
    }
  }, [shouldRender]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  const requestClose = () => {
    if (showDirtyConfirm) {
      return;
    }

    if (shouldConfirmBeforeClose) {
      setShowDirtyConfirm(true);
      return;
    }

    setIsActive(false);
    closeTimerRef.current = window.setTimeout(() => {
      onClose();
    }, TRANSITION_MS);
  };

  if (!shouldRender) {
    return null;
  }

  const panelBaseClass =
    mode === "drawer"
      ? "h-screen w-full max-w-lg border-l border-slate-200"
      : "w-full max-w-xl rounded-xl border border-slate-200";

  const panelPositionClass =
    mode === "drawer"
      ? "flex h-screen w-full items-stretch justify-end overflow-hidden pointer-events-none"
      : "flex min-h-full items-center justify-center p-4";

  const panelAnimationClass =
    mode === "drawer"
      ? isActive
        ? "translate-x-0"
        : "translate-x-full"
      : isActive
        ? "translate-y-0 scale-100 opacity-100"
        : "translate-y-2 scale-[0.985] opacity-0";

  const footerContent = typeof footer === "function" ? footer({ requestClose }) : footer;

  return (
    <div
      className="fixed inset-0 z-[80]"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button
        type="button"
        aria-label="Close form"
        onClick={requestClose}
        className={`absolute inset-0 bg-slate-900/50 transition-opacity duration-200 ${isActive ? "opacity-100" : "opacity-0"}`}
      />

      <div className={`absolute inset-0 ${panelPositionClass}`}>
        <section
          onClick={(event) => event.stopPropagation()}
          className={`${panelBaseClass} ${widthClassName ?? ""} ${panelAnimationClass} pointer-events-auto bg-white shadow-2xl transition-all duration-200 ease-out flex h-full min-h-0 flex-col justify-between`}
        >
          <header className="border-b border-slate-200 px-5 py-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {title}
                </h2>
                {description ? (
                  <p className="mt-1 text-sm text-slate-500">{description}</p>
                ) : null}
              </div>

              <button
                type="button"
                onClick={requestClose}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-100"
                aria-label="Close"
              >
                <span aria-hidden="true">x</span>
              </button>
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            {children}
          </div>

          {footerContent ? (
            <footer className="shrink-0 border-t border-slate-200 bg-white px-5 py-4 pointer-events-auto">
              {footerContent}
            </footer>
          ) : null}
        </section>
      </div>

      <ConfirmDialog
        open={showDirtyConfirm}
        title="Discard unsaved changes?"
        description="You have unsaved changes in this form. If you close now, your edits will be lost."
        onCancel={() => setShowDirtyConfirm(false)}
        onConfirm={() => {
          setShowDirtyConfirm(false);
          onClose();
        }}
      />
    </div>
  );
}

export type { FormSurfaceProps, FormSurfaceMode, FormSurfaceFooterControls };
