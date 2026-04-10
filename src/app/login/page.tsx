"use client";

import { createClient } from "@/lib/supabase/client";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const t = useTranslations("login");
  const router = useRouter();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmationSent, setConfirmationSent] = useState(false);

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
      setError(err instanceof Error ? err.message : "Authentication error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-6">
      <div className="w-full max-w-sm">
        {/* Logo & Subtitle */}
        <div className="text-center mb-8">
          <h1 className="font-heading text-[28px] text-text mb-2">{t("title")}</h1>
          <p className="font-poetry text-text-secondary text-sm">{t("subtitle")}</p>
        </div>

        {/* Card */}
        <div className="bg-bg-subtle rounded-[var(--radius-lg)] p-8">
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
            <input
              type="email"
              placeholder={t("emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-border rounded-[var(--radius-md)] bg-bg px-4 py-3 text-text placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full border border-border rounded-[var(--radius-md)] bg-bg px-4 py-3 text-text placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary"
            />

            {error && (
              <p className="text-error text-sm text-center">{error}</p>
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
  );
}
