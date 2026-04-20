import Link from "next/link";
import type { Poem } from "@/types/poem";
import { formatEdition, type PoemEdition } from "@/lib/format";

export function PoemCard({ poem, editions, hideFirstLine }: { poem: Poem; editions?: PoemEdition[]; hideFirstLine?: boolean }) {
  const firstLine = !hideFirstLine
    ? (poem.lines[0]?.chars.map((c) => c.char).join("") ?? "") + (poem.lines[0]?.punctuation ?? "")
    : null;

  return (
    <Link
      href={`/review?id=${poem.id}`}
      className="flex items-start gap-3 px-4 py-4 -mx-4 rounded-[var(--radius-lg)] transition-colors hover:bg-bg-subtle"
    >
      <div className="flex-1 min-w-0">
        <div className="font-heading font-semibold text-[17px] tracking-tight mb-0.5">
          {poem.title}
        </div>
        <div className="text-[14px] text-text-tertiary tracking-tight">
          〔{poem.dynasty}〕{poem.author}
        </div>
        {firstLine && (
          <div className="font-poetry text-[15px] text-text-secondary tracking-wide mt-1.5">
            {firstLine}
          </div>
        )}
      </div>
      {editions && editions.length > 0 && (
        <div className="flex flex-col items-end gap-0.5 shrink-0 pt-0.5">
          {editions.map((e, i) => (
            <span key={i} className="text-[11px] text-text-tertiary leading-tight whitespace-nowrap">
              {formatEdition(e)}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
