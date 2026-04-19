"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import type { Poem } from "@/types/poem";
import { PoemBody } from "./PoemBody";
import { RatingButtons } from "./RatingButtons";
import { PlayButton } from "./PlayButton";

interface PoemEdition {
  edition: string;
  level: string;
  grade: number;
}

interface CardReviewProps {
  poem: Poem;
  onRate?: (rating: "forgot" | "hard" | "good" | "easy") => void;
}

export function CardReview({ poem, onRate }: CardReviewProps) {
  const t = useTranslations("review");
  const [showPinyin, setShowPinyin] = useState(true);
  const [revealed, setRevealed] = useState(false);
  const [editions, setEditions] = useState<PoemEdition[]>([]);

  useEffect(() => {
    if (!poem?.id) return;
    const supabase = createClient();
    supabase
      .from("poem_editions")
      .select("edition, level, grade")
      .eq("poem_id", poem.id)
      .then(({ data }) => {
        if (data) setEditions(data);
      });
  }, [poem?.id]);

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
        className="absolute top-4 right-4 min-w-[44px] min-h-[44px] flex items-center justify-center text-text-tertiary hover:text-text-secondary transition-colors"
        aria-label={showPinyin ? "Hide pinyin" : "Show pinyin"}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
          {!showPinyin && <path d="M1 1l22 22" />}
        </svg>
      </button>

      <h2 className="font-heading font-semibold text-[21px] tracking-tight mb-1">
        {poem.title}
      </h2>
      <div className="flex items-center justify-center gap-2 mb-2">
        <p className="text-[14px] text-text-tertiary tracking-tight">
          〔{poem.dynasty}〕{poem.author}
        </p>
        <PlayButton poem={poem} />
      </div>

      {editions.length > 0 && (
        <div className="flex flex-wrap justify-center gap-x-3 gap-y-0.5 mb-10">
          {editions.map((ed, i) => (
            <span key={i} className="text-[11px] text-text-tertiary">
              {ed.edition}版 · {ed.level}{ed.grade ? ` · ${ed.grade}年级` : ""}
            </span>
          ))}
        </div>
      )}
      {editions.length === 0 && <div className="mb-10" />}

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
