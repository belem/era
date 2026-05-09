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
  const deckId = searchParams.get("deckId");
  const studentId = searchParams.get("studentId");

  if (!studentId) return NextResponse.json({ error: "Missing studentId" }, { status: 400 });

  let query = supabase
    .from("fragments")
    .select("id, deck_id, student_id, front, back, tags, created_at")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });

  if (deckId) query = query.eq("deck_id", deckId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limitedPost = await checkRateLimit(generalLimiter, user.id);
  if (limitedPost) return limitedPost;

  const body = await request.json();
  const { studentId, deckId, front, back, tags } = body;

  // Insert fragment
  const { data: fragment, error } = await supabase
    .from("fragments")
    .insert({ student_id: studentId, deck_id: deckId, front, back, tags: tags ?? [] })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Create initial review state
  await supabase.from("fragment_reviews").insert({
    student_id: studentId,
    fragment_id: fragment.id,
  });

  return NextResponse.json(fragment, { status: 201 });
}
