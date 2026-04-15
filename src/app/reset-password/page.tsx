"use client";

import { Suspense, useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

function ResetPasswordContent() {
  const t = useTranslations("auth");
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    // Supabase handles the token exchange via the URL hash automatically
    const supabase = createClient();
    supabase.auth.onAuthStateChange((event) => {
      if (event === "TOKEN_REFRESHED" || event === "SIGNED_IN") {
        // Token is valid, user can reset
      }
    });

    // Check if there's an error in the URL hash (expired token)
    const hash = window.location.hash;
    if (hash.includes("error=")) {
      setExpired(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError(t("passwordMismatch"));
      return;
    }
    setLoading(true);
    setError("");

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch (err) {
      if (err instanceof Error && err.message.includes("token")) {
        setExpired(true);
      } else {
        setError(err instanceof Error ? err.message : "Failed to reset password");
      }
    } finally {
      setLoading(false);
    }
  };

  if (expired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg p-6">
        <div className="w-full max-w-sm text-center">
          <div className="bg-bg-subtle rounded-[var(--radius-lg)] p-8 space-y-4">
            <h2 className="text-[17px] font-heading text-text">{t("tokenExpired")}</h2>
            <p className="text-text-secondary text-[14px]">{t("tokenExpiredDesc")}</p>
            <Link
              href="/forgot-password"
              className="inline-block px-6 py-2.5 border border-primary text-primary rounded-[var(--radius-pill)] text-[14px] font-medium hover:bg-primary hover:text-white transition-colors"
            >
              {t("requestNewLink")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg p-6">
        <div className="w-full max-w-sm text-center">
          <div className="bg-bg-subtle rounded-[var(--radius-lg)] p-8 space-y-4">
            <h2 className="text-[17px] font-heading text-text">{t("passwordChanged")}</h2>
            <p className="text-text-secondary text-[14px]">{t("redirectingToLogin")}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-heading text-[28px] text-text mb-2">{t("resetTitle")}</h1>
          <p className="text-text-secondary text-[14px]">{t("resetSubtitle")}</p>
        </div>

        <div className="bg-bg-subtle rounded-[var(--radius-lg)] p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="password"
              placeholder={t("newPassword")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full border border-border rounded-[var(--radius-md)] bg-bg px-4 py-3 text-text placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              type="password"
              placeholder={t("confirmPassword")}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={6}
              aria-invalid={!!error}
              aria-describedby={error ? "reset-error" : undefined}
              className={`w-full border rounded-[var(--radius-md)] bg-bg px-4 py-3 text-text placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary ${
                error ? "border-error" : "border-border"
              }`}
            />
            {error && (
              <p id="reset-error" className="text-error text-[14px]" role="alert">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white rounded-[var(--radius-pill)] py-3 font-medium hover:bg-primary-hover transition-colors disabled:opacity-50"
            >
              {loading ? "..." : t("resetPassword")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordContent />
    </Suspense>
  );
}
