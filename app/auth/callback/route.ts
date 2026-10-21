import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=auth", url.origin));
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(new URL("/login?error=auth", url.origin));
  }

  const { data: profile, error:profileError } = await supabase
    .from("profiles")
    .select("is_superadmin")
    .eq("id", data.user.id)
    .maybeSingle();

  if (profileError || !profile?.is_superadmin) {
    await supabase.auth.signOut();
    return NextResponse.redirect(
      new URL("/login?error=unauthorized", url.origin)
    );
  }

  return NextResponse.redirect(new URL("/", url.origin));
}