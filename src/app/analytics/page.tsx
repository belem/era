"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useStudent } from "@/hooks/useStudent";
import { AppHeader } from "@/components/AppHeader";
import { TabBar } from "@/components/TabBar";
import { ThemeToggle } from "@/components/ThemeToggle";

interface AnalyticsData {
  heatmap: { date: string; count: number }[];
  ratingDist: { forgot: number; hard: number; good: number; easy: number };
  poemMastery: { poemId: string; title: string; intervalDays: number; mastered: boolean; nextReview: string }[];
  masteredCount: number;
  totalPoems: number;
  streak: { current_streak: number; longest_streak: number };
  totalReviews: number;
  listening: { totalMinutes: number; passiveMinutes: number; activeMinutes: number };
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-bg-subtle rounded-[var(--radius-lg)] p-5 text-center">
      <div className="text-[32px] font-heading font-semibold text-text leading-none">{value}</div>
      <div className="text-[13px] text-text-secondary mt-1">{label}</div>
      {sub && <div className="text-[11px] text-text-tertiary mt-0.5">{sub}</div>}
    </div>
  );
}

function Heatmap({ data }: { data: { date: string; count: number }[] }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="flex gap-1 flex-wrap">
      {data.map((d) => {
        const intensity = d.count === 0 ? 0 : Math.max(0.2, d.count / max);
        const dayNum = new Date(d.date).getDate();
        return (
          <div
            key={d.date}
            className="w-7 h-7 rounded-[4px] flex items-center justify-center text-[9px]"
            style={{
              backgroundColor: d.count === 0 ? "var(--bg-muted)" : `rgba(0, 113, 227, ${intensity})`,
              color: intensity > 0.5 ? "white" : "var(--text-tertiary)",
            }}
            title={`${d.date}: ${d.count} reviews`}
          >
            {dayNum}
          </div>
        );
      })}
    </div>
  );
}

function RatingBars({ dist }: { dist: AnalyticsData["ratingDist"] }) {
  const t = useTranslations("rating");
  const total = dist.forgot + dist.hard + dist.good + dist.easy;
  const colors = { forgot: "#ff3b30", hard: "#ff9500", good: "#0071e3", easy: "#34c759" };

  return (
    <div className="space-y-2">
      {(["forgot", "hard", "good", "easy"] as const).map((r) => {
        const pct = total > 0 ? (dist[r] / total) * 100 : 0;
        return (
          <div key={r} className="flex items-center gap-3">
            <span className="text-[13px] text-text-secondary w-12 text-right">{t(r)}</span>
            <div className="flex-1 h-3 bg-bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, backgroundColor: colors[r] }}
              />
            </div>
            <span className="text-[12px] text-text-tertiary w-10 text-right">
              {dist[r]} ({Math.round(pct)}%)
            </span>
          </div>
        );
      })}
    </div>
  );
}

function MasteryList({ poems }: { poems: AnalyticsData["poemMastery"] }) {
  const t = useTranslations("analytics");
  const sorted = [...poems].sort((a, b) => b.intervalDays - a.intervalDays);

  return (
    <div className="space-y-1 max-h-[300px] overflow-y-auto">
      {sorted.map((p) => (
        <div key={p.poemId} className="flex items-center gap-3 py-2 px-3 rounded-[var(--radius-md)] hover:bg-bg-muted transition-colors">
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: p.mastered ? "#34c759" : p.intervalDays >= 7 ? "#ff9500" : "#ff3b30" }}
          />
          <div className="flex-1 min-w-0">
            <span className="text-[14px] text-text">{p.title}</span>
          </div>
          <span className="text-[12px] text-text-tertiary flex-shrink-0">
            {p.intervalDays}{t("days")}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const t = useTranslations("analytics");
  const { student } = useStudent();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!student) return;
    fetch(`/api/analytics?studentId=${student.id}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); });
  }, [student]);

  return (
    <>
      <AppHeader />
      <ThemeToggle />
      <main className="flex-1 px-6 py-10 max-w-[980px] mx-auto w-full">
        <h1 className="font-heading font-semibold text-[28px] leading-tight tracking-tight mb-8">
          {t("title")}
        </h1>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-bg-subtle rounded-[var(--radius-lg)] animate-pulse" />
            ))}
          </div>
        ) : data ? (
          <div className="space-y-8">
            {/* Stats row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard label={t("totalReviews")} value={data.totalReviews} />
              <StatCard label={t("mastered")} value={data.masteredCount} sub={`/ ${data.totalPoems}`} />
              <StatCard label={t("currentStreak")} value={data.streak.current_streak} sub={t("longestStreak", { n: data.streak.longest_streak })} />
              <StatCard label={t("listeningMinutes")} value={data.listening.totalMinutes} sub={data.listening.totalMinutes > 0 ? `${data.listening.passiveMinutes}p / ${data.listening.activeMinutes}a` : undefined} />
            </div>

            {/* Heatmap */}
            <section>
              <h2 className="text-[13px] uppercase tracking-[0.08em] text-text-tertiary mb-3">
                {t("activity")}
              </h2>
              <div className="bg-bg-subtle rounded-[var(--radius-lg)] p-5">
                <Heatmap data={data.heatmap} />
              </div>
            </section>

            {/* Rating distribution */}
            <section>
              <h2 className="text-[13px] uppercase tracking-[0.08em] text-text-tertiary mb-3">
                {t("ratingDistribution")}
              </h2>
              <div className="bg-bg-subtle rounded-[var(--radius-lg)] p-5">
                <RatingBars dist={data.ratingDist} />
              </div>
            </section>

            {/* Poem mastery */}
            <section>
              <h2 className="text-[13px] uppercase tracking-[0.08em] text-text-tertiary mb-3">
                {t("poemProgress")}
              </h2>
              <div className="bg-bg-subtle rounded-[var(--radius-lg)] p-5">
                {data.poemMastery.length === 0 ? (
                  <p className="text-text-tertiary text-[14px] text-center py-4">{t("noData")}</p>
                ) : (
                  <MasteryList poems={data.poemMastery} />
                )}
              </div>
            </section>
          </div>
        ) : null}
      </main>
      <TabBar />
    </>
  );
}
