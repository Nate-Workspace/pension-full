"use client";

import type { ReactNode } from "react";

type FormSurfaceMode = "modal" | "drawer";

type FormSurfaceProps = {
  open: boolean;
  title: string;
  description?: string;
  mode?: FormSurfaceMode;
  widthClassName?: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
};

export function FormSurface({
  open,
  title,
  description,
  mode = "modal",
  widthClassName,
  children,
  footer,
  onClose,
}: FormSurfaceProps) {
  if (!open) {
    return null;
  }

  const panelBaseClass =
    mode === "drawer"
      ? "h-full w-full max-w-md border-l border-slate-200"
      : "w-full max-w-xl rounded-xl border border-slate-200";

  const panelPositionClass =
    mode === "drawer"
      ? "flex h-full w-full items-stretch justify-end"
      : "flex min-h-full items-center justify-center p-4";

  return (
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button
        type="button"
        aria-label="Close form"
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/50"
      />

      <div className={`relative ${panelPositionClass}`}>
        <section
          className={`${panelBaseClass} ${widthClassName ?? ""} bg-white shadow-xl flex flex-col itmes-start justify-between`}
        >
          <div>
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
                  onClick={onClose}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-100"
                  aria-label="Close"
                >
                  <span aria-hidden="true">x</span>
                </button>
              </div>
            </header>

            <div className="max-h-[70vh] overflow-y-auto px-5 py-4">
              {children}
            </div>
          </div>

          {footer ? (
            <footer className="border-t border-slate-200 px-5 py-4">
              {footer}
            </footer>
          ) : null}
        </section>
      </div>
    </div>
  );
}

export type { FormSurfaceProps, FormSurfaceMode };
