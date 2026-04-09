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
        <AppHeader />
        <ThemeToggle />
        <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-[4px] border-[3px] border-primary flex items-center justify-center font-heading text-xl text-primary -rotate-[5deg]">
            成
          </div>
          <h2 className="font-heading font-semibold text-[21px] tracking-tight mb-2">
            复习完成
          </h2>
          <p className="text-text-secondary text-[14px] tracking-tight mb-1">
            今日复习 {poems.length} 首诗
          </p>
          <p className="text-text-tertiary text-[12px]">明日再见</p>
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
              卡片
            </button>
            <button
              onClick={() => setMode("scroll")}
              className={`px-3.5 py-1.5 text-[12px] rounded-[var(--radius-pill)] border transition-colors ${
                mode === "scroll"
                  ? "border-primary text-primary bg-primary-soft"
                  : "border-border text-text-tertiary hover:text-text-secondary"
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
