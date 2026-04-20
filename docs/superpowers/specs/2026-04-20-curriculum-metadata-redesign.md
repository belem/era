# Curriculum Metadata Redesign

## Summary

Redesign how poem edition/curriculum metadata works across Kuibu. Changes reflect actual Chinese textbook organization: 人教 (not 部编), 学制 (六三/五四/高中), unified 义务教育 level with grades 1-9, and per-poem page numbers.

## Data Model

### `poem_editions` table (drop and recreate)

```sql
CREATE TABLE poem_editions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poem_id UUID NOT NULL REFERENCES poems ON DELETE CASCADE,
  edition TEXT NOT NULL,
  school_system TEXT NOT NULL CHECK (school_system IN ('六三', '五四', '高中')),
  level TEXT NOT NULL CHECK (level IN ('义务教育', '高中')),
  grade INTEGER CHECK (grade IS NULL OR grade BETWEEN 1 AND 9),
  page INTEGER,
  UNIQUE (poem_id, edition, school_system, grade)
);

CREATE INDEX idx_poem_editions_lookup ON poem_editions(edition, school_system, grade);
```

Fields:
- `edition`: Publisher name (人教, 苏教, 沪教, etc.)
- `school_system`: 六三, 五四, or 高中
- `level`: 义务教育 or 高中 (derived from school_system but stored explicitly for query convenience)
- `grade`: Nullable. 1-9 for 义务教育, 1-3 for 高中. NULL when grade placement is unknown (e.g. 苏教/沪教)
- `page`: Nullable page number in textbook

### `students` table changes

Add `school_system` column. Update constraints on `level`, `grade`, `edition`.

```sql
-- New schema for students (relevant columns):
school_system TEXT NOT NULL DEFAULT '六三' CHECK (school_system IN ('六三', '五四', '高中'))
level TEXT NOT NULL DEFAULT '义务教育' CHECK (level IN ('义务教育', '高中'))
grade INTEGER NOT NULL CHECK (grade BETWEEN 1 AND 9)
edition TEXT NOT NULL DEFAULT '人教'
```

### Derivation rule

- `school_system IN ('六三', '五四')` implies `level = '义务教育'`
- `school_system = '高中'` implies `level = '高中'`

### Grade mapping from old to new

| Old level | Old grade | New level | New grade |
|-----------|-----------|-----------|-----------|
| 小学 | 1-6 | 义务教育 | 1-6 |
| 初中 | 1 | 义务教育 | 7 |
| 初中 | 2 | 义务教育 | 8 |
| 初中 | 3 | 义务教育 | 9 |
| 高中 | 1-3 | 高中 | 1-3 |

### Edition renaming

| Old | New |
|-----|-----|
| 部编 | 人教 |
| 苏教 | 苏教 (unchanged) |
| 沪教 | 沪教 (unchanged) |

## Seed Data Changes

### `scripts/seed-batches/seed-poems-18-editions.sql`

Rewrite with new columns:
- All 部编 entries become 人教 with `school_system = '六三'`
- Old 初中 grade 1/2/3 become grade 7/8/9
- `page` = NULL throughout (to be populated manually via admin)
- No 五四 entries yet (added manually later)

### `scripts/generate-seed-sql.py`

Update `EDITION_MAP` constants:
- `("部编", "小学", N)` → `("人教", "六三", "义务教育", N)`
- `("部编", "初中", N)` → `("人教", "六三", "义务教育", N+6)`
- `("部编", "高中", N)` → `("人教", "高中", "高中", N)`
- `("苏教", "小学", None)` → `("苏教", "六三", "义务教育", None)`
- `("苏教", "初中", None)` → `("苏教", "六三", "义务教育", None)`

## UI Changes

### Student onboarding (`src/app/onboarding/page.tsx`)

- Replace level picker (小学/初中/高中) with **学制 picker** (六·三学制, 五·四学制)
  - 高中 is a separate path, triggered when grade > what 义务教育 covers
  - Or: three-option picker: 六·三学制, 五·四学制, 高中
- Grade picker: 1-9 for 义务教育, 1-3 for 高中
- Edition default: 人教
- KNOWN_EDITIONS: update, remove 部编, ensure 人教 is first

### Student profile (`src/app/profile/page.tsx`)

- Replace LEVELS constant with school_system options
- Replace `gradeOptions(level)` with `gradeOptions(schoolSystem)`:
  - 六三 or 五四 → grades 1-9
  - 高中 → grades 1-3
- EDITIONS: replace 部编 with 人教
- Curriculum change detection: include school_system

### Library filters (`src/app/library/page.tsx`)

- Edition filter: show only editions with data in the DB
- School system filter: only show if more than one school_system has data
- Grade filter: show available grades based on data
- Update LEVEL_ORDER and curriculumOrder sorting logic
- Hide any filter section with no data

### PoemCard display (`src/components/PoemCard.tsx`)

Update `formatEdition()`:
```
人教·六三·三年级           (义务教育 grade 1-6)
人教·六三·七年级·第97页    (义务教育 grade 7-9, with page)
人教·高中·高一             (高中)
苏教·六三                  (no grade info)
```

Rule: only show page if not NULL.

### Format utilities (`src/lib/format.ts`)

Update `formatGrade()`:
- Grades 1-6: `X年级`
- Grades 7-9: `七年级`, `八年级`, `九年级`
- 高中 grades 1-3: `高一`, `高二`, `高三`

### Review page (`src/app/review/page.tsx`)

Already uses `formatGrade` from lib. Will work after utility update.

### Admin page (`src/app/admin/page.tsx`)

- Add school_system dropdown (六三/五四/高中) to edition editor
- Add page number input (optional)
- Update LEVELS and KNOWN_EDITIONS constants
- Update filter dropdowns

### useStudent hook (`src/hooks/useStudent.tsx`)

Add `school_system` to Student interface.

## API Changes

### `src/app/api/admin/poems/route.ts`

- Add `school_system` to query filter params
- Add `page` to insert/update payloads

### `src/app/api/admin/poems/[poemId]/route.ts`

- Include school_system and page in upsert/conflict resolution
- Update unique key from `(poem_id, edition, level, grade)` to `(poem_id, edition, school_system, grade)`

## UI Principle

**Hide what has no data.** If page is NULL, don't show it. If only one school_system exists in the DB, don't show a school_system filter. This prevents empty/confusing UI until data is populated.

## Database Reset Flow

A combined `supabase/reset-all.sql` merges all migrations (001 + 002 + 003 + 004) into a single file for clean resets. The `tag-seasonal.sql` content is appended to `seed-poems-18-editions.sql`.

**Steps in Supabase SQL Editor:**
1. `supabase/reset-all.sql` — drops everything, recreates all tables/RLS/triggers/functions/badges
2. `scripts/seed-batches/seed-poems-01.sql` through `seed-poems-17.sql` — poem data
3. `scripts/seed-batches/seed-poems-18-editions.sql` — edition links + seasonal tags

## Files Modified

| File | Change |
|------|--------|
| `supabase/migrations/001_initial_schema.sql` | Rewrite students + poem_editions tables |
| `supabase/migrations/004_auto_assign_poems.sql` | Update assign RPC, join on school_system |
| `supabase/reset-all.sql` | Combined reset script (all migrations merged) |
| `scripts/seed-batches/seed-poems-18-editions.sql` | Rewrite with new structure + seasonal tags |
| `scripts/generate-seed-sql.py` | Update EDITION_MAP and output logic |
| `scripts/tag-seasonal.sql` | (content merged into seed-poems-18-editions.sql) |
| `src/lib/format.ts` | Update formatGrade, add formatEdition, helper functions |
| `src/components/PoemCard.tsx` | Use new formatEdition from lib |
| `src/app/onboarding/page.tsx` | School system picker, new grade logic |
| `src/app/profile/page.tsx` | School system field, new grade logic |
| `src/app/library/page.tsx` | New filters, hide-when-empty logic |
| `src/app/review/page.tsx` | Fetch school_system, use updated format |
| `src/app/admin/page.tsx` | New fields in edition editor |
| `src/hooks/useStudent.tsx` | Add school_system to interface |
| `src/app/api/admin/poems/route.ts` | New filter/insert fields |
| `src/app/api/admin/poems/[poemId]/route.ts` | New upsert logic |
| `src/app/api/badges/check/route.ts` | Filter by school_system instead of level |
