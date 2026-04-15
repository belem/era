import { createServerSupabase } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { generalLimiter, checkRateLimit } from "@/lib/ratelimit";

export async function POST(request: Request) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limited = await checkRateLimit(generalLimiter, user.id);
  if (limited) return limited;

  const { studentId, email } = await request.json() as {
    studentId: string;
    email: string;
  };

  // Prevent self-invite
  if (email === user.email) {
    return NextResponse.json({ error: "Cannot invite yourself" }, { status: 400 });
  }

  // Check for duplicate pending invitation
  const { data: existingInvite } = await supabase
    .from("guardian_invitations")
    .select("id")
    .eq("student_id", studentId)
    .eq("invited_email", email)
    .is("accepted_at", null)
    .gt("expires_at", new Date().toISOString())
    .single();

  if (existingInvite) {
    return NextResponse.json({ error: "An invitation is already pending for this email" }, { status: 400 });
  }

  // Create invitation
  const { data: invitation, error } = await supabase
    .from("guardian_invitations")
    .insert({
      student_id: studentId,
      invited_by: user.id,
      invited_email: email,
    })
    .select("token")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Send email via Resend (if configured and installed)
  if (process.env.RESEND_API_KEY) {
    try {
      // Dynamic import: resend is an optional dependency
      const resendModule = await import("resend" as string) as { Resend: new (key: string) => { emails: { send: (opts: Record<string, unknown>) => Promise<unknown> } } };
      const resend = new resendModule.Resend(process.env.RESEND_API_KEY);

      const acceptUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/invite/accept?token=${invitation.token}`;

      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || "Kuibu <noreply@kuibu.app>",
        to: email,
        subject: "You've been invited to Kuibu",
        html: `
          <p>You've been invited to help manage a student's poetry learning on Kuibu.</p>
          <p><a href="${acceptUrl}">Accept Invitation</a></p>
          <p>This link expires in 7 days.</p>
        `,
      });
    } catch {
      // Email send failed or resend not installed — invitation still created
    }
  }

  return NextResponse.json({ success: true, token: invitation.token });
}
