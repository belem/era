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
    className: "bg-success text-white border-success hover:opacity-90",
  },
];

export function RatingButtons({ onRate }: RatingButtonsProps) {
  return (
    <div className="flex gap-2">
      {ratings.map((r) => (
        <button
          key={r.key}
          onClick={() => onRate(r.key)}
          className={`flex-1 py-3 px-2 rounded-[var(--radius-md)] font-ui text-[14px] font-normal border transition-all cursor-pointer ${
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
