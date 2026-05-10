import { requireAdmin } from "@/lib/admin";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { error, supabase } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = parseInt(searchParams.get("limit") ?? "50", 10);
  const search = searchParams.get("q") ?? "";
  const edition = searchParams.get("edition");
  const schoolSystem = searchParams.get("school_system");
  const grade = searchParams.get("grade");

  let query = supabase!
    .from("poems")
    .select("id, title, author, dynasty, tags, poem_editions(edition, school_system, grade, semester, page)", { count: "exact" })
    .order("title", { ascending: true })
    .range((page - 1) * limit, page * limit - 1);

  if (search) {
    const sanitized = search.replace(/[.,()]/g, "");
    query = query.or(`title.ilike.%${sanitized}%,author.ilike.%${sanitized}%`);
  }

  if (edition || schoolSystem || grade) {
    let editionFilter = supabase!
      .from("poem_editions")
      .select("poem_id");
    if (edition) editionFilter = editionFilter.eq("edition", edition);
    if (schoolSystem) editionFilter = editionFilter.eq("school_system", schoolSystem);
    if (grade) editionFilter = editionFilter.eq("grade", parseInt(grade, 10));

    const { data: matchingIds } = await editionFilter;
    if (matchingIds && matchingIds.length > 0) {
      query = query.in("id", matchingIds.map((r: any) => r.poem_id));
    } else {
      return NextResponse.json({ poems: [], total: 0, page, limit });
    }
  }

  const { data, error: queryError, count } = await query;
  if (queryError) return NextResponse.json({ error: queryError.message }, { status: 500 });

  return NextResponse.json({ poems: data, total: count, page, limit });
}

export async function POST(request: Request) {
  const { error, supabase } = await requireAdmin();
  if (error) return error;

  const body = await request.json();
  const { title, author, dynasty, content_lines, tags, editions } = body;

  if (!title || !author || !dynasty || !content_lines) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { data, error: insertError } = await supabase!
    .from("poems")
    .insert({ title, author, dynasty, content_lines, tags: tags ?? [] })
    .select()
    .single();

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

  if (editions && Array.isArray(editions) && editions.length > 0) {
    const rows = editions.map((e: { edition: string; school_system: string; grade: number; semester?: string | null; page?: number | null }) => ({
      poem_id: data.id,
      edition: e.edition,
      school_system: e.school_system,
      grade: e.grade,
      semester: e.semester ?? null,
      page: e.page ?? null,
    }));
    const { error: edError } = await supabase!
      .from("poem_editions")
      .insert(rows);
    if (edError) return NextResponse.json({ error: edError.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
