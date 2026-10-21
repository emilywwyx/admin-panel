"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const REASONS: Record<string, string> = {
  unauthorized: "You don't have permission to access the admin panel.",
  auth: "Sign in failed. Please try again.",
};

function RedirectReason() {
  const reason = useSearchParams().get("error");

  return reason && REASONS[reason] ? (
    <p className="mt-5 text-sm text-red-400">{REASONS[reason]}</p>
  ) : null;
}

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleGoogleLogin() {
    setLoading(true);
    setError("");

    const supabase = createClient();

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        // Let someone who signed in with the wrong account pick another one.
        queryParams: { prompt: "select_account" },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 text-white">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center">
        <p className="mb-3 text-sm font-medium text-zinc-400">
          CAPTION NYC
        </p>

        <h1 className="mb-3 text-3xl font-bold">Admin Panel</h1>

        <p className="mb-8 text-sm text-zinc-400">
          Sign in with an authorized Google account to continue.
        </p>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full cursor-pointer rounded-lg bg-white px-5 py-3 font-medium text-black hover:bg-zinc-200 disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign in with Google"}
        </button>

        {error ? (
          <p className="mt-5 text-sm text-red-400">{error}</p>
        ) : (
          <Suspense>
            <RedirectReason />
          </Suspense>
        )}
      </div>
    </main>
  );
}