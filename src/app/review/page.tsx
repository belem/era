"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { poems } from "@/data/poems";
import { AppHeader } from "@/components/AppHeader";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CardReview } from "@/components/CardReview";
import { LivingScroll } from "@/components/LivingScroll";

function ReviewContent() {
  const searchParams = useSearchParams();
  const poemId = searchParams.get("id");

  const [currentIndex, setCurrentIndex] = useState(() => {
    if (poemId) {
      const idx = poems.findIndex((p) => p.id === poemId);
      return idx >= 0 ? idx : 0;
    }
    return 0;
  });
  const [mode, setMode] = useState<"card" | "scroll">("card");
  const [sessionComplete, setSessionComplete] = useState(false);

  const poem = poems[currentIndex];

  const handleRate = () => {
    if (currentIndex < poems.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setSessionComplete(true);
    }
  };

  if (sessionComplete) {
    return (
      <>
        <ThemeToggle />
        <AppHeader />
        <main className="flex-1 flex flex-col items-center justify-center px-5 py-16 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-[4px] border-[3px] border-primary flex items-center justify-center font-heading text-xl text-primary -rotate-[5deg]">
            成
          </div>
          <h2 className="font-heading font-semibold text-xl mb-2">复习完成</h2>
          <p className="text-text-secondary text-sm mb-1">
            今日复习 {poems.length} 首诗
          </p>
          <p className="text-text-tertiary text-xs">明日再见</p>
        </main>
      </>
    );
  }

  return (
    <>
      <ThemeToggle />
      <AppHeader />
      <main className="flex-1 px-5 py-8 max-w-[600px] mx-auto w-full">
        <div className="flex items-center justify-between mb-8">
          <p className="text-xs text-text-tertiary">
            {currentIndex + 1} / {poems.length}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setMode("card")}
              className={`px-3 py-1.5 text-xs rounded-[var(--radius-md)] border transition-colors ${
                mode === "card"
                  ? "border-primary text-primary"
                  : "border-border text-text-tertiary hover:border-text-tertiary"
              }`}
            >
              卡片
            </button>
            <button
              onClick={() => setMode("scroll")}
              className={`px-3 py-1.5 text-xs rounded-[var(--radius-md)] border transition-colors ${
                mode === "scroll"
                  ? "border-primary text-primary"
                  : "border-border text-text-tertiary hover:border-text-tertiary"
              }`}
            >
              卷轴
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
