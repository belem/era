"use client";

interface RatingButtonsProps {
  onRate: (rating: "forgot" | "hard" | "good" | "easy") => void;
}

const ratings = [
  { key: "forgot" as const, label: "淡忘", className: "" },
  { key: "hard" as const, label: "艰难", className: "" },
  { key: "good" as const, label: "尚可", className: "" },
  {
    key: "easy" as const,
    label: "轻松",
    className: "bg-jade text-white border-jade hover:bg-pine hover:border-pine",
  },
];

export function RatingButtons({ onRate }: RatingButtonsProps) {
  return (
    <div className="flex gap-2">
      {ratings.map((r) => (
        <button
          key={r.key}
          onClick={() => onRate(r.key)}
          className={`flex-1 py-3.5 px-2 rounded-[var(--radius-md)] font-ui text-sm font-medium border transition-colors cursor-pointer ${
            r.className ||
            "border-border bg-bg text-text-secondary hover:border-text-tertiary"
          }`}
          aria-label={`Rate as ${r.key}`}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}
