"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";

import { useAuth } from "@/components/providers/auth-provider";
import Link from "next/link";

type HeaderProps = {
  onOpenSidebar: () => void;
  onLogout: () => void;
  isLoggingOut: boolean;
};

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <path
        d="M4 7h16M4 12h16M4 17h16"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth={2}
      />
    </svg>
  );
}

export function Header({ onOpenSidebar, onLogout, isLoggingOut }: HeaderProps) {
  const { user } = useAuth();
  const pathname = usePathname();

  const roleLabel =
    user?.role === "admin"
      ? "Owner"
      : user?.role === "staff"
        ? "Staff"
        : "Account";
  const avatarLabel = roleLabel.slice(0, 1).toUpperCase();

  const breadcrumbs = useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);

    return segments.map((segment, index) => {
      const href = "/" + segments.slice(0, index + 1).join("/");

      return {
        label: segment
          .replace(/-/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase()),
        href,
      };
    });
  }, [pathname]);

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-slate-50/90 backdrop-blur">
      <div className="flex min-h-16 items-center gap-3 px-4 py-3 sm:px-6">
        <button
          type="button"
          onClick={onOpenSidebar}
          className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100 lg:hidden"
          aria-label="Open navigation"
        >
          <MenuIcon />
        </button>

        <div className="flex items-end gap-4">
          <nav className="hidden sm:flex items-center text-sm text-slate-500">

            {breadcrumbs.map((crumb, index) => (
              <span key={crumb.href} className="flex items-end">
                <span className="mx-2 text-slate-400">/</span>
                <Link href={crumb.href}
                  className={`${
                    index === breadcrumbs.length - 1
                      ? "text-slate-900 font-medium"
                      : "hover:text-slate-700"
                  }`}
                >
                  {crumb.label}
                </Link>
              </span>
            ))}
          </nav>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-md border border-slate-200 px-2 py-1.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
              {avatarLabel}
            </div>
            <div className="hidden leading-tight sm:block">
              <p className="text-sm font-medium text-slate-900">{roleLabel}</p>
              <p className="text-xs text-slate-500">{user?.email ?? ""}</p>
            </div>
            <button
              type="button"
              onClick={onLogout}
              disabled={isLoggingOut}
              className="ml-1 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoggingOut ? "Logging out..." : "Logout"}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
