"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useStudent } from "@/hooks/useStudent";
import { createClient } from "@/lib/supabase/client";

interface Guardian {
  guardian_id: string;
  role: string;
  profiles: { display_name: string | null; username: string | null } | null;
}

export function FamilyTab() {
  const t = useTranslations("settings");
  const { student } = useStudent();
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!student) return;
    const supabase = createClient();
    supabase
      .from("student_guardians")
      .select("guardian_id, role, profiles(display_name, username)")
      .eq("student_id", student.id)
      .then(({ data }) => {
        if (data) setGuardians(data as unknown as Guardian[]);
      });
  }, [student]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student || !inviteEmail) return;
    setSending(true);
    setError("");
    setSent(false);

    try {
      const res = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: student.id, email: inviteEmail }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send invitation");
      }

      setSent(true);
      setInviteEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send invitation");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Guardian list */}
      <section>
        <h3 className="text-[13px] uppercase tracking-[0.08em] text-text-secondary mb-3">
          {t("guardians")}
        </h3>
        {guardians.length === 0 ? (
          <p className="text-[14px] text-text-secondary">
            {t("noGuardians", { name: student?.name ?? "" })}
          </p>
        ) : (
          <div className="space-y-2">
            {guardians.map((g) => (
              <div
                key={g.guardian_id}
                className="flex items-center justify-between bg-bg-subtle rounded-[var(--radius-lg)] px-4 py-3"
              >
                <span className="text-[14px] text-text">
                  {g.profiles?.display_name || g.profiles?.username || t("unknownGuardian")}
                </span>
                <span
                  className={`text-[12px] font-medium ${
                    g.role === "OWNER" ? "text-primary" : "text-text-secondary"
                  }`}
                >
                  {g.role}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Invite form */}
      <section>
        <h3 className="text-[13px] uppercase tracking-[0.08em] text-text-secondary mb-3">
          {t("inviteGuardian")}
        </h3>
        <form onSubmit={handleInvite} className="space-y-3">
          <input
            type="email"
            placeholder={t("inviteEmailPlaceholder")}
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            required
            className="w-full border border-border rounded-[var(--radius-md)] bg-bg px-4 py-3 text-[14px] text-text placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {error && <p className="text-[14px] text-error" role="alert">{error}</p>}
          {sent && <p className="text-[14px] text-success">{t("inviteSent")}</p>}
          <button
            type="submit"
            disabled={sending}
            className="px-6 py-2.5 border border-primary text-primary rounded-[var(--radius-pill)] text-[14px] font-medium hover:bg-primary hover:text-white transition-colors disabled:opacity-50"
          >
            {sending ? "..." : t("sendInvite")}
          </button>
        </form>
      </section>
    </div>
  );
}
