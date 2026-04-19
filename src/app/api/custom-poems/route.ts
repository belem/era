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

  const { data, error } = await supabase
    .from("custom_poems")
    .select("*")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limitedPost = await checkRateLimit(generalLimiter, user.id);
  if (limitedPost) return limitedPost;

  // Check tier
  const { data: userData } = await supabase
    .from("users")
    .select("plan")
    .eq("id", user.id)
    .single();

  if (!userData || (userData.plan !== "PRO" && userData.plan !== "MAX" && userData.plan !== "ADMIN")) {
    return NextResponse.json({ error: "Requires Pro or Max plan" }, { status: 403 });
  }

  const body = await request.json();
  const { studentId, title, author, dynasty, contentLines, sourcePoemId } = body;

  const { data, error } = await supabase
    .from("custom_poems")
    .insert({
      created_by: user.id,
      student_id: studentId,
      title,
      author: author || null,
      dynasty: dynasty || null,
      content_lines: contentLines,
      source_poem_id: sourcePoemId || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from("poem_reviews").insert({
    student_id: studentId,
    custom_poem_id: data.id,
    source: "CUSTOM",
  });

  return NextResponse.json(data, { status: 201 });
}
