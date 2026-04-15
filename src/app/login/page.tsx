"use client";

import { createClient } from "@/lib/supabase/client";
import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const t = useTranslations("login");
  const router = useRouter();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [errorField, setErrorField] = useState<"email" | "password" | null>(null);
  const [confirmationSent, setConfirmationSent] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) router.push("/");
    });
  }, [router]);

  const handleOAuthSignIn = async (provider: "google" | "apple" | "github" | "azure" | "twitter") => {
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
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
        router.push("/");
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setConfirmationSent(true);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Authentication error";
      setError(msg);
      // Map Supabase error messages to field hints
      if (msg.includes("Invalid login") || msg.includes("invalid_credentials")) {
        setErrorField("password");
      } else if (msg.includes("not confirmed") || msg.includes("Email not confirmed")) {
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

        {/* Card */}
        <div className="bg-bg-subtle rounded-[var(--radius-lg)] p-8 lg:bg-transparent lg:p-0">
          {confirmationSent ? (
            <div className="text-center space-y-4">
              <div className="text-4xl mb-2">✉️</div>
              <h2 className="text-lg font-heading text-text">{t("confirmationSent")}</h2>
              <p className="text-text-secondary text-sm">{t("checkEmail")}</p>
              <button
                onClick={() => {
                  setConfirmationSent(false);
                  setMode("signin");
                  setError("");
                }}
                className="text-primary text-sm hover:underline"
              >
                {t("backToSignIn")}
              </button>
            </div>
          ) : (<>
          {/* OAuth Row */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={() => handleOAuthSignIn("google")}
              className="flex-1 h-12 flex items-center justify-center bg-bg rounded-[var(--radius-md)] border border-border hover:border-primary transition-colors"
              aria-label="Sign in with Google"
            >
              <span className="text-base font-medium text-text">G</span>
            </button>
            <button
              onClick={() => handleOAuthSignIn("twitter")}
              className="flex-1 h-12 flex items-center justify-center bg-bg rounded-[var(--radius-md)] border border-border hover:border-primary transition-colors"
              aria-label="Sign in with X"
            >
              <span className="text-base font-medium text-text">X</span>
            </button>
            <button
              onClick={() => handleOAuthSignIn("github")}
              className="flex-1 h-12 flex items-center justify-center bg-bg rounded-[var(--radius-md)] border border-border hover:border-primary transition-colors"
              aria-label="Sign in with GitHub"
            >
              <span className="text-base font-medium text-text">GH</span>
            </button>
            <button
              disabled
              className="flex-1 h-12 flex items-center justify-center bg-bg rounded-[var(--radius-md)] border border-border opacity-40 cursor-not-allowed"
              aria-label="Sign in with Apple (coming soon)"
              title="Coming soon"
            >
              <span className="text-base font-medium text-text"></span>
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

            {error && !errorField && (
              <p className="text-error text-[14px] text-center" role="alert">{error}</p>
            )}

            {mode === "signin" && !error && (
              <div className="text-right">
                <Link href="/forgot-password" className="text-text-secondary text-[14px] hover:text-primary transition-colors">
                  {t("forgotPassword")}
                </Link>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white rounded-[var(--radius-pill)] py-3 font-medium hover:bg-primary-hover transition-colors disabled:opacity-50"
            >
              {loading ? "..." : mode === "signin" ? t("signIn") : t("signUp")}
            </button>

            {/* Toggle mode */}
            <button
              type="button"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="w-full text-center text-text-secondary text-sm hover:text-primary transition-colors"
            >
              {mode === "signin" ? t("signUp") : t("signIn")}
            </button>
          </form>
          </>)}
        </div>
      </div>
      </div>
    </div>
  );
}
