"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { Poem } from "@/data/poems";
import { PoemBody } from "./PoemBody";
import { RatingButtons } from "./RatingButtons";

interface CardReviewProps {
  poem: Poem;
  onRate?: (rating: "forgot" | "hard" | "good" | "easy") => void;
}

export function CardReview({ poem, onRate }: CardReviewProps) {
  const t = useTranslations("review");
  const [showPinyin, setShowPinyin] = useState(true);
  const [revealed, setRevealed] = useState(false);

  const togglePinyin = () => {
    setShowPinyin((prev) => !prev);
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("pinyin-hidden", showPinyin);
    }
  };

  return (
    <div className="max-w-[390px] mx-auto bg-bg-subtle rounded-[var(--radius-lg)] overflow-hidden p-12 pb-8 text-center relative">
      <button
        onClick={togglePinyin}
        className="absolute top-4 right-5 text-base text-text-tertiary hover:text-text-secondary transition-colors"
        aria-label={showPinyin ? "Hide pinyin" : "Show pinyin"}
      >
        {showPinyin ? "👁" : "👁‍🗨"}
      </button>

      <h2 className="font-heading font-semibold text-[21px] tracking-tight mb-1">
        {poem.title}
      </h2>
      <p className="text-[14px] text-text-tertiary tracking-tight mb-10">
        〔{poem.dynasty}〕{poem.author}
      </p>

      <div className="mb-12 leading-[2.4]">
        <PoemBody poem={poem} />
      </div>

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
  );
}
