import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/auth/callback"];

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },

        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          supabaseResponse = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });

          Object.entries(headers).forEach(([key, value]) => {
            supabaseResponse.headers.set(key, value);
          });
        },
      },
    }
  );

  const { data } = await supabase.auth.getClaims();
  const path = request.nextUrl.pathname;

  if (PUBLIC_PATHS.some((publicPath) => path.startsWith(publicPath))) {
    return supabaseResponse;
  }

  function redirectTo(search: string) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = search;

    const redirect = NextResponse.redirect(url);

    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirect.cookies.set(cookie);
    });

    return redirect;
  }

  const userId = data?.claims?.sub;

  if (!userId) {
    return redirectTo("");
  }

  // Every admin route requires profiles.is_superadmin. Pages and Server Actions
  // check again through lib/auth.ts, so this is the first gate, not the only one.
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_superadmin")
    .eq("id", userId)
    .maybeSingle();

  if (!profile?.is_superadmin) {
    return redirectTo("?error=unauthorized");
  }

  return supabaseResponse;
}
