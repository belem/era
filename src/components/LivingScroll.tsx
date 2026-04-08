"use client";

import { useState, useCallback } from "react";
import type { Poem } from "@/data/poems";
import { ChopStamp } from "./ChopStamp";
import { RatingButtons } from "./RatingButtons";

interface LivingScrollProps {
  poem: Poem;
  onComplete?: (rating: "forgot" | "hard" | "good" | "easy") => void;
}

export function LivingScroll({ poem, onComplete }: LivingScrollProps) {
  const allChars = poem.lines.flatMap((line) => line.chars);
  const [revealedCount, setRevealedCount] = useState(0);
  const [completed, setCompleted] = useState(false);

  const revealNext = useCallback(() => {
    if (revealedCount < allChars.length) {
      setRevealedCount((prev) => prev + 1);
      if (revealedCount + 1 === allChars.length) {
        setCompleted(true);
      }
    }
  }, [revealedCount, allChars.length]);

  const handleRate = (rating: "forgot" | "hard" | "good" | "easy") => {
    onComplete?.(rating);
  };

  return (
    <div className="max-w-[390px] mx-auto bg-bg rounded-2xl overflow-hidden shadow-[0_0_0_1px_var(--border),0_8px_32px_rgba(0,0,0,0.06)] p-10 text-center">
      <h2 className="font-heading font-semibold text-xl mb-1">{poem.title}</h2>
      <p className="text-[13px] text-text-tertiary mb-10">
        〔{poem.dynasty}〕{poem.author}
      </p>

      <div className="grid grid-cols-5 gap-1.5 max-w-[280px] mx-auto mb-10">
        {allChars.map((c, i) => {
          const isRevealed = i < revealedCount;
          const isActive = i === revealedCount;
          return (
            <button
              key={i}
              onClick={revealNext}
              disabled={i !== revealedCount}
              className={`aspect-square flex items-center justify-center font-poetry text-[26px] rounded-[var(--radius-sm)] transition-all duration-700 ${
                isRevealed
                  ? "bg-bg-subtle text-text"
                  : isActive
                    ? "bg-bg-subtle shadow-[0_0_0_2px_var(--primary)] text-text cursor-pointer"
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
              {isRevealed || isActive ? c.char : "　"}
            </button>
          );
        })}
      </div>

      {completed && (
        <div className="space-y-6 animate-[fadeIn_0.5s_ease]">
          <ChopStamp />
          <p className="text-xs text-text-tertiary">卷轴完成</p>
          <RatingButtons onRate={handleRate} />
        </div>
      )}

      {!completed && (
        <button
          onClick={revealNext}
          className="w-full py-3.5 bg-primary text-white rounded-[var(--radius-md)] font-ui text-[15px] font-medium cursor-pointer transition-colors hover:bg-primary-hover"
        >
          揭示下一字
        </button>
      )}
    </div>
  );
}
