"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/providers/auth-provider";
import { apiFetch } from "@/lib/api-client";

type LoginPayload = {
  email: string;
  password: string;
};

type LoginResponse = {
  user: {
    id: string;
    email: string;
    role: "admin" | "staff";
  };
};

type ApiErrorPayload = {
  message?: string | string[];
};

async function getErrorMessage(response: Response, fallback: string): Promise<string> {
  const payload = (await response.json().catch(() => null)) as ApiErrorPayload | null;

  if (!payload?.message) {
    return fallback;
  }

  if (Array.isArray(payload.message)) {
    return payload.message[0] ?? fallback;
  }

  return payload.message;
}

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAuth();

  const [form, setForm] = useState<LoginPayload>({
    email: "",
    password: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const checkCurrentSession = async () => {
      const response = await apiFetch("/auth/me", {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
        skipAuthRedirect: true,
      });

      if (!response.ok) {
        return;
      }

      const payload = (await response.json()) as LoginResponse["user"];

      if (!isMounted) {
        return;
      }

      setUser(payload);
      router.replace("/dashboard");
    };

    void checkCurrentSession();

    return () => {
      isMounted = false;
    };
  }, [router, setUser]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    void (async () => {
      setIsSubmitting(true);

      try {
        const response = await apiFetch("/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            email: form.email.trim(),
            password: form.password,
          }),
          skipAuthRedirect: true,
        });

        if (!response.ok) {
          throw new Error(await getErrorMessage(response, `Login failed (${response.status}).`));
        }

        const payload = (await response.json()) as LoginResponse;
        setUser(payload.user);
        router.replace("/dashboard");
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Unable to log in.");
      } finally {
        setIsSubmitting(false);
      }
    })();
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <section className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Sign In</h1>
        <p className="mt-1 text-sm text-slate-500">Use your account to access the dashboard.</p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Email</span>
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-800"
              autoComplete="email"
              required
              disabled={isSubmitting}
            />
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Password</span>
            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
              className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-800"
              autoComplete="current-password"
              required
              disabled={isSubmitting}
            />
          </label>

          {errorMessage ? (
            <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {errorMessage}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="h-10 w-full rounded-md bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </section>
    </main>
  );
}
