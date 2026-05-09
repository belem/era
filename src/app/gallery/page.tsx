"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { useStudent } from "@/hooks/useStudent";
import { AppHeader } from "@/components/AppHeader";
import { TabBar } from "@/components/TabBar";
import { ChopStamp } from "@/components/ChopStamp";
import Link from "next/link";

interface ScrollEntry {
  id: string;
  completedAt: string;
  poem: {
    title: string;
    author: string;
    dynasty: string;
    firstLine: string;
  };
}

export default function GalleryPage() {
  const t = useTranslations("gallery");
  const { student } = useStudent();
  const [scrolls, setScrolls] = useState<ScrollEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!student) {
      setLoading(false);
      return;
    }

    const supabase = createClient();
    supabase
      .from("scroll_completions")
      .select("id, completed_at, poems(title, author, dynasty, content_lines)")
      .eq("student_id", student.id)
      .order("completed_at", { ascending: false })
      .then(({ data }) => {
        if (data) {
          setScrolls(
            data
              .filter((d: any) => d.poems)
              .map((d: any) => {
                const lines = d.poems.content_lines ?? [];
                const firstLine = lines[0]?.chars?.map((c: any) => c.char).join("") ?? "";
                return {
                  id: d.id,
                  completedAt: d.completed_at,
                  poem: {
                    title: d.poems.title,
                    author: d.poems.author,
                    dynasty: d.poems.dynasty,
                    firstLine: firstLine + (lines[0]?.punctuation ?? ""),
                  },
                };
              })
          );
        }
        setLoading(false);
      });
  }, [student]);

  return (
    <>
      <AppHeader />
      <main className="flex-1 px-6 py-10 md:px-12 md:py-14 lg:px-20 xl:px-32">
        <h1 className="font-heading font-semibold text-[28px] leading-tight tracking-tight mb-8">
          {t("title")}
        </h1>

        {loading ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-[160px] bg-bg-subtle rounded-[var(--radius-lg)] animate-pulse"
              />
            ))}
          </div>
        ) : scrolls.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <ChopStamp name="卷" size={72} className="opacity-30 !border-text-tertiary !text-text-tertiary" />
            <h2 className="font-heading font-semibold text-[21px] tracking-tight mt-6 mb-2">
              {t("emptyTitle")}
            </h2>
            <p className="text-text-secondary text-[14px] mb-6">
              {t("emptyDesc")}
            </p>
            <Link
              href="/review?mode=scroll"
              className="px-6 py-2.5 border border-primary text-primary rounded-[var(--radius-pill)] text-[14px] font-medium hover:bg-primary hover:text-white transition-colors"
            >
              {t("startScroll")}
            </Link>
          </div>
        ) : (
          /* Gallery cards */
          <div className="grid grid-cols-2 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {scrolls.map((scroll) => (
              <div
                key={scroll.id}
                className="bg-bg-subtle rounded-[var(--radius-lg)] p-4 relative"
                role="listitem"
                aria-label={scroll.poem.title}
              >
                {/* ChopStamp */}
                <div className="absolute top-2 right-2">
                  <ChopStamp name={student?.name.charAt(0) ?? "学"} size={48} />
                </div>

                <h3 className="font-heading font-semibold text-[17px] text-text tracking-tight mb-0.5 pr-14">
                  {scroll.poem.title}
                </h3>
                <p className="text-[14px] text-text-secondary mb-2">
                  {scroll.poem.author} · {scroll.poem.dynasty}
                </p>
                <p className="font-poetry text-[16px] text-text-secondary line-clamp-2 mb-3">
                  {scroll.poem.firstLine}
                </p>
                <p className="text-[12px] text-text-tertiary">
                  {new Date(scroll.completedAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </main>
      <TabBar />
    </>
  );
}
