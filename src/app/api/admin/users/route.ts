import { requireAdmin } from "@/lib/admin";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { error, supabase } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = parseInt(searchParams.get("limit") ?? "50", 10);

  const { data, error: queryError, count } = await supabase!
    .from("users")
    .select("id, role, plan, created_at, profiles(display_name, username, locale)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (queryError) return NextResponse.json({ error: queryError.message }, { status: 500 });
  return NextResponse.json({ users: data, total: count, page, limit });
}
