import type { Poem } from "@/types/poem";

export function PoemBody({ poem }: { poem: Poem }) {
  return (
    <div className="poem-ruby font-poetry text-2xl tracking-widest leading-relaxed text-center">
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
