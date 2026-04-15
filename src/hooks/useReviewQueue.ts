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
      .select("*, poems(*)")
      .eq("student_id", student.id)
      .lte("next_review_at", new Date().toISOString())
      .order("next_review_at", { ascending: true })
      .then(({ data }) => {
        if (data) {
          // Map Supabase response to match existing Poem interface
          const mapped: Poem[] = data
            .filter((r: any) => r.poems)
            .map((r: any) => ({
              id: r.poems.id,
              title: r.poems.title,
              author: r.poems.author,
              dynasty: r.poems.dynasty,
              grade: r.poems.grade_level,
              lines: r.poems.content_lines,
            }));
          setPoems(mapped);
        }
        setLoading(false);
      });
  }, [student]);

  return { poems, loading };
}
