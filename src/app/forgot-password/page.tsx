"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const t = useTranslations("auth");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/reset-password")}`,
      });
      if (error) throw error;
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-heading text-[28px] text-text mb-2">{t("forgotTitle")}</h1>
          <p className="text-text-secondary text-[14px]">{t("forgotSubtitle")}</p>
        </div>

        <div className="bg-bg-subtle rounded-[var(--radius-lg)] p-8">
          {sent ? (
            <div className="text-center space-y-4">
              <h2 className="text-[17px] font-heading text-text">{t("resetSent")}</h2>
              <p className="text-text-secondary text-[14px]">{t("resetSentDesc")}</p>
              <Link href="/login" className="text-primary text-[14px] hover:underline">
                {t("backToLogin")}
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="email"
                placeholder={t("emailPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                aria-invalid={!!error}
                aria-describedby={error ? "forgot-error" : undefined}
                className={`w-full border rounded-[var(--radius-md)] bg-bg px-4 py-3 text-text placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary ${
                  error ? "border-error" : "border-border"
                }`}
              />
              {error && (
                <p id="forgot-error" className="text-error text-[14px]" role="alert">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-white rounded-[var(--radius-pill)] py-3 font-medium hover:bg-primary-hover transition-colors disabled:opacity-50"
              >
                {loading ? "..." : t("sendResetLink")}
              </button>
              <Link
                href="/login"
                className="block text-center text-text-secondary text-[14px] hover:text-primary transition-colors"
              >
                {t("backToLogin")}
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
