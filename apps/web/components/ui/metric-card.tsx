import type { ReactNode } from "react";

type MetricChange = {
  value: string;
  direction: "up" | "down" | "neutral";
  label?: string;
};

type MetricCardProps = {
  title: string;
  value: string;
  icon?: ReactNode;
  description?: string;
  change?: MetricChange;
  className?: string;
};

function changeColor(direction: MetricChange["direction"]): string {
  if (direction === "up") {
    return "text-emerald-600";
  }

  if (direction === "down") {
    return "text-rose-600";
  }

  return "text-slate-500";
}

function changeSymbol(direction: MetricChange["direction"]): string {
  if (direction === "up") {
    return "+";
  }

  if (direction === "down") {
    return "-";
  }

  return "";
}

export function MetricCard({
  title,
  value,
  icon,
  description,
  change,
  className,
}: MetricCardProps) {
  return (
    <section
      className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm ${className ?? ""}`}
      aria-label={title}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
        </div>

        {icon ? (
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
            {icon}
          </div>
        ) : null}
      </div>

      <div className="mt-3 min-h-5">
        {change ? (
          <p className={`text-xs font-medium ${changeColor(change.direction)}`}>
            {changeSymbol(change.direction)}
            {change.value}
            {change.label ? <span className="ml-1 text-slate-500">{change.label}</span> : null}
          </p>
        ) : description ? (
          <p className="text-xs text-slate-500">{description}</p>
        ) : null}
      </div>
    </section>
  );
}

export type { MetricCardProps, MetricChange };
