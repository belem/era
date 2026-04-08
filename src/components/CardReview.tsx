"use client";

import { useState } from "react";
import type { Poem } from "@/data/poems";
import { PoemBody } from "./PoemBody";
import { RatingButtons } from "./RatingButtons";

interface CardReviewProps {
  poem: Poem;
  onRate?: (rating: "forgot" | "hard" | "good" | "easy") => void;
}

export function CardReview({ poem, onRate }: CardReviewProps) {
  const [showPinyin, setShowPinyin] = useState(true);
  const [revealed, setRevealed] = useState(false);

  const togglePinyin = () => {
    setShowPinyin((prev) => !prev);
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("pinyin-hidden", showPinyin);
    }
  };

  return (
    <div className="max-w-[390px] mx-auto bg-bg rounded-2xl overflow-hidden shadow-[0_0_0_1px_var(--border),0_8px_32px_rgba(0,0,0,0.06)] p-12 pb-8 text-center relative">
      <button
        onClick={togglePinyin}
        className="absolute top-4 right-5 text-lg text-text-tertiary hover:text-text-secondary transition-colors"
        aria-label={showPinyin ? "Hide pinyin" : "Show pinyin"}
      >
        {showPinyin ? "👁" : "👁‍🗨"}
      </button>

      <h2 className="font-heading font-semibold text-lg mb-1">{poem.title}</h2>
      <p className="text-[13px] text-text-tertiary mb-10">
        〔{poem.dynasty}〕{poem.author}
      </p>

      <div className="mb-12 leading-[2.4]">
        <PoemBody poem={poem} />
      </div>

      {!revealed ? (
        <button
          onClick={() => setRevealed(true)}
          className="w-full py-3.5 bg-primary text-white rounded-[var(--radius-md)] font-ui text-[15px] font-medium cursor-pointer transition-colors hover:bg-primary-hover"
        >
          显示评分
        </button>
      ) : (
        <RatingButtons onRate={(r) => onRate?.(r)} />
      )}
    </div>
  );
}
