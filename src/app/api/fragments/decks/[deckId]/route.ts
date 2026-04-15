import { createServerSupabase } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { generalLimiter, checkRateLimit } from "@/lib/ratelimit";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ deckId: string }> }
) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limited = await checkRateLimit(generalLimiter, user.id);
  if (limited) return limited;

  const { deckId } = await params;
  const body = await request.json();

  const { data, error } = await supabase
    .from("fragment_decks")
    .update(body)
    .eq("id", deckId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ deckId: string }> }
) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limitedDel = await checkRateLimit(generalLimiter, user.id);
  if (limitedDel) return limitedDel;

  const { deckId } = await params;

  const { error } = await supabase
    .from("fragment_decks")
    .delete()
    .eq("id", deckId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
