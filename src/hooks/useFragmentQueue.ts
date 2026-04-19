"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useStudent } from "./useStudent";
import type { Fragment } from "@/types/fragment";

export function useFragmentQueue(deckId?: string) {
  const { student } = useStudent();
  const [fragments, setFragments] = useState<Fragment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!student) {
      setLoading(false);
      return;
    }

    const supabase = createClient();

    let query = supabase
      .from("fragment_reviews")
      .select("*, fragments(*)")
      .eq("student_id", student.id)
      .lte("next_review_at", new Date().toISOString())
      .order("next_review_at", { ascending: true });

    if (deckId) {
      query = query.eq("fragments.deck_id", deckId);
    }

    query.then(({ data }) => {
      if (data) {
        const mapped: Fragment[] = data
          .filter((r: any) => r.fragments)
          .map((r: any) => ({
            id: r.fragments.id,
            deck_id: r.fragments.deck_id,
            student_id: r.fragments.student_id,
            front: r.fragments.front,
            back: r.fragments.back,
            tags: r.fragments.tags ?? [],
            created_at: r.fragments.created_at,
          }));
        setFragments(mapped);
      }
      setLoading(false);
    });
  }, [student, deckId]);

  return { fragments, loading };
}
