"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { MFAEnroll } from "./MFAEnroll";
import { Spinner } from "@/components/Spinner";
import type { Plan } from "@/lib/tier";

const PLAN_BADGE: Record<Plan, { label: string; className: string }> = {
  FREE: { label: "Free", className: "text-text-secondary bg-bg-muted" },
  PRO: { label: "Pro", className: "text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30" },
  MAX: { label: "Max", className: "text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-900/30" },
  ADMIN: { label: "Admin", className: "text-purple-700 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/30" },
};

export function AccountTab() {
  const t = useTranslations("settings");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [providers, setProviders] = useState<string[]>([]);
  const [loggingOut, setLoggingOut] = useState(false);
  const [linkError, setLinkError] = useState("");
  const [plan, setPlan] = useState<Plan | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setEmail(user.email ?? "");
        const linked = user.identities?.map((i) => i.provider) ?? [];
        setProviders(linked);
        supabase
          .from("users")
          .select("plan")
          .eq("id", user.id)
          .single()
          .then(({ data }) => { if (data?.plan) setPlan(data.plan as Plan); });
      }
    });
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleLink = async (provider: "google" | "github" | "twitter") => {
    setLinkError("");
    const supabase = createClient();
    const { error } = await supabase.auth.linkIdentity({
      provider,
      options: {
        redirectTo: `${window.location.origin}/settings`,
      },
    });
    if (error) {
      if (error.message.toLowerCase().includes("manual linking")) {
        setLinkError(t("linkDisabled"));
      } else {
        setLinkError(error.message);
      }
    }
  };

  const providerList = [
    { key: "google", label: "Google" },
    { key: "github", label: "GitHub" },
    { key: "twitter", label: "X" },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Email */}
      <section>
        <h3 className="text-[13px] uppercase tracking-[0.08em] text-text-secondary mb-3">
          {t("email")}
        </h3>
        <div className="bg-bg-subtle rounded-[var(--radius-lg)] px-4 py-3 text-[14px] text-text-secondary">
          {email}
        </div>
      </section>

      {/* Password */}
      <section>
        <h3 className="text-[13px] uppercase tracking-[0.08em] text-text-secondary mb-3">
          {t("password")}
        </h3>
        <button
          onClick={() => router.push("/settings/change-password")}
          className="text-[14px] text-primary hover:underline"
        >
          {t("changePassword")}
        </button>
      </section>

      {/* MFA */}
      <MFAEnroll />

      {/* Linked providers */}
      <section>
        <h3 className="text-[13px] uppercase tracking-[0.08em] text-text-secondary mb-3">
          {t("linkedProviders")}
        </h3>
        {linkError && <p className="text-[13px] text-error mb-2" role="alert">{linkError}</p>}
        <div className="space-y-2">
          {providerList.map((p) => {
            const isLinked = providers.includes(p.key);
            return (
              <div
                key={p.key}
                className="flex items-center justify-between bg-bg-subtle rounded-[var(--radius-lg)] px-4 py-3"
              >
                <span className="text-[14px] text-text">{p.label}</span>
                {isLinked ? (
                  <span className="text-[12px] text-success font-medium">{t("connected")}</span>
                ) : (
                  <button
                    onClick={() => handleLink(p.key)}
                    className="text-[12px] text-primary hover:underline"
                  >
                    {t("link")}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Plan */}
      {plan && (
        <section>
          <h3 className="text-[13px] uppercase tracking-[0.08em] text-text-secondary mb-3">
            {t("plan.label")}
          </h3>
          <div className="flex items-center justify-between bg-bg-subtle rounded-[var(--radius-lg)] px-4 py-3">
            <span className={`text-[12px] font-semibold px-2.5 py-1 rounded-full ${PLAN_BADGE[plan].className}`}>
              {PLAN_BADGE[plan].label}
            </span>
            {plan === "FREE" && (
              <a href="/pricing" className="text-[13px] text-primary hover:underline">
                {t("upgrade")}
              </a>
            )}
          </div>
        </section>
      )}

      {/* Logout */}
      <button
        onClick={handleLogout}
        disabled={loggingOut}
        className="w-full flex items-center justify-center text-[14px] text-error hover:text-error/80 transition-colors py-3 disabled:opacity-50"
      >
        {loggingOut ? <Spinner size={16} /> : t("logout")}
      </button>
    </div>
  );
}
