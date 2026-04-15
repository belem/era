"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useReviewQueue } from "@/hooks/useReviewQueue";
import { useStudent } from "@/hooks/useStudent";
import { AppHeader } from "@/components/AppHeader";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CardReview } from "@/components/CardReview";
import { LivingScroll } from "@/components/LivingScroll";
import { SessionSummary } from "@/components/SessionSummary";

interface SessionRating {
  poemId: string;
  rating: "forgot" | "hard" | "good" | "easy";
}

function ReviewContent() {
  const t = useTranslations("review");
  const searchParams = useSearchParams();
  const poemId = searchParams.get("id");
  const { student } = useStudent();
  const { poems, loading } = useReviewQueue();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [mode, setMode] = useState<"card" | "scroll">("card");
  const [sessionComplete, setSessionComplete] = useState(false);
  const [sessionRatings, setSessionRatings] = useState<SessionRating[]>([]);

  // Set initial index when poems load and poemId is present
  useEffect(() => {
    if (!loading && poems.length > 0 && poemId) {
      const idx = poems.findIndex((p) => p.id === poemId);
      if (idx >= 0) {
        setCurrentIndex(idx);
      }
    }
  }, [loading, poems, poemId]);

  const poem = poems[currentIndex];

  const handleRate = useCallback(async (rating: "forgot" | "hard" | "good" | "easy") => {
    if (student && poem) {
      setSessionRatings((prev) => [...prev, { poemId: poem.id, rating }]);
      await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: student.id,
          poemId: poem.id,
          rating,
        }),
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
      <main className="flex-1 px-6 py-10 max-w-[600px] mx-auto w-full">
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
