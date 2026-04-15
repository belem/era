"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function AccountTab() {
  const t = useTranslations("settings");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [providers, setProviders] = useState<string[]>([]);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setEmail(user.email ?? "");
        const linked = user.identities?.map((i) => i.provider) ?? [];
        setProviders(linked);
      }
    });
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  const providerList = [
    { key: "google", label: "Google" },
    { key: "github", label: "GitHub" },
    { key: "twitter", label: "X" },
  ];

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

      {/* Linked providers */}
      <section>
        <h3 className="text-[13px] uppercase tracking-[0.08em] text-text-secondary mb-3">
          {t("linkedProviders")}
        </h3>
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
                  <button className="text-[12px] text-primary hover:underline">
                    {t("link")}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Logout */}
      <button
        onClick={handleLogout}
        disabled={loggingOut}
        className="w-full text-center text-[14px] text-error hover:text-error/80 transition-colors py-3 disabled:opacity-50"
      >
        {loggingOut ? "..." : t("logout")}
      </button>
    </div>
  );
}
