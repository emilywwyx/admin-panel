import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface Admin {
  id: string;
  name: string;
  email: string | null;
  avatarUrl: string | null;
}

export const requireAdmin = cache(async (): Promise<Admin> => {
  // Admin data is per-request: the Supabase client and our date math read the
  // clock, which Cache Components forbids during prerendering and prefetching.
  await connection();

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name, avatar_url, is_superadmin")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.is_superadmin) {
    redirect("/login?error=unauthorized");
  }

  const name = [profile.first_name, profile.last_name].filter(Boolean).join(" ");

  return {
    id: user.id,
    name: name || user.email || "Admin",
    email: user.email ?? null,
    avatarUrl: profile.avatar_url ?? user.user_metadata?.avatar_url ?? null,
  };
});

// The data access layer: every admin read and write goes through here, so the
// superadmin check always runs right next to the data.
export async function getDb(): Promise<{ admin: Admin; db: SupabaseClient }> {
  const admin = await requireAdmin();
  const db = createAdminClient() ?? (await createClient());

  return { admin, db };
}
