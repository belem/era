import { createServerSupabase } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { generalLimiter, checkRateLimit } from "@/lib/ratelimit";
import { hasPlan, tierConfig, type Plan } from "@/lib/tier";

export async function POST(request: Request) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limited = await checkRateLimit(generalLimiter, user.id);
  if (limited) return limited;

  // Fetch user plan
  const { data: userData } = await supabase
    .from("users")
    .select("plan")
    .eq("id", user.id)
    .single();

  const plan: Plan = (userData?.plan as Plan) ?? "FREE";

  // Count existing students owned by this user
  const { count } = await supabase
    .from("student_guardians")
    .select("student_id", { count: "exact", head: true })
    .eq("guardian_id", user.id)
    .eq("role", "OWNER");

  const current = count ?? 0;
  const limit = tierConfig.maxStudents[plan];

  if (current >= limit) {
    return NextResponse.json(
      { error: `Student limit reached for ${plan} plan (${limit} students)` },
      { status: 403 }
    );
  }

  const body = await request.json();
  const { name, schoolSystem, grade, edition, algorithm } = body;

  if (!name?.trim() || !schoolSystem || !grade || !edition) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { data: student, error: studentError } = await supabase
    .from("students")
    .insert({
      name: name.trim(),
      school_system: schoolSystem,
      grade,
      edition,
      algorithm: algorithm ?? "SM2",
      created_by: user.id,
    })
    .select()
    .single();

  if (studentError) return NextResponse.json({ error: studentError.message }, { status: 500 });

  const { error: guardianError } = await supabase
    .from("student_guardians")
    .insert({
      student_id: student.id,
      guardian_id: user.id,
      role: "OWNER",
      accepted_at: new Date().toISOString(),
    });

  if (guardianError) {
    // Roll back the student insert
    await supabase.from("students").delete().eq("id", student.id);
    return NextResponse.json({ error: guardianError.message }, { status: 500 });
  }

  return NextResponse.json(student, { status: 201 });
}
