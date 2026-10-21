import "server-only";
import { createClient } from "@supabase/supabase-js";

// Bypasses RLS. Only lib/auth.ts hands this out, after the superadmin check.
export function createAdminClient() {
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!secretKey) {
    return null;
  }

  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
