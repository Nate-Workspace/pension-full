"use client";

import { useMemo, useState } from "react";

import { useAuth } from "@/components/providers/auth-provider";
import { buildDashboardNotifications } from "@/lib/notifications";

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

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <path
        d="M15 17h5l-1.4-1.4a2 2 0 0 1-.6-1.4V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5m6 0a3 3 0 1 1-6 0"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
      />
    </svg>
  );
}

function notificationStyle(category: "cleaning" | "checkout" | "payment"): string {
  if (category === "payment") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  if (category === "checkout") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-cyan-200 bg-cyan-50 text-cyan-700";
}

function notificationLabel(category: "cleaning" | "checkout" | "payment"): string {
  if (category === "payment") {
    return "Payment";
  }

  if (category === "checkout") {
    return "Check-out";
  }

  return "Cleaning";
}

export function Header({ onOpenSidebar, onLogout, isLoggingOut }: HeaderProps) {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notifications = useMemo(() => buildDashboardNotifications(), []);
  const { user } = useAuth();

  const roleLabel = user?.role === "admin" ? "Owner" : user?.role === "staff" ? "Staff" : "Account";
  const avatarLabel = roleLabel.slice(0, 1).toUpperCase();

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

        <div className="ml-auto flex items-center gap-3">
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsNotificationsOpen((current) => !current)}
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100"
              aria-label="Notifications"
              aria-expanded={isNotificationsOpen}
            >
              <BellIcon />
              {notifications.length > 0 ? (
                <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-semibold text-white">
                  {notifications.length}
                </span>
              ) : null}
            </button>

            {isNotificationsOpen ? (
              <div className="absolute right-0 z-30 mt-2 w-90 rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
                  <button
                    type="button"
                    onClick={() => setIsNotificationsOpen(false)}
                    className="text-xs font-medium text-slate-500 hover:text-slate-700"
                  >
                    Close
                  </button>
                </div>

                {notifications.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-300 px-3 py-8 text-center">
                    <p className="text-sm font-medium text-slate-700">No new notifications</p>
                    <p className="mt-1 text-xs text-slate-500">Operational alerts will appear here.</p>
                  </div>
                ) : (
                  <ul className="max-h-95 space-y-2 overflow-y-auto pr-1">
                    {notifications.map((notification) => (
                      <li key={notification.id} className="rounded-lg border border-slate-200 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-slate-900">{notification.title}</p>
                          <span
                            className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-semibold ${notificationStyle(notification.category)}`}
                          >
                            {notificationLabel(notification.category)}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-600">{notification.message}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : null}
          </div>

          <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2 py-1.5">
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
