import Link from "next/link";
import type { Poem } from "@/data/poems";

export function PoemCard({ poem }: { poem: Poem }) {
  const firstLine = poem.lines[0]?.chars.map((c) => c.char).join("") ?? "";

  return (
    <Link
      href={`/review?id=${poem.id}`}
      className="block py-4 border-b border-border last:border-b-0 transition-colors hover:bg-bg-subtle"
    >
      <div className="font-heading font-semibold text-base mb-0.5">
        {poem.title}
      </div>
      <div className="text-xs text-text-tertiary mb-1.5">
        〔{poem.dynasty}〕{poem.author} · {poem.grade}年级
      </div>
      <div className="font-poetry text-[15px] text-text-secondary tracking-wide">
        {firstLine}
        {poem.lines[0]?.punctuation}
      </div>
    </Link>
  );
}
