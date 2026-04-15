import { createServerSupabase } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { studentId } = await request.json() as { studentId: string };

  // Get student settings for freeze
  const { data: student } = await supabase
    .from("students")
    .select("settings_json")
    .eq("id", studentId)
    .single();

  const settings = (student?.settings_json ?? {}) as {
    streak_freeze_enabled?: boolean;
    streak_freeze_used_this_week?: string | null;
  };

  // Compute streak from review_events
  // Get distinct review dates, ordered descending
  const { data: events } = await supabase
    .from("review_events")
    .select("reviewed_at")
    .eq("student_id", studentId)
    .order("reviewed_at", { ascending: false });

  if (!events || events.length === 0) {
    return NextResponse.json({ currentStreak: 0, longestStreak: 0 });
  }

  // Get distinct dates
  const dates = [...new Set(
    events.map((e) => new Date(e.reviewed_at).toISOString().split("T")[0])
  )].sort().reverse();

  const today = new Date().toISOString().split("T")[0];

  let streak = 0;
  let checkDate = new Date(today);
  let frozenThisWeek = false;

  // Check if today has a review
  if (dates[0] === today) {
    streak = 1;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  // Walk backward counting consecutive days
  for (let i = 0; i < 365; i++) {
    const dateStr = checkDate.toISOString().split("T")[0];
    if (dates.includes(dateStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else if (
      settings.streak_freeze_enabled &&
      !frozenThisWeek
    ) {
      // Use freeze for this gap
      frozenThisWeek = true;
      streak++; // Preserved by freeze
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  // Get existing longest streak
  const { data: existing } = await supabase
    .from("streaks")
    .select("longest_streak")
    .eq("student_id", studentId)
    .single();

  const longestStreak = Math.max(existing?.longest_streak ?? 0, streak);

  // Upsert streak record
  await supabase
    .from("streaks")
    .upsert({
      student_id: studentId,
      current_streak: streak,
      longest_streak: longestStreak,
      last_review_date: today,
    }, { onConflict: "student_id" });

  // Update freeze usage if we used it
  if (frozenThisWeek && !settings.streak_freeze_used_this_week) {
    await supabase
      .from("students")
      .update({
        settings_json: {
          ...settings,
          streak_freeze_used_this_week: today,
        },
      })
      .eq("id", studentId);
  }

  return NextResponse.json({
    currentStreak: streak,
    longestStreak,
    frozen: frozenThisWeek,
  });
}
