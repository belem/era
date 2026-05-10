import { requireAdmin } from "@/lib/admin";
import { NextResponse } from "next/server";

export async function GET() {
  const { error, supabase } = await requireAdmin();
  if (error) return error;

  const [poems, users, students, reviews] = await Promise.all([
    supabase!.from("poems").select("*", { count: "exact", head: true }),
    supabase!.from("users").select("*", { count: "exact", head: true }),
    supabase!.from("students").select("*", { count: "exact", head: true }),
    supabase!.from("review_events").select("*", { count: "exact", head: true }),
  ]);

  if (users.error) console.error("[admin/stats] users:", users.error.message);
  if (students.error) console.error("[admin/stats] students:", students.error.message);
  if (reviews.error) console.error("[admin/stats] reviews:", reviews.error.message);

  return NextResponse.json({
    totalPoems: poems.count ?? 0,
    totalUsers: users.count ?? 0,
    totalStudents: students.count ?? 0,
    totalReviewEvents: reviews.count ?? 0,
  });
}
