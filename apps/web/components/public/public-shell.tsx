"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { publicNavigation } from "@/lib/public-navigation";

type PublicShellProps = {
  pensionName: string;
  children: React.ReactNode;
};

export function PublicShell({ pensionName, children }: PublicShellProps) {
  const pathname = usePathname();
  const [isNavOpen, setIsNavOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            {pensionName}
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {publicNavigation.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-full px-3 py-2 text-sm transition ${
                    isActive
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/auth/login"
              className="hidden rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 sm:inline-flex"
            >
              Staff login
            </Link>
            <button
              type="button"
              className="inline-flex rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 md:hidden"
              onClick={() => setIsNavOpen((open) => !open)}
              aria-expanded={isNavOpen}
              aria-label="Toggle navigation"
            >
              Menu
            </button>
          </div>
        </div>

        {isNavOpen && (
          <nav className="border-t border-slate-200 px-4 py-3 md:hidden">
            <div className="flex flex-col gap-1">
              {publicNavigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                  onClick={() => setIsNavOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/auth/login"
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100"
                onClick={() => setIsNavOpen(false)}
              >
                Staff login
              </Link>
            </div>
          </nav>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-slate-200 bg-slate-950 text-slate-300">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <p className="text-sm font-medium text-white">{pensionName}</p>
            <p className="mt-1 text-sm text-slate-400">
              Comfortable stays with clear pricing and responsive hospitality.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <Link href="/terms" className="hover:text-white">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-white">
              Privacy
            </Link>
            <Link href="/auth/login" className="hover:text-white">
              Staff login
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
