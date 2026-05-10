import { createServerSupabase } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { generalLimiter, checkRateLimit } from "@/lib/ratelimit";

// POST: start or end a listening session
export async function POST(request: Request) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limited = await checkRateLimit(generalLimiter, user.id);
  if (limited) return limited;

  const body = await request.json();

  if (body.action === "start") {
    // Verify student belongs to this user (RLS-enforced)
    const { data: studentCheck } = await supabase
      .from("students")
      .select("id")
      .eq("id", body.studentId)
      .single();
    if (!studentCheck) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { data, error } = await supabase
      .from("listening_sessions")
      .insert({
        student_id: body.studentId,
        mode: body.mode,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  }

  if (body.action === "end") {
    // Verify session belongs to this user via student ownership (RLS-enforced)
    const { data: sessionCheck } = await supabase
      .from("listening_sessions")
      .select("id, students!inner(id)")
      .eq("id", body.sessionId)
      .single();
    if (!sessionCheck) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { error } = await supabase
      .from("listening_sessions")
      .update({
        ended_at: new Date().toISOString(),
        poems_played: body.poemsPlayed ?? 0,
        poems_rated: body.poemsRated ?? 0,
        duration_seconds: body.durationSeconds ?? 0,
      })
      .eq("id", body.sessionId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
