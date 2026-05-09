import { createServerSupabase } from "@/lib/supabase/server";
import { getAlgorithm } from "@/lib/srs/algorithm-factory";
import { NextResponse } from "next/server";
import { scheduleLimiter, checkRateLimit } from "@/lib/ratelimit";
import type { Rating, AlgorithmName } from "@/lib/srs/types";

export async function POST(request: Request) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { studentId, poemId, customPoemId, rating, reviewMode } = await request.json() as {
    studentId: string;
    poemId?: string;
    customPoemId?: string;
    rating: Rating;
    reviewMode?: string;
  };

  if (!poemId && !customPoemId) {
    return NextResponse.json({ error: "Missing poemId or customPoemId" }, { status: 400 });
  }

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

  const reviewQuery = supabase
    .from("poem_reviews")
    .select("repetitions, ease_factor, interval_days, leitner_box, fsrs_stability, fsrs_difficulty, fsrs_reps, last_reviewed_at")
    .eq("student_id", studentId);

  if (poemId) reviewQuery.eq("poem_id", poemId);
  else reviewQuery.eq("custom_poem_id", customPoemId!);

  const { data: existing } = await reviewQuery.single();

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

  const eventData: Record<string, unknown> = {
    student_id: studentId,
    algorithm: algorithmName,
    rating,
  };
  if (poemId) eventData.poem_id = poemId;
  else eventData.custom_poem_id = customPoemId;

  const eventInsert = supabase.from("review_events").insert(eventData);

  const reviewData: Record<string, unknown> = {
    student_id: studentId,
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
  };
  if (poemId) reviewData.poem_id = poemId;
  else reviewData.custom_poem_id = customPoemId;

  const conflictKey = poemId ? "student_id,poem_id" : "student_id,custom_poem_id";
  const reviewUpsert = supabase
    .from("poem_reviews")
    .upsert(reviewData, { onConflict: conflictKey });

  const scrollInsert = reviewMode === "scroll" && poemId
    ? supabase.from("scroll_completions").insert({
        student_id: studentId,
        poem_id: poemId,
        review_mode: "scroll",
      })
    : null;

  const allOps = scrollInsert
    ? [eventInsert, reviewUpsert, scrollInsert]
    : [eventInsert, reviewUpsert];

  const [eventResult, reviewResult] = await Promise.all(allOps);

  if (eventResult.error) {
    return NextResponse.json({ error: eventResult.error.message }, { status: 500 });
  }
  if (reviewResult.error) {
    return NextResponse.json({ error: reviewResult.error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, nextReview: nextReviewAt.toISOString() });
}
