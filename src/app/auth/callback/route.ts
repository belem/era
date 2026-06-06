import { createServerSupabase } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

const ALLOWED_OTP_TYPES: EmailOtpType[] = ["signup", "email", "recovery", "invite", "email_change", "magiclink"];

function safeNext(raw: string | null): string {
  if (!raw) return "/";
  if (raw.startsWith("/") && !raw.startsWith("//")) return raw;
  return "/";
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const typeParam = searchParams.get("type");
  const next = safeNext(searchParams.get("next") ?? searchParams.get("redirect"));

  const errorCode = searchParams.get("error_code") ?? searchParams.get("error");
  if (errorCode) {
    return NextResponse.redirect(`${origin}/login?error=auth&reason=${encodeURIComponent(errorCode)}`);
  }

  const supabase = await createServerSupabase();
  let authError: string | null = null;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) authError = error.message;
  } else if (tokenHash && typeParam && (ALLOWED_OTP_TYPES as string[]).includes(typeParam)) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: typeParam as EmailOtpType,
    });
    if (error) authError = error.message;
  } else {
    authError = "missing_token";
  }

  if (authError) {
    return NextResponse.redirect(
      `${origin}/login?error=auth&reason=${encodeURIComponent(authError)}`,
    );
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(`${origin}/login?error=auth&reason=no_session`);
  }

  // Password recovery: send to reset page (still authenticated, but they came here to set a new password).
  if (typeParam === "recovery" || next === "/reset-password") {
    return NextResponse.redirect(`${origin}/reset-password`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", user.id)
    .single();

  if (!profile?.onboarding_completed) {
    return NextResponse.redirect(`${origin}/onboarding`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
