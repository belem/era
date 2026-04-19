"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useStudent } from "./useStudent";
import type { Poem } from "@/types/poem";

export function useReviewQueue() {
  const { student } = useStudent();
  const [poems, setPoems] = useState<Poem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!student) {
      setLoading(false);
      return;
    }

    const settings = student.settings_json as {
      new_poems_per_day?: number;
      max_reviews_per_session?: number;
    } | undefined;
    const maxNew = settings?.new_poems_per_day ?? 3;
    const maxTotal = settings?.max_reviews_per_session ?? 15;

    const supabase = createClient();

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    Promise.all([
      supabase
        .from("poem_reviews")
        .select("*, poems(*), custom_poems(*)")
        .eq("student_id", student.id)
        .lte("next_review_at", new Date().toISOString())
        .order("sort_order", { ascending: true })
        .order("next_review_at", { ascending: true }),
      supabase
        .from("review_events")
        .select("poem_id")
        .eq("student_id", student.id)
        .gte("reviewed_at", todayStart.toISOString()),
    ]).then(([{ data: reviews }, { data: todayEvents }]) => {
      if (!reviews) {
        setLoading(false);
        return;
      }

      const studiedTodayIds = new Set(
        (todayEvents ?? []).map((e: any) => e.poem_id).filter(Boolean)
      );

      const due: any[] = [];
      const fresh: any[] = [];

      for (const r of reviews) {
        if (r.repetitions > 0 || r.last_reviewed_at) {
          due.push(r);
        } else {
          fresh.push(r);
        }
      }

      const newStudiedToday = fresh.filter(
        (r: any) => studiedTodayIds.has(r.poem_id)
      ).length;
      const newSlots = Math.max(0, maxNew - newStudiedToday);
      const newPoems = fresh.slice(0, newSlots);

      const combined = [...due, ...newPoems].slice(0, maxTotal);

      const mapped: Poem[] = combined
        .filter((r: any) => r.poems || r.custom_poems)
        .map((r: any) => {
          const p = r.poems ?? r.custom_poems;
          return {
            id: p.id,
            title: p.title,
            author: p.author ?? "",
            dynasty: p.dynasty ?? "",
            lines: p.content_lines,
            isCustom: !r.poems,
          };
        });
      setPoems(mapped);
      setLoading(false);
    });
  }, [student]);

  return { poems, loading };
}
