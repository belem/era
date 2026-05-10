"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { Spinner } from "@/components/Spinner";

export default function ChangePasswordPage() {
  const t = useTranslations("auth");
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

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
      setTimeout(() => router.push("/settings"), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AppHeader />
      <main className="flex-1 px-6 py-10 md:px-12 md:py-14 lg:px-[20%] xl:px-[28%]">
        <h1 className="font-heading font-semibold text-[21px] tracking-tight mb-6">
          {t("changePasswordTitle")}
        </h1>

        {success ? (
          <div className="bg-bg-subtle rounded-[var(--radius-lg)] p-6 text-center space-y-2">
            <p className="text-[14px] text-success font-medium">{t("passwordChanged")}</p>
            <p className="text-[14px] text-text-secondary">{t("redirectingToSettings")}</p>
          </div>
        ) : (
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
              aria-describedby={error ? "change-pw-error" : undefined}
              className={`w-full border rounded-[var(--radius-md)] bg-bg px-4 py-3 text-text placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary ${
                error ? "border-error" : "border-border"
              }`}
            />
            {error && (
              <p id="change-pw-error" className="text-error text-[14px]" role="alert">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white rounded-[var(--radius-pill)] py-3 font-medium hover:bg-primary-hover transition-colors disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? <Spinner size={18} /> : t("changePassword")}
            </button>
          </form>
        )}
      </main>
    </>
  );
}
