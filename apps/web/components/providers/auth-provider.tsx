"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Dispatch, ReactNode, SetStateAction } from "react";

import { apiFetch } from "@/lib/api-client";

export type AuthUser = {
  id: string;
  email: string;
  role: "admin" | "staff";
};

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isAuthResolved: boolean;
  isAdmin: boolean;
  isStaff: boolean;
  setUser: Dispatch<SetStateAction<AuthUser | null>>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthResolved, setIsAuthResolved] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      try {
        const response = await apiFetch("/auth/me", {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
          cache: "no-store",
          skipAuthRedirect: true,
        });

        if (!isMounted) {
          return;
        }

        if (!response.ok) {
          setUser(null);
          return;
        }

        const payload = (await response.json()) as AuthUser;
        setUser(payload);
      } catch {
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsAuthResolved(true);
        }
      }
    };

    void restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isAuthResolved,
      isAdmin: user?.role === 'admin',
      isStaff: user?.role === 'staff',
      setUser,
    }),
    [isAuthResolved, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }

  return context;
}
