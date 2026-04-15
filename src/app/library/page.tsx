"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { usePoetrySearch } from "@/hooks/usePoetrySearch";
import { AppHeader } from "@/components/AppHeader";
import { TabBar } from "@/components/TabBar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PoemCard } from "@/components/PoemCard";
import type { Poem } from "@/types/poem";

export default function LibraryPage() {
  const t = useTranslations("library");
  const [poems, setPoems] = useState<Poem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const { search, ready } = usePoetrySearch();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("poems")
      .select("*")
      .order("grade_level", { ascending: true })
      .order("title", { ascending: true })
      .then(({ data }) => {
        if (data) {
          setPoems(
            data.map((p: any) => ({
              id: p.id,
              title: p.title,
              author: p.author,
              dynasty: p.dynasty,
              grade: p.grade_level,
              lines: p.content_lines,
            }))
          );
        }
        setLoading(false);
      });
  }, []);

  const handleQueryChange = useCallback((val: string) => {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQuery(val), 150);
  }, []);

  const filtered = useMemo(() => {
    if (!debouncedQuery.trim() || !ready) return poems;
    const hits = search(debouncedQuery, 50);
    const hitIds = new Set(hits.map((h) => h.id));
    return poems.filter((p) => hitIds.has(p.id));
  }, [debouncedQuery, ready, search, poems]);

  return (
    <>
      <AppHeader />
      <ThemeToggle />
      <main className="flex-1 px-6 py-10 max-w-[980px] mx-auto w-full">
        <h1 className="font-heading font-semibold text-[28px] leading-tight tracking-tight mb-4">
          {t("title")}
        </h1>

        <div className="mb-6">
          <input
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="w-full border border-border rounded-[var(--radius-md)] bg-bg px-4 py-3 text-text placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {loading ? (
          <div className="space-y-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-bg-subtle rounded-[var(--radius-lg)] animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-16 text-center text-text-tertiary text-[14px]">
            {t("noResults")}
          </p>
        ) : (
          <div className="space-y-1 md:grid md:grid-cols-2 md:gap-2 md:space-y-0 lg:grid-cols-3">
            {filtered.map((poem) => (
              <PoemCard key={poem.id} poem={poem} />
            ))}
          </div>
        )}
      </main>
      <TabBar />
    </>
  );
}
