# Kuibu — Product Requirements Document (PRD)

**Project Codename**: Kuibu
**Version**: v1.1
**Status**: Draft
**Last Updated**: 2026

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [User & Permission Model](#2-user--permission-model)
3. [Poetry Database: Sources, Pinyin & Polyphonic Characters](#3-poetry-database-sources-pinyin--polyphonic-characters)
4. [Classical Poetry Learning Module](#4-classical-poetry-learning-module)
5. [Spaced Repetition Algorithm System](#5-spaced-repetition-algorithm-system)
6. [Recitation Fragment Module](#6-recitation-fragment-module)
7. [Settings Module](#7-settings-module)
8. [Frontend Architecture Recommendations](#8-frontend-architecture-recommendations)
9. [Glossary](#9-glossary)

---

## 1. Project Overview

### 1.1 Product Positioning

Kuibu is an intelligent memorization platform for classical Chinese poetry, targeting primary and middle school students. It uses Spaced Repetition algorithms to scientifically schedule study and review sessions, while supporting collaborative participation by parents and family members.

### 1.2 Technology Stack

- **Frontend**: Mobile First, Responsive Web Application (PWA-friendly), with reserved Tauri desktop extension capability
- **Font**: Prioritize loading LXGW WenKai (霞鹜文楷); fallback to system Song/Kai typefaces
- **Pinyin Rendering**: HTML `<ruby>` / `<rt>` tags; global CSS variable `--pinyin-display` controls show/hide
- **Algorithm Libraries**: SM-2 (custom implementation), Leitner Box (custom implementation), FSRS-6 (via `ts-fsrs` npm package)

### 1.3 Design Style

| Design Element | Specification |
|----------------|---------------|
| Main Background | Rice white / Xuan paper texture `#F5F5F0` / `#F9F9F4` |
| Main Text | Ink black `#2C2C2C` |
| Accent Colors | Vermillion red `#C3272B` (primary actions), Porcelain blue `#1D4E89` (navigation/headings) |
| Overall Style | Traditional Chinese color palette, classical Chinese cultural aesthetics — elegant and serene |

---

## 2. User & Permission Model

### 2.1 Account Types

The system has three principal account types, implemented via a single `users` table with a role enum:

| Account Type | Identifier | Description |
|--------------|------------|-------------|
| Administrator | `ADMIN` | Platform operators; can modify the poetry library and handle error reports |
| Parent / Guardian | `GUARDIAN` | Primary registrant; creates student accounts and can invite family members |
| Student | `STUDENT` | The learner; **does not hold an independent login credential** — created by a parent and accessed via profile switching |

> **Design Decision**: Student accounts do not log in independently. After a parent logs in, they switch to a student's learning interface via "Switch Profile." The frontend maintains a `currentStudentId` context state. This avoids the complexity of managing independent accounts for minors.

### 2.2 Data Models

#### `users` Table (Parent / ADMIN)

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID PK | Primary key |
| `email` | string UNIQUE | Login email |
| `password_hash` | string | Hashed password |
| `display_name` | string | Display name / nickname |
| `role` | ENUM(GUARDIAN, ADMIN) | Account role |
| `plan` | ENUM(FREE, PRO) | Subscription plan; default FREE |
| `created_at` / `updated_at` | timestamp | Timestamps |

#### `students` Table

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID PK | Primary key |
| `owner_id` | UUID FK → users.id | Creator (primary parent) with full management rights |
| `name` | string | Student name / nickname |
| `grade` | INT (1–6) | Current grade; auto-incremented by +1 each September via scheduled job |
| `textbook_edition` | ENUM(PEP, HJ, SJ, OTHER) | Textbook edition |
| `algorithm` | ENUM(SM2, LEITNER, FSRS) | Active review algorithm |
| `settings_json` | jsonb | Personalized configuration (review count, pinyin toggle, etc.) |
| `created_at` / `updated_at` | timestamp | Timestamps |

#### `student_guardians` Table (Many-to-Many Relationship)

| Field | Type | Description |
|-------|------|-------------|
| `student_id` | UUID FK → students.id | Student ID |
| `guardian_id` | UUID FK → users.id | Guardian user ID |
| `relationship` | string | Relationship label (see quota rules) |
| `is_owner` | boolean | Whether this is the primary parent (creator) |
| `status` | ENUM(PENDING, ACTIVE, REVOKED) | Invitation status |
| `invited_by` | UUID FK → users.id | Inviter |
| `invited_at` / `joined_at` | timestamp | Invitation / join timestamps |

> `relationship` field: FREE plan only allows enumerated values (e.g., Dad, Mom); PRO plan supports additional labels such as Grandfather, Grandmother, Uncle, Aunt, and any other custom string up to 20 characters.

### 2.3 Quotas & Permissions

| Rule | Free | Pro | Max | Admin |
|------|------|-----|-----|-------|
| Max student accounts | 2 | 8 | 120 | Unlimited |
| Max guardians per student | 2 | 16 | 30 | Unlimited |
| Available review algorithms | SM2, LEITNER | SM2, LEITNER, FSRS | SM2, LEITNER, FSRS | All |
| Relationship labels | Enum values only | Custom supported | Custom supported | Custom supported |
| Poetry library modification | ❌ Blocked | ❌ Blocked | ❌ Blocked | ✅ Allowed |
| Error report handling | Submit only | Submit only | Submit only | View & resolve |
| Custom poem additions | ❌ Not supported | ✅ Supported (200 poems/student max) | ✅ Unlimited | ✅ Unlimited |

> All quota checks are enforced in backend middleware. The frontend mirrors these constraints as UX hints but is not the authoritative validation layer.

### 2.4 Invitation Flow

1. The primary parent enters the invitee's email address and selects a relationship label on the student settings page, generating an invite link with a token (valid for 7 days).
2. The invitee clicks the link to register / log in; `student_guardians.status` updates to `ACTIVE`.
3. The primary parent can revoke access at any time from "Family Management" (`status → REVOKED`).
4. Non-owner guardians have read-only access (view learning reports only); only the owner can modify student settings.

### 2.5 Automatic Grade Advancement

A scheduled job runs on September 1st each year, incrementing `grade +1` for all active students (capped at Grade 6). It is recommended to push a notification to the primary parent for confirmation rather than performing a silent update.

---

## 3. Poetry Database: Sources, Pinyin & Polyphonic Characters

### 3.1 Recommended Data Sources

#### Option A: `chinese-poetry/chinese-poetry` (Recommended — Primary Source)

- Open-source GitHub repository, MIT license, distributed in JSON format
- Contains approximately 55,000 Tang poems, 260,000 Song poems, and 21,000 Song ci; high data quality
- Companion npm package `chinese-poetry-npm` available for direct integration
- **Limitation**: Raw data does not include pinyin or textbook edition annotations; secondary processing is required

#### Option B: Manually Curated Small Library (Strongly Recommended alongside Option A)

The three major textbook editions (PEP / HJ / SJ) for primary and middle school combined cover approximately **200–300 classical poems**. The recommended approach:

1. Filter poems from `chinese-poetry` by title
2. Manually verify text and pinyin poem-by-poem (especially polyphonic characters), building a validated "Primary School Poetry Essential Library"
3. Use this as the application's primary database, with `chinese-poetry` as a supplementary source for future expansion

#### Option C: Additional Reference Sources

| Source | Characteristics | Best For |
|--------|-----------------|----------|
| `nk2028/ORCHESTRA-dataset` | From Sou Yun network; comprehensive coverage | Supplementary poetry library expansion |
| Textbook PDFs / Official publications | Authoritative, but requires manual entry | Precise textbook edition annotation |

### 3.2 Pinyin Generation

Polyphonic characters are prevalent in classical poetry (e.g., 行, 长, 重, 处, 相), so **simple dictionary mapping cannot be used** — context-aware disambiguation is essential.

#### Recommended Tool: `pypinyin` (Python)

```python
from pypinyin import pinyin, Style

# Default mode: context-aware pronunciation selection
pinyin('朝辞白帝彩云间')
# → [['zhāo'], ['cí'], ['bái'], ['dì'], ['cǎi'], ['yún'], ['jiān']]

# Polyphonic mode: retrieve all possible pronunciations
pinyin('行', heteronym=True)
# → [['xíng', 'háng', 'hàng', 'héng']]
```

- Supports context-aware disambiguation at the phrase level (significantly more accurate than single-character mapping)
- Supports polyphonic mode (`heteronym=True`) to list all readings for manual review
- Supports custom dictionaries to add correction rules for special classical usages

#### Pinyin Generation Workflow

```
Raw poem text
    ↓
Batch generation via pypinyin (default context mode)
    ↓
Polyphonic character flagging (heteronym=True detects characters with multiple readings)
    ↓
Manual review of polyphonic characters (especially archaic/variant readings)
    ↓
Write to database (pinyin_overrides field stores manual corrections)
    ↓
User reports error → Admin corrects → Update pinyin_overrides
```

### 3.3 Polyphonic Character Database Design

This is a core design challenge. **Pinyin cannot simply be stored as a string array** — the following must be distinguished: auto-generated pinyin, manually confirmed pinyin, and pending polyphonic characters.

#### `poems` Table

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID PK | Primary key |
| `title` | string | Poem title |
| `dynasty` | string | Dynasty |
| `author` | string | Author |
| `content_lines` | `string[]` | Body text stored line by line, e.g. `["床前明月光", "疑是地上霜"]` |
| `editions` | `ENUM[]` | Applicable textbook editions; supports multiple |
| `grade_levels` | `INT[]` | Recommended grade levels; supports cross-grade |
| `tags` | `string[]` | Tags such as "homesickness," "nature" |
| `created_at` / `updated_at` | timestamp | Timestamps |

#### `poem_pinyin` Table (Stored Separately — Key Design)

Pinyin is **stored in a separate table** from the main poems table for the following reasons:
- Pinyin requires independent review status management
- Polyphonic characters need to store multiple candidate readings
- Pinyin corrections should not affect the `updated_at` timestamp of the main poems table

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID PK | Primary key |
| `poem_id` | UUID FK → poems.id | Associated poem |
| `scope` | ENUM(TITLE, AUTHOR, LINE) | Pinyin scope |
| `line_index` | INT nullable | Line index (used when scope=LINE, zero-based) |
| `char_index` | INT | Character position within the line/field (zero-based) |
| `char` | string(1) | The corresponding Chinese character (stored redundantly for validation) |
| `pinyin_auto` | string | Auto-generated pinyin from pypinyin (with tone marks, e.g. `chuáng`) |
| `pinyin_confirmed` | string nullable | Manually confirmed pinyin; null if same as auto |
| `is_polyphone` | boolean | Whether this character is polyphonic |
| `polyphone_candidates` | `string[]` nullable | All candidate readings, e.g. `["xíng", "háng"]` |
| `review_status` | ENUM(AUTO, CONFIRMED, DISPUTED) | Review status |
| `reviewed_by` | UUID FK nullable | Reviewing admin |
| `reviewed_at` | timestamp nullable | Review timestamp |

> **Read Logic**: When displaying pinyin on the frontend, `pinyin_confirmed` takes priority; if null, fall back to `pinyin_auto`.

#### Design Rationale

Benefits of this design:

- Each character's pinyin has an independent status, enabling granular error correction
- The `is_polyphone` field allows quick filtering of all characters requiring priority manual review
- Pinyin correction history is traceable (combined with the `error_reports` table)
- Future support for Zhuyin (ㄅㄆㄇ) or other pinyin styles only requires adding new fields

#### Frontend Ruby Tag Rendering Example

```html
<!-- CSS variable controls pinyin show/hide -->
<style>
  :root { --pinyin-display: block; }
  rt { display: var(--pinyin-display); }
</style>

<!-- Rendering a line of poetry -->
<p class="poem-line">
  <ruby>床<rt>chuáng</rt></ruby>
  <ruby>前<rt>qián</rt></ruby>
  <ruby>明<rt>míng</rt></ruby>
  <ruby>月<rt>yuè</rt></ruby>
  <ruby>光<rt>guāng</rt></ruby>
</p>
```

### 3.4 Textbook Edition Annotations

| Edition ID | Name | Notes |
|------------|------|-------|
| `PEP` | People's Education Press (Edition A) | Most widely used nationwide |
| `HJ` | Shanghai Education Press | Shanghai region |
| `SJ` | Jiangsu Education Press | Jiangsu region |
| `OTHER` | Other / Custom | Reserved for extension |

A single poem may belong to multiple textbook editions; `poems.editions` uses an array to store this.

### 3.5 Error Reports

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID PK | Primary key |
| `poem_id` | UUID FK | Associated poem |
| `reporter_id` | UUID FK | Reporting user ID |
| `scope` | ENUM(TITLE, AUTHOR, LINE) | Scope of the error |
| `line_index` | INT nullable | Line index |
| `char_index` | INT nullable | Character position (triggered by long-press) |
| `error_type` | ENUM(TEXT, PINYIN, OTHER) | Error type |
| `description` | string | User description |
| `status` | ENUM(PENDING, RESOLVED, DISMISSED) | Processing status |
| `resolved_by` / `resolved_at` | UUID / timestamp | Admin resolution info |

### 3.6 User-Defined Custom Poems (PRO Feature)

#### Design Principles

The platform poetry library (`poems` table) is a **global public resource** maintained exclusively by admins — all users have read-only access. Custom poems added by PRO users are **private resources**, stored in a separate `custom_poems` table and kept entirely separate from the public library to avoid polluting global data.

Both poem types are routed through the scheduling engine via a source field in `poem_reviews`, so the student experience is seamless.

#### `custom_poems` Table

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID PK | Primary key |
| `owner_id` | UUID FK → users.id | Creator (PRO parent) |
| `student_id` | UUID FK → students.id nullable | Target student; NULL means available to all students under this parent |
| `title` | string | Poem title (required) |
| `dynasty` | string nullable | Dynasty (optional) |
| `author` | string nullable | Author (optional) |
| `content_lines` | `string[]` | Body text stored line by line |
| `tags` | `string[]` nullable | Custom tags |
| `source_note` | string nullable | Source note (e.g. workbook title, page number) |
| `pinyin_json` | jsonb nullable | Pinyin data (structure below) |
| `pinyin_status` | ENUM(NONE, AUTO, MANUAL) | Pinyin source status |
| `is_active` | boolean | Whether included in student's review queue; default true |
| `created_at` / `updated_at` | timestamp | Timestamps |

**`pinyin_json` Structure**

Custom poem pinyin uses a lightweight single JSON object rather than a per-character row (the latter suits the fine-grained management of the public library but is overly heavy for private user libraries):

```json
{
  "title":  ["jìng", "yè", "sī"],
  "author": ["lǐ", "bái"],
  "lines": [
    ["chuáng", "qián", "míng", "yuè", "guāng"],
    ["yí",  "shì",  "dì",  "shàng", "shuāng"]
  ]
}
```

After a user submits the poem body, the backend automatically calls `pypinyin` to generate a draft pinyin (`pinyin_status = AUTO`). Once the user edits individual characters in the edit page, the status changes to `MANUAL`. Custom poem pinyin **does not enter the public review workflow** and belongs solely to the PRO parent.

#### Quota Rules

| Dimension | Details |
|-----------|---------|
| Max custom poems per student | PRO: 200; ADMIN: Unlimited |
| Can target different students | ✅ Via `student_id` |
| Can share with other parents | ❌ Private resource; not shareable |
| Admin visibility | ✅ Viewable (for moderation purposes); content cannot be modified |

#### `poem_reviews` Table — New Fields

Add the following two columns to the existing fields to distinguish system poems from custom poems:

| New Field | Type | Description |
|-----------|------|-------------|
| `poem_source` | ENUM(SYSTEM, CUSTOM) | Source identifier; default SYSTEM |
| `custom_poem_id` | UUID FK → custom_poems.id nullable | Set when `poem_source = CUSTOM`; `poem_id` is null in this case |

> `poem_id` and `custom_poem_id` are mutually exclusive and are not merged into a single polymorphic foreign key. This preserves foreign key constraint integrity and enables independent indexing. The backend routes queries by `poem_source` to the appropriate table.

---

## 4. Classical Poetry Learning Module

### 4.1 Poem Display Specification

- Each poem displays: title, dynasty, author, and body text — all fields support pinyin display
- Pinyin is controlled globally by the CSS variable `--pinyin-display` (`block` / `none`) for instant toggle
- **Long-pressing** a Chinese character triggers an action menu:
  - **System poems**: Shows "Report Error," submitting to the public error report queue
  - **Custom poems**: Shows "Edit Pinyin," navigating to the parent-side edit page (does not enter the public queue)
- Custom poems appear identical to system poems in the student learning interface; a <kbd>Custom</kbd> badge is shown in the top-right corner of the poem detail page to indicate the source

### 4.2 Learning Record Data Model (`poem_reviews`)

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID PK | Primary key |
| `student_id` | UUID FK | Student ID |
| `poem_id` | UUID FK | Poem ID |
| `algorithm` | ENUM(SM2, LEITNER, FSRS) | Algorithm used for this record |
| `interval` | float | Days until next review (used by SM2 / Leitner) |
| `ease_factor` | float | Ease factor (SM2; default 2.5) |
| `repetitions` | int | Consecutive correct count (SM2) |
| `leitner_box` | int (1–5) | Leitner box level |
| `stability` | float | Memory stability (FSRS) |
| `difficulty_fsrs` | float | FSRS difficulty value |
| `last_review_at` | timestamp | Last review time |
| `next_review_at` | timestamp | Next review time (core scheduling field) |
| `review_count` | int | Total review count |

### 4.3 Daily Learning Flow

1. After a parent logs in and switches to a student, the system queries all poems where `next_review_at ≤ now()`
2. The home screen displays: "N poems due for review today / M new poems to learn"
3. A learning session begins, presenting cards sequentially (front: title; back: full text + pinyin)
4. After flipping the card, the user selects a rating: **Forgot / Hard / Good / Easy** — the system writes to `poem_reviews` and reschedules
5. After the session ends, a learning report is shown (completion count, consecutive study days, etc.)

---

## 5. Spaced Repetition Algorithm System

### 5.1 Algorithm Comparison Overview

| Dimension | SM-2 | Leitner Box | FSRS-6 |
|-----------|------|-------------|--------|
| Complexity | Medium | Simple | More complex |
| Target Users | General | Children / beginners | Advanced users |
| Core Model | Ease factor + interval growth | Five-level card box | Memory stability + retrievability |
| Personalization | Medium | Low | High (optimizable personal parameters) |
| Accuracy | Baseline | Below SM-2 | ~20–30% fewer reviews than SM-2 |
| Implementation | Custom | Custom | `ts-fsrs` npm package |
| Plan Requirement | FREE available | FREE available | PRO only |

> **Algorithm Recommendations**:
> - Lower grade students / first-time users: Leitner Box (most intuitive)
> - Most users by default: SM-2 (classic and reliable)
> - Efficiency-focused parents: Upgrade to PRO and use FSRS-6

### 5.2 SM-2 Algorithm Specification

**Rating Mapping**

| User Rating | Quality Value |
|-------------|---------------|
| Forgot | 0 |
| Hard | 2 |
| Good | 4 |
| Easy | 5 |

**Scheduling Rules**

```
If quality < 3 (Forgot / Hard):
  repetitions = 0
  interval = 1 day

If quality ≥ 3 (Good / Easy):
  repetitions += 1
  interval(1) = 1 day
  interval(2) = 6 days
  interval(n) = interval(n-1) × ease_factor  (rounded up)

ease_factor update (after each rating):
  EF' = EF + (0.1 - (5 - q) × (0.08 + (5 - q) × 0.02))
  Minimum EF = 1.3
```

### 5.3 FSRS-6 Algorithm Specification

- Uses the `ts-fsrs` npm package; called via the official API
- Rating mapping: Forgot → Again(1), Hard → Hard(2), Good → Good(3), Easy → Easy(4)
- Core parameters: `stability` (memory stability in days) and `difficulty` (0–1 scale)
- After each review, the library computes `next_review_at`
- Available only on the PRO plan

> FSRS-6 is based on the "Three-Component Model of Memory" (Retrievability R, Stability S, Difficulty D). With sufficient data, research indicates it can reduce review count by approximately 20–30% compared to SM-2 for the same retention rate.

### 5.4 Leitner Box Algorithm Specification

| Box | Interval | Rule |
|-----|----------|------|
| Box 1 | 1 day | New cards, or cards returned after any incorrect answer |
| Box 2 | 2 days | Promoted from Box 1 after a correct answer |
| Box 3 | 4 days | Promoted from Box 2 after a correct answer |
| Box 4 | 8 days | Promoted from Box 3 after a correct answer |
| Box 5 | 16 days | Promoted from Box 4 after a correct answer; then enters long-term memory pool |

Rating is simplified to: **Remembered (promote) / Forgot (return to Box 1)**.

### 5.5 Smooth Algorithm Migration (FREE → PRO Upgrade)

When a user switches from SM-2 to FSRS:

1. Historical `poem_reviews` records are **retained and not deleted**
2. Old `interval` values are mapped to FSRS's initial `scheduled_days` reference
3. Old `next_review_at` values are preserved; FSRS takes over scheduling from the next evaluation
4. A "Migration Notice" modal is shown to the user when switching, explaining the impact

### 5.6 Additional Algorithms for Future Consideration

| Algorithm | Characteristics | Best For | Implementation Difficulty |
|-----------|-----------------|----------|---------------------------|
| **HLR (Half-Life Regression)** | Used by Duolingo; regression-based half-life model; requires historical training data | After accumulating sufficient learning history | High |
| **DASH / ACT-R Model** | Cognitive science background; smoother prediction curves | Academic / research use | High |
| **Fixed Interval** | Manual schedule: 2-3-5-7-14-30 days | Teacher-specified review pacing | Very low |
| **Anki-modified SM-2** | Differences from original SM-2: customizable initial steps, same-day repetition support | Migrating heavy Anki users | Low |

> **Implementation Recommendation for This Version**: Prioritize completing SM-2 + Leitner + FSRS. Algorithms like HLR require substantial user data to be effective and can be added to the future roadmap.

---

## 6. Recitation Fragment Module

### 6.1 Module Positioning

Users can create "fragment cards" from any text (classical prose passages, English sentences, vocabulary words, etc.) and mark whether they should be included in a memorization plan. This module **shares the same spaced repetition scheduling engine** as the classical poetry module.

### 6.2 Fragment Data Model (`fragments`)

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID PK | Primary key |
| `student_id` | UUID FK | Owning student |
| `title` | string nullable | Fragment title (optional) |
| `content` | text | Fragment body text |
| `language` | ENUM(ZH, EN) | Language category |
| `need_memorize` | boolean | Whether included in the memorization plan |
| `source` | string nullable | Source note (book title, URL, etc.) |
| `content_extra` | jsonb nullable | Extension field (reserved: phonetics, part of speech, definitions, etc.) |
| `created_at` | timestamp | Creation time (used for sorting when not in memorization) |

### 6.3 Learning Records (`fragment_reviews`)

Identical structure to `poem_reviews` (`student_id + fragment_id + algorithm fields`), reusing the same scheduling logic — no additional development required.

### 6.4 English Vocabulary Extension (Reserved Design)

- Fragments with `language = EN` serve as English word / sentence cards
- Content format: word or phrase (front) + definition / example sentence (back), currently stored as plain text in `content`
- The `content_extra` jsonb field reserves structured extension, for example:
  ```json
  {
    "phonetic": "/ˈæpəl/",
    "pos": "noun",
    "definition": "apple",
    "example": "I eat an apple every day."
  }
  ```
- Scheduling algorithm is fully reused from Chinese fragments; adding English vocabulary functionality requires no changes to the algorithm layer

### 6.5 Browsing & Categorization

- **Not in memorization plan**: Sorted by `created_at` descending; supports ZH / EN filtering
- **In memorization plan**: Enters the spaced repetition queue; merged with poetry reviews in "Today's Tasks"
- Supports search (full-text search across title + content)

---

## 7. Settings Module

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| Cards per session | INT (1–50) | 10 | Maximum cards processed per session |
| Show pinyin | Boolean | true | Controls CSS variable `--pinyin-display` |
| Review algorithm | ENUM | SM2 | FREE plan can only select SM2 / LEITNER |
| Textbook edition | ENUM | PEP | Affects recommended poem scope on the home screen |
| Daily reminder time | time | 20:00 | PWA push notification time |

All settings are stored in `students.settings_json`; each student has an independent configuration.

---

## 8. Frontend Architecture Recommendations

### 8.1 Route Structure

```
/login                      Login / Registration
/home                       Today's tasks home (current student context)
/study                      Learning / review session
/poems                      Poetry library browser (system library; filter by grade / edition)
/poems/custom               Custom poem list (PRO; parent side)
/poems/custom/new           Add new custom poem (PRO; parent side)
/poems/custom/:id/edit      Edit custom poem and pinyin (PRO; parent side)
/fragments                  Fragment management
/settings                   Student settings
/profile                    Parent account info & student list
/admin                      Admin dashboard (ADMIN role only)
```

### 8.2 Key Frontend State

```typescript
interface AppState {
  authUser: User | null;          // Currently logged-in parent / ADMIN
  currentStudent: Student | null; // Currently switched student (includes settings_json)
  showPinyin: boolean;            // Mapped to CSS --pinyin-display
}
```

### 8.3 Permission Middleware (Frontend + Backend Double Validation)

- **Backend**: Every quota-sensitive endpoint reads `user.plan` and current counts in middleware; exceeding limits returns `403 + error code`
- **Frontend**: Dynamically renders buttons as enabled/disabled based on `plan`; exceeding limits triggers an "Upgrade to PRO" guidance modal
- Frontend interception is a UX hint only; backend validation is the hard constraint and cannot be bypassed

### 8.4 Custom Poem Page Interaction Details

#### Parent Side: Custom Poem List (`/poems/custom`)

- Displays all custom poems under the current account; each entry shows: title, assigned student, and active status
- Top quota progress bar: `N / 200 poems added` (counted separately per `student_id`)
- Action column: **Edit**, **Delete**, **Activate / Deactivate** toggle
  - Deactivating does not delete the record; the card is removed from the review queue but historical progress is preserved
  - Deleting when `poem_reviews` records exist requires a secondary confirmation; historical records are soft-deleted in sync

#### Parent Side: Add / Edit Page (`/poems/custom/new`, `/poems/custom/:id/edit`)

1. **Basic info form**: Title (required), dynasty, author, body text (line-by-line input), assigned student, tags, source note
2. **Auto pinyin generation**: After completing the body text, click "Generate Pinyin" — the backend calls `pypinyin` and returns a draft, which is populated into the pinyin editor
3. **Pinyin editor**:
   - Each character displays a clickable pinyin annotation above it
   - Clicking any pinyin opens a candidate reading list (`pypinyin heteronym` results + manual input box)
   - A real-time preview at the bottom renders the `<ruby>` output
4. **Save options**:
   - "Save Draft": `is_active = false` — not added to the review queue
   - "Save & Add to Review": `is_active = true` — included in scheduling the next time today's tasks are generated

#### Student Learning Interface

No additional interaction. Custom poems are merged directly into the "Today's Tasks" queue, displayed identically to system poems. Only a small badge in the top-right corner of the poem detail page distinguishes the source.

---

## 9. Glossary

| Term | English | Description |
|------|---------|-------------|
| 间隔重复 | Spaced Repetition | A learning method that schedules reviews at optimal intervals based on the forgetting curve |
| SM-2 | SuperMemo 2 | Classic spaced repetition algorithm proposed in 1987 |
| FSRS | Free Spaced Repetition Scheduler | Modern open-source algorithm based on the Three-Component Model of Memory; more accurate than SM-2 |
| Leitner Box | Leitner Box | Five-level card box system; simple logic suited to children |
| HLR | Half-Life Regression | Statistical learning model used by Duolingo; requires historical training data |
| 多音字 | Polyphonic Character | A Chinese character with multiple distinct pronunciations, e.g. 行, 长, 重 |
| pypinyin | — | Python library for Chinese character-to-pinyin conversion with context-based polyphonic disambiguation |
| 卡片 | Card / Flashcard | One classical poem or one fragment corresponds to one card |
| 可提取性 R | Retrievability | One of three FSRS components; probability of successful recall at the current moment |
| 稳定性 S | Stability | One of three FSRS components; days for R to drop from 100% to 90% |
| 主家长 | Owner | The parent who created the student account; holds full management rights |
| 家属 | Guardian | A family member invited to be associated with a student account |
| 教材版本 | Textbook Edition | PEP (People's Education) / HJ (Shanghai Education) / SJ (Jiangsu Education) |
| 自定义诗词 | Custom Poem | A poem privately added by a PRO user for a specific student; not in the global public library; pinyin maintained by the parent |
