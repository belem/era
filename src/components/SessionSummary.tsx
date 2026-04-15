"use client";

import { useEffect, useState } from "react";
import { ChopStamp } from "./ChopStamp";
import Link from "next/link";

interface SessionRating {
  poemId: string;
  rating: "forgot" | "hard" | "good" | "easy";
}

interface Props {
  studentId: string;
  studentName: string;
  ratings: SessionRating[];
}

const ratingConfig = {
  easy: { label: "Easy", labelZh: "轻松", color: "bg-success" },
  good: { label: "Good", labelZh: "尚可", color: "bg-primary" },
  hard: { label: "Hard", labelZh: "艰难", color: "bg-warning" },
  forgot: { label: "Forgot", labelZh: "淡忘", color: "bg-error" },
} as const;

export function SessionSummary({ studentId, studentName, ratings }: Props) {
  const [streak, setStreak] = useState<{ current: number; frozen: boolean } | null>(null);
  const [newBadges, setNewBadges] = useState<{ id: string; name: string }[]>([]);
  const [barsVisible, setBarsVisible] = useState(false);

  // Count ratings
  const counts = { easy: 0, good: 0, hard: 0, forgot: 0 };
  for (const r of ratings) {
    counts[r.rating]++;
  }
  const maxCount = Math.max(...Object.values(counts), 1);

  useEffect(() => {
    // Update streak
    fetch("/api/streaks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId }),
    })
      .then((r) => r.json())
      .then((data) => setStreak({ current: data.currentStreak, frozen: data.frozen }))
      .catch(() => {});

    // Check badges (silent failure per spec)
    fetch("/api/badges/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId }),
    })
      .then((r) => r.json())
      .then((data) => setNewBadges(data.newBadges ?? []))
      .catch(() => {});

    // Animate bars after mount
    const timer = setTimeout(() => setBarsVisible(true), 100);
    return () => clearTimeout(timer);
  }, [studentId]);

  return (
    <div className="flex flex-col items-center px-6 py-12 max-w-[400px] mx-auto">
      {/* ChopStamp */}
      <div className="mb-4" style={{ animation: "stampIn 0.5s ease-out" }}>
        <ChopStamp name={studentName} size={72} />
      </div>

      {/* Poem count */}
      <p className="text-[17px] text-text mb-4">
        {ratings.length} poems reviewed
      </p>

      {/* Streak hero */}
      {streak && (
        <div className="flex items-center gap-2 mb-8">
          {streak.frozen ? (
            <>
              <img src="/icons/snowflake.svg" alt="" className="w-5 h-5 text-primary" />
              <span className="font-heading font-semibold text-[28px] text-text">
                Streak frozen
              </span>
            </>
          ) : (
            <>
              <img src="/icons/flame.svg" alt="" className="w-5 h-5 text-warning" />
              <span className="font-heading font-semibold text-[28px] text-text">
                Day {streak.current}
              </span>
            </>
          )}
        </div>
      )}

      {/* Rating breakdown bars */}
      <div className="w-full space-y-3 mb-8" aria-label="Rating breakdown">
        {(["easy", "good", "hard", "forgot"] as const).map((key) => {
          const config = ratingConfig[key];
          const count = counts[key];
          const width = maxCount > 0 ? (count / maxCount) * 100 : 0;

          return (
            <div key={key} className="flex items-center gap-3" aria-label={`${config.label}: ${count} poems`}>
              <span className="text-[14px] text-text-secondary w-14 text-right">{config.label}</span>
              <div className="flex-1 h-2 bg-bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${config.color} transition-all duration-[400ms] ease-out`}
                  style={{ width: barsVisible ? `${width}%` : "0%" }}
                />
              </div>
              <span className="text-[14px] text-text w-6 tabular-nums">{count}</span>
            </div>
          );
        })}
      </div>

      {/* Badge notification */}
      {newBadges.length > 0 && (
        <Link
          href="/profile"
          className="text-[14px] text-text-secondary hover:text-primary transition-colors mb-3"
        >
          New badge unlocked! Check your profile.
        </Link>
      )}

      {/* Done button */}
      <Link
        href="/"
        className="px-8 py-3 border border-primary text-primary rounded-[var(--radius-pill)] text-[17px] font-medium hover:bg-primary hover:text-white transition-colors"
      >
        Done
      </Link>
    </div>
  );
}
