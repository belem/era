import { createServerSupabase } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// POST: start or end a listening session
export async function POST(request: Request) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  if (body.action === "start") {
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
