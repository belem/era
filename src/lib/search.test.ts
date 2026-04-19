import { describe, it, expect, beforeAll } from "vitest";
import { createPoemIndex, searchPoems, type SearchablePoem, type PoemIndex } from "./search";

function makeLine(text: string, pinyinArr: string[]) {
  const chars = [...text].map((ch, i) => ({ char: ch, pinyin: pinyinArr[i] ?? "" }));
  return { chars, punctuation: "" };
}

const testRows = [
  {
    id: "1",
    title: "静夜思",
    author: "李白",
    dynasty: "唐",
    content_lines: [
      makeLine("床前明月光", ["chuáng", "qián", "míng", "yuè", "guāng"]),
      makeLine("疑是地上霜", ["yí", "shì", "dì", "shàng", "shuāng"]),
    ],
  },
  {
    id: "2",
    title: "春晓",
    author: "孟浩然",
    dynasty: "唐",
    content_lines: [
      makeLine("春眠不觉晓", ["chūn", "mián", "bù", "jué", "xiǎo"]),
      makeLine("处处闻啼鸟", ["chù", "chù", "wén", "tí", "niǎo"]),
    ],
  },
  {
    id: "3",
    title: "登鹳雀楼",
    author: "王之涣",
    dynasty: "唐",
    content_lines: [
      makeLine("白日依山尽", ["bái", "rì", "yī", "shān", "jìn"]),
      makeLine("黄河入海流", ["huáng", "hé", "rù", "hǎi", "liú"]),
    ],
  },
];

describe("search", () => {
  let index: PoemIndex;

  beforeAll(() => {
    index = createPoemIndex();
    for (const row of testRows) {
      const lines = row.content_lines;
      const paragraphs = lines.map((l) => l.chars.map((c) => c.char).join(""));
      const content = paragraphs.join("");
      const pinyin = lines.flatMap((l) => l.chars.map((c) => c.pinyin)).join(" ");
      index.add({
        id: row.id,
        title: row.title,
        author: row.author,
        dynasty: row.dynasty,
        content,
        pinyin,
        paragraphs,
      });
    }
  });

  it("returns empty array for empty query", () => {
    expect(searchPoems(index, "")).toEqual([]);
    expect(searchPoems(index, "   ")).toEqual([]);
  });

  it("finds poem by Chinese title", () => {
    const results = searchPoems(index, "静夜思");
    expect(results.length).toBe(1);
    expect(results[0].id).toBe("1");
  });

  it("finds poem by author", () => {
    const results = searchPoems(index, "李白");
    expect(results.length).toBe(1);
    expect(results[0].id).toBe("1");
  });

  it("finds poem by content characters", () => {
    const results = searchPoems(index, "明月");
    expect(results.length).toBe(1);
    expect(results[0].title).toBe("静夜思");
  });

  it("finds poem by pinyin prefix", () => {
    const results = searchPoems(index, "chun");
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results.some((r) => r.id === "2")).toBe(true);
  });

  it("returns no results for unmatched query", () => {
    const results = searchPoems(index, "xyz非诗词内容xyz");
    expect(results.length).toBe(0);
  });

  it("respects limit parameter", () => {
    const results = searchPoems(index, "唐", 1);
    expect(results.length).toBeLessThanOrEqual(1);
  });

  it("finds poem by partial CJK match", () => {
    const results = searchPoems(index, "黄河");
    expect(results.length).toBe(1);
    expect(results[0].id).toBe("3");
  });
});
