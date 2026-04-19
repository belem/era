import { requireAdmin } from "@/lib/admin";
import { NextResponse } from "next/server";

export async function GET() {
  const { error, supabase } = await requireAdmin();
  if (error) return error;

  const [poems, users, students, reviews] = await Promise.all([
    supabase!.from("poems").select("id", { count: "exact", head: true }),
    supabase!.from("users").select("id", { count: "exact", head: true }),
    supabase!.from("students").select("id", { count: "exact", head: true }),
    supabase!.from("review_events").select("id", { count: "exact", head: true }),
  ]);

  return NextResponse.json({
    totalPoems: poems.count ?? 0,
    totalUsers: users.count ?? 0,
    totalStudents: students.count ?? 0,
    totalReviewEvents: reviews.count ?? 0,
  });
}
