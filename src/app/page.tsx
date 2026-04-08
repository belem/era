import Link from "next/link";
import { poems } from "@/data/poems";
import { AppHeader } from "@/components/AppHeader";
import { TabBar } from "@/components/TabBar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PoemCard } from "@/components/PoemCard";

export default function HomePage() {
  return (
    <>
      <ThemeToggle />
      <AppHeader />
      <main className="flex-1 px-5 py-7 max-w-[600px] mx-auto w-full">
        <h1 className="font-heading font-semibold text-2xl mb-1">今日诗词</h1>
        <p className="text-[13px] text-text-tertiary mb-6 flex items-center gap-1.5">
          🔥 <span>连续 14 天</span>
        </p>

        <div>
          {poems.map((poem) => (
            <PoemCard key={poem.id} poem={poem} />
          ))}
        </div>

        <Link
          href="/review"
          className="block w-full py-3.5 mt-6 bg-primary text-white rounded-[var(--radius-md)] text-center font-ui text-[15px] font-medium transition-colors hover:bg-primary-hover"
        >
          开始复习
        </Link>
      </main>
      <TabBar />
    </>
  );
}
