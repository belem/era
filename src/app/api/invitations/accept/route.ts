import { createServerSupabase } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { generalLimiter, checkRateLimit } from "@/lib/ratelimit";

export async function POST(request: Request) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limited = await checkRateLimit(generalLimiter, user.id);
  if (limited) return limited;

  const { token } = await request.json() as { token: string };

  // Find invitation
  const { data: invitation, error: invError } = await supabase
    .from("guardian_invitations")
    .select("*")
    .eq("token", token)
    .single();

  if (invError || !invitation) {
    return NextResponse.json({ error: "Invalid invitation" }, { status: 404 });
  }

  if (invitation.accepted_at) {
    return NextResponse.json({ error: "already accepted" }, { status: 400 });
  }

  if (new Date(invitation.expires_at) < new Date()) {
    return NextResponse.json({ error: "Invitation expired" }, { status: 400 });
  }

  if (invitation.invited_by === user.id) {
    return NextResponse.json({ error: "Cannot accept self invite" }, { status: 400 });
  }

  // Check if already linked
  const { data: existing } = await supabase
    .from("student_guardians")
    .select("guardian_id")
    .eq("student_id", invitation.student_id)
    .eq("guardian_id", user.id)
    .single();

  if (existing) {
    return NextResponse.json({ error: "already linked" }, { status: 400 });
  }

  // Link guardian to student
  const { error: linkError } = await supabase
    .from("student_guardians")
    .insert({
      student_id: invitation.student_id,
      guardian_id: user.id,
      role: "VIEWER",
      accepted_at: new Date().toISOString(),
    });

  if (linkError) {
    return NextResponse.json({ error: linkError.message }, { status: 500 });
  }

  // Mark invitation as accepted
  await supabase
    .from("guardian_invitations")
    .update({ accepted_at: new Date().toISOString() })
    .eq("id", invitation.id);

  return NextResponse.json({ success: true });
}
