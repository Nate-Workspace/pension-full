import Link from "next/link";
import type { ReactNode } from "react";
import {
  IconBed,
  IconCalendarEvent,
  IconChartBar,
  IconCreditCard,
  IconLayoutDashboard,
  IconSettings,
} from "@tabler/icons-react";
import Image from "next/image";

import type { NavItem } from "@/lib/navigation";

type SidebarProps = {
  items: NavItem[];
  pathname: string;
  onNavigate?: () => void;
};

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

const navIcons: Record<string, ReactNode> = {
  "/dashboard": <IconLayoutDashboard size={18} stroke={1.8} />,
  "/rooms": <IconBed size={18} stroke={1.8} />,
  "/bookings": <IconCalendarEvent size={18} stroke={1.8} />,
  "/payments": <IconCreditCard size={18} stroke={1.8} />,
  "/reports": <IconChartBar size={18} stroke={1.8} />,
  "/settings": <IconSettings size={18} stroke={1.8} />,
};

export function Sidebar({ items, pathname, onNavigate }: SidebarProps) {
  return (
    <aside className="flex h-full w-full flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-5 py-4">
        <h1 className="mt-2 text-lg font-semibold text-slate-900">
          Hillside Guest House
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {items.map((item) => {
          const active = isActive(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <span
                aria-hidden="true"
                className="inline-flex shrink-0 items-center justify-center"
              >
                {navIcons[item.href]}
              </span>

              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Branding */}
      <div className="border-t border-slate-200 px-4 py-4">
        <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-3">
          <div className="flex h-10 px-2 items-center justify-center rounded-lg bg-white shadow-sm">
            <Image
              src="/logo1.png"
              alt="StayFlow logo"
              width={100}
              height={32}
              className="h-8 w-auto object-contain"
            />
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">
              Hillside Guest House
            </p>

            <p className="truncate text-xs text-slate-500">StayFlow PMS v1.0</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
