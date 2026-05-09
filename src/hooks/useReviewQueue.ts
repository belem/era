"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useStudent } from "./useStudent";
import type { Poem } from "@/types/poem";

const POEM_CACHE_KEY = "kuibu:poems:v1";

function readPoemCache(): Record<string, Poem> {
  try {
    // Migrate: remove old unversioned key
    localStorage.removeItem("kuibu:poems");
    const raw = localStorage.getItem(POEM_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function writePoemCache(cache: Record<string, Poem>) {
  try { localStorage.setItem(POEM_CACHE_KEY, JSON.stringify(cache)); } catch { /* quota */ }
}

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
      // Only fetch poem metadata (id, title, author, dynasty) — skip content_lines here
      supabase
        .from("poem_reviews")
        .select("student_id, poem_id, custom_poem_id, repetitions, last_reviewed_at, next_review_at, sort_order, poems(id, title, author, dynasty), custom_poems(id, title, author, dynasty, content_lines)")
        .eq("student_id", student.id)
        .lte("next_review_at", new Date().toISOString())
        .order("sort_order", { ascending: true })
        .order("next_review_at", { ascending: true }),
      supabase
        .from("review_events")
        .select("poem_id")
        .eq("student_id", student.id)
        .gte("reviewed_at", todayStart.toISOString()),
    ]).then(async ([{ data: reviews }, { data: todayEvents }]) => {
      if (!reviews) { setLoading(false); return; }

      const studiedTodayIds = new Set(
        (todayEvents ?? []).map((e: any) => e.poem_id).filter(Boolean)
      );

      const due: any[] = [];
      const fresh: any[] = [];
      for (const r of reviews) {
        if (r.repetitions > 0 || r.last_reviewed_at) due.push(r);
        else fresh.push(r);
      }

      const newStudiedToday = fresh.filter((r: any) => studiedTodayIds.has(r.poem_id)).length;
      const newSlots = Math.max(0, maxNew - newStudiedToday);
      const combined = [...due, ...fresh.slice(0, newSlots)].slice(0, maxTotal)
        .filter((r: any) => r.poems || r.custom_poems);

      // Check which poem IDs are missing from localStorage cache
      const poemCache = readPoemCache();
      const missingIds = combined
        .filter((r: any) => r.poems && !poemCache[r.poems.id])
        .map((r: any) => r.poems.id);

      // Batch-fetch only the missing content_lines
      if (missingIds.length > 0) {
        const { data: poemData } = await supabase
          .from("poems")
          .select("id, content_lines")
          .in("id", missingIds);

        if (poemData) {
          for (const p of poemData) {
            // We'll fill in the full poem object after merging with metadata
            poemCache[p.id] = { ...poemCache[p.id], lines: p.content_lines };
          }
        }
      }

      const mapped: Poem[] = combined.map((r: any) => {
        const meta = r.poems ?? r.custom_poems;
        const cached = r.poems ? poemCache[meta.id] : null;
        const poem: Poem = {
          id: meta.id,
          title: meta.title,
          author: meta.author ?? "",
          dynasty: meta.dynasty ?? "",
          lines: cached?.lines ?? meta.content_lines,
          isCustom: !r.poems,
        };
        // Update cache with latest metadata
        if (r.poems) poemCache[meta.id] = poem;
        return poem;
      });

      writePoemCache(poemCache);
      setPoems(mapped);
      setLoading(false);
    });
  }, [student]);

  return { poems, loading };
}
