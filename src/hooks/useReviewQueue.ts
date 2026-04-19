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

    const supabase = createClient();

    supabase
      .from("poem_reviews")
      .select("*, poems(*), custom_poems(*)")
      .eq("student_id", student.id)
      .lte("next_review_at", new Date().toISOString())
      .order("sort_order", { ascending: true })
      .order("next_review_at", { ascending: true })
      .then(({ data }) => {
        if (data) {
          const mapped: Poem[] = data
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
        }
        setLoading(false);
      });
  }, [student]);

  return { poems, loading };
}
