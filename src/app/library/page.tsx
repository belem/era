"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { TabBar } from "@/components/TabBar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PoemCard } from "@/components/PoemCard";
import type { Poem } from "@/types/poem";

export default function LibraryPage() {
  const t = useTranslations("library");
  const [poems, setPoems] = useState<Poem[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <>
      <AppHeader />
      <ThemeToggle />
      <main className="flex-1 px-6 py-10 max-w-[980px] mx-auto w-full">
        <h1 className="font-heading font-semibold text-[28px] leading-tight tracking-tight mb-8">
          {t("title")}
        </h1>
        {loading ? (
          <div className="space-y-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-bg-subtle rounded-[var(--radius-lg)] animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-1 md:grid md:grid-cols-2 md:gap-2 md:space-y-0 lg:grid-cols-3">
            {poems.map((poem) => (
              <PoemCard key={poem.id} poem={poem} />
            ))}
          </div>
        )}
      </main>
      <TabBar />
    </>
  );
}
