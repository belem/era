"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Spinner } from "@/components/Spinner";

interface InviteData {
  studentName: string;
  inviterName: string;
}

function AcceptContent() {
  const t = useTranslations("invite");
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [invite, setInvite] = useState<InviteData | null>(null);
  const [error, setError] = useState<"expired" | "already_linked" | "self_invite" | "not_found" | null>(null);
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("not_found");
      setLoading(false);
      return;
    }

    const supabase = createClient();

    Promise.all([
      supabase.auth.getUser(),
      supabase
        .from("guardian_invitations")
        .select("*, students(name)")
        .eq("token", token)
        .single(),
    ]).then(async ([{ data: { user: authUser } }, { data: invitation, error: invError }]) => {
      setUser(authUser);

      if (invError || !invitation) {
        setError("not_found");
      } else if (invitation.accepted_at) {
        setError("already_linked");
      } else if (new Date(invitation.expires_at) < new Date()) {
        setError("expired");
      } else {
        // Fetch inviter profile separately to avoid FK hint issues
        const { data: inviterProfile } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("id", invitation.invited_by)
          .single();
        setInvite({
          studentName: (invitation as any).students?.name ?? "Student",
          inviterName: inviterProfile?.display_name ?? "Someone",
        });
      }

      setLoading(false);
    });
  }, [token]);

  const handleAccept = async () => {
    if (!token || !user) return;
    setAccepting(true);

    try {
      const res = await fetch("/api/invitations/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (!res.ok) {
        const data = await res.json();
        if (data.error?.includes("self")) setError("self_invite");
        else if (data.error?.includes("already")) setError("already_linked");
        else setError("not_found");
        return;
      }

      setAccepted(true);
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg p-6">
        <div className="flex items-center gap-2 text-text-tertiary text-[14px]">
          <Spinner size={16} />
          {t("validating")}
        </div>
      </div>
    );
  }

  if (error === "expired") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg p-6">
        <div className="w-full max-w-sm text-center bg-bg-subtle rounded-[var(--radius-lg)] p-8 space-y-4">
          <h2 className="text-[17px] font-heading text-text">{t("expiredTitle")}</h2>
          <p className="text-text-secondary text-[14px]">
            {t("expiredDesc", { name: invite?.inviterName ?? t("inviter") })}
          </p>
        </div>
      </div>
    );
  }

  if (error === "already_linked") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg p-6">
        <div className="w-full max-w-sm text-center bg-bg-subtle rounded-[var(--radius-lg)] p-8 space-y-4">
          <h2 className="text-[17px] font-heading text-text">{t("alreadyLinkedTitle")}</h2>
          <p className="text-text-secondary text-[14px]">{t("alreadyLinkedDesc")}</p>
          <Link href="/" className="inline-block px-6 py-2.5 border border-primary text-primary rounded-[var(--radius-pill)] text-[14px] font-medium hover:bg-primary hover:text-white transition-colors">
            {t("backHome")}
          </Link>
        </div>
      </div>
    );
  }

  if (error === "self_invite") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg p-6">
        <div className="w-full max-w-sm text-center bg-bg-subtle rounded-[var(--radius-lg)] p-8 space-y-4">
          <h2 className="text-[17px] font-heading text-text">{t("selfInviteTitle")}</h2>
          <p className="text-text-secondary text-[14px]">{t("selfInviteDesc")}</p>
        </div>
      </div>
    );
  }

  if (error || !invite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg p-6">
        <div className="w-full max-w-sm text-center bg-bg-subtle rounded-[var(--radius-lg)] p-8 space-y-4">
          <h2 className="text-[17px] font-heading text-text">{t("invalidTitle")}</h2>
          <p className="text-text-secondary text-[14px]">{t("invalidDesc")}</p>
        </div>
      </div>
    );
  }

  if (accepted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg p-6">
        <div className="w-full max-w-sm text-center bg-bg-subtle rounded-[var(--radius-lg)] p-8 space-y-4">
          <h2 className="text-[17px] font-heading text-text">{t("successTitle")}</h2>
          <p className="text-text-secondary text-[14px]">
            {t("successDesc", { name: invite.studentName })}
          </p>
          <Link href="/" className="inline-block px-6 py-2.5 bg-primary text-white rounded-[var(--radius-pill)] text-[14px] font-medium hover:bg-primary-hover transition-colors">
            {t("backHome")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-6">
      <div className="w-full max-w-sm text-center bg-bg-subtle rounded-[var(--radius-lg)] p-8 space-y-6">
        <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 text-primary flex items-center justify-center text-[24px] font-heading">
          {invite.studentName.charAt(0)}
        </div>
        <div>
          <h2 className="text-[17px] font-heading text-text mb-1">{invite.studentName}</h2>
          <p className="text-text-secondary text-[14px]">
            {t("invitedBy", { name: invite.inviterName })}
          </p>
        </div>

        {user ? (
          <button
            onClick={handleAccept}
            disabled={accepting}
            className="w-full bg-primary text-white rounded-[var(--radius-pill)] py-3 font-medium hover:bg-primary-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {accepting ? <><Spinner size={16} />{t("accepting")}</> : t("accept")}
          </button>
        ) : (
          <Link
            href={`/login?redirect=${encodeURIComponent(`/invite/accept?token=${token}`)}`}
            className="block w-full bg-primary text-white rounded-[var(--radius-pill)] py-3 font-medium hover:bg-primary-hover transition-colors text-center"
          >
            {t("loginToAccept")}
          </Link>
        )}
      </div>
    </div>
  );
}

export default function InviteAcceptPage() {
  return (
    <Suspense>
      <AcceptContent />
    </Suspense>
  );
}
