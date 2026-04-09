import Link from "next/link";
import { poems } from "@/data/poems";
import { AppHeader } from "@/components/AppHeader";
import { TabBar } from "@/components/TabBar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PoemCard } from "@/components/PoemCard";

export default function HomePage() {
  return (
    <>
      <AppHeader />
      <ThemeToggle />
      <main className="flex-1 px-6 py-10 max-w-[600px] mx-auto w-full">
        <h1 className="font-heading font-semibold text-[28px] leading-tight tracking-tight mb-1">
          今日诗词
        </h1>
        <p className="text-[14px] text-text-tertiary tracking-tight mb-8 flex items-center gap-1.5">
          <span className="text-warning">🔥</span> <span>连续 14 天</span>
        </p>

        <div className="space-y-1">
          {poems.map((poem) => (
            <PoemCard key={poem.id} poem={poem} />
          ))}
        </div>

        <Link
          href="/review"
          className="block w-full py-3 mt-8 bg-primary text-white rounded-[var(--radius-pill)] text-center font-ui text-[17px] font-normal transition-colors hover:bg-primary-hover"
        >
          开始复习
        </Link>
      </main>
      <TabBar />
    </>
  );
}
