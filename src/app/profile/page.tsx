import { AppHeader } from "@/components/AppHeader";
import { TabBar } from "@/components/TabBar";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function ProfilePage() {
  return (
    <>
      <ThemeToggle />
      <AppHeader />
      <main className="flex-1 px-5 py-7 max-w-[600px] mx-auto w-full">
        <h1 className="font-heading font-semibold text-2xl mb-6">我的</h1>

        <div className="bg-bg-subtle rounded-[var(--radius-lg)] p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-text text-bg flex items-center justify-center text-lg font-medium">
              学
            </div>
            <div>
              <div className="font-heading font-semibold">小明</div>
              <div className="text-xs text-text-tertiary">二年级 · 人教版</div>
            </div>
          </div>
        </div>

        <h2 className="text-xs uppercase tracking-widest text-text-tertiary mb-4">
          成就
        </h2>
        <div className="flex gap-4 flex-wrap">
          <div className="w-[52px] h-[52px] rounded-[var(--radius-md)] border border-peach text-peach flex items-center justify-center font-heading text-[22px]">
            十
          </div>
          <div className="w-[52px] h-[52px] rounded-[var(--radius-md)] border border-border text-text-tertiary opacity-35 flex items-center justify-center font-heading text-[22px]">
            月
          </div>
          <div className="w-[52px] h-[52px] rounded-[var(--radius-md)] border border-border text-text-tertiary opacity-35 flex items-center justify-center font-heading text-[22px]">
            百
          </div>
          <div className="w-[52px] h-[52px] rounded-[var(--radius-md)] border border-border text-text-tertiary opacity-35 flex items-center justify-center font-heading text-[22px]">
            年
          </div>
        </div>
      </main>
      <TabBar />
    </>
  );
}
