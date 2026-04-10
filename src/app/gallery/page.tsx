import { useTranslations } from "next-intl";
import { AppHeader } from "@/components/AppHeader";
import { TabBar } from "@/components/TabBar";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function GalleryPage() {
  const t = useTranslations("gallery");
  return (
    <>
      <AppHeader />
      <ThemeToggle />
      <main className="flex-1 px-6 py-10 max-w-[600px] mx-auto w-full">
        <h1 className="font-heading font-semibold text-[28px] leading-tight tracking-tight mb-8">
          {t("title")}
        </h1>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 mb-4 rounded-[4px] border-[3px] border-border flex items-center justify-center font-heading text-xl text-text-tertiary opacity-30">
            卷
          </div>
          <p className="text-text-tertiary text-[14px] tracking-tight">
            {t("empty")}
          </p>
        </div>
      </main>
      <TabBar />
    </>
  );
}
