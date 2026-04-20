#!/usr/bin/env python3
"""
Generate SQL seed script from reference shici data.
Extracts poems from 人教, 苏教, 沪教 collections,
annotates with pinyin, and produces INSERT statements for poems + poem_editions.
"""

import json
import re
import sys
from pathlib import Path

from pypinyin import lazy_pinyin, Style, load_phrases_dict
from pypinyin.contrib.tone_convert import to_tone

SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
REF_DIR = PROJECT_ROOT / "reference" / "shici" / "src" / "database" / "json"

COLLECTION_WORKS_PATH = REF_DIR / "collection_works.json"
WORKS_PATH = REF_DIR / "works.json"

END_PUNCTS = set("，。！？；")
ALL_PUNCTS = set(
    "，。！？；、：…·（）【】《》〈〉「」『』"
    "\u200b\ufeff"
    "\u201c\u201d"  # ""
    "\u2018\u2019"  # ''
    "\u300a\u300b"  # 《》
)
SKIP_CHARS = ALL_PUNCTS | set("\"'()[]{}<>~`@#$%^&*_+=|\\")

# Collection ID -> (edition, school_system, grade_or_None, semester_or_None)
# 人教 (formerly 部编): even IDs = 上册, odd IDs = 下册
EDITION_MAP = {
    # 人教 六三学制 (12 semesters = grades 1-6)
    114: ("人教", "六三", 1, "上册"), 115: ("人教", "六三", 1, "下册"),
    116: ("人教", "六三", 2, "上册"), 117: ("人教", "六三", 2, "下册"),
    118: ("人教", "六三", 3, "上册"), 119: ("人教", "六三", 3, "下册"),
    120: ("人教", "六三", 4, "上册"), 121: ("人教", "六三", 4, "下册"),
    122: ("人教", "六三", 5, "上册"), 123: ("人教", "六三", 5, "下册"),
    124: ("人教", "六三", 6, "上册"), 125: ("人教", "六三", 6, "下册"),
    # 人教 六三学制 (old 初中 grades 1-3 -> grades 7-9)
    126: ("人教", "六三", 7, "上册"), 127: ("人教", "六三", 7, "下册"),
    128: ("人教", "六三", 8, "上册"), 129: ("人教", "六三", 8, "下册"),
    131: ("人教", "六三", 9, "上册"), 132: ("人教", "六三", 9, "下册"),
    # 人教 高中 (grades 1-3)
    133: ("人教", "高中", 1, "上册"), 134: ("人教", "高中", 1, "下册"),
    135: ("人教", "高中", 2, "上册"), 136: ("人教", "高中", 2, "下册"),
    137: ("人教", "高中", 3, "上册"), 138: ("人教", "高中", 3, "下册"),
    # 苏教 (no grade/semester info)
    421: ("苏教", "六三", None, None),
    427: ("苏教", "六三", None, None),
    440: ("苏教", "高中", None, None),
    # 沪教 (no grade/semester info)
    423: ("沪教", "六三", None, None),
    430: ("沪教", "六三", None, None),
}

# Known polyphones: char -> context-dependent readings
# Only listing ones that matter for classical poetry
POLYPHONE_CHARS = set(
    "行长还重间好少处觉曾将应教为看得乐说地分相"
    "更朝便大称传降量弹度奇强调和中泊背别解散发"
    "藏横似骑扁模燕兴思"
)

CUSTOM_PHRASES = {
    "处处": [["chù"], ["chù"]],
    "行人": [["xíng"], ["rén"]],
    "独行": [["dú"], ["xíng"]],
}
load_phrases_dict(CUSTOM_PHRASES)


def escape_sql(s: str) -> str:
    return s.replace("'", "''")


def parse_content_to_clauses(content: str) -> list[tuple[str, str]]:
    """Split poem content into (text, punctuation) pairs at clause boundaries."""
    content = content.replace("\r\n", "\n").replace("\r", "\n")
    content = re.sub(r"【[^】]*】\s*", "", content)  # remove section headers like 【其一】
    clauses = []
    current = ""
    for ch in content:
        if ch == "\n":
            if current.strip():
                clauses.append((current.strip(), ""))
                current = ""
            continue
        if ch in END_PUNCTS:
            if current.strip():
                clauses.append((current.strip(), ch))
            current = ""
        elif ch in SKIP_CHARS:
            continue
        else:
            current += ch
    if current.strip():
        clauses.append((current.strip(), ""))
    return clauses


def annotate_line(text: str) -> list[dict]:
    """Annotate each character with pinyin, marking polyphones."""
    clean = "".join(ch for ch in text if ch not in SKIP_CHARS and not ch.isspace())
    pinyins = lazy_pinyin(clean, style=Style.TONE, errors="default")
    chars = []
    for i, ch in enumerate(clean):
        py = pinyins[i] if i < len(pinyins) else ch
        entry = {"char": ch, "pinyin": py}
        if ch in POLYPHONE_CHARS:
            entry["polyphone"] = True
        chars.append(entry)
    return chars


def build_content_lines(content: str) -> list[dict]:
    """Convert raw poem content to structured content_lines with pinyin."""
    clauses = parse_content_to_clauses(content)
    lines = []
    for text, punct in clauses:
        chars = annotate_line(text)
        if not chars:
            continue
        line = {"chars": chars}
        if punct:
            line["punctuation"] = punct
        lines.append(line)
    return lines


def infer_tags(title: str, dynasty: str, content_lines: list[dict], kind_cn: str) -> list[str]:
    tags = [dynasty]
    if kind_cn and kind_cn in ("词", "曲"):
        tags.append(kind_cn)
    else:
        line_count = len(content_lines)
        char_counts = [len(line["chars"]) for line in content_lines]
        if line_count >= 4:
            first4 = char_counts[:4]
            if all(c == 5 for c in first4) and line_count == 4:
                tags.append("五言绝句")
            elif all(c == 7 for c in first4) and line_count == 4:
                tags.append("七言绝句")
            elif all(c == 5 for c in char_counts[:8]) and line_count == 8:
                tags.append("五言律诗")
            elif all(c == 7 for c in char_counts[:8]) and line_count == 8:
                tags.append("七言律诗")
            elif line_count >= 8:
                tags.append("古体诗")

    if any(w in title for w in ["思", "忆", "相思", "送", "别", "寄"]):
        tags.append("思乡")
    if any(w in title for w in ["春", "夏", "秋", "冬", "雪", "雨", "风", "晓", "夜", "暮"]):
        tags.append("写景")
    if any(w in title for w in ["山", "水", "江", "湖", "河", "溪", "海", "峰", "岭", "瀑布"]):
        tags.append("山水")
    return tags


def main():
    sys.stdout.reconfigure(encoding="utf-8")

    with open(COLLECTION_WORKS_PATH, "r", encoding="utf-8") as f:
        cw_data = json.load(f)
    collection_works = cw_data.get("collection_works", cw_data)
    if isinstance(collection_works, dict):
        collection_works = list(collection_works.values())

    with open(WORKS_PATH, "r", encoding="utf-8") as f:
        w_data = json.load(f)
    all_works = w_data.get("works", w_data)
    if isinstance(all_works, dict):
        all_works = list(all_works.values())

    works_by_id = {w["id"]: w for w in all_works}

    # Collect unique poems and their edition mappings
    # poem key = (title, author, dynasty) to deduplicate
    poems_map = {}  # key -> {title, author, dynasty, content, kind_cn, content_lines, tags}
    edition_entries = []  # (poem_key, edition, school_system, grade_or_None, semester_or_None)

    for cw in collection_works:
        cid = cw["collection_id"]
        if cid not in EDITION_MAP:
            continue

        edition, school_system, grade, semester = EDITION_MAP[cid]
        work_id = cw["work_id"]
        title = cw["work_title"]
        author = cw["work_author"]
        dynasty = cw["work_dynasty"]

        full_work = works_by_id.get(work_id)
        if full_work:
            content = full_work["content"]
            kind_cn = full_work.get("kind_cn", "")
        else:
            content = cw.get("work_content", "")
            kind_cn = ""

        if not content:
            continue

        key = (title, author, dynasty)
        if key not in poems_map:
            content_lines = build_content_lines(content)
            if not content_lines:
                continue
            tags = infer_tags(title, dynasty, content_lines, kind_cn)
            poems_map[key] = {
                "title": title,
                "author": author,
                "dynasty": dynasty,
                "content_lines": content_lines,
                "tags": tags,
            }

        edition_entries.append((key, edition, school_system, grade, semester))

    # Deduplicate edition entries
    edition_set = set()
    unique_editions = []
    for key, edition, school_system, grade, semester in edition_entries:
        entry = (key, edition, school_system, grade, semester)
        if entry not in edition_set:
            edition_set.add(entry)
            unique_editions.append(entry)

    poems_list = list(poems_map.values())
    poems_list.sort(key=lambda p: (p["dynasty"], p["title"]))

    print(f"[INFO] Unique poems: {len(poems_list)}", file=sys.stderr)
    print(f"[INFO] Edition entries: {len(unique_editions)}", file=sys.stderr)

    # Generate SQL
    sql = []
    sql.append("-- Seed script for poems + poem_editions tables")
    sql.append(f"-- Generated from 人教/苏教/沪教 textbook collections")
    sql.append(f"-- Total: {len(poems_list)} unique poems, {len(unique_editions)} edition placements")
    sql.append(f"-- Covers: 小学 (grades 1-6), 初中 (grades 1-3), 高中 (grades 1-3)")
    sql.append("")
    sql.append("-- Insert poems")
    sql.append("INSERT INTO poems (title, author, dynasty, content_lines, tags)")
    sql.append("VALUES")

    values = []
    for p in poems_list:
        title = escape_sql(p["title"])
        author = escape_sql(p["author"])
        dynasty = escape_sql(p["dynasty"])
        cl_json = json.dumps(p["content_lines"], ensure_ascii=False)
        cl_json = cl_json.replace("'", "''")
        tags_arr = "ARRAY[" + ", ".join(f"'{escape_sql(t)}'" for t in p["tags"]) + "]"
        values.append(f"  ('{title}', '{author}', '{dynasty}', '{cl_json}'::jsonb, {tags_arr})")

    sql.append(",\n".join(values))
    sql.append(";")
    sql.append("")

    # Group edition entries: with grade vs without grade
    with_grade = [(k, ed, ss, g, sem) for k, ed, ss, g, sem in unique_editions if g is not None]
    without_grade = [(k, ed, ss, g, sem) for k, ed, ss, g, sem in unique_editions if g is None]

    if with_grade:
        sql.append("-- Link poems to editions with grade info (人教)")
        sql.append("INSERT INTO poem_editions (poem_id, edition, school_system, grade, semester)")
        sql.append("SELECT p.id, g.edition, g.school_system, g.grade, g.semester")
        sql.append("FROM (VALUES")
        vals = []
        for key, edition, school_system, grade, semester in with_grade:
            title = escape_sql(key[0])
            sem_sql = f"'{semester}'" if semester else "NULL"
            vals.append(f"  ('{title}', '{edition}', '{school_system}', {grade}, {sem_sql})")
        sql.append(",\n".join(vals))
        sql.append(") AS g(title, edition, school_system, grade, semester)")
        sql.append("JOIN poems p ON p.title = g.title")
        sql.append("ON CONFLICT DO NOTHING;")
        sql.append("")

    if without_grade:
        sql.append("-- Link poems to editions without grade info (苏教/沪教)")
        sql.append("INSERT INTO poem_editions (poem_id, edition, school_system, grade, semester)")
        sql.append("SELECT p.id, g.edition, g.school_system, NULL, NULL")
        sql.append("FROM (VALUES")
        vals = []
        for key, edition, school_system, _, _sem in without_grade:
            title = escape_sql(key[0])
            vals.append(f"  ('{title}', '{edition}', '{school_system}')")
        sql.append(",\n".join(vals))
        sql.append(") AS g(title, edition, school_system)")
        sql.append("JOIN poems p ON p.title = g.title")
        sql.append("ON CONFLICT DO NOTHING;")

    output_path = SCRIPT_DIR / "seed-poems.sql"
    with open(output_path, "w", encoding="utf-8") as f:
        f.write("\n".join(sql) + "\n")

    # Also write batched files for Supabase SQL Editor (target ~300KB per file)
    MAX_BATCH_BYTES = 300_000
    batch_dir = SCRIPT_DIR / "seed-batches"
    batch_dir.mkdir(exist_ok=True)
    batch_num = 1
    current_batch = []
    current_size = 0
    poem_idx = 0

    def flush_batch():
        nonlocal batch_num, current_batch, current_size, poem_idx
        if not current_batch:
            return
        start = poem_idx - len(current_batch) + 1
        batch_sql = []
        batch_sql.append(f"-- Batch {batch_num}: poems {start}-{poem_idx} of {len(poems_list)}")
        batch_sql.append("INSERT INTO poems (title, author, dynasty, content_lines, tags)")
        batch_sql.append("VALUES")
        batch_sql.append(",\n".join(current_batch))
        batch_sql.append(";")
        batch_file = batch_dir / f"seed-poems-{batch_num:02d}.sql"
        with open(batch_file, "w", encoding="utf-8") as f:
            f.write("\n".join(batch_sql) + "\n")
        batch_num += 1
        current_batch = []
        current_size = 0

    for p in poems_list:
        poem_idx += 1
        title = escape_sql(p["title"])
        author = escape_sql(p["author"])
        dynasty = escape_sql(p["dynasty"])
        cl_json = json.dumps(p["content_lines"], ensure_ascii=False)
        cl_json = cl_json.replace("'", "''")
        tags_arr = "ARRAY[" + ", ".join(f"'{escape_sql(t)}'" for t in p["tags"]) + "]"
        val = f"  ('{title}', '{author}', '{dynasty}', '{cl_json}'::jsonb, {tags_arr})"
        val_size = len(val.encode("utf-8"))
        if current_size + val_size > MAX_BATCH_BYTES and current_batch:
            flush_batch()
        current_batch.append(val)
        current_size += val_size
    flush_batch()

    # Write editions as the last batch
    edition_sql = []
    if with_grade:
        edition_sql.append("-- Link poems to editions with grade info (人教)")
        edition_sql.append("INSERT INTO poem_editions (poem_id, edition, school_system, grade, semester)")
        edition_sql.append("SELECT p.id, g.edition, g.school_system, g.grade, g.semester")
        edition_sql.append("FROM (VALUES")
        vals = []
        for key, edition, school_system, grade, semester in with_grade:
            title = escape_sql(key[0])
            sem_sql = f"'{semester}'" if semester else "NULL"
            vals.append(f"  ('{title}', '{edition}', '{school_system}', {grade}, {sem_sql})")
        edition_sql.append(",\n".join(vals))
        edition_sql.append(") AS g(title, edition, school_system, grade, semester)")
        edition_sql.append("JOIN poems p ON p.title = g.title")
        edition_sql.append("ON CONFLICT DO NOTHING;")
        edition_sql.append("")
    if without_grade:
        edition_sql.append("-- Link poems to editions without grade info (苏教/沪教)")
        edition_sql.append("INSERT INTO poem_editions (poem_id, edition, school_system, grade, semester)")
        edition_sql.append("SELECT p.id, g.edition, g.school_system, NULL, NULL")
        edition_sql.append("FROM (VALUES")
        vals = []
        for key, edition, school_system, _, _sem in without_grade:
            title = escape_sql(key[0])
            vals.append(f"  ('{title}', '{edition}', '{school_system}')")
        edition_sql.append(",\n".join(vals))
        edition_sql.append(") AS g(title, edition, school_system)")
        edition_sql.append("JOIN poems p ON p.title = g.title")
        edition_sql.append("ON CONFLICT DO NOTHING;")
    edition_file = batch_dir / f"seed-poems-{batch_num:02d}-editions.sql"
    with open(edition_file, "w", encoding="utf-8") as f:
        f.write("\n".join(edition_sql) + "\n")

    print(f"[OK] Generated {output_path}", file=sys.stderr)
    print(f"[OK] Generated {batch_num} batch files in {batch_dir}/", file=sys.stderr)
    print(f"[OK] {len(poems_list)} poems, {len(unique_editions)} edition placements", file=sys.stderr)


if __name__ == "__main__":
    main()
