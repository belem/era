import { requireAdmin } from "@/lib/admin";
import { NextResponse } from "next/server";

export async function PATCH(request: Request, { params }: { params: Promise<{ poemId: string }> }) {
  const { error, supabase } = await requireAdmin();
  if (error) return error;

  const { poemId } = await params;
  const body = await request.json();

  const updates: Record<string, unknown> = {};
  if (body.title !== undefined) updates.title = body.title;
  if (body.author !== undefined) updates.author = body.author;
  if (body.dynasty !== undefined) updates.dynasty = body.dynasty;
  if (body.content_lines !== undefined) updates.content_lines = body.content_lines;
  if (body.tags !== undefined) updates.tags = body.tags;

  if (Object.keys(updates).length > 0) {
    const { error: updateError } = await supabase!
      .from("poems")
      .update(updates)
      .eq("id", poemId);

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  if (body.editions !== undefined && Array.isArray(body.editions)) {
    if (body.editions.length > 0) {
      const rows = body.editions.map((e: { edition: string; level: string; grade: number }) => ({
        poem_id: poemId,
        edition: e.edition,
        level: e.level,
        grade: e.grade,
      }));
      const { error: edError } = await supabase!
        .from("poem_editions")
        .upsert(rows, { onConflict: "poem_id,edition,level,grade" });
      if (edError) return NextResponse.json({ error: edError.message }, { status: 500 });
    }
    // Remove editions not in the new set
    const keepPairs = body.editions.map((e: { edition: string; level: string; grade: number }) =>
      `${e.edition}|${e.level}|${e.grade}`
    );
    const { data: existing } = await supabase!
      .from("poem_editions")
      .select("id, edition, level, grade")
      .eq("poem_id", poemId);
    const toDelete = (existing ?? [])
      .filter((e: any) => !keepPairs.includes(`${e.edition}|${e.level}|${e.grade}`))
      .map((e: any) => e.id);
    if (toDelete.length > 0) {
      await supabase!.from("poem_editions").delete().in("id", toDelete);
    }
  }

  const { data } = await supabase!
    .from("poems")
    .select("*, poem_editions(*)")
    .eq("id", poemId)
    .single();

  return NextResponse.json(data);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ poemId: string }> }) {
  const { error, supabase } = await requireAdmin();
  if (error) return error;

  const { poemId } = await params;

  const { error: deleteError } = await supabase!
    .from("poems")
    .delete()
    .eq("id", poemId);

  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });
  return NextResponse.json({ deleted: true });
}
