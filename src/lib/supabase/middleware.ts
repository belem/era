import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Redirect unauthenticated users to login (except public pages)
  const publicPaths = ["/login", "/auth/callback", "/onboarding", "/forgot-password", "/reset-password", "/invite/accept"];
  const isPublic = publicPaths.some((p) => request.nextUrl.pathname.startsWith(p));

  if (!user && !isPublic) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user && !isPublic && !request.nextUrl.pathname.startsWith("/onboarding")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("id", user.id)
      .single();

    if (profile && !profile.onboarding_completed) {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }
  }

  // MFA enforcement: if user has enrolled TOTP factors, check AAL level.
  // Skip on public paths so recovery flows (forgot/reset password, magic-link
  // sign-in landing) don't bounce mid-flow.
  if (user && !isPublic && !request.nextUrl.pathname.startsWith("/auth/mfa")) {
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    const { data: factors } = await supabase.auth.mfa.listFactors();
    const hasVerifiedTOTP = (factors?.totp ?? []).some((f) => f.status === "verified");

    if (hasVerifiedTOTP && aal?.currentLevel === "aal1") {
      // User has MFA enrolled but only completed password auth, needs TOTP challenge
      return NextResponse.redirect(new URL("/auth/mfa", request.url));
    }
  }

  return response;
}
