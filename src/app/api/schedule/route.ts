import { createServerSupabase } from "@/lib/supabase/server";
import { sm2, nextReviewDate } from "@/lib/srs/sm2";
import { NextResponse } from "next/server";
import type { Rating } from "@/lib/srs/sm2";

export async function POST(request: Request) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { studentId, poemId, rating } = await request.json() as {
    studentId: string;
    poemId: string;
    rating: Rating;
  };

  // Fetch current review state (or create fresh)
  const { data: existing } = await supabase
    .from("poem_reviews")
    .select("*")
    .eq("student_id", studentId)
    .eq("poem_id", poemId)
    .single();

  const currentState = existing
    ? { repetitions: existing.repetitions, easeFactor: existing.ease_factor, interval: existing.interval_days }
    : { repetitions: 0, easeFactor: 2.5, interval: 0 };

  const newState = sm2(currentState, rating);
  const nextReview = nextReviewDate(new Date(), newState.interval);

  const reviewData = {
    student_id: studentId,
    poem_id: poemId,
    rating,
    repetitions: newState.repetitions,
    ease_factor: newState.easeFactor,
    interval_days: newState.interval,
    next_review_at: nextReview.toISOString(),
    last_reviewed_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("poem_reviews")
    .upsert(reviewData, { onConflict: "student_id,poem_id" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, nextReview: nextReview.toISOString() });
}
