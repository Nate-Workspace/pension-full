"use client";

import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { useAuth } from "@/components/providers/auth-provider";
import { apiFetch } from "@/lib/api-client";
import { dashboardNavigation } from "@/lib/navigation";

import { Header } from "./header";
import { Sidebar } from "./sidebar";

type DashboardShellProps = {
  children: React.ReactNode;
};

export function DashboardShell({ children }: DashboardShellProps) {
  const router = useRouter();
  const { setUser } = useAuth();
  const pathname = usePathname();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = () => {
    void (async () => {
      if (isLoggingOut) {
        return;
      }

      setIsLoggingOut(true);

      try {
        const response = await apiFetch("/auth/logout", {
          method: "POST",
          headers: {
            Accept: "application/json",
          },
          skipAuthRedirect: true,
        });

        if (!response.ok) {
          throw new Error(`Logout failed (${response.status}).`);
        }

        setUser(null);
        router.replace("/login");
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoggingOut(false);
      }
    })();
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <div className="hidden w-72 shrink-0 lg:block">
        <div className="fixed inset-y-0 w-72">
          <Sidebar items={dashboardNavigation} pathname={pathname} />
        </div>
      </div>

      {isMobileNavOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-30 bg-slate-900/45 lg:hidden"
          onClick={() => setIsMobileNavOpen(false)}
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-40 w-72 transform transition-transform duration-200 lg:hidden ${
          isMobileNavOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar
          items={dashboardNavigation}
          pathname={pathname}
          onNavigate={() => setIsMobileNavOpen(false)}
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          onOpenSidebar={() => setIsMobileNavOpen(true)}
          onLogout={handleLogout}
          isLoggingOut={isLoggingOut}
        />
        <main className="min-h-[calc(100vh-4rem)] p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
