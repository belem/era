"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function useAuthGuard() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT" || event === "TOKEN_REFRESHED") {
        // On SIGNED_OUT, redirect to login
        if (event === "SIGNED_OUT") {
          router.push("/login");
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);
}
