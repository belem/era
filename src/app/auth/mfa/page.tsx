"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function MFAChallengePage() {
  const t = useTranslations("mfa");
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function init() {
      const supabase = createClient();
      const { data } = await supabase.auth.mfa.listFactors();
      const verified = data?.totp?.filter((f) => f.status === "verified") ?? [];

      if (verified.length === 0) {
        // No MFA enrolled, go home
        router.replace("/");
        return;
      }

      setFactorId(verified[0].id);
      setChecking(false);
    }
    init();
  }, [router]);

  async function handleVerify(e?: React.FormEvent) {
    e?.preventDefault();
    if (!factorId || code.length !== 6) return;

    setLoading(true);
    setError("");

    const supabase = createClient();

    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
      factorId,
    });

    if (challengeError || !challenge) {
      setError(challengeError?.message ?? "Challenge failed");
      setLoading(false);
      return;
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code,
    });

    if (verifyError) {
      setError(t("wrongCode"));
      setCode("");
      setLoading(false);
      return;
    }

    // MFA verified, redirect to home
    router.replace("/");
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <svg className="w-12 h-12 mx-auto text-text-secondary mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
          <h1 className="font-heading text-[24px] text-text mb-2">{t("title")}</h1>
          <p className="text-text-secondary text-[14px]">{t("subtitle")}</p>
        </div>

        <form onSubmit={handleVerify} className="bg-bg-subtle rounded-[var(--radius-lg)] p-6 space-y-4">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            autoFocus
            placeholder={t("codePlaceholder")}
            value={code}
            onChange={(e) => {
              setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
              setError("");
            }}
            className="w-full border border-border rounded-[var(--radius-md)] bg-bg px-4 py-3 text-text text-center text-[24px] tracking-[0.5em] font-mono placeholder:text-text-tertiary placeholder:tracking-normal placeholder:text-[14px] focus:outline-none focus:ring-2 focus:ring-primary"
          />

          {error && (
            <p className="text-error text-[14px] text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full py-3 bg-primary text-white rounded-[var(--radius-pill)] font-medium text-[17px] transition-colors hover:bg-primary-hover disabled:opacity-50"
          >
            {loading ? "..." : t("verifyButton")}
          </button>
        </form>
      </div>
    </div>
  );
}
