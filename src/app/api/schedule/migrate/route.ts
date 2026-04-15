import { createServerSupabase } from "@/lib/supabase/server";
import { getAlgorithm } from "@/lib/srs/algorithm-factory";
import { NextResponse } from "next/server";
import { generalLimiter, checkRateLimit } from "@/lib/ratelimit";
import type { AlgorithmName, Rating } from "@/lib/srs/types";

export async function POST(request: Request) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limited = await checkRateLimit(generalLimiter, user.id);
  if (limited) return limited;

  const { studentId, algorithm: algoName } = await request.json() as {
    studentId: string;
    algorithm: AlgorithmName;
  };

  const algorithm = getAlgorithm(algoName);

  // Fetch all review events for this student, grouped by poem
  const { data: events, error: eventsError } = await supabase
    .from("review_events")
    .select("poem_id, rating, reviewed_at")
    .eq("student_id", studentId)
    .order("reviewed_at", { ascending: true });

  if (eventsError) {
    return NextResponse.json({ error: eventsError.message }, { status: 500 });
  }

  // Group events by poem
  const byPoem = new Map<string, { rating: Rating; reviewedAt: Date }[]>();
  for (const e of events ?? []) {
    const list = byPoem.get(e.poem_id) ?? [];
    list.push({ rating: e.rating as Rating, reviewedAt: new Date(e.reviewed_at) });
    byPoem.set(e.poem_id, list);
  }

  // Recalculate state for each poem using the new algorithm
  for (const [poemId, poemEvents] of byPoem) {
    const result = algorithm.migrateFromHistory(poemEvents);
    const { nextReviewAt, ...state } = result;

    await supabase
      .from("poem_reviews")
      .update({
        repetitions: state.repetitions as number,
        ease_factor: state.ease_factor as number,
        interval_days: state.interval_days as number,
        leitner_box: state.leitner_box as number,
        fsrs_stability: state.fsrs_stability as number | null,
        fsrs_difficulty: state.fsrs_difficulty as number | null,
        fsrs_reps: state.fsrs_reps as number,
        next_review_at: nextReviewAt.toISOString(),
      })
      .eq("student_id", studentId)
      .eq("poem_id", poemId);
  }

  return NextResponse.json({ success: true, migratedPoems: byPoem.size });
}
