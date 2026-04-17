"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { useStudent } from "@/hooks/useStudent";
import { AppHeader } from "@/components/AppHeader";
import { TabBar } from "@/components/TabBar";
import { ThemeToggle } from "@/components/ThemeToggle";

interface Badge {
  id: string;
  icon: string;
  unlocked: boolean;
}

export default function ProfilePage() {
  const t = useTranslations("profile");
  const tb = useTranslations("badges");
  const { student } = useStudent();
  const [badges, setBadges] = useState<Badge[]>([]);

  useEffect(() => {
    if (!student) return;
    const supabase = createClient();

    Promise.all([
      supabase.from("badges").select("*"),
      supabase.from("badge_unlocks").select("badge_id").eq("student_id", student.id),
    ]).then(([{ data: allBadges }, { data: unlocks }]) => {
      const unlockedIds = new Set(unlocks?.map((u) => u.badge_id) ?? []);
      setBadges(
        (allBadges ?? []).map((b) => ({
          id: b.id,
          icon: b.icon,
          unlocked: unlockedIds.has(b.id),
        }))
      );
    });
  }, [student]);

  return (
    <>
      <AppHeader />
      <ThemeToggle />
      <main className="flex-1 px-6 py-10 max-w-[980px] mx-auto w-full">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-heading font-semibold text-[28px] leading-tight tracking-tight">
            {t("title")}
          </h1>
          <div className="flex gap-4">
            <Link
              href="/analytics"
              className="text-[14px] text-primary hover:underline"
            >
              {t("analytics")}
            </Link>
            <Link
              href="/settings"
              className="text-[14px] text-primary hover:underline"
            >
              {t("settings")}
            </Link>
          </div>
        </div>

        <div className="md:grid md:grid-cols-2 md:gap-8">
          {/* Student info */}
          <div className="bg-bg-subtle rounded-[var(--radius-lg)] p-6 mb-8 md:mb-0">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-text text-bg flex items-center justify-center text-lg font-medium">
                {student?.name.charAt(0) ?? "?"}
              </div>
              <div>
                <div className="font-heading font-semibold text-[17px] tracking-tight">
                  {student?.name ?? "---"}
                </div>
                <div className="text-[14px] text-text-tertiary tracking-tight">
                  {student?.level ?? ""}{t("gradeInfo", { grade: student?.grade ?? "--" })} · {student?.edition ?? "部编"}版
                </div>
              </div>
            </div>
          </div>

          {/* Badges */}
          <div>
            <h2 className="text-[13px] uppercase tracking-[0.08em] text-text-tertiary mb-4">
              {t("achievements")}
            </h2>
            <div className="grid grid-cols-3 gap-3 lg:grid-cols-5" role="list">
              {badges.map((badge) => {
                const badgeName = tb(`${badge.icon}.name`);
                const status = badge.unlocked ? t("unlocked") : t("locked");
                return (
                  <div
                    key={badge.id}
                    role="listitem"
                    aria-label={`${badgeName}, ${status}`}
                    title={`${badgeName} — ${tb(`${badge.icon}.desc`)}`}
                    className={`w-[52px] h-[52px] rounded-[var(--radius-md)] flex items-center justify-center ${
                      badge.unlocked
                        ? "border-2 border-badge-1 bg-bg-subtle"
                        : "border border-border bg-bg-muted opacity-30"
                    }`}
                  >
                    <img
                      src={`/badges/${badge.icon}.svg`}
                      alt={badgeName}
                      className={`w-6 h-6 ${badge.unlocked ? "text-text" : "text-text-tertiary"}`}
                    />
                  </div>
                );
              })}
              {badges.length === 0 && (
                <>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="w-[52px] h-[52px] rounded-[var(--radius-md)] border border-border bg-bg-muted opacity-30 animate-pulse"
                    />
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      </main>
      <TabBar />
    </>
  );
}
