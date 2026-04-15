import { createServerSupabase } from "@/lib/supabase/server";
import { getAlgorithm } from "@/lib/srs/algorithm-factory";
import { NextResponse } from "next/server";
import { scheduleLimiter, checkRateLimit } from "@/lib/ratelimit";
import type { Rating, AlgorithmName } from "@/lib/srs/types";

export async function POST(request: Request) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { studentId, poemId, rating } = await request.json() as {
    studentId: string;
    poemId: string;
    rating: Rating;
  };

  const limited = await checkRateLimit(scheduleLimiter, studentId);
  if (limited) return limited;

  // Fetch student to get active algorithm
  const { data: student, error: studentError } = await supabase
    .from("students")
    .select("algorithm")
    .eq("id", studentId)
    .single();

  if (studentError || !student) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  const algorithmName = student.algorithm as AlgorithmName;
  const algorithm = getAlgorithm(algorithmName);

  // Fetch current review state (or create fresh)
  const { data: existing } = await supabase
    .from("poem_reviews")
    .select("*")
    .eq("student_id", studentId)
    .eq("poem_id", poemId)
    .single();

  const currentState = existing
    ? {
        repetitions: existing.repetitions,
        ease_factor: existing.ease_factor,
        interval_days: existing.interval_days,
        leitner_box: existing.leitner_box,
        fsrs_stability: existing.fsrs_stability,
        fsrs_difficulty: existing.fsrs_difficulty,
        fsrs_reps: existing.fsrs_reps,
      }
    : algorithm.defaultState();

  const lastReview = existing?.last_reviewed_at
    ? new Date(existing.last_reviewed_at)
    : new Date();

  const { nextReviewAt, updatedState } = algorithm.schedule(currentState, rating, lastReview);

  // Dual write: append to review_events + upsert poem_reviews
  const eventInsert = supabase
    .from("review_events")
    .insert({
      student_id: studentId,
      poem_id: poemId,
      algorithm: algorithmName,
      rating,
    });

  const reviewUpsert = supabase
    .from("poem_reviews")
    .upsert(
      {
        student_id: studentId,
        poem_id: poemId,
        rating,
        repetitions: updatedState.repetitions as number,
        ease_factor: updatedState.ease_factor as number,
        interval_days: updatedState.interval_days as number,
        leitner_box: updatedState.leitner_box as number,
        fsrs_stability: updatedState.fsrs_stability as number | null,
        fsrs_difficulty: updatedState.fsrs_difficulty as number | null,
        fsrs_reps: updatedState.fsrs_reps as number,
        next_review_at: nextReviewAt.toISOString(),
        last_reviewed_at: new Date().toISOString(),
      },
      { onConflict: "student_id,poem_id" }
    );

  const [eventResult, reviewResult] = await Promise.all([eventInsert, reviewUpsert]);

  if (eventResult.error) {
    return NextResponse.json({ error: eventResult.error.message }, { status: 500 });
  }
  if (reviewResult.error) {
    return NextResponse.json({ error: reviewResult.error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, nextReview: nextReviewAt.toISOString() });
}
