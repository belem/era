import { useTranslations } from "next-intl";
import { poems } from "@/data/poems";
import { AppHeader } from "@/components/AppHeader";
import { TabBar } from "@/components/TabBar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PoemCard } from "@/components/PoemCard";

export default function LibraryPage() {
  const t = useTranslations("library");
  return (
    <>
      <AppHeader />
      <ThemeToggle />
      <main className="flex-1 px-6 py-10 max-w-[600px] mx-auto w-full">
        <h1 className="font-heading font-semibold text-[28px] leading-tight tracking-tight mb-8">
          {t("title")}
        </h1>
        <div className="space-y-1">
          {poems.map((poem) => (
            <PoemCard key={poem.id} poem={poem} />
          ))}
        </div>
      </main>
      <TabBar />
    </>
  );
}
