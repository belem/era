import { createServerSupabase } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { generalLimiter, checkRateLimit } from "@/lib/ratelimit";
import { sendEmail } from "@/lib/email";

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

  const acceptUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://kuibu.app"}/invite/accept?token=${invitation.token}`;

  await sendEmail({
    to: email,
    subject: "您已被邀请加入跬步",
    html: `
      <p>您已被邀请协助管理一位学生在跬步上的古诗词学习。</p>
      <p><a href="${acceptUrl}">接受邀请</a></p>
      <p>此链接将在 7 天后过期。</p>
    `,
    text: `您已被邀请协助管理一位学生在跬步上的古诗词学习。\n\n接受邀请: ${acceptUrl}\n\n此链接将在 7 天后过期。`,
  });
  // Email failure is non-fatal — invitation row already exists, recipient
  // can be reminded later from the family settings page.

  return NextResponse.json({ success: true });
}
