import Link from "next/link";
import type { Poem } from "@/types/poem";

interface PoemEdition {
  edition: string;
  level: string;
  grade: number | null;
}

const CN_NUM = ["", "一", "二", "三", "四", "五", "六", "七", "八", "九"];

function formatEdition(e: PoemEdition): string {
  const g = e.grade != null ? CN_NUM[e.grade] ?? String(e.grade) : null;
  if (e.level === "初中" && g) return `${e.edition}·初${g}`;
  if (e.level === "高中" && g) return `${e.edition}·高${g}`;
  if (g) return `${e.edition}·${e.level}·${g}年级`;
  return `${e.edition}·${e.level}`;
}

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
