"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

interface InviteData {
  studentName: string;
  inviterName: string;
}

function AcceptContent() {
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

    // Check auth status and validate token
    Promise.all([
      supabase.auth.getUser(),
      supabase
        .from("guardian_invitations")
        .select("*, students(name), profiles!guardian_invitations_invited_by_fkey(display_name)")
        .eq("token", token)
        .single(),
    ]).then(([{ data: { user: authUser } }, { data: invitation, error: invError }]) => {
      setUser(authUser);

      if (invError || !invitation) {
        setError("not_found");
      } else if (invitation.accepted_at) {
        setError("already_linked");
      } else if (new Date(invitation.expires_at) < new Date()) {
        setError("expired");
      } else {
        setInvite({
          studentName: (invitation as any).students?.name ?? "Student",
          inviterName: (invitation as any).profiles?.display_name ?? "Someone",
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
        <p className="text-text-tertiary text-[14px]">Validating invitation...</p>
      </div>
    );
  }

  if (error === "expired") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg p-6">
        <div className="w-full max-w-sm text-center bg-bg-subtle rounded-[var(--radius-lg)] p-8 space-y-4">
          <h2 className="text-[17px] font-heading text-text">Invitation Expired</h2>
          <p className="text-text-secondary text-[14px]">
            Ask {invite?.inviterName ?? "the inviter"} to send a new one.
          </p>
        </div>
      </div>
    );
  }

  if (error === "already_linked") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg p-6">
        <div className="w-full max-w-sm text-center bg-bg-subtle rounded-[var(--radius-lg)] p-8 space-y-4">
          <h2 className="text-[17px] font-heading text-text">Already Connected</h2>
          <p className="text-text-secondary text-[14px]">
            You're already connected to this student.
          </p>
          <Link href="/" className="inline-block px-6 py-2.5 border border-primary text-primary rounded-[var(--radius-pill)] text-[14px] font-medium hover:bg-primary hover:text-white transition-colors">
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  if (error === "self_invite") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg p-6">
        <div className="w-full max-w-sm text-center bg-bg-subtle rounded-[var(--radius-lg)] p-8 space-y-4">
          <h2 className="text-[17px] font-heading text-text">Can't Accept</h2>
          <p className="text-text-secondary text-[14px]">
            You can't accept your own invitation.
          </p>
        </div>
      </div>
    );
  }

  if (error || !invite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg p-6">
        <div className="w-full max-w-sm text-center bg-bg-subtle rounded-[var(--radius-lg)] p-8 space-y-4">
          <h2 className="text-[17px] font-heading text-text">Invalid Invitation</h2>
          <p className="text-text-secondary text-[14px]">This invitation link is not valid.</p>
        </div>
      </div>
    );
  }

  if (accepted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg p-6">
        <div className="w-full max-w-sm text-center bg-bg-subtle rounded-[var(--radius-lg)] p-8 space-y-4">
          <h2 className="text-[17px] font-heading text-text">Connected!</h2>
          <p className="text-text-secondary text-[14px]">
            You are now linked to {invite.studentName}.
          </p>
          <Link href="/" className="inline-block px-6 py-2.5 bg-primary text-white rounded-[var(--radius-pill)] text-[14px] font-medium hover:bg-primary-hover transition-colors">
            Go to Home
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
            Invited by {invite.inviterName}
          </p>
        </div>

        {user ? (
          <button
            onClick={handleAccept}
            disabled={accepting}
            className="w-full bg-primary text-white rounded-[var(--radius-pill)] py-3 font-medium hover:bg-primary-hover transition-colors disabled:opacity-50"
          >
            {accepting ? "..." : "Accept Invitation"}
          </button>
        ) : (
          <Link
            href={`/login?redirect=/invite/accept?token=${token}`}
            className="block w-full bg-primary text-white rounded-[var(--radius-pill)] py-3 font-medium hover:bg-primary-hover transition-colors text-center"
          >
            Create Account to Accept
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
