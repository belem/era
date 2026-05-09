"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import type { Poem } from "@/types/poem";
import { ChopStamp } from "./ChopStamp";
import { RatingButtons } from "./RatingButtons";

interface LivingScrollProps {
  poem: Poem;
  onComplete?: (rating: "forgot" | "hard" | "good" | "easy") => void;
}

const PUNCTUATION = /[，。！？、；：,\.!?;:]/;

export function LivingScroll({ poem, onComplete }: LivingScrollProps) {
  const t = useTranslations("review");
  const allChars = poem.lines.flatMap((line) => line.chars);
  const [revealedCount, setRevealedCount] = useState(0);
  const [completed, setCompleted] = useState(false);

  const advance = useCallback((nextCount: number) => {
    setRevealedCount(nextCount);
    if (nextCount >= allChars.length) {
      setCompleted(true);
      navigator.vibrate?.(50);
    }
  }, [allChars.length]);

  const revealNext = useCallback(() => {
    if (revealedCount < allChars.length) {
      advance(revealedCount + 1);
    }
  }, [revealedCount, allChars.length, advance]);

  const revealPhrase = useCallback(() => {
    if (revealedCount >= allChars.length) return;
    // Reveal chars until we hit (and include) the next punctuation mark
    let next = revealedCount + 1;
    while (next < allChars.length && !PUNCTUATION.test(allChars[next - 1].char)) {
      next++;
    }
    advance(next);
  }, [revealedCount, allChars, advance]);

  const handleRate = (rating: "forgot" | "hard" | "good" | "easy") => {
    onComplete?.(rating);
  };

  return (
    <div className="max-w-[480px] mx-auto overflow-hidden px-2 pt-8 pb-8 text-center">
      <h2 className="font-heading font-semibold text-[21px] tracking-tight mb-1">
        {poem.title}
      </h2>
      <p className="text-[14px] text-text-tertiary tracking-tight mb-6">
        〔{poem.dynasty}〕{poem.author}
      </p>

      <div className="grid grid-cols-5 gap-1.5 max-w-[280px] mx-auto mb-6">
        {allChars.map((c, i) => {
          const isRevealed = i < revealedCount;
          const isActive = i === revealedCount;
          return (
            <button
              key={i}
              onClick={revealNext}
              disabled={i !== revealedCount}
              className={`aspect-square flex items-center justify-center font-poetry text-[26px] rounded-[var(--radius-sm)] transition-all duration-500 ${
                isRevealed
                  ? "bg-bg text-text"
                  : isActive
                    ? "bg-bg shadow-[0_0_0_2px_var(--primary)] text-text cursor-pointer"
                    : "bg-bg-muted text-transparent"
              }`}
              aria-label={
                isRevealed
                  ? c.char
                  : isActive
                    ? "Reveal next character"
                    : "Hidden character"
              }
            >
              {isRevealed ? c.char : "　"}
            </button>
          );
        })}
      </div>

      <div className="px-12">
        {completed && (
          <div className="space-y-6 animate-[fadeIn_0.4s_ease]">
            <ChopStamp />
            <p className="text-[12px] text-text-tertiary">{t("scrollDone")}</p>
            <RatingButtons onRate={handleRate} />
          </div>
        )}

        {!completed && (
          <div className="flex gap-2">
            <button
              onClick={revealNext}
              className="flex-1 py-3 bg-primary text-white rounded-[var(--radius-md)] font-ui text-[17px] font-normal cursor-pointer transition-colors hover:bg-primary-hover"
            >
              {t("revealChar")}
            </button>
            <button
              onClick={revealPhrase}
              className="flex-1 py-3 bg-bg-subtle text-text-secondary border border-border rounded-[var(--radius-md)] font-ui text-[17px] font-normal cursor-pointer transition-colors hover:bg-bg-muted"
            >
              {t("revealPhrase")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
