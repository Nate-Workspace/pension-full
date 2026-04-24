"use client";

import { useQuery } from "@tanstack/react-query";
import { createContext, useContext } from "react";
import type { ReactNode } from "react";

import { apiFetch } from "@/lib/api-client";

export type AuthUser = {
  id: string;
  email: string;
  role: "admin" | "staff";
};

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  isStaff: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);
export const AUTH_QUERY_KEY = ["auth", "me"] as const;

async function fetchCurrentUser(): Promise<AuthUser | null> {
  const response = await apiFetch("/auth/me", {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
    skipAuthRedirect: true,
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Unable to restore auth session (${response.status}).`);
  }

  return (await response.json()) as AuthUser;
}

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const authQuery = useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn: fetchCurrentUser,
    retry: 1,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  const user = authQuery.data ?? null;
  const isLoading = authQuery.isPending;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 text-slate-900">
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />
          <p className="text-sm font-medium">Restoring session...</p>
        </div>
      </div>
    );
  }

  const value: AuthContextValue = {
    user,
    isAuthenticated: user !== null,
    isLoading,
    isAdmin: user?.role === "admin",
    isStaff: user?.role === "staff",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }

  return context;
}
