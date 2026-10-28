"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { GoogleG, LogoMark } from "@/components/icons";
import { createClient } from "@/lib/supabase/client";

const REASONS: Record<string, string> = {
  unauthorized: "You don't have permission to access the admin panel.",
  auth: "Sign in failed. Please try again.",
};

function RedirectReason() {
  const reason = useSearchParams().get("error");

  return reason && REASONS[reason] ? (
    <p className="rounded-[14px] bg-danger-soft px-4 py-3 text-sm font-medium text-danger">{REASONS[reason]}</p>
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
    <main className="flex min-h-screen items-center justify-center bg-cream px-4 text-ink">
      <div className="flex w-full max-w-[460px] flex-col items-center gap-5 rounded-[28px] border border-line-soft bg-surface px-8 py-10 text-center">
        <p className="inline-flex items-center gap-2.5 text-sm font-extrabold tracking-[0.06em]">
          <LogoMark />
          CAPTIONNYC
        </p>

        <span className="rounded-md bg-accent-soft px-3 py-1.5 text-xs font-bold uppercase tracking-[0.06em] text-accent-deep">
          Admin
        </span>

        <h1 className="text-4xl font-extrabold">Admin Panel</h1>

        <p className="text-muted">Sign in with an authorized Google account to continue.</p>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="inline-flex min-h-[52px] w-full cursor-pointer items-center justify-center gap-2.5 rounded-full border border-line bg-surface px-7 font-semibold transition hover:-translate-y-px hover:border-ink disabled:cursor-wait disabled:opacity-60"
        >
          <GoogleG />
          {loading ? "Signing in…" : "Continue with Google"}
        </button>

        {error ? (
          <p className="rounded-[14px] bg-danger-soft px-4 py-3 text-sm font-medium text-danger">{error}</p>
        ) : (
          <Suspense>
            <RedirectReason />
          </Suspense>
        )}
      </div>
    </main>
  );
}
