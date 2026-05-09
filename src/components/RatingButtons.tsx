"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

interface RatingButtonsProps {
  onRate: (rating: "forgot" | "hard" | "good" | "easy") => void;
}

export function RatingButtons({ onRate }: RatingButtonsProps) {
  const t = useTranslations("rating");
  const [clicked, setClicked] = useState(false);

  const handleClick = (rating: "forgot" | "hard" | "good" | "easy") => {
    if (clicked) return;
    setClicked(true);
    onRate(rating);
  };

  const ratings = [
    { key: "forgot" as const, label: t("forgot"), className: "" },
    { key: "hard" as const, label: t("hard"), className: "" },
    { key: "good" as const, label: t("good"), className: "" },
    {
      key: "easy" as const,
      label: t("easy"),
      className: "bg-success text-white border-success hover:opacity-90",
    },
  ];
  return (
    <div className="flex gap-2">
      {ratings.map((r) => (
        <button
          key={r.key}
          onClick={() => handleClick(r.key)}
          disabled={clicked}
          className={`flex-1 py-3 px-2 rounded-[var(--radius-md)] font-ui text-[14px] font-normal border transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
            r.className ||
            "border-border bg-transparent text-text-secondary hover:bg-bg-muted"
          }`}
          aria-label={`Rate as ${r.key}`}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}
