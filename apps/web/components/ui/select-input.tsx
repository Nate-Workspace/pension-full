import type { SelectHTMLAttributes } from "react";

import { IconChevronDown } from "@tabler/icons-react";

export type SelectInputProps = SelectHTMLAttributes<HTMLSelectElement> & {
  wrapperClassName?: string;
};

export function SelectInput({ className = "", wrapperClassName = "", children, ...props }: SelectInputProps) {
  return (
    <div className={`relative inline-flex ${wrapperClassName}`}>
      <select
        {...props}
        className={`appearance-none rounded-md border border-slate-200 bg-white px-3 pr-10 text-sm text-slate-800 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 [&>option]:bg-white [&>option]:text-slate-800 [&>option]:py-2 ${className}`}
        style={{ colorScheme: "light" }}
      >
        {children}
      </select>

      <IconChevronDown
        aria-hidden="true"
        size={16}
        stroke={2}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
      />
    </div>
  );
}