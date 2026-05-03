"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

import { AUTH_QUERY_KEY, useAuth } from "@/components/providers/auth-provider";
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

async function getErrorMessage(
  response: Response,
  fallback: string,
): Promise<string> {
  const payload = (await response
    .json()
    .catch(() => null)) as ApiErrorPayload | null;

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
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading } = useAuth();

  const [form, setForm] = useState<LoginPayload>({
    email: "",
    password: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

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
          throw new Error(
            await getErrorMessage(
              response,
              `Login failed (${response.status}).`,
            ),
          );
        }

        const payload = (await response.json()) as LoginResponse;
        queryClient.setQueryData(AUTH_QUERY_KEY, payload.user);
        router.replace("/dashboard");
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Unable to log in.",
        );
      } finally {
        setIsSubmitting(false);
      }
    })();
  };

  return (
    <main className="relative min-h-screen bg-white overflow-hidden">
      {/* Background blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 top-10 h-80 w-80 rounded-full bg-emerald-700/20 blur-[120px]" />
        <div className="absolute right-10 top-1/3 h-96 w-96 rounded-full bg-amber-500/10 blur-[140px]" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-cyan-700/10 blur-[120px]" />
      </div>

      {/* Layout */}
      <div className="relative grid min-h-screen lg:grid-cols-2">
        <section className="flex flex-col justify-center px-6 py-12 sm:px-10 lg:px-36">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-black/5 px-3 py-1 text-xs uppercase tracking-[0.2em] text-emerald-800">
              Pension Management Suite
            </div>

            <h1 className="mt-6 text-3xl font-semibold sm:text-4xl lg:text-5xl">
              Easy access for pension operations and management analytics
            </h1>

            <p className="mt-4 text-base text-slate-600">
              Monitor bookings, manage room services, and keep financial reports
              ready with a single, unified dashboard.
            </p>

            {/* Stats */}
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                { label: "Financial", value: "Analytics" },
                { label: "Activity", value: "Tracking" },
                { label: "Overall", value: "Management" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-black/10 bg-black/5 p-4 backdrop-blur"
                >
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-700">
                    {item.label}
                  </p>
                  <p className=" text-2xl font-semibold">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-12 flex items-center justify-between text-xs text-slate-500">
              <span>Trusted pension operations platform</span>
              <span>ISO 27001 aligned</span>
            </div>
          </div>

          {/* Decorative curved lines */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <svg
              className="absolute left-0 top-0 h-full w-full opacity-80"
              viewBox="0 0 800 600"
              fill="none"
              preserveAspectRatio="none"
            >
              {/* top-left soft curve */}
              <path
                d="M0 80 C120 40, 160 120, 240 100"
                stroke="#94a3b8"
                strokeWidth="0.5"
              />
            </svg>
          </div>
        </section>

        {/* RIGHT SIDE */}
        <div className="flex items-center justify-center bg-gradient-to-br from-slate-600 via-slate-700 to-slate-900 px-6 py-12 sm:px-10 lg:px-16">
          <section className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
            {/* subtle top accent */}
            <div className="mb-6 h-1 w-12 rounded-full bg-slate-900" />

            <h1 className="text-xl font-semibold text-slate-900">Hello!</h1>
            <p className="mt-1 text-sm text-slate-500">
              Sign Up to Get Started
            </p>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <input
                type="email"
                value={form.email}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, email: event.target.value }))
                }
                placeholder="Email Address"
                className="h-11 w-full rounded-md border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-slate-500 focus:bg-white"
                required
                disabled={isSubmitting}
              />

              <input
                type="password"
                value={form.password}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, password: event.target.value }))
                }
                placeholder="Password"
                className="h-11 w-full rounded-md border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-slate-500 focus:bg-white"
                required
                disabled={isSubmitting}
              />

              {errorMessage && (
                <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {errorMessage}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="h-10 w-full rounded-md bg-slate-900 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {isSubmitting ? "Signing in..." : "Login"}
              </button>

              {/* <p className="text-center text-xs text-slate-500 hover:text-slate-700 cursor-pointer">
                Forgot Password
              </p> */}
            </form>
          </section>
          {/* Decorative curved lines */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <svg
              className="absolute right-0 top-0 h-full w-full opacity-25"
              viewBox="0 0 800 600"
              fill="none"
              preserveAspectRatio="none"
            >
              {/* soft outer flow */}
              <path
                d="M800 40 C680 80, 720 180, 800 240"
                stroke="white"
                strokeWidth="0.4"
              />
              <path
                d="M800 120 C650 160, 760 260, 800 320"
                stroke="white"
                strokeWidth="0.3"
              />

              {/* medium curvature layer */}
              <path
                d="M800 0 C620 120, 700 220, 800 360"
                stroke="white"
                strokeWidth="0.5"
              />
              <path
                d="M800 180 C600 260, 720 380, 800 520"
                stroke="white"
                strokeWidth="0.35"
              />

              {/* tighter curves (adds depth) */}
              <path
                d="M800 60 C740 120, 760 160, 800 200"
                stroke="white"
                strokeWidth="0.25"
              />
              <path
                d="M800 300 C730 340, 760 420, 800 460"
                stroke="white"
                strokeWidth="0.25"
              />

              {/* large sweeping edge curve */}
              <path
                d="M800 0 C500 150, 500 450, 800 600"
                stroke="white"
                strokeWidth="0.6"
              />
            </svg>
          </div>
        </div>
      </div>
    </main>
  );
}
