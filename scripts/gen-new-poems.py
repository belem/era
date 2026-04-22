#!/usr/bin/env python3
"""Generate seed SQL for new poems with pinyin annotations."""

import json
from pypinyin import pinyin, Style

POLYPHONE_CHARS = set("了行处长得还分没觉好少重教乐地的为切思见度传说间要和")
PUNCT_CHARS = set("，。！？、；：")
SKIP_CHARS = set("\u201c\u201d\u2018\u2019")  # ""'' — skip Chinese quotes


def text_to_content_lines(text):
    """Convert raw text into content_lines JSON structure with pinyin."""
    lines = []
    current_chars = []
    
    for char in text:
        if char in SKIP_CHARS:
            continue  # Skip Chinese quotes
        if char in PUNCT_CHARS:
            if current_chars:
                chars_data = []
                raw = ''.join(c for c in current_chars)
                py_list = pinyin(raw, style=Style.TONE, heteronym=False)
                for i, c in enumerate(current_chars):
                    entry = {"char": c, "pinyin": py_list[i][0]}
                    if c in POLYPHONE_CHARS:
                        entry["polyphone"] = True
                    chars_data.append(entry)
                lines.append({"chars": chars_data, "punctuation": char})
                current_chars = []
        else:
            current_chars.append(char)
    
    # Handle trailing text without punctuation
    if current_chars:
        raw = ''.join(current_chars)
        py_list = pinyin(raw, style=Style.TONE, heteronym=False)
        chars_data = []
        for i, c in enumerate(current_chars):
            entry = {"char": c, "pinyin": py_list[i][0]}
            if c in POLYPHONE_CHARS:
                entry["polyphone"] = True
            chars_data.append(entry)
        lines.append({"chars": chars_data, "punctuation": "。"})
    
    return lines


# New poems to add
new_poems = [
    {
        "title": "江上渔者",
        "author": "范仲淹",
        "dynasty": "宋",
        "text": "江上往来人，但爱鲈鱼美。君看一叶舟，出没风波里。",
        "tags": []
    },
    {
        "title": "浣溪沙 · 游蕲水清泉寺",
        "author": "苏轼",
        "dynasty": "宋",
        "text": "游蕲水清泉寺，寺临兰溪，溪水西流。山下兰芽短浸溪，松间沙路净无泥。萧萧暮雨子规啼。谁道人生无再少？门前流水尚能西！休将白发唱黄鸡。",
        "tags": []
    },
    {
        "title": "清平乐 · 春归何处",
        "author": "黄庭坚",
        "dynasty": "宋",
        "text": "春归何处？寂寞无行路。若有人知春去处，唤取归来同住。春无踪迹谁知？除非问取黄鹂。百啭无人能解，因风飞过蔷薇。",
        "tags": ["spring"]
    },
    {
        "title": "淮中晚泊犊头",
        "author": "苏舜钦",
        "dynasty": "宋",
        "text": "春阴垂野草青青，时有幽花一树明。晚泊孤舟古祠下，满川风雨看潮生。",
        "tags": ["spring"]
    },
    {
        "title": "学弈",
        "author": "孟子",
        "dynasty": "先秦",
        "text": "弈秋，通国之善弈者也。使弈秋诲二人弈，其一人专心致志，惟弈秋之为听；一人虽听之，一心以为有鸿鹄将至，思援弓缴而射之。虽与之俱学，弗若之矣。为是其智弗若与？曰：非然也。",
        "tags": []
    },
    {
        "title": "曹冲称象",
        "author": "陈寿",
        "dynasty": "魏晋",
        "text": "邓哀王冲字仓舒。少聦察岐嶷，生五六岁，智意所及，有若成人之智。时孙权曾致巨象，太祖欲知其斤重，访之群下，咸莫能出其理。冲曰：\u201c置象大船之上，而刻其水痕所至，称物以载之，则校可知矣。\u201d太祖悦，即施行焉。",
        "tags": []
    },
]

# Generate SQL
lines = []
lines.append("-- New poems (batch 19)")
lines.append("INSERT INTO poems (title, author, dynasty, content_lines, tags)")
lines.append("VALUES")

values = []
for poem in new_poems:
    content_lines = text_to_content_lines(poem["text"])
    cl_json = json.dumps(content_lines, ensure_ascii=False)
    tags = "'{}'::text[]" if not poem["tags"] else "ARRAY[" + ", ".join(f"'{t}'" for t in poem["tags"]) + "]"
    escaped_title = poem["title"].replace("'", "''")
    val = f"  ('{escaped_title}', '{poem['author']}', '{poem['dynasty']}', '{cl_json}'::jsonb, {tags})"
    values.append(val)

lines.append(',\n'.join(values))
lines.append("ON CONFLICT DO NOTHING;")

sql = '\n'.join(lines) + '\n'

with open('scripts/seed-batches/seed-poems-19.sql', 'w', encoding='utf-8') as f:
    f.write(sql)

print(f"Generated {len(new_poems)} new poems → scripts/seed-batches/seed-poems-19.sql")
for p in new_poems:
    print(f"  ✓ {p['title']} ({p['author']})")
