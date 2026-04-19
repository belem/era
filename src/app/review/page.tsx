"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useReviewQueue } from "@/hooks/useReviewQueue";
import { useStudent } from "@/hooks/useStudent";
import { createClient } from "@/lib/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CardReview } from "@/components/CardReview";
import { LivingScroll } from "@/components/LivingScroll";
import { SessionSummary } from "@/components/SessionSummary";
import type { Poem } from "@/types/poem";

const CN_NUM = ["", "一", "二", "三", "四", "五", "六", "七", "八", "九"];

function formatGrade(level: string, grade: number | null): string {
  const g = grade != null ? CN_NUM[grade] ?? String(grade) : null;
  if (level === "初中" && g) return `初${g}`;
  if (level === "高中" && g) return `高${g}`;
  if (g) return `${level} · ${g}年级`;
  return level;
}

interface SessionRating {
  poemId: string;
  rating: "forgot" | "hard" | "good" | "easy";
}

function ReviewContent() {
  const t = useTranslations("review");
  const searchParams = useSearchParams();
  const poemId = searchParams.get("id");
  const { student } = useStudent();
  const { poems: queuePoems, loading: queueLoading } = useReviewQueue();

  const [poems, setPoems] = useState<Poem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mode, setMode] = useState<"card" | "scroll">("card");
  const [sessionComplete, setSessionComplete] = useState(false);
  const [sessionRatings, setSessionRatings] = useState<SessionRating[]>([]);
  const [editions, setEditions] = useState<{ edition: string; level: string; grade: number }[]>([]);

  useEffect(() => {
    if (queueLoading) return;

    if (poemId) {
      const inQueue = queuePoems.find((p) => p.id === poemId);
      if (inQueue) {
        const idx = queuePoems.indexOf(inQueue);
        setPoems(queuePoems);
        setCurrentIndex(idx);
        setLoading(false);
      } else {
        const supabase = createClient();
        supabase
          .from("poems")
          .select("id, title, author, dynasty, content_lines")
          .eq("id", poemId)
          .single()
          .then(({ data }) => {
            if (data) {
              const poem: Poem = {
                id: data.id,
                title: data.title,
                author: data.author,
                dynasty: data.dynasty,
                lines: data.content_lines as Poem["lines"],
              };
              setPoems([poem]);
              setCurrentIndex(0);
            }
            setLoading(false);
          });
      }
    } else {
      setPoems(queuePoems);
      setLoading(false);
    }
  }, [queueLoading, queuePoems, poemId]);

  const poem = poems[currentIndex];

  useEffect(() => {
    if (!poem?.id) { setEditions([]); return; }
    const supabase = createClient();
    supabase
      .from("poem_editions")
      .select("edition, level, grade")
      .eq("poem_id", poem.id)
      .then(({ data }) => setEditions(data ?? []));
  }, [poem?.id]);

  const handleRate = useCallback(async (rating: "forgot" | "hard" | "good" | "easy") => {
    if (student && poem) {
      setSessionRatings((prev) => [...prev, { poemId: poem.id, rating }]);
      const scheduleBody: Record<string, string> = { studentId: student.id, rating };
      if (poem.isCustom) scheduleBody.customPoemId = poem.id;
      else scheduleBody.poemId = poem.id;
      await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scheduleBody),
      });
    }
    if (currentIndex < poems.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setSessionComplete(true);
    }
  }, [student, poem, currentIndex, poems.length]);

  if (loading) {
    return (
      <>
        <AppHeader />
        <ThemeToggle />
        <main className="flex-1 flex items-center justify-center px-6 py-20">
          <div className="text-text-tertiary text-[14px]">Loading...</div>
        </main>
      </>
    );
  }

  if (poems.length === 0) {
    return (
      <>
        <AppHeader />
        <ThemeToggle />
        <main className="flex-1 flex items-center justify-center px-6 py-20 text-center">
          <p className="text-text-tertiary text-[14px]">No poems to review</p>
        </main>
      </>
    );
  }

  if (sessionComplete && student) {
    return (
      <>
        <AppHeader />
        <main className="flex-1 flex items-center justify-center">
          <SessionSummary
            studentId={student.id}
            studentName={student.name}
            ratings={sessionRatings}
          />
        </main>
      </>
    );
  }

  return (
    <>
      <AppHeader />
      <ThemeToggle />
      <main className="flex-1 px-6 py-10 md:px-12 md:py-14 lg:px-[20%] xl:px-[28%]">
        <div className="flex items-center justify-between mb-8">
          <p className="text-[12px] text-text-tertiary tracking-tight">
            {currentIndex + 1} / {poems.length}
          </p>
          <div className="flex gap-1.5">
            <button
              onClick={() => setMode("card")}
              className={`px-3.5 py-1.5 text-[12px] rounded-[var(--radius-pill)] border transition-colors ${
                mode === "card"
                  ? "border-primary text-primary bg-primary-soft"
                  : "border-border text-text-tertiary hover:text-text-secondary"
              }`}
            >
              {t("card")}
            </button>
            <button
              onClick={() => setMode("scroll")}
              className={`px-3.5 py-1.5 text-[12px] rounded-[var(--radius-pill)] border transition-colors ${
                mode === "scroll"
                  ? "border-primary text-primary bg-primary-soft"
                  : "border-border text-text-tertiary hover:text-text-secondary"
              }`}
            >
              {t("scroll")}
            </button>
          </div>
        </div>

        {mode === "card" ? (
          <CardReview poem={poem} onRate={handleRate} />
        ) : (
          <LivingScroll poem={poem} onComplete={handleRate} />
        )}

        {editions.length > 0 && (
          <div className="flex flex-wrap justify-center gap-x-3 gap-y-0.5 mt-4 max-w-[480px] mx-auto">
            {editions.map((ed, i) => (
              <span key={i} className="text-[11px] text-text-tertiary">
                {ed.edition}版 · {formatGrade(ed.level, ed.grade)}
              </span>
            ))}
          </div>
        )}
      </main>
    </>
  );
}

export default function ReviewPage() {
  return (
    <Suspense>
      <ReviewContent />
    </Suspense>
  );
}
