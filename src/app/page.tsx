"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

type CheckStatus = "pending" | "success" | "error" | "not-configured";

interface SystemCheck {
  status: CheckStatus;
  message: string;
}

interface SystemChecks {
  env: SystemCheck;
  auth: SystemCheck;
  database: SystemCheck;
}

function StatusIndicator({ status }: { status: CheckStatus }) {
  switch (status) {
    case "pending":
      return <span className="text-amber-500">...</span>;
    case "success":
      return <span className="text-green-500 font-medium">✓</span>;
    case "error":
      return <span className="text-red-500 font-medium">✗</span>;
    case "not-configured":
      return <span className="text-zinc-400 dark:text-zinc-500">—</span>;
  }
}

function StatusCard({ title, check }: { title: string; check: SystemCheck }) {
  return (
    <div className="flex-1 min-w-[140px] p-4 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-medium text-black dark:text-white">
          {title}
        </h3>
        <StatusIndicator status={check.status} />
      </div>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">{check.message}</p>
    </div>
  );
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  // Environment check is synchronous - compute in initial state
  const hasEnvVars = !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const [checks, setChecks] = useState<SystemChecks>({
    env: {
      status: hasEnvVars ? "success" : "error",
      message: hasEnvVars ? "Configured" : "Missing Supabase credentials",
    },
    auth: { status: "pending", message: "Checking..." },
    database: { status: "not-configured", message: "Not configured yet" },
  });

  useEffect(() => {
    // Auth connection check (async)
    supabase.auth.getSession().then(({ error }) => {
      setChecks((prev) => ({
        ...prev,
        auth: {
          status: error ? "error" : "success",
          message: error ? error.message : "Connected",
        },
      }));
    });

    // Auth state management (existing logic)
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage("Check your email for the login link!");
    }
    setSending(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-center gap-8 py-16 px-8 bg-white dark:bg-black">
        {/* System Health Section */}
        <section className="w-full max-w-lg">
          <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-3 uppercase tracking-wide">
            System Health
          </h2>
          <div className="flex flex-wrap gap-3">
            <StatusCard title="Environment" check={checks.env} />
            <StatusCard title="Auth" check={checks.auth} />
            <StatusCard title="Database" check={checks.database} />
          </div>
        </section>

        {/* Divider */}
        <div className="w-full max-w-lg border-t border-zinc-200 dark:border-zinc-800" />

        {/* Auth Status Section */}
        <section className="w-full max-w-lg flex flex-col items-center gap-6">
          <h1 className="text-3xl font-semibold text-black dark:text-zinc-50">
            Auth Status
          </h1>
          {loading ? (
            <p className="text-zinc-600 dark:text-zinc-400">Checking...</p>
          ) : user ? (
            <div className="flex flex-col items-center gap-4 text-center">
              <p className="text-lg text-green-600 dark:text-green-400">
                ✓ Logged in
              </p>
              <p className="text-zinc-600 dark:text-zinc-400">{user.email}</p>
              <button
                onClick={() => supabase.auth.signOut().then(() => setUser(null))}
                className="rounded-full border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleMagicLink}
              className="flex flex-col items-center gap-4 w-full max-w-sm"
            >
              <p className="text-lg text-zinc-600 dark:text-zinc-400">
                Sign in with Magic Link
              </p>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-black dark:text-white"
              />
              <button
                type="submit"
                disabled={sending}
                className="w-full rounded-full bg-black dark:bg-white text-white dark:text-black px-4 py-2 text-sm font-medium hover:opacity-80 disabled:opacity-50"
              >
                {sending ? "Sending..." : "Send Magic Link"}
              </button>
              {message && (
                <p
                  className={`text-sm ${message.startsWith("Error") ? "text-red-500" : "text-green-600 dark:text-green-400"}`}
                >
                  {message}
                </p>
              )}
            </form>
          )}
        </section>
      </main>
    </div>
  );
}
