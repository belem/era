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

type FlatChar = { char: string; pinyin: string; isPunct?: boolean };

export function LivingScroll({ poem, onComplete }: LivingScrollProps) {
  const t = useTranslations("review");

  // Flatten chars + punctuation into one sequence so revealPhrase can stop at punctuation
  const allChars = poem.lines.flatMap((line): FlatChar[] => [
    ...line.chars,
    ...(line.punctuation
      ? line.punctuation.split("").map((ch) => ({ char: ch, pinyin: "", isPunct: true }))
      : []),
  ]);
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
    // Reveal chars until we've included the next punctuation char
    let next = revealedCount + 1;
    while (next < allChars.length && !PUNCTUATION.test(allChars[next - 1].char)) {
      next++;
    }
    advance(next);
  }, [revealedCount, allChars, advance]);

  const handleRate = (rating: "forgot" | "hard" | "good" | "easy") => {
    onComplete?.(rating);
  };

  // Show 2 poem lines per grid row (couplet style)
  const lineWidth = Math.max(
    ...poem.lines.map((l) => l.chars.length + (l.punctuation?.length ?? 0)),
    1
  );
  const cols = lineWidth * 2;
  // Scale font down for wider grids to fit the container
  const charFontSize = cols <= 8 ? 24 : cols <= 12 ? 18 : 14;

  return (
    <div className="max-w-[480px] mx-auto overflow-hidden px-2 pt-2 pb-4 text-center">
      <h2 className="font-heading font-semibold text-[21px] tracking-tight mb-1">
        {poem.title}
      </h2>
      <p className="text-[14px] text-text-tertiary tracking-tight mb-6">
        〔{poem.dynasty}〕{poem.author}
      </p>

      <div
        className="grid gap-1 mx-auto mb-6"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, maxWidth: `${cols * 40}px` }}
      >
        {allChars.map((c, i) => {
          const isRevealed = i < revealedCount;
          const isActive = i === revealedCount;
          if (c.isPunct) {
            return (
              <div
                key={i}
                style={{ fontSize: `${charFontSize}px` }}
                className={`aspect-square flex items-center justify-center font-poetry rounded-[var(--radius-sm)] transition-all duration-500 ${
                  isRevealed ? "text-text-tertiary" : "text-transparent"
                }`}
              >
                {isRevealed ? c.char : "　"}
              </div>
            );
          }
          return (
            <button
              key={i}
              onClick={revealNext}
              disabled={i !== revealedCount}
              style={{ fontSize: `${charFontSize}px` }}
              className={`aspect-square flex items-center justify-center font-poetry rounded-[var(--radius-sm)] transition-all duration-500 ${
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
              className="flex-1 py-2 bg-primary text-white rounded-[var(--radius-md)] font-ui text-[17px] font-normal cursor-pointer transition-colors hover:bg-primary-hover"
            >
              {t("revealChar")}
            </button>
            <button
              onClick={revealPhrase}
              className="flex-1 py-2 bg-bg-subtle text-text-secondary border border-border rounded-[var(--radius-md)] font-ui text-[17px] font-normal cursor-pointer transition-colors hover:bg-bg-muted"
            >
              {t("revealPhrase")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
