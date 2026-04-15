import Link from "next/link";
import type { Poem } from "@/types/poem";

export function PoemCard({ poem }: { poem: Poem }) {
  const firstLine = poem.lines[0]?.chars.map((c) => c.char).join("") ?? "";

  return (
    <Link
      href={`/review?id=${poem.id}`}
      className="block px-4 py-4 -mx-4 rounded-[var(--radius-lg)] transition-colors hover:bg-bg-subtle"
    >
      <div className="font-heading font-semibold text-[17px] tracking-tight mb-0.5">
        {poem.title}
      </div>
      <div className="text-[14px] text-text-tertiary tracking-tight mb-1.5">
        〔{poem.dynasty}〕{poem.author} · {poem.grade}年级
      </div>
      <div className="font-poetry text-[15px] text-text-secondary tracking-wide">
        {firstLine}
        {poem.lines[0]?.punctuation}
      </div>
    </Link>
  );
}
