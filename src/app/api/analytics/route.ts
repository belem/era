import { createServerSupabase } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { generalLimiter, checkRateLimit } from "@/lib/ratelimit";

export async function GET(request: Request) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limited = await checkRateLimit(generalLimiter, user.id);
  if (limited) return limited;

  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get("studentId");
  if (!studentId) return NextResponse.json({ error: "Missing studentId" }, { status: 400 });

  // 1. Review events for the past 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: events } = await supabase
    .from("review_events")
    .select("poem_id, rating, reviewed_at")
    .eq("student_id", studentId)
    .gte("reviewed_at", thirtyDaysAgo.toISOString())
    .order("reviewed_at", { ascending: true });

  // 2. Current SRS state for all poems
  const { data: reviews } = await supabase
    .from("poem_reviews")
    .select("poem_id, rating, interval_days, ease_factor, next_review_at, poems(title, grade_level)")
    .eq("student_id", studentId);

  // 3. Streak data
  const { data: streak } = await supabase
    .from("streaks")
    .select("current_streak, longest_streak")
    .eq("student_id", studentId)
    .single();

  // 4. Fragment review events (same 30 days)
  const { data: fragmentEvents } = await supabase
    .from("fragment_review_events")
    .select("fragment_id, rating, reviewed_at")
    .eq("student_id", studentId)
    .gte("reviewed_at", thirtyDaysAgo.toISOString());

  // 5. Listening sessions
  const { data: listeningSessions } = await supabase
    .from("listening_sessions")
    .select("mode, started_at, duration_seconds, poems_played, poems_rated")
    .eq("student_id", studentId)
    .gte("started_at", thirtyDaysAgo.toISOString());

  // Compute daily heatmap
  const dailyMap: Record<string, number> = {};
  for (const e of events ?? []) {
    const day = e.reviewed_at.slice(0, 10);
    dailyMap[day] = (dailyMap[day] ?? 0) + 1;
  }
  for (const e of fragmentEvents ?? []) {
    const day = e.reviewed_at.slice(0, 10);
    dailyMap[day] = (dailyMap[day] ?? 0) + 1;
  }

  // Generate 30-day array
  const heatmap: { date: string; count: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    heatmap.push({ date: key, count: dailyMap[key] ?? 0 });
  }

  // Rating distribution
  const ratingDist = { forgot: 0, hard: 0, good: 0, easy: 0 };
  for (const e of events ?? []) {
    if (e.rating in ratingDist) ratingDist[e.rating as keyof typeof ratingDist]++;
  }

  // Per-poem mastery: poems with interval > 21 days = "mastered"
  const poemMastery = (reviews ?? []).map((r: any) => ({
    poemId: r.poem_id,
    title: r.poems?.title ?? "Unknown",
    grade: r.poems?.grade_level ?? 0,
    intervalDays: r.interval_days,
    mastered: r.interval_days >= 21,
    nextReview: r.next_review_at,
  }));

  const masteredCount = poemMastery.filter((p) => p.mastered).length;
  const totalPoems = poemMastery.length;

  // Listening stats
  const totalListeningMinutes = Math.round(
    (listeningSessions ?? []).reduce((sum, s) => sum + (s.duration_seconds ?? 0), 0) / 60
  );
  const passiveMinutes = Math.round(
    (listeningSessions ?? []).filter((s) => s.mode === "passive").reduce((sum, s) => sum + (s.duration_seconds ?? 0), 0) / 60
  );
  const activeMinutes = totalListeningMinutes - passiveMinutes;

  return NextResponse.json({
    heatmap,
    ratingDist,
    poemMastery,
    masteredCount,
    totalPoems,
    streak: streak ?? { current_streak: 0, longest_streak: 0 },
    totalReviews: (events ?? []).length + (fragmentEvents ?? []).length,
    listening: { totalMinutes: totalListeningMinutes, passiveMinutes, activeMinutes },
  });
}
