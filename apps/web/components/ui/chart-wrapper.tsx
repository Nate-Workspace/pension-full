import type { ReactNode } from "react";

type ChartWrapperProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  legend?: ReactNode;
  children: ReactNode;
  isLoading?: boolean;
  minHeightClassName?: string;
  className?: string;
};

export function ChartWrapper({
  title,
  description,
  action,
  legend,
  children,
  isLoading = false,
  minHeightClassName = "min-h-[280px]",
  className,
}: ChartWrapperProps) {
  return (
    <section className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm ${className ?? ""}`}>
      <header className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
        </div>

        {action ? <div>{action}</div> : null}
      </header>

      <div
        className={`rounded-lg border border-slate-100 bg-slate-50/40 p-3 ${minHeightClassName} ${
          isLoading ? "animate-pulse" : ""
        }`}
      >
        {isLoading ? <div className="h-full rounded bg-slate-100" /> : children}
      </div>

      {legend ? <footer className="mt-3">{legend}</footer> : null}
    </section>
  );
}

export type { ChartWrapperProps };
