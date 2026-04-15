import { createServerSupabase } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { studentId } = await request.json() as { studentId: string };

  // Fetch all badge definitions and existing unlocks
  const [{ data: badges }, { data: unlocked }] = await Promise.all([
    supabase.from("badges").select("*"),
    supabase
      .from("badge_unlocks")
      .select("badge_id")
      .eq("student_id", studentId),
  ]);

  if (!badges) return NextResponse.json({ newBadges: [] });

  const unlockedIds = new Set(unlocked?.map((u) => u.badge_id) ?? []);
  const newBadges: { id: string; name: string }[] = [];

  for (const badge of badges) {
    if (unlockedIds.has(badge.id)) continue;

    let earned = false;

    switch (badge.criteria_type) {
      case "scroll_count": {
        const { count } = await supabase
          .from("scroll_completions")
          .select("id", { count: "exact", head: true })
          .eq("student_id", studentId);
        earned = (count ?? 0) >= badge.criteria_value;
        break;
      }
      case "streak_days": {
        const { data: streak } = await supabase
          .from("streaks")
          .select("current_streak, longest_streak")
          .eq("student_id", studentId)
          .single();
        const longest = Math.max(streak?.current_streak ?? 0, streak?.longest_streak ?? 0);
        earned = longest >= badge.criteria_value;
        break;
      }
      case "review_count": {
        const { count } = await supabase
          .from("review_events")
          .select("id", { count: "exact", head: true })
          .eq("student_id", studentId);
        earned = (count ?? 0) >= badge.criteria_value;
        break;
      }
      case "grade_mastered": {
        // Check if all poems in any single grade have been reviewed with "good" or "easy" at least once
        // Simplified: count distinct poems reviewed vs total poems per grade
        const { data: student } = await supabase
          .from("students")
          .select("grade")
          .eq("id", studentId)
          .single();
        if (student) {
          const [{ count: totalPoems }, { count: reviewedPoems }] = await Promise.all([
            supabase
              .from("poems")
              .select("id", { count: "exact", head: true })
              .eq("grade_level", student.grade),
            supabase
              .from("poem_reviews")
              .select("poem_id", { count: "exact", head: true })
              .eq("student_id", studentId)
              .gte("repetitions", 3),
          ]);
          earned = (totalPoems ?? 0) > 0 && (reviewedPoems ?? 0) >= (totalPoems ?? 0);
        }
        break;
      }
    }

    if (earned) {
      await supabase
        .from("badge_unlocks")
        .insert({ student_id: studentId, badge_id: badge.id });
      newBadges.push({ id: badge.id, name: badge.name });
    }
  }

  return NextResponse.json({ newBadges });
}
