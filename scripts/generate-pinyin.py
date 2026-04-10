#!/usr/bin/env python3
"""
Generate per-character pinyin annotations for curated poems.
Uses pypinyin with Style.TONE and flags common polyphone characters.
"""

import json
from pathlib import Path
from pypinyin import pinyin, Style

# Common polyphone characters that often need manual review
POLYPHONE_CHARS = set("了行处长得还分没觉好少重教乐地的为切思见度传说间要和")


def generate_pinyin(input_path: str, output_path: str):
    """
    Read curated poems and generate pinyin annotations.

    Input: JSON with poems containing 'paragraphs' array
    Output: JSON with poems containing 'content_lines' array with char-level pinyin
    """
    input_file = Path(input_path)
    output_file = Path(output_path)

    if not input_file.exists():
        raise FileNotFoundError(f"Input file not found: {input_file}")

    with open(input_file, "r", encoding="utf-8") as f:
        poems = json.load(f)

    results = []
    polyphone_count = 0
    total_chars = 0

    for poem in poems:
        lines = []

        for paragraph in poem["paragraphs"]:
            # Separate text from trailing punctuation
            text = paragraph.rstrip("，。！？、；：")
            punct = paragraph[len(text):] if len(text) < len(paragraph) else "。"

            if not text:  # Handle edge case of pure punctuation
                continue

            # Generate pinyin for each character
            chars = []
            py_list = pinyin(text, style=Style.TONE, heteronym=False)

            for i, char in enumerate(text):
                total_chars += 1
                entry = {
                    "char": char,
                    "pinyin": py_list[i][0]
                }

                # Flag potential polyphones for manual review
                if char in POLYPHONE_CHARS:
                    entry["polyphone"] = True
                    polyphone_count += 1

                chars.append(entry)

            lines.append({
                "chars": chars,
                "punctuation": punct
            })

        # Build output poem object with content_lines instead of paragraphs
        result = {
            "title": poem["title"],
            "author": poem["author"],
            "dynasty": poem["dynasty"],
            "grade": poem["grade"],
            "content_lines": lines
        }
        results.append(result)

    # Write output
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    print(f"[OK] Generated pinyin for {len(results)} poems")
    print(f"[OK] Total characters: {total_chars}")
    print(f"[OK] Polyphone markers: {polyphone_count} ({polyphone_count/total_chars*100:.1f}%)")
    print(f"[OK] Output: {output_file}")
    print(f"\n[WARN] Review characters marked with 'polyphone: true' for accuracy")


if __name__ == "__main__":
    script_dir = Path(__file__).parent
    input_path = script_dir / "curated-poems.json"
    output_path = script_dir / "poems-with-pinyin.json"

    generate_pinyin(str(input_path), str(output_path))
