import { requireAdmin } from "@/lib/admin";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { error, supabase } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = parseInt(searchParams.get("limit") ?? "50", 10);

  const { data: users, error: usersError, count } = await supabase!
    .from("users")
    .select("id, role, plan, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (usersError) return NextResponse.json({ error: usersError.message }, { status: 500 });
  if (!users || users.length === 0) return NextResponse.json({ users: [], total: count ?? 0, page, limit });

  // Fetch profiles separately to avoid FK join issues with the service role client
  const ids = users.map((u: { id: string }) => u.id);
  const { data: profiles } = await supabase!
    .from("profiles")
    .select("id, display_name, username, locale")
    .in("id", ids);

  const profileMap = Object.fromEntries((profiles ?? []).map((p: { id: string; display_name: string | null; username: string | null; locale: string }) => [p.id, p]));

  const merged = users.map((u: { id: string; role: string; plan: string; created_at: string }) => ({
    ...u,
    profiles: profileMap[u.id] ?? null,
  }));

  return NextResponse.json({ users: merged, total: count ?? 0, page, limit });
}
