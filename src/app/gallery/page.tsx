import { AppHeader } from "@/components/AppHeader";
import { TabBar } from "@/components/TabBar";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function GalleryPage() {
  return (
    <>
      <ThemeToggle />
      <AppHeader />
      <main className="flex-1 px-5 py-7 max-w-[600px] mx-auto w-full">
        <h1 className="font-heading font-semibold text-2xl mb-6">卷轴馆</h1>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 mb-4 rounded-[4px] border-[3px] border-border flex items-center justify-center font-heading text-xl text-text-tertiary opacity-35">
            卷
          </div>
          <p className="text-text-tertiary text-sm">
            完成复习后，卷轴将在此展示
          </p>
        </div>
      </main>
      <TabBar />
    </>
  );
}
