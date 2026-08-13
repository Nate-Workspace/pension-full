"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import type { PublicLayoutData } from "@/lib/public-home-data";
import { formatPhoneHref } from "@/lib/public-content";
import { publicNavigation } from "@/lib/public-navigation";

type PublicShellProps = PublicLayoutData & {
  children: React.ReactNode;
};

function isNavItemActive(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function PublicShell({
  pensionName,
  tagline,
  contactPhone,
  contactEmail,
  address,
  city,
  children,
}: PublicShellProps) {
  const pathname = usePathname();
  const [isNavOpen, setIsNavOpen] = useState(false);

  const locationLabel = [address, city].filter(Boolean).join(", ");
  const footerTagline =
    tagline || "Comfortable stays with clear pricing and responsive hospitality.";

  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            {pensionName}
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
            {publicNavigation.map((item) => {
              const isActive = isNavItemActive(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-full px-3 py-2 text-sm transition-colors ${
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
              href="/booking/track"
              className="hidden rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 md:inline-flex"
            >
              Track booking
            </Link>
            <Link
              href="/auth/login"
              className="hidden rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 sm:inline-flex"
            >
              Staff login
            </Link>
            <button
              type="button"
              className="inline-flex rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 lg:hidden"
              onClick={() => setIsNavOpen((open) => !open)}
              aria-expanded={isNavOpen}
              aria-controls="public-mobile-nav"
              aria-label="Toggle navigation"
            >
              Menu
            </button>
          </div>
        </div>

        <nav
          id="public-mobile-nav"
          className={`overflow-hidden border-t border-slate-200 transition-[max-height,opacity] duration-300 ease-out lg:hidden ${
            isNavOpen ? "max-h-[28rem] opacity-100" : "max-h-0 opacity-0"
          }`}
          aria-label="Mobile"
        >
          <div className="space-y-1 px-4 py-3">
            {publicNavigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                  isNavItemActive(pathname, item.href)
                    ? "bg-slate-900 text-white"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
                onClick={() => setIsNavOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/booking/track"
              className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100"
              onClick={() => setIsNavOpen(false)}
            >
              Track my booking
            </Link>
            <Link
              href="/auth/login"
              className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100"
              onClick={() => setIsNavOpen(false)}
            >
              Staff login
            </Link>
          </div>
        </nav>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-slate-200 bg-slate-950 text-slate-300">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.4fr_1fr]">
          <div>
            <p className="text-base font-semibold text-white">{pensionName}</p>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-400">
              {footerTagline}
            </p>
            {(locationLabel || contactPhone || contactEmail) && (
              <dl className="mt-5 space-y-2 text-sm">
                {locationLabel ? (
                  <div>
                    <dt className="text-slate-500">Location</dt>
                    <dd>{locationLabel}</dd>
                  </div>
                ) : null}
                {contactPhone ? (
                  <div>
                    <dt className="text-slate-500">Phone</dt>
                    <dd>
                      <a
                        href={formatPhoneHref(contactPhone)}
                        className="transition hover:text-white"
                      >
                        {contactPhone}
                      </a>
                    </dd>
                  </div>
                ) : null}
                {contactEmail ? (
                  <div>
                    <dt className="text-slate-500">Email</dt>
                    <dd>
                      <a
                        href={`mailto:${contactEmail}`}
                        className="transition hover:text-white"
                      >
                        {contactEmail}
                      </a>
                    </dd>
                  </div>
                ) : null}
              </dl>
            )}
          </div>

          <div className="flex flex-col gap-6 sm:flex-row sm:justify-end md:flex-col md:items-end">
            <nav aria-label="Footer">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Guest links
              </p>
              <div className="mt-3 flex flex-col gap-2 text-sm">
                <Link href="/booking/track" className="transition hover:text-white">
                  Track my booking
                </Link>
                <Link href="/contact" className="transition hover:text-white">
                  Contact
                </Link>
                <Link href="/faq" className="transition hover:text-white">
                  FAQ
                </Link>
              </div>
            </nav>

            <nav aria-label="Legal">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Legal
              </p>
              <div className="mt-3 flex flex-col gap-2 text-sm">
                <Link href="/terms" className="transition hover:text-white">
                  Terms of service
                </Link>
                <Link href="/privacy" className="transition hover:text-white">
                  Privacy policy
                </Link>
                <Link href="/auth/login" className="transition hover:text-white">
                  Staff login
                </Link>
              </div>
            </nav>
          </div>
        </div>

        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p>© {new Date().getFullYear()} {pensionName}. All rights reserved.</p>
            <p>Transparent pricing · Secure booking reference on confirmation</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
