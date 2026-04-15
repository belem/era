import { Document, Encoder } from "flexsearch";

export interface SearchablePoem {
  [key: string]: string | number | string[];
  id: string;
  title: string;
  author: string;
  dynasty: string;
  grade: number;
  content: string;
  pinyin: string;
  paragraphs: string[];
}

// CJK encoder: split on every character boundary — ideal for Chinese text
const cjkEncoder = new Encoder({ split: "" });

export type PoemIndex = Document<SearchablePoem>;

let _index: PoemIndex | null = null;

export function createPoemIndex(): PoemIndex {
  return new Document<SearchablePoem>({
    document: {
      id: "id",
      index: [
        { field: "title", tokenize: "full", encoder: cjkEncoder },
        { field: "author", tokenize: "full", encoder: cjkEncoder },
        { field: "dynasty", tokenize: "full", encoder: cjkEncoder },
        { field: "content", tokenize: "full", encoder: cjkEncoder },
        { field: "pinyin", tokenize: "forward", encoder: "LatinBalance" },
      ],
      store: ["id", "title", "author", "dynasty", "grade", "paragraphs"],
    },
  });
}

/** Build a fresh index from raw poem rows (as returned by Supabase) */
export function buildIndex(
  rows: Array<{
    id: string;
    title: string;
    author: string;
    dynasty: string;
    grade_level: number;
    content_lines: any[];
  }>,
): PoemIndex {
  const index = createPoemIndex();

  for (const row of rows) {
    const lines = row.content_lines as Array<{
      chars: Array<{ char: string; pinyin: string }>;
      punctuation?: string;
    }>;

    const paragraphs = lines.map(
      (l) => l.chars.map((c) => c.char).join("") + (l.punctuation ?? ""),
    );
    const content = lines.map((l) => l.chars.map((c) => c.char).join("")).join("");
    const pinyin = lines
      .flatMap((l) => l.chars.map((c) => c.pinyin))
      .join(" ");

    index.add({
      id: row.id,
      title: row.title,
      author: row.author,
      dynasty: row.dynasty,
      grade: row.grade_level,
      content,
      pinyin,
      paragraphs,
    });
  }

  _index = index;
  return index;
}

/** Return the cached singleton index (or null if not yet built) */
export function getCachedIndex(): PoemIndex | null {
  return _index;
}

/** Search the index — returns enriched results with the stored document data */
export function searchPoems(
  index: PoemIndex,
  query: string,
  limit = 8,
): SearchablePoem[] {
  if (!query.trim()) return [];

  const raw = index.search(query, {
    limit,
    enrich: true,
    merge: true,
  });

  // merged results: Array<{ id, doc, field[] }>
  return (raw as any[]).map((hit) => hit.doc as SearchablePoem);
}
