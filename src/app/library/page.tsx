"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { usePoetrySearch } from "@/hooks/usePoetrySearch";
import { AppHeader } from "@/components/AppHeader";
import { TabBar } from "@/components/TabBar";
import { PoemCard } from "@/components/PoemCard";
import type { Poem } from "@/types/poem";
import type { PoemEdition } from "@/lib/format";

interface PoemWithEditions extends Poem {
  editions: PoemEdition[];
}

function curriculumOrder(e: PoemEdition): number {
  const base = (e.school_system === "高中" ? 100 : 0) + (e.grade ?? 0);
  return base * 10 + (e.semester === "下册" ? 1 : 0);
}

function minCurriculumOrder(editions: PoemEdition[]): number {
  if (editions.length === 0) return 999;
  return Math.min(...editions.map(curriculumOrder));
}

function MultiSelect({
  label,
  options,
  selected,
  onToggle,
  renderOption,
}: {
  label: string;
  options: string[];
  selected: Set<string>;
  onToggle: (val: string) => void;
  renderOption?: (val: string) => string;
}) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span className="text-[12px] text-text-tertiary mr-0.5">{label}</span>
      {options.map((opt) => {
        const active = selected.has(opt);
        return (
          <button
            key={opt}
            onClick={() => onToggle(opt)}
            className={`px-2.5 py-1 text-[12px] rounded-[var(--radius-pill)] border transition-colors ${
              active
                ? "border-primary text-primary bg-primary-soft"
                : "border-border text-text-tertiary hover:text-text-secondary hover:border-text-tertiary"
            }`}
          >
            {renderOption ? renderOption(opt) : opt}
          </button>
        );
      })}
    </div>
  );
}

export default function LibraryPage() {
  const t = useTranslations("library");
  const [poems, setPoems] = useState<PoemWithEditions[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const { search, ready } = usePoetrySearch();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedQuery, setDebouncedQuery] = useState("");

  const [selectedEditions, setSelectedEditions] = useState<Set<string>>(new Set());
  const [selectedSchoolSystems, setSelectedSchoolSystems] = useState<Set<string>>(new Set());
  const [selectedGrades, setSelectedGrades] = useState<Set<string>>(new Set());

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("poems")
      .select("*, poem_editions(edition, school_system, grade, semester, page)")
      .then(({ data }) => {
        if (data) {
          const mapped: PoemWithEditions[] = data.map((p: any) => ({
            id: p.id,
            title: p.title,
            author: p.author,
            dynasty: p.dynasty,
            lines: p.content_lines,
            editions: (p.poem_editions ?? []).map((e: any) => ({
              edition: e.edition,
              school_system: e.school_system,
              grade: e.grade,
              semester: e.semester,
              page: e.page,
            })),
          }));
          mapped.sort((a, b) => {
            const aMin = minCurriculumOrder(a.editions);
            const bMin = minCurriculumOrder(b.editions);
            if (aMin !== bMin) return aMin - bMin;
            return a.title.localeCompare(b.title, "zh");
          });
          setPoems(mapped);
        }
        setLoading(false);
      });
  }, []);

  const { allEditions, allSchoolSystems } = useMemo(() => {
    const edSet = new Set<string>();
    const ssSet = new Set<string>();
    for (const p of poems) {
      for (const e of p.editions) {
        edSet.add(e.edition);
        ssSet.add(e.school_system);
      }
    }
    return {
      allEditions: [...edSet].sort(),
      allSchoolSystems: [...ssSet].sort(),
    };
  }, [poems]);

  const allGrades = useMemo(() => {
    const onlyGaozhong = selectedSchoolSystems.size > 0
      && selectedSchoolSystems.has("高中")
      && !selectedSchoolSystems.has("六三")
      && !selectedSchoolSystems.has("五四");
    const max = onlyGaozhong ? 3 : 9;
    return Array.from({ length: max }, (_, i) => String(i + 1));
  }, [selectedSchoolSystems]);

  useEffect(() => {
    const gradeSet = new Set(allGrades);
    setSelectedGrades((prev) => {
      const next = new Set([...prev].filter((g) => gradeSet.has(g)));
      return next.size === prev.size ? prev : next;
    });
  }, [allGrades]);

  const handleQueryChange = useCallback((val: string) => {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQuery(val), 150);
  }, []);

  const toggle = useCallback((set: Set<string>, setFn: React.Dispatch<React.SetStateAction<Set<string>>>, val: string) => {
    setFn((prev) => {
      const next = new Set(prev);
      if (next.has(val)) next.delete(val);
      else next.add(val);
      return next;
    });
  }, []);

  const hasFilters = selectedEditions.size > 0 || selectedSchoolSystems.size > 0 || selectedGrades.size > 0;

  const filtered = useMemo(() => {
    let result = poems;

    if (debouncedQuery.trim() && ready) {
      const hits = search(debouncedQuery, 50);
      const hitIds = new Set(hits.map((h) => h.id));
      result = result.filter((p) => hitIds.has(p.id));
    }

    if (hasFilters) {
      result = result.filter((p) => {
        if (p.editions.length === 0) return false;
        return p.editions.some((e) => {
          if (selectedEditions.size > 0 && !selectedEditions.has(e.edition)) return false;
          if (selectedSchoolSystems.size > 0 && !selectedSchoolSystems.has(e.school_system)) return false;
          if (selectedGrades.size > 0 && (e.grade == null || !selectedGrades.has(String(e.grade)))) return false;
          return true;
        });
      });
    }

    return result;
  }, [debouncedQuery, ready, search, poems, hasFilters, selectedEditions, selectedSchoolSystems, selectedGrades]);

  return (
    <>
      <AppHeader />
      <main className="flex-1 px-6 py-10 md:px-12 md:py-14 lg:px-20 xl:px-32">
        <h1 className="font-heading font-semibold text-[28px] leading-tight tracking-tight mb-4">
          {t("title")}
        </h1>

        <div className="mb-4 relative">
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

        {!loading && (allEditions.length > 0 || allSchoolSystems.length > 0 || allGrades.length > 0) && (
          <div className="flex flex-col gap-2 mb-6">
            {allEditions.length > 1 && (
              <MultiSelect
                label={t("edition")}
                options={allEditions}
                selected={selectedEditions}
                onToggle={(v) => toggle(selectedEditions, setSelectedEditions, v)}
              />
            )}
            {allSchoolSystems.length > 1 && (
              <MultiSelect
                label={t("schoolSystem")}
                options={allSchoolSystems}
                selected={selectedSchoolSystems}
                onToggle={(v) => toggle(selectedSchoolSystems, setSelectedSchoolSystems, v)}
                renderOption={(v) => v === "高中" ? "高中" : `${v}学制`}
              />
            )}
            {allGrades.length > 1 && (
              <MultiSelect
                label={t("grade")}
                options={allGrades}
                selected={selectedGrades}
                onToggle={(v) => toggle(selectedGrades, setSelectedGrades, v)}
                renderOption={(v) => t(`grade${v}`)}
              />
            )}
          </div>
        )}

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
          <div className="space-y-1 md:grid md:grid-cols-2 md:gap-2 md:space-y-0 lg:gap-4 lg:grid-cols-3 xl:gap-8 xl:grid-cols-4">
            {filtered.map((poem) => (
              <PoemCard key={poem.id} poem={poem} editions={poem.editions} />
            ))}
          </div>
        )}
      </main>
      <TabBar />
    </>
  );
}
