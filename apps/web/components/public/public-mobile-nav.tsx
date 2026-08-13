"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const mobileTabs = [
  { label: "Home", href: "/" },
  { label: "Rooms", href: "/rooms" },
  { label: "Contact", href: "/contact" },
  { label: "Track", href: "/booking/track" },
] as const;

function isTabActive(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function PublicMobileNav() {
  const pathname = usePathname();
  const showBookCta = pathname === "/rooms";

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur lg:hidden"
      aria-label="Mobile site navigation"
    >
      {showBookCta ? (
        <div className="border-b border-slate-100 px-4 py-2">
          <Link
            href="/rooms"
            className="inline-flex w-full justify-center rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white"
          >
            Book a room
          </Link>
        </div>
      ) : null}

      <div className="grid grid-cols-4 gap-1 px-2 py-2">
        {mobileTabs.map((tab) => {
          const active = isTabActive(pathname, tab.href);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`rounded-xl px-2 py-2 text-center text-[11px] font-semibold transition ${
                active
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
