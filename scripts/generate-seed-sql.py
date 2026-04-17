#!/usr/bin/env python3
"""
Generate SQL seed script from poems-with-pinyin.json.
Converts JSON data into INSERT statements for the poems table.
"""

import json
from pathlib import Path


def escape_sql_string(s: str) -> str:
    """Escape single quotes for SQL."""
    return s.replace("'", "''")


def generate_tags(poem: dict) -> list[str]:
    """Generate tags for a poem based on its metadata."""
    tags = []

    # Add dynasty tag
    tags.append(poem["dynasty"])

    # Add grade tag
    tags.append(f"小学{poem['grade']}年级")

    # Infer form based on line count and character count
    line_count = len(poem["content_lines"])
    char_counts = [len(line["chars"]) for line in poem["content_lines"]]

    # Determine poem form
    if all(c == 5 for c in char_counts[:4]) and line_count == 4:
        tags.append("五言绝句")
    elif all(c == 7 for c in char_counts[:4]) and line_count == 4:
        tags.append("七言绝句")
    elif all(c == 5 for c in char_counts[:8]) and line_count == 8:
        tags.append("五言律诗")
    elif all(c == 7 for c in char_counts[:8]) and line_count == 8:
        tags.append("七言律诗")
    elif "词" in poem["title"] or any(c < 5 for c in char_counts):
        tags.append("词")
    elif line_count >= 8:
        tags.append("古体诗")

    # Add thematic tags based on common themes in titles and content
    title = poem["title"]
    if any(word in title for word in ["思", "忆", "相思", "送"]):
        tags.append("思乡")
    if any(word in title for word in ["春", "夏", "秋", "冬", "雪", "雨", "风"]):
        tags.append("写景")
    if any(word in title for word in ["山", "水", "江", "湖", "瀑布"]):
        tags.append("山水")

    return tags


def generate_seed_sql(input_path: str, output_path: str):
    """
    Generate SQL INSERT statements from poems-with-pinyin.json.
    Poems go into the poems table; edition/grade mappings go into poem_editions.
    """
    input_file = Path(input_path)
    output_file = Path(output_path)

    if not input_file.exists():
        raise FileNotFoundError(f"Input file not found: {input_file}")

    with open(input_file, "r", encoding="utf-8") as f:
        poems = json.load(f)

    sql_lines = [
        "-- Seed script for poems + poem_editions tables",
        f"-- Generated from curated 人教版 elementary school textbook poems",
        f"-- Total: {len(poems)} poems from grades 1-6",
        "",
        "-- Insert poems (without grade_level or edition)",
        "INSERT INTO poems (title, author, dynasty, content_lines, tags)",
        "VALUES"
    ]

    values = []
    edition_pairs = []
    for poem in poems:
        title = escape_sql_string(poem["title"])
        author = escape_sql_string(poem["author"])
        dynasty = escape_sql_string(poem["dynasty"])
        grade = poem["grade"]
        content_lines_json = json.dumps(poem["content_lines"], ensure_ascii=False)
        tags = generate_tags(poem)
        tags_array = "ARRAY[" + ", ".join(f"'{escape_sql_string(tag)}'" for tag in tags) + "]"

        value = f"  ('{title}', '{author}', '{dynasty}', '{content_lines_json}'::jsonb, {tags_array})"
        values.append(value)
        edition_pairs.append((title, grade))

    sql_lines.append(",\n".join(values))
    sql_lines.append(";")
    sql_lines.append("")
    sql_lines.append("-- Link poems to 人教版 小学 with their grades")
    sql_lines.append("INSERT INTO poem_editions (poem_id, edition, level, grade)")
    sql_lines.append("SELECT p.id, '人教', '小学', g.grade")
    sql_lines.append("FROM (VALUES")

    ed_values = []
    for title, grade in edition_pairs:
        ed_values.append(f"  ('{title}', {grade})")

    sql_lines.append(",\n".join(ed_values))
    sql_lines.append(") AS g(title, grade)")
    sql_lines.append("JOIN poems p ON p.title = g.title;")

    with open(output_file, "w", encoding="utf-8") as f:
        f.write("\n".join(sql_lines))

    print(f"[OK] Generated SQL seed script")
    print(f"[OK] Output: {output_file}")
    print(f"[OK] Total poems: {len(poems)}")
    print(f"\nTo run this script:")
    print(f"  psql -U postgres -d kuibu -f {output_file.name}")
    print(f"  OR")
    print(f"  Use Supabase SQL Editor to paste and execute the contents")


if __name__ == "__main__":
    script_dir = Path(__file__).parent
    input_path = script_dir / "poems-with-pinyin.json"
    output_path = script_dir / "seed-poems.sql"

    generate_seed_sql(str(input_path), str(output_path))
