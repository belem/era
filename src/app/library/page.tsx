import { poems } from "@/data/poems";
import { AppHeader } from "@/components/AppHeader";
import { TabBar } from "@/components/TabBar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PoemCard } from "@/components/PoemCard";

export default function LibraryPage() {
  return (
    <>
      <ThemeToggle />
      <AppHeader />
      <main className="flex-1 px-5 py-7 max-w-[600px] mx-auto w-full">
        <h1 className="font-heading font-semibold text-2xl mb-6">诗库</h1>
        <div>
          {poems.map((poem) => (
            <PoemCard key={poem.id} poem={poem} />
          ))}
        </div>
      </main>
      <TabBar />
    </>
  );
}
