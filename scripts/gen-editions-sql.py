#!/usr/bin/env python3
"""Parse curriculum-editions-九年.md and regenerate seed-poems-18-editions.sql."""
import re
import os

os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def parse_section(text):
    """Parse a markdown table section into rows: (title, grade, semester, page)."""
    rows = []
    for line in text.split('\n'):
        line = line.strip()
        if not line.startswith('|') or '---' in line or '年级' in line:
            continue
        parts = line.split('|')
        if len(parts) < 6:
            continue
        grade_str = parts[1].strip()
        sem_str = parts[2].strip()
        page_str = parts[3].strip()
        title = parts[4].strip()
        if not title:
            continue
        grade = int(grade_str) if grade_str.isdigit() else None
        semester = sem_str if sem_str in ('上册', '下册') else None
        page = int(page_str) if page_str.isdigit() else None
        rows.append((title, grade, semester, page))
    return rows

def fill_missing_grades(rows):
    """Forward-fill grades: entries without grade inherit from nearest preceding graded entry."""
    first_grade = next((g for _, g, _, _ in rows if g is not None), None)
    last = first_grade
    result = []
    for title, grade, sem, page in rows:
        if grade is not None:
            last = grade
        result.append((title, grade if grade is not None else last, sem, page))
    return result

# Read inputs
with open('docs/curriculum-editions-九年.md', 'r', encoding='utf-8') as f:
    md = f.read()

with open('scripts/seed-batches/seed-poems-18-editions.sql', 'r', encoding='utf-8') as f:
    sql = f.read()

# Extract rest of SQL (苏教/沪教 + seasonal tags)
rest_marker = '-- Link poems to editions without grade info'
rest_idx = sql.index(rest_marker)
rest_of_sql = sql[rest_idx:]

# Parse markdown sections
secs = md.split('## ')
w_text = next(s for s in secs if s.startswith('人教 · 五四'))
l_text = next(s for s in secs if s.startswith('人教 · 六三'))

w_rows = fill_missing_grades(parse_section(w_text))
l_rows = fill_missing_grades(parse_section(l_text))

def fmt(title, ed, sys_, grade, sem, page):
    t = title.replace("'", "''")
    g = str(grade) if grade is not None else 'NULL'
    s = f"'{sem}'" if sem else 'NULL'
    p = str(page) if page is not None else 'NULL'
    return f"  ('{t}', '{ed}', '{sys_}', {g}, {s}, {p})"

vals = []

# 五四 entries
for t, g, s, p in w_rows:
    vals.append(fmt(t, '人教', '五四', g, s, p))

# 六三 entries
for t, g, s, p in l_rows:
    vals.append(fmt(t, '人教', '六三', g, s, p))

# 高中 entries (preserve from existing SQL verbatim, convert 5-col to 6-col)
first_insert_end = sql.index(rest_marker)
gaozh_5col = r"\('([^']+)',\s*'人教',\s*'高中',\s*(\d+),\s*NULL\)"
gaozh_6col = r"  \('[^']+',\s*'人教',\s*'高中',\s*\d+,\s*NULL,\s*NULL\)"
for m in re.finditer(gaozh_6col, sql[:first_insert_end]):
    vals.append(m.group(0))
for m in re.finditer(gaozh_5col, sql[:first_insert_end]):
    vals.append(fmt(m.group(1), '人教', '高中', int(m.group(2)), None, None))

# Build the first INSERT block
new_insert = [
    "-- Link poems to editions with grade info (人教)",
    "INSERT INTO poem_editions (poem_id, edition, school_system, grade, semester, page)",
    "SELECT p.id, g.edition, g.school_system, g.grade, g.semester, g.page",
    "FROM (VALUES",
    ',\n'.join(vals),
    ") AS g(title, edition, school_system, grade, semester, page)",
    "JOIN poems p ON p.title = g.title",
    "ON CONFLICT DO NOTHING;",
]

full_sql = '\n'.join(new_insert) + '\n\n' + rest_of_sql

with open('scripts/seed-batches/seed-poems-18-editions.sql', 'w', encoding='utf-8') as f:
    f.write(full_sql)

# Summary
wusi_count = len(w_rows)
liusan_count = len(l_rows)
gaozh_count = len([v for v in vals if "'高中'" in v])
print(f"五四 entries: {wusi_count}")
print(f"六三 entries: {liusan_count}")
print(f"高中 entries: {gaozh_count}")
print(f"Total VALUES: {len(vals)}")
print("File written: scripts/seed-batches/seed-poems-18-editions.sql")
