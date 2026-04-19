"use client";

import { useState, useCallback, use } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useStudent } from "@/hooks/useStudent";
import { useFragmentQueue } from "@/hooks/useFragmentQueue";
import { AppHeader } from "@/components/AppHeader";
import { ThemeToggle } from "@/components/ThemeToggle";
import { RatingButtons } from "@/components/RatingButtons";

export default function FragmentReviewPage({ params }: { params: Promise<{ deckId: string }> }) {
  const { deckId } = use(params);
  const t = useTranslations("fragments");
  const tRating = useTranslations("review");
  const { student } = useStudent();
  const { fragments, loading } = useFragmentQueue(deckId);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [ratings, setRatings] = useState<{ forgot: number; hard: number; good: number; easy: number }>({
    forgot: 0, hard: 0, good: 0, easy: 0,
  });

  const fragment = fragments[currentIndex];

  const handleRate = useCallback(async (rating: "forgot" | "hard" | "good" | "easy") => {
    if (!student || !fragment) return;

    setRatings((prev) => ({ ...prev, [rating]: prev[rating] + 1 }));

    await fetch("/api/fragments/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId: student.id,
        fragmentId: fragment.id,
        rating,
      }),
    });

    if (currentIndex < fragments.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setRevealed(false);
    } else {
      setSessionComplete(true);
    }
  }, [student, fragment, currentIndex, fragments.length]);

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

  if (fragments.length === 0) {
    return (
      <>
        <AppHeader />
        <ThemeToggle />
        <main className="flex-1 flex items-center justify-center px-6 py-20 text-center">
          <div>
            <p className="text-text-tertiary text-[14px] mb-4">{t("noDue")}</p>
            <Link href={`/fragments/${deckId}`} className="text-primary text-[14px] hover:underline">
              {t("backToDeck")}
            </Link>
          </div>
        </main>
      </>
    );
  }

  if (sessionComplete) {
    const total = ratings.forgot + ratings.hard + ratings.good + ratings.easy;
    return (
      <>
        <AppHeader />
        <main className="flex-1 flex items-center justify-center px-6 py-20">
          <div className="max-w-[360px] mx-auto text-center space-y-6">
            <h2 className="font-heading font-semibold text-[21px] text-text">
              {t("reviewComplete")}
            </h2>
            <p className="text-[14px] text-text-secondary">
              {t("reviewedCount", { count: total })}
            </p>
            <div className="space-y-2">
              {(["forgot", "hard", "good", "easy"] as const).map((r) => {
                const count = ratings[r];
                const pct = total > 0 ? (count / total) * 100 : 0;
                return (
                  <div key={r} className="flex items-center gap-3">
                    <span className="text-[13px] text-text-secondary w-12 text-right">{tRating(r)}</span>
                    <div className="flex-1 h-2 bg-bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: r === "easy" ? "#34c759" : r === "good" ? "#0071e3" : r === "hard" ? "#ff9500" : "#ff3b30",
                        }}
                      />
                    </div>
                    <span className="text-[12px] text-text-tertiary w-6">{count}</span>
                  </div>
                );
              })}
            </div>
            <Link
              href={`/fragments/${deckId}`}
              className="block w-full py-3 bg-primary text-white rounded-[var(--radius-pill)] text-center font-ui text-[17px] transition-colors hover:bg-primary-hover"
            >
              {t("done")}
            </Link>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <AppHeader />
      <ThemeToggle />
      <main className="flex-1 px-6 py-10 md:px-12 md:py-14 lg:px-[20%] xl:px-[28%]">
        <p className="text-[12px] text-text-tertiary tracking-tight mb-8">
          {currentIndex + 1} / {fragments.length}
        </p>

        <div className="bg-bg-subtle rounded-[var(--radius-lg)] overflow-hidden p-8 text-center min-h-[240px] flex flex-col items-center justify-center">
          <p className="text-[20px] text-text font-medium mb-6">{fragment.front}</p>

          {revealed ? (
            <div className="space-y-6 w-full animate-[fadeIn_0.3s_ease]">
              <div className="h-px bg-border" />
              <p className="text-[17px] text-text-secondary">{fragment.back}</p>
              <RatingButtons onRate={handleRate} />
            </div>
          ) : (
            <button
              onClick={() => setRevealed(true)}
              className="w-full py-3 bg-primary text-white rounded-[var(--radius-md)] font-ui text-[17px] transition-colors hover:bg-primary-hover"
            >
              {t("showAnswer")}
            </button>
          )}
        </div>
      </main>
    </>
  );
}
