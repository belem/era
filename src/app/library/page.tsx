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
      .order("title", { ascending: true })
      .then(({ data }) => {
        if (data) {
          setPoems(
            data.map((p: any) => ({
              id: p.id,
              title: p.title,
              author: p.author,
              dynasty: p.dynasty,
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

        <div className="mb-6 relative">
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-text-tertiary pointer-events-none"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="w-full border border-border rounded-[var(--radius-md)] bg-bg pl-10 pr-10 py-3 text-text placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {query && (
            <button
              onClick={() => { setQuery(""); setDebouncedQuery(""); }}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full bg-bg-muted hover:bg-border transition-colors"
              aria-label="Clear search"
            >
              <svg className="w-3 h-3 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
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
