import { createServerSupabase } from "@/lib/supabase/server";
import { generalLimiter, checkRateLimit } from "@/lib/ratelimit";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { studentId } = await request.json() as { studentId: string };
  if (!studentId) return NextResponse.json({ error: "Missing studentId" }, { status: 400 });

  const limited = await checkRateLimit(generalLimiter, user.id);
  if (limited) return limited;

  const { data: guardian } = await supabase
    .from("student_guardians")
    .select("role")
    .eq("student_id", studentId)
    .eq("guardian_id", user.id)
    .eq("role", "OWNER")
    .single();

  if (!guardian) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await supabase.rpc("reset_student_progress", {
    p_student_id: studentId,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
