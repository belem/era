"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";

type MFAState = "loading" | "off" | "enrolling" | "verifying" | "enabled";

export function MFAEnroll() {
  const t = useTranslations("settings.mfa");
  const [state, setState] = useState<MFAState>("loading");
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [factorId, setFactorId] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [disabling, setDisabling] = useState(false);

  useEffect(() => {
    checkMFAStatus();
  }, []);

  async function checkMFAStatus() {
    const supabase = createClient();
    const { data } = await supabase.auth.mfa.listFactors();
    const totp = data?.totp ?? [];
    const verified = totp.filter((f) => f.status === "verified");
    setState(verified.length > 0 ? "enabled" : "off");
    if (verified.length > 0) {
      setFactorId(verified[0].id);
    }
  }

  async function handleEnroll() {
    setError("");
    const supabase = createClient();
    const { data, error: enrollError } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "Kuibu",
    });

    if (enrollError || !data) {
      setError(enrollError?.message ?? "Enrollment failed");
      return;
    }

    setFactorId(data.id);
    setQrCode(data.totp.qr_code);
    setSecret(data.totp.secret);
    setState("enrolling");
  }

  async function handleVerify() {
    setError("");
    if (code.length !== 6) {
      setError(t("invalidCode"));
      return;
    }

    const supabase = createClient();

    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
      factorId,
    });

    if (challengeError || !challenge) {
      setError(challengeError?.message ?? "Challenge failed");
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
      return;
    }

    setState("enabled");
    setCode("");
    setQrCode("");
    setSecret("");
  }

  async function handleDisable() {
    setError("");
    setDisabling(true);
    const supabase = createClient();
    const { error: unenrollError } = await supabase.auth.mfa.unenroll({
      factorId,
    });

    if (unenrollError) {
      setError(unenrollError.message);
      setDisabling(false);
      return;
    }

    setState("off");
    setFactorId("");
    setDisabling(false);
  }

  if (state === "loading") {
    return (
      <div className="h-10 bg-bg-subtle rounded-[var(--radius-lg)] animate-pulse" />
    );
  }

  return (
    <section>
      <h3 className="text-[13px] uppercase tracking-[0.08em] text-text-secondary mb-3">
        {t("title")}
      </h3>

      {state === "off" && (
        <div className="bg-bg-subtle rounded-[var(--radius-lg)] p-4">
          <p className="text-[14px] text-text-secondary mb-3">{t("description")}</p>
          <button
            onClick={handleEnroll}
            className="text-[14px] text-primary hover:underline"
          >
            {t("enable")}
          </button>
        </div>
      )}

      {state === "enrolling" && (
        <div className="bg-bg-subtle rounded-[var(--radius-lg)] p-4 space-y-4">
          <p className="text-[14px] text-text-secondary">{t("scanQR")}</p>

          {/* QR Code */}
          <div className="flex justify-center">
            <img
              src={qrCode}
              alt="TOTP QR Code"
              className="w-48 h-48 rounded-[var(--radius-md)]"
            />
          </div>

          {/* Manual secret */}
          <details className="text-[13px]">
            <summary className="text-text-tertiary cursor-pointer hover:text-text-secondary">
              {t("manualEntry")}
            </summary>
            <code className="block mt-2 bg-bg rounded-[var(--radius-md)] px-3 py-2 text-[12px] text-text font-mono break-all select-all">
              {secret}
            </code>
          </details>

          {/* Verify code */}
          <div>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              placeholder={t("codePlaceholder")}
              value={code}
              onChange={(e) => {
                setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                setError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && code.length === 6) handleVerify();
              }}
              className="w-full border border-border rounded-[var(--radius-md)] bg-bg px-4 py-3 text-text text-center text-[20px] tracking-[0.5em] font-mono placeholder:text-text-tertiary placeholder:tracking-normal placeholder:text-[14px] focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {error && (
            <p className="text-error text-[14px] text-center">{error}</p>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => {
                setState("off");
                setQrCode("");
                setSecret("");
                setCode("");
                setError("");
              }}
              className="flex-1 py-3 text-[14px] text-text-secondary hover:text-text transition-colors"
            >
              {t("cancel")}
            </button>
            <button
              onClick={handleVerify}
              disabled={code.length !== 6}
              className="flex-1 py-3 bg-primary text-white rounded-[var(--radius-pill)] text-[14px] transition-colors hover:bg-primary-hover disabled:opacity-50"
            >
              {t("verify")}
            </button>
          </div>
        </div>
      )}

      {state === "enabled" && (
        <div className="bg-bg-subtle rounded-[var(--radius-lg)] p-4">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-4 h-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-[14px] text-success font-medium">{t("enabled")}</span>
          </div>
          <p className="text-[13px] text-text-tertiary mb-3">{t("enabledDesc")}</p>

          {error && (
            <p className="text-error text-[14px] mb-3">{error}</p>
          )}

          <button
            onClick={handleDisable}
            disabled={disabling}
            className="text-[13px] text-error hover:underline disabled:opacity-50"
          >
            {disabling ? "..." : t("disable")}
          </button>
        </div>
      )}
    </section>
  );
}
