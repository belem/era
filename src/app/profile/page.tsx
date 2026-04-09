import { AppHeader } from "@/components/AppHeader";
import { TabBar } from "@/components/TabBar";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function ProfilePage() {
  return (
    <>
      <AppHeader />
      <ThemeToggle />
      <main className="flex-1 px-6 py-10 max-w-[600px] mx-auto w-full">
        <h1 className="font-heading font-semibold text-[28px] leading-tight tracking-tight mb-8">
          我的
        </h1>

        <div className="bg-bg-subtle rounded-[var(--radius-lg)] p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-text text-bg flex items-center justify-center text-lg font-medium">
              学
            </div>
            <div>
              <div className="font-heading font-semibold text-[17px] tracking-tight">
                小明
              </div>
              <div className="text-[14px] text-text-tertiary tracking-tight">
                二年级 · 人教版
              </div>
            </div>
          </div>
        </div>

        <h2 className="text-[13px] uppercase tracking-[0.08em] text-text-tertiary mb-4">
          成就
        </h2>
        <div className="flex gap-3 flex-wrap">
          <div className="w-[52px] h-[52px] rounded-[var(--radius-md)] border-2 border-badge-1 text-badge-1 flex items-center justify-center font-heading text-[22px]">
            十
          </div>
          <div className="w-[52px] h-[52px] rounded-[var(--radius-md)] border border-border text-text-tertiary opacity-25 flex items-center justify-center font-heading text-[22px]">
            月
          </div>
          <div className="w-[52px] h-[52px] rounded-[var(--radius-md)] border border-border text-text-tertiary opacity-25 flex items-center justify-center font-heading text-[22px]">
            百
          </div>
          <div className="w-[52px] h-[52px] rounded-[var(--radius-md)] border border-border text-text-tertiary opacity-25 flex items-center justify-center font-heading text-[22px]">
            年
          </div>
        </div>
      </main>
      <TabBar />
    </>
  );
}
