import { createServerSupabase } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { pinyinLimiter, checkRateLimit } from "@/lib/ratelimit";

/**
 * Generate pinyin for Chinese text.
 * Uses pypinyin via a Python subprocess.
 * Rate limited: 10 requests/minute per authenticated user.
 */
export async function POST(request: Request) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limited = await checkRateLimit(pinyinLimiter, user.id);
  if (limited) return limited;

  // Check tier (custom poems is paid)
  const { data: userData } = await supabase
    .from("users")
    .select("plan")
    .eq("id", user.id)
    .single();

  if (!userData || (userData.plan !== "PRO" && userData.plan !== "MAX" && userData.plan !== "ADMIN")) {
    return NextResponse.json({ error: "Requires Pro or Max plan" }, { status: 403 });
  }

  const { text } = await request.json();
  if (!text || typeof text !== "string") {
    return NextResponse.json({ error: "Missing text" }, { status: 400 });
  }

  try {
    // Try pypinyin via Python subprocess
    const { execSync } = await import("child_process");
    const escaped = text.replace(/'/g, "\\'");
    const cmd = `python3 -c "from pypinyin import pinyin, Style; import json; result = pinyin('${escaped}', style=Style.TONE); print(json.dumps(result))"`;
    const output = execSync(cmd, { timeout: 5000, encoding: "utf-8" });
    const result = JSON.parse(output.trim());

    // Convert [[p1], [p2], ...] to flat array
    const flat: string[] = result.map((r: string[]) => r[0]);

    return NextResponse.json({ pinyin: flat });
  } catch {
    // Fallback: return empty pinyin array (user can enter manually)
    return NextResponse.json({ pinyin: [], fallback: true });
  }
}
