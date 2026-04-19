import { createServerSupabase } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { generalLimiter, checkRateLimit } from "@/lib/ratelimit";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ fragmentId: string }> }
) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limited = await checkRateLimit(generalLimiter, user.id);
  if (limited) return limited;

  const { fragmentId } = await params;
  const body = await request.json();
  const { front, back, tags } = body;

  const { data, error } = await supabase
    .from("fragments")
    .update({ front, back, tags })
    .eq("id", fragmentId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ fragmentId: string }> }
) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limitedDel = await checkRateLimit(generalLimiter, user.id);
  if (limitedDel) return limitedDel;

  const { fragmentId } = await params;

  const { error } = await supabase
    .from("fragments")
    .delete()
    .eq("id", fragmentId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
