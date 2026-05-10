import { createServerSupabase } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

/** Service-role client — bypasses RLS. Only use in verified-admin routes. */
function createServiceClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey
  );
}

export async function requireAdmin() {
  // Verify identity using the user's own session (subject to RLS — correct for auth check)
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }), supabase: null, user: null };
  }

  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!userData || userData.role !== "ADMIN") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }), supabase: null, user: null };
  }

  // Return service-role client so admin queries can read all rows across RLS
  try {
    return { error: null, supabase: createServiceClient(), user };
  } catch (e) {
    console.error("[requireAdmin] Failed to create service client:", e);
    return { error: NextResponse.json({ error: "Server misconfiguration" }, { status: 500 }), supabase: null, user: null };
  }
}
