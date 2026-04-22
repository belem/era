"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useReviewQueue } from "@/hooks/useReviewQueue";
import { useStudent } from "@/hooks/useStudent";
import { createClient } from "@/lib/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { TabBar } from "@/components/TabBar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PoemCard } from "@/components/PoemCard";
import { getSeasonalTags, getCurrentSolarTerm } from "@/lib/seasonal";

interface SeasonalPoem {
  id: string;
  title: string;
  author: string;
  firstLine: string;
}

function SeasonalTeaser({ showFirstLine }: { showFirstLine: boolean }) {
  const t = useTranslations("home");
  const [poem, setPoem] = useState<SeasonalPoem | null>(null);
  const solarTerm = getCurrentSolarTerm();

  useEffect(() => {
    const supabase = createClient();
    const tags = getSeasonalTags();

    supabase
      .from("poems")
      .select("id, title, author, content_lines")
      .overlaps("tags", tags)
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data) {
          const lines = data.content_lines as any[];
          const firstLine = lines?.[0]?.chars?.map((c: any) => c.char).join("") ?? "";
          setPoem({
            id: data.id,
            title: data.title,
            author: data.author,
            firstLine: firstLine + (lines?.[0]?.punctuation ?? ""),
          });
        }
      });
  }, []);

  if (!poem) return null;

  return (
    <Link href={`/review?id=${poem.id}`} className="block border-y border-border-subtle py-3 mb-6">
      <div className="flex items-center gap-2 mb-1">
        <p className="text-[13px] tracking-[0.08em] text-text-secondary">
          {solarTerm.nameZh}
        </p>
        <span className="text-[11px] px-1.5 py-0.5 rounded-[var(--radius-sm)] bg-primary-soft text-primary">
          {t("seasonal")}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <span className="font-heading font-semibold text-[17px] text-text">
            {poem.title}
          </span>
          <span className="text-text-secondary text-[14px] ml-2">{poem.author}</span>
        </div>
        <svg className="w-4 h-4 text-text-tertiary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>
      {showFirstLine && (
        <p className="font-poetry text-[17px] text-text-secondary mt-1 truncate lg:whitespace-normal">
          {poem.firstLine}
        </p>
      )}
    </Link>
  );
}

export default function HomePage() {
  const t = useTranslations("home");
  const { student } = useStudent();
  const { poems, loading } = useReviewQueue();
  const [streak, setStreak] = useState(0);
  const showFirstLine = student?.settings_json?.show_first_line ?? false;

  useEffect(() => {
    if (!student) return;
    const supabase = createClient();
    supabase
      .from("streaks")
      .select("current_streak")
      .eq("student_id", student.id)
      .single()
      .then(({ data }) => {
        if (data) setStreak(data.current_streak);
      });
  }, [student]);

  return (
    <>
      <AppHeader />
      <ThemeToggle />
      <main className="flex-1 px-6 py-10 md:px-12 md:py-14 lg:px-20 xl:px-32">
        <h1 className="font-heading font-semibold text-[28px] leading-tight tracking-tight mb-1">
          {t("title")}
        </h1>
        <p className="text-[14px] text-text-tertiary tracking-tight mb-8 flex items-center gap-1.5">
          <img src="/icons/flame.svg" alt="" className="w-4 h-4" />
          <span>{t("streak", { days: streak })}</span>
        </p>

        <SeasonalTeaser showFirstLine={showFirstLine} />

        {loading ? (
          <div className="space-y-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-bg-subtle rounded-[var(--radius-lg)] animate-pulse" />
            ))}
          </div>
        ) : poems.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-text-tertiary text-[14px]">{t("empty")}</p>
          </div>
        ) : (
          <div className="space-y-1">
            {poems.map((poem) => (
              <PoemCard key={poem.id} poem={poem} hideFirstLine={!showFirstLine} />
            ))}
          </div>
        )}

        {!loading && poems.length > 0 && (
          <div className="mt-8">
            <Link
              href="/review"
              className="block w-full py-3 bg-primary text-white rounded-[var(--radius-pill)] text-center font-ui text-[17px] font-normal transition-colors hover:bg-primary-hover"
            >
              {t("startReview")}
            </Link>
          </div>
        )}
      </main>
      <TabBar />
    </>
  );
}
