"use client";

import { createClient } from "@/lib/supabase/client";
import { useTranslations } from "next-intl";
import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Spinner } from "@/components/Spinner";

function LoginForm() {
  const t = useTranslations("login");
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionExpired = searchParams.get("expired") === "1";
  const authError = searchParams.get("error") === "auth";
  const [otpExpired, setOtpExpired] = useState(false);

  // Detect otp_expired from URL hash (can't read hash server-side)
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("otp_expired") || hash.includes("error_code=otp_expired")) {
      setOtpExpired(true);
    }
  }, []);
  const redirectTo = searchParams.get("redirect") || "/";

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [errorField, setErrorField] = useState<"email" | "password" | null>(null);
  const [confirmationSent, setConfirmationSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(0);
  const [oauthConflictProvider, setOauthConflictProvider] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [magicLinkLoading, setMagicLinkLoading] = useState(false);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lockRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Redirect if already logged in
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) router.push(redirectTo);
    });
  }, [router, redirectTo]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    cooldownRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          if (cooldownRef.current) clearInterval(cooldownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (cooldownRef.current) clearInterval(cooldownRef.current); };
  }, [resendCooldown]);

  // Lock timer
  useEffect(() => {
    if (lockedUntil <= 0) return;
    lockRef.current = setInterval(() => {
      setLockedUntil((prev) => {
        if (prev <= 1) {
          if (lockRef.current) clearInterval(lockRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (lockRef.current) clearInterval(lockRef.current); };
  }, [lockedUntil]);

  const handleResendConfirmation = useCallback(async () => {
    if (resendCooldown > 0) return;
    const supabase = createClient();
    await supabase.auth.resend({ type: "signup", email });
    setResendCooldown(60);
  }, [email, resendCooldown]);

  const handleOAuthSignIn = async (provider: "google" | "apple" | "github" | "azure" | "twitter") => {
    try {
      const supabase = createClient();
      const next = redirectTo !== "/" ? `?next=${encodeURIComponent(redirectTo)}` : "";
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback${next}`,
        },
      });
      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err.message : "OAuth error");
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const supabase = createClient();
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push(redirectTo);
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { accepted_terms_at: new Date().toISOString() },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) throw error;
        setConfirmationSent(true);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Authentication error";
      setError(msg);
      setOauthConflictProvider(null);
      // Map Supabase error messages to field hints
      if (msg.includes("Invalid login") || msg.includes("invalid_credentials")) {
        setErrorField("password");
      } else if (msg.includes("not confirmed") || msg.includes("Email not confirmed")) {
        setErrorField("email");
      } else if (msg.includes("rate limit") || msg.includes("too many requests") || msg.includes("Too many requests")) {
        setErrorField(null);
        setLockedUntil(60);
      } else if (msg.includes("already registered") || msg.includes("already been registered")) {
        // OAuth conflict: email exists with a different provider
        const providerMatch = msg.match(/provider[:\s]+(\w+)/i);
        setOauthConflictProvider(providerMatch?.[1] ?? "another provider");
        setErrorField("email");
      } else {
        setErrorField(null);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-bg">
      {/* Desktop branding panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-bg-subtle items-center justify-center">
        <div className="text-center px-12">
          <h1 className="font-heading text-[40px] text-text mb-4">{t("title")}</h1>
          <p className="font-poetry text-[24px] text-text-secondary">{t("subtitle")}</p>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Logo & Subtitle (mobile only) */}
        <div className="text-center mb-8 lg:hidden">
          <h1 className="font-heading text-[28px] text-text mb-2">{t("title")}</h1>
          <p className="font-poetry text-text-secondary text-sm">{t("subtitle")}</p>
        </div>

        {sessionExpired && (
          <div className="mb-4 px-4 py-3 rounded-[var(--radius-md)] border border-warning bg-warning/10 text-[14px] text-text-secondary">
            {t("sessionExpired")}
          </div>
        )}

        {authError && !sessionExpired && (
          <div className="mb-4 px-4 py-3 rounded-[var(--radius-md)] border border-error bg-error/10 text-[14px] text-text-secondary space-y-2">
            <p>{otpExpired ? t("otpExpired") : t("authError")}</p>
            {otpExpired && email && (
              <button
                onClick={handleResendConfirmation}
                disabled={resendCooldown > 0}
                className="text-primary hover:underline text-[13px] disabled:opacity-50"
              >
                {resendCooldown > 0 ? t("resendCooldown", { seconds: resendCooldown }) : t("resendEmail")}
              </button>
            )}
            {otpExpired && !email && (
              <p className="text-[13px]">{t("otpExpiredHint")}</p>
            )}
          </div>
        )}

        {/* Card */}
        <div className="bg-bg-subtle rounded-[var(--radius-lg)] p-8 lg:bg-transparent lg:p-0">
          {confirmationSent ? (
            <div className="text-center space-y-4">
              <svg className="w-10 h-10 mx-auto text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
              <h2 className="text-lg font-heading text-text">{t("confirmationSent")}</h2>
              <p className="text-text-secondary text-sm">{t("checkEmail")}</p>
              <button
                onClick={handleResendConfirmation}
                disabled={resendCooldown > 0}
                className="text-primary text-sm hover:underline disabled:opacity-50 disabled:no-underline"
              >
                {resendCooldown > 0
                  ? t("resendCooldown", { seconds: resendCooldown })
                  : t("resendEmail")}
              </button>
              <br />
              <button
                onClick={() => {
                  setConfirmationSent(false);
                  setMode("signin");
                  setError("");
                }}
                className="text-text-secondary text-sm hover:text-primary transition-colors"
              >
                {t("backToSignIn")}
              </button>
            </div>
          ) : (<>
          {/* OAuth conflict banner */}
          {oauthConflictProvider && (
            <div className="bg-bg rounded-[var(--radius-md)] border border-border p-4 mb-6 text-center">
              <p className="text-[14px] text-text mb-2">{t("oauthConflict", { provider: oauthConflictProvider })}</p>
              <button
                onClick={() => {
                  setOauthConflictProvider(null);
                  setError("");
                  setErrorField(null);
                }}
                className="text-primary text-[14px] hover:underline"
              >
                {t("tryDifferentMethod")}
              </button>
            </div>
          )}

          {/* OAuth Row */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={() => handleOAuthSignIn("google")}
              className="flex-1 h-12 flex items-center justify-center bg-bg rounded-[var(--radius-md)] border border-border hover:border-primary transition-colors"
              aria-label="Sign in with Google"
            >
              {/* Google G logo */}
              <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            </button>
            <button
              onClick={() => handleOAuthSignIn("twitter")}
              className="flex-1 h-12 flex items-center justify-center bg-bg rounded-[var(--radius-md)] border border-border hover:border-primary transition-colors"
              aria-label="Sign in with X"
            >
              {/* X (Twitter) logo */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-text" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.259 5.629 5.905-5.629zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </button>
            <button
              onClick={() => handleOAuthSignIn("github")}
              className="flex-1 h-12 flex items-center justify-center bg-bg rounded-[var(--radius-md)] border border-border hover:border-primary transition-colors"
              aria-label="Sign in with GitHub"
            >
              {/* GitHub mark */}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-text" aria-hidden="true">
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-text-tertiary text-sm">{t("or")}</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div>
              <input
                type="email"
                placeholder={t("emailPlaceholder")}
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); setErrorField(null); }}
                required
                aria-invalid={errorField === "email"}
                aria-describedby={errorField === "email" ? "login-error" : undefined}
                className={`w-full border rounded-[var(--radius-md)] bg-bg px-4 py-3 text-text placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary ${
                  errorField === "email" ? "border-error" : "border-border"
                }`}
              />
              {errorField === "email" && (
                <p id="login-error" className="text-error text-[14px] mt-1" role="alert">{error}</p>
              )}
            </div>
            <div>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); setErrorField(null); }}
                required
                minLength={6}
                aria-invalid={errorField === "password"}
                aria-describedby={errorField === "password" ? "login-error" : undefined}
                className={`w-full border rounded-[var(--radius-md)] bg-bg px-4 py-3 text-text placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary ${
                  errorField === "password" ? "border-error" : "border-border"
                }`}
              />
              {errorField === "password" && (
                <div className="flex items-center justify-between mt-1">
                  <p id="login-error" className="text-error text-[14px]" role="alert">{error}</p>
                  <Link href="/forgot-password" className="text-primary text-[14px] hover:underline">
                    {t("forgotPassword")}
                  </Link>
                </div>
              )}
            </div>

            {error && !errorField && lockedUntil <= 0 && (
              <p className="text-error text-[14px] text-center" role="alert">{error}</p>
            )}

            {lockedUntil > 0 && (
              <p className="text-error text-[14px] text-center" role="alert">
                {t("tooManyAttempts", { seconds: lockedUntil })}
              </p>
            )}

            {mode === "signin" && !error && lockedUntil <= 0 && (
              <div className="text-right">
                <Link href="/forgot-password" className="text-text-secondary text-[14px] hover:text-primary transition-colors">
                  {t("forgotPassword")}
                </Link>
              </div>
            )}

            {mode === "signup" && (
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-0.5 accent-primary"
                />
                <span className="text-[13px] text-text-secondary leading-tight">
                  {t("termsConsent")}
                </span>
              </label>
            )}

            <button
              type="submit"
              disabled={loading || lockedUntil > 0 || (mode === "signup" && !termsAccepted)}
              className="w-full bg-primary text-white rounded-[var(--radius-pill)] py-3 font-medium hover:bg-primary-hover transition-colors disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? <Spinner size={18} /> : mode === "signin" ? t("signIn") : t("signUp")}
            </button>

            {/* Toggle mode */}
            <button
              type="button"
              onClick={() => {
                setMode(mode === "signin" ? "signup" : "signin");
                setOauthConflictProvider(null);
                setError("");
                setErrorField(null);
                setLockedUntil(0);
              }}
              className="w-full text-center text-text-secondary text-sm hover:text-primary transition-colors"
            >
              {mode === "signin" ? t("signUp") : t("signIn")}
            </button>

            {/* Magic Link */}
            {mode === "signin" && (
              <div className="pt-2 border-t border-border mt-2">
                {magicLinkSent ? (
                  <p className="text-text-secondary text-sm text-center">{t("magicLinkSent")}</p>
                ) : (
                  <button
                    type="button"
                    disabled={magicLinkLoading || !email}
                    onClick={async () => {
                      if (!email) return;
                      setMagicLinkLoading(true);
                      const supabase = createClient();
                      const { error: otpError } = await supabase.auth.signInWithOtp({
                        email,
                        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
                      });
                      if (otpError) {
                        setError(otpError.message);
                      } else {
                        setMagicLinkSent(true);
                      }
                      setMagicLinkLoading(false);
                    }}
                    className="w-full text-center text-text-tertiary text-sm hover:text-primary transition-colors disabled:opacity-50"
                  >
                    {magicLinkLoading ? <Spinner size={16} /> : t("magicLink")}
                  </button>
                )}
              </div>
            )}
          </form>
          </>)}
        </div>
      </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex bg-bg items-center justify-center">
        <div className="text-text-secondary">Loading...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
