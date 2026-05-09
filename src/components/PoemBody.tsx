import type { Poem } from "@/types/poem";

export function PoemBody({ poem }: { poem: Poem }) {
  const lineWidth = Math.max(
    ...poem.lines.map((l) => l.chars.length + (l.punctuation?.length ?? 0)),
    1
  );
  const useCouplet = lineWidth <= 4;

  if (useCouplet) {
    // Pair lines side-by-side: 人之初，性本善。on one row
    const pairs: (typeof poem.lines)[] = [];
    for (let i = 0; i < poem.lines.length; i += 2) {
      pairs.push(poem.lines.slice(i, i + 2));
    }
    return (
      <div className="poem-ruby font-poetry text-xl tracking-[0.05em] leading-[2] text-center">
        {pairs.map((pair, pi) => (
          <div key={pi} className="flex justify-center">
            {pair.map((line, li) => (
              <span key={li} className="flex">
                {line.chars.map((c, j) => (
                  <ruby key={j} className={c.polyphone ? "polyphone-mark" : ""}>
                    {c.char}
                    <rp>(</rp>
                    <rt lang="zh-Latn">{c.pinyin}</rt>
                    <rp>)</rp>
                  </ruby>
                ))}
                <span className="heti-hang">{line.punctuation}</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    );
  }

  // Default: one line per row (五言, 七言, etc.)
  return (
    <div className="poem-ruby font-poetry text-2xl tracking-[0.05em] leading-[2] text-center">
      {poem.lines.map((line, i) => (
        <span key={i}>
          {line.chars.map((c, j) => (
            <ruby key={j} className={c.polyphone ? "polyphone-mark" : ""}>
              {c.char}
              <rp>(</rp>
              <rt lang="zh-Latn">{c.pinyin}</rt>
              <rp>)</rp>
            </ruby>
          ))}
          <span className="heti-hang">{line.punctuation}</span>
          {i < poem.lines.length - 1 && <br />}
        </span>
      ))}
    </div>
  );
}
