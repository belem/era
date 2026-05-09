"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { Poem } from "@/types/poem";
import { PoemBody } from "./PoemBody";
import { RatingButtons } from "./RatingButtons";
import { PlayButton } from "./PlayButton";

interface CardReviewProps {
  poem: Poem;
  onRate?: (rating: "forgot" | "hard" | "good" | "easy") => void;
}

export function CardReview({ poem, onRate }: CardReviewProps) {
  const t = useTranslations("review");
  const [showPinyin, setShowPinyin] = useState(() =>
    typeof document !== "undefined" ? !document.documentElement.classList.contains("pinyin-hidden") : true
  );
  const [revealed, setRevealed] = useState(false);

  const togglePinyin = () => {
    const next = !showPinyin;
    setShowPinyin(next);
    document.documentElement.classList.toggle("pinyin-hidden", !next);
  };

  return (
    <div className="max-w-[480px] mx-auto overflow-hidden px-2 pt-8 pb-8 text-center">
      <h2 className="font-heading font-semibold text-[21px] tracking-tight mb-1">
        {poem.title}
      </h2>
      <div className="flex items-center justify-center gap-1 text-[14px] text-text-tertiary tracking-tight mb-2">
        <span>〔{poem.dynasty}〕{poem.author}</span>
        <button
          onClick={togglePinyin}
          className="min-w-[32px] min-h-[32px] flex items-center ml-2 justify-center text-text-tertiary hover:text-text-secondary transition-colors"
          aria-label={showPinyin ? "Hide pinyin" : "Show pinyin"}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
            {!showPinyin && <path d="M1 1l22 22" />}
          </svg>
        </button>
        <PlayButton poem={poem} />
      </div>

      <div className="mb-4" />

      <div className="mb-4 leading-[2.4]">
        <PoemBody poem={poem} />
      </div>

      <div className="px-12">
        {!revealed ? (
          <button
            onClick={() => setRevealed(true)}
            className="w-full py-3 bg-primary text-white rounded-[var(--radius-md)] font-ui text-[17px] font-normal cursor-pointer transition-colors hover:bg-primary-hover"
          >
            {t("reveal")}
          </button>
        ) : (
          <RatingButtons onRate={(r) => onRate?.(r)} />
        )}
      </div>
    </div>
  );
}
