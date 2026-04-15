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

  const { data: decks, error } = await supabase
    .from("fragment_decks")
    .select("*, fragments(count)")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Get due counts per deck
  const now = new Date().toISOString();
  const { data: dueCounts } = await supabase
    .from("fragment_reviews")
    .select("fragment_id, fragments!inner(deck_id)")
    .eq("student_id", studentId)
    .lte("next_review_at", now);

  const dueByDeck: Record<string, number> = {};
  for (const r of dueCounts ?? []) {
    const deckId = (r as any).fragments?.deck_id;
    if (deckId) dueByDeck[deckId] = (dueByDeck[deckId] ?? 0) + 1;
  }

  const result = (decks ?? []).map((d: any) => ({
    id: d.id,
    student_id: d.student_id,
    name: d.name,
    description: d.description,
    color: d.color,
    created_at: d.created_at,
    fragment_count: d.fragments?.[0]?.count ?? 0,
    due_count: dueByDeck[d.id] ?? 0,
  }));

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limitedPost = await checkRateLimit(generalLimiter, user.id);
  if (limitedPost) return limitedPost;

  const body = await request.json();
  const { studentId, name, description, color } = body;

  const { data, error } = await supabase
    .from("fragment_decks")
    .insert({ student_id: studentId, name, description, color })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
