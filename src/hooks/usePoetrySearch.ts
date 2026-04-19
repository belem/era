"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { searchPoems, getCachedIndex, buildIndex } from "@/lib/search";
import type { PoemIndex, SearchablePoem } from "@/lib/search";

/**
 * Lazily builds a FlexSearch index from all poems in Supabase,
 * then exposes a synchronous search function.
 */
export function usePoetrySearch() {
  const indexRef = useRef<PoemIndex | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      // reuse if already built
      const cached = getCachedIndex();
      if (cached) {
        indexRef.current = cached;
        if (!cancelled) setReady(true);
        return;
      }

      // fetch all poems once, then build index client-side
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data } = await supabase
        .from("poems")
        .select("id, title, author, dynasty, content_lines");

      if (cancelled) return;
      if (!data || data.length === 0) return;

      indexRef.current = buildIndex(data);
      setReady(true);
    }

    init();
    return () => { cancelled = true; };
  }, []);

  const search = useCallback(
    (query: string, limit = 8): SearchablePoem[] => {
      if (!indexRef.current || !query.trim()) return [];
      return searchPoems(indexRef.current, query, limit);
    },
    [],
  );

  return { search, ready };
}
