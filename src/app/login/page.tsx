"use client";

import { createClient } from "@/lib/supabase/client";
import { useTranslations } from "next-intl";
import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Spinner } from "@/components/Spinner";

function safeRedirect(raw: string | null): string {
  if (!raw) return "/";
  if (raw.startsWith("/") && !raw.startsWith("//")) return raw;
  return "/";
}

function LoginForm() {
  const t = useTranslations("login");
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionExpired = searchParams.get("expired") === "1";
  const authError = searchParams.get("error") === "auth";
  const authErrorReason = searchParams.get("reason");
  const redirectTo = safeRedirect(searchParams.get("redirect") ?? searchParams.get("next"));

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [errorField, setErrorField] = useState<"email" | "password" | null>(null);
  const [confirmationSent, setConfirmationSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(0);
  const [oauthConflict, setOauthConflict] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Magic-link / OTP code state
  const [magicLinkLoading, setMagicLinkLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);

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
    if (resendCooldown > 0 || !email) return;
    const supabase = createClient();
    await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setResendCooldown(60);
  }, [email, resendCooldown]);

  const handleGitHub = async () => {
    setError("");
    try {
      const supabase = createClient();
      const next = redirectTo !== "/" ? `?next=${encodeURIComponent(redirectTo)}` : "";
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: `${window.location.origin}/auth/callback${next}`,
        },
      });
      if (oauthError) throw oauthError;
    } catch (err) {
      setError(err instanceof Error ? err.message : "GitHub sign-in failed");
    }
  };

  const handleMagicLink = async () => {
    if (!email) {
      setError(t("emailPlaceholder"));
      setErrorField("email");
      return;
    }
    setError("");
    setMagicLinkLoading(true);
    try {
      const supabase = createClient();
      const next = redirectTo !== "/" ? `?next=${encodeURIComponent(redirectTo)}` : "";
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback${next}`,
        },
      });
      if (otpError) {
        // Treat rate-limit as "already sent" so user can still enter the code
        if (otpError.status === 429 || otpError.message.toLowerCase().includes("rate limit")) {
          setMagicLinkSent(true);
        } else {
          throw otpError;
        }
      } else {
        setMagicLinkSent(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send sign-in link");
    } finally {
      setMagicLinkLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 6) return;
    setOtpLoading(true);
    setError("");
    try {
      const supabase = createClient();
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: otpCode,
        type: "email",
      });
      if (verifyError) {
        setError(t("invalidCode"));
        setOtpLoading(false);
        return;
      }
      // Successful: server will route through onboarding gate via middleware on next nav.
      window.location.href = redirectTo;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
      setOtpLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setErrorField(null);
    setOauthConflict(false);

    try {
      const supabase = createClient();
      if (mode === "signin") {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        window.location.href = redirectTo;
      } else {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { accepted_terms_at: new Date().toISOString() },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (signUpError) throw signUpError;
        setConfirmationSent(true);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Authentication error";
      setError(msg);
      const lower = msg.toLowerCase();
      if (lower.includes("invalid login") || lower.includes("invalid_credentials")) {
        setErrorField("password");
      } else if (lower.includes("not confirmed") || lower.includes("email not confirmed")) {
        setErrorField("email");
      } else if (lower.includes("rate limit") || lower.includes("too many requests")) {
        setErrorField(null);
        setLockedUntil(60);
      } else if (lower.includes("already registered") || lower.includes("already been registered")) {
        setOauthConflict(true);
        setErrorField("email");
      } else {
        setErrorField(null);
      }
    } finally {
      setLoading(false);
    }
  };

  // Magic-link OTP code-entry view
  if (magicLinkSent) {
    return (
      <div className="min-h-screen flex bg-bg">
        <div className="hidden lg:flex lg:w-1/2 bg-bg-subtle items-center justify-center">
          <div className="text-center px-12">
            <h1 className="font-heading text-[40px] text-text mb-4">{t("title")}</h1>
            <p className="font-poetry text-[24px] text-text-secondary">{t("subtitle")}</p>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-sm">
            <div className="text-center mb-8 lg:hidden">
              <h1 className="font-heading text-[28px] text-text mb-2">{t("title")}</h1>
              <p className="font-poetry text-text-secondary text-sm">{t("subtitle")}</p>
            </div>
            <div className="bg-bg-subtle rounded-[var(--radius-lg)] p-8 lg:bg-transparent lg:p-0">
              <div className="space-y-1 mb-5 text-center">
                <p className="text-[14px] text-text">
                  {t("magicLinkInbox", { email })}
                </p>
                <p className="text-[13px] text-text-tertiary">
                  {t("magicLinkInstructions")}
                </p>
              </div>
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  autoFocus
                  aria-label={t("codeLabel")}
                  placeholder={t("codePlaceholder")}
                  value={otpCode}
                  onChange={(e) => {
                    setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                    setError("");
                  }}
                  className="w-full border border-border rounded-[var(--radius-md)] bg-bg px-4 py-3 text-text text-center text-[24px] tracking-[0.5em] font-mono placeholder:text-text-tertiary placeholder:tracking-normal placeholder:text-[14px] focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {error && (
                  <p className="text-error text-[14px] text-center" role="alert">{error}</p>
                )}
                <button
                  type="submit"
                  disabled={otpLoading || otpCode.length !== 6}
                  className="w-full bg-primary text-white rounded-[var(--radius-pill)] py-3 font-medium hover:bg-primary-hover transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {otpLoading ? <Spinner size={18} /> : t("verifyCode")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMagicLinkSent(false);
                    setOtpCode("");
                    setError("");
                  }}
                  className="w-full text-text-secondary text-sm hover:text-primary transition-colors"
                >
                  {t("back")}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
              <p>{authErrorReason?.includes("expired") ? t("otpExpired") : t("authError")}</p>
              {authErrorReason && (
                <p className="text-[12px] text-text-tertiary">
                  {t("authErrorReason", { reason: authErrorReason })}
                </p>
              )}
              {email && (
                <button
                  onClick={handleResendConfirmation}
                  disabled={resendCooldown > 0}
                  className="text-primary hover:underline text-[13px] disabled:opacity-50"
                >
                  {resendCooldown > 0 ? t("resendCooldown", { seconds: resendCooldown }) : t("resendEmail")}
                </button>
              )}
              {!email && (
                <p className="text-[13px]">{t("otpExpiredHint")}</p>
              )}
            </div>
          )}

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
            ) : (
              <>
                {oauthConflict && (
                  <div className="bg-bg rounded-[var(--radius-md)] border border-border p-4 mb-6 text-center">
                    <p className="text-[14px] text-text mb-2">{t("oauthConflict", { provider: "GitHub" })}</p>
                    <button
                      onClick={() => {
                        setOauthConflict(false);
                        setError("");
                        setErrorField(null);
                      }}
                      className="text-primary text-[14px] hover:underline"
                    >
                      {t("tryDifferentMethod")}
                    </button>
                  </div>
                )}

                {/* GitHub OAuth */}
                <button
                  onClick={handleGitHub}
                  className="w-full h-12 flex items-center justify-center gap-2 bg-bg rounded-[var(--radius-md)] border border-border hover:border-primary transition-colors mb-6"
                  aria-label="Sign in with GitHub"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-text" aria-hidden="true">
                    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
                  </svg>
                  <span className="text-[14px] text-text">GitHub</span>
                </button>

                <div className="flex items-center gap-3 mb-6">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-text-tertiary text-sm">{t("or")}</span>
                  <div className="flex-1 h-px bg-border" />
                </div>

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

                  <button
                    type="button"
                    onClick={() => {
                      setMode(mode === "signin" ? "signup" : "signin");
                      setOauthConflict(false);
                      setError("");
                      setErrorField(null);
                      setLockedUntil(0);
                    }}
                    className="w-full text-center text-text-secondary text-sm hover:text-primary transition-colors"
                  >
                    {mode === "signin" ? t("signUp") : t("signIn")}
                  </button>

                  {/* Magic link */}
                  {mode === "signin" && (
                    <div className="pt-2 border-t border-border mt-2">
                      <button
                        type="button"
                        disabled={magicLinkLoading || !email}
                        onClick={handleMagicLink}
                        className="w-full flex items-center justify-center gap-2 text-text-tertiary text-sm hover:text-primary transition-colors disabled:opacity-50 py-2"
                      >
                        {magicLinkLoading ? (
                          <>
                            <Spinner size={16} />
                            {t("magicLinkSending")}
                          </>
                        ) : (
                          t("magicLink")
                        )}
                      </button>
                    </div>
                  )}
                </form>
              </>
            )}
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
