"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useReviewQueue } from "@/hooks/useReviewQueue";
import { AppHeader } from "@/components/AppHeader";
import { TabBar } from "@/components/TabBar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PoemCard } from "@/components/PoemCard";

export default function HomePage() {
  const t = useTranslations("home");
  const { poems, loading } = useReviewQueue();

  return (
    <>
      <AppHeader />
      <ThemeToggle />
      <main className="flex-1 px-6 py-10 max-w-[600px] mx-auto w-full">
        <h1 className="font-heading font-semibold text-[28px] leading-tight tracking-tight mb-1">
          {t("title")}
        </h1>
        <p className="text-[14px] text-text-tertiary tracking-tight mb-8 flex items-center gap-1.5">
          <span className="text-warning">🔥</span> <span>{t("streak", { days: 14 })}</span>
        </p>

        {loading ? (
          <div className="space-y-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-surface-soft rounded-[var(--radius-card)] animate-pulse" />
            ))}
          </div>
        ) : poems.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-text-tertiary text-[14px]">{t("empty")}</p>
          </div>
        ) : (
          <div className="space-y-1">
            {poems.map((poem) => (
              <PoemCard key={poem.id} poem={poem} />
            ))}
          </div>
        )}

        {!loading && poems.length > 0 && (
          <Link
            href="/review"
            className="block w-full py-3 mt-8 bg-primary text-white rounded-[var(--radius-pill)] text-center font-ui text-[17px] font-normal transition-colors hover:bg-primary-hover"
          >
            {t("startReview")}
          </Link>
        )}
      </main>
      <TabBar />
    </>
  );
}
