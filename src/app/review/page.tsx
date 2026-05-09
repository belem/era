"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useReviewQueue } from "@/hooks/useReviewQueue";
import { useStudent } from "@/hooks/useStudent";
import { createClient } from "@/lib/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { CardReview } from "@/components/CardReview";
import { LivingScroll } from "@/components/LivingScroll";
import { SessionSummary } from "@/components/SessionSummary";
import type { Poem } from "@/types/poem";
import { formatEdition, type PoemEdition } from "@/lib/format";

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
  const [mode, setMode] = useState<"card" | "scroll">("scroll");
  const [sessionComplete, setSessionComplete] = useState(false);
  const [sessionRatings, setSessionRatings] = useState<SessionRating[]>([]);
  const [editions, setEditions] = useState<PoemEdition[]>([]);
  const [exiting, setExiting] = useState(false);

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
      .select("edition, school_system, grade, semester, page")
      .eq("poem_id", poem.id)
      .then(({ data }) => setEditions(data ?? []));
  }, [poem?.id]);

  const handleRate = useCallback(async (rating: "forgot" | "hard" | "good" | "easy") => {
    if (exiting) return;
    setExiting(true);
    if (student && poem) {
      setSessionRatings((prev) => [...prev, { poemId: poem.id, rating }]);
      const scheduleBody: Record<string, string> = { studentId: student.id, rating, reviewMode: mode };
      if (poem.isCustom) scheduleBody.customPoemId = poem.id;
      else scheduleBody.poemId = poem.id;
      await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scheduleBody),
      });
    }
    setExiting(false);
    if (currentIndex < poems.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setSessionComplete(true);
    }
  }, [student, poem, currentIndex, poems.length, exiting]);

  if (loading) {
    return (
      <>
        <AppHeader />
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

      {/* Chinese ink transition overlay */}
      {exiting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="absolute inset-0 bg-bg/60" />
          <svg width="200" height="200" viewBox="0 0 200 200" className="relative">
            {/* Ensō — calligraphy ink ring */}
            <circle
              cx="100" cy="100" r="68"
              fill="none"
              stroke="var(--primary)"
              strokeWidth="5"
              strokeLinecap="round"
              className="ink-ring"
            />
            {/* 梅花 plum blossom — 5 petals + golden center */}
            <g className="plum-group">
              <ellipse cx="100" cy="82" rx="9" ry="13" fill="var(--primary)" opacity="0.85" />
              <ellipse cx="100" cy="82" rx="9" ry="13" fill="var(--primary)" opacity="0.85" transform="rotate(72 100 100)" />
              <ellipse cx="100" cy="82" rx="9" ry="13" fill="var(--primary)" opacity="0.85" transform="rotate(144 100 100)" />
              <ellipse cx="100" cy="82" rx="9" ry="13" fill="var(--primary)" opacity="0.85" transform="rotate(216 100 100)" />
              <ellipse cx="100" cy="82" rx="9" ry="13" fill="var(--primary)" opacity="0.85" transform="rotate(288 100 100)" />
              <circle cx="100" cy="100" r="7" fill="var(--primary)" opacity="0.95" />
            </g>
          </svg>
        </div>
      )}

      <main className="flex-1 px-6 py-6 md:px-12 md:py-14 lg:px-[20%] xl:px-[28%]">
        <div key={currentIndex} className={exiting ? "animate-poem-out" : "animate-poem-in"}>
          {mode === "card" ? (
            <CardReview poem={poem} onRate={handleRate} />
          ) : (
            <LivingScroll poem={poem} onComplete={handleRate} />
          )}
        </div>

        <div className="flex items-center justify-between mt-4 mb-4">
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

        {editions.length > 0 && (
          <div className="flex flex-wrap justify-center gap-x-3 gap-y-0.5 mt-3 max-w-[480px] mx-auto">
            {editions.map((ed, i) => (
              <span key={i} className="text-[11px] text-text-tertiary">
                {formatEdition(ed)}
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
