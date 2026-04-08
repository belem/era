# 跬步 Design System

> *A thousand-mile journey begins with a single step.*
>
> Design philosophy: **留白** — the art of leaving blank. Every element earns its place. The poetry is the art; the interface is the white wall of the gallery.

---

## Thesis

A poetry app rooted in traditional Chinese color and typographic tradition, expressed through modern minimalism. Cultural identity comes through the ink, the space, and the brushstroke — not through ornament. The design should feel like a well-made notebook, not a museum exhibit.

Three principles guide every decision:

1. **Poetry is the content; the app is the frame.** Generous whitespace, restrained chrome. The screen should never feel full.
2. **Every color carries centuries of meaning.** The palette is drawn entirely from classical Chinese pigments. No arbitrary hues.
3. **The tempo is unhurried.** Animations run slightly slower than a typical app. Not sluggish — deliberate. The pace of practice, not a game.

---

## Color

### Traditional Chinese Pigments — 14 colors, each with cultural weight

The palette is divided into three functional layers: **surfaces**, **semantics**, and the **extended palette** for contextual use.

#### Surfaces

| Token | Light | Dark | Name | Role |
|---|---|---|---|---|
| `--bg` | `#FFFFFF` | `#1a2120` | — | Primary background |
| `--bg-subtle` | `#FAFAFA` | `#222d2b` | — | Elevated surfaces, cards |
| `--bg-muted` | `#EFEFEF` | `#2a3634` | — | Disabled, skeleton states |
| `--bg-card` | `#e3f9fd` | `#1e2d2b` | 霜 Frost | Cool card surfaces |

#### Text

| Token | Light | Dark | Name | Usage |
|---|---|---|---|---|
| `--text` | `#1c3532` | `#e8ece6` | 松墨 Pine-ink | Body text, headings |
| `--text-secondary` | `#4a6b66` | `#9ab5ad` | 淡松 Faded pine | Secondary copy, metadata |
| `--text-tertiary` | `#8a9e9a` | `#6b8a82` | 烟 Mist | Hints, disabled labels, pinyin |

> **Contrast note:** Mist (`#8a9e9a`) on white is 3.1:1 — use only for large text (≥18px) or decorative elements, never for essential body text. Faded pine on white is 5.2:1 (WCAG AA). Pine-ink on white is 11.3:1 (AAA).

#### Borders

| Token | Light | Dark | Name |
|---|---|---|---|
| `--border` | `#d1c2d3` | `#3a4a47` | 藤 Plum mist |
| `--border-subtle` | `#e2dbd4` | `#2f3e3b` | Rice paper shadow |

#### Primary — 松 Pine Green

The anchor of the system. CTAs, chop stamp, active states.

| Token | Light | Dark |
|---|---|---|
| `--primary` | `#007d62` | `#7bcfa6` (jade) |
| `--primary-hover` | `#006650` | `#93d5dc` |
| `--primary-soft` | `#a5d1b5` | `#2a4a3e` |

In dark mode, **jade replaces pine** as primary for contrast against dark surfaces.

#### Accent — 海棠 Crabapple

Warmth, delight, highlights. Polyphonic character markers.

| Token | Light | Dark |
|---|---|---|
| `--accent` | `#f091a0` | `#f091a0` |
| `--accent-hover` | `#e87d8e` | `#f1939c` |
| `--accent-soft` | `#f1939c` | `#3a2528` |

#### Semantic

| Token | Light | Dark | Name | Usage |
|---|---|---|---|---|
| `--success` | `#7bcfa6` | `#7bcfa6` | 翡 Jade | Positive states, "Easy" rating |
| `--error` | `#f1939c` | `#f1939c` | 桃花 Blossom | Errors, "Forgot" indication |
| `--info` | `#66a9c9` | `#93d5dc` | 蓝 Sky | Informational |
| `--warning` | `#f3a694` | `#f3a694` | 桃 Peach | Warnings |

#### Extended Palette

Available for badges, heatmaps, charts, and contextual highlights. These never appear as UI chrome — only as content-layer accents.

| Token | Hex | Name (Chinese) | Name (English) |
|---|---|---|---|
| `--jade` | `#7bcfa6` | 翡 | Jade |
| `--sky` | `#66a9c9` | 蓝 | Sky |
| `--willow` | `#a8bf8f` | 柳 | Willow |
| `--peach` | `#f3a694` | 桃 | Peach |
| `--frost` | `#e3f9fd` | 霜 | Frost |
| `--celadon` | `#93d5dc` | 青瓷 | Celadon |
| `--crabapple` | `#f091a0` | 海棠 | Crabapple |
| `--wave` | `#a0d2e2` | 波 | Wave |
| `--wisteria` | `#a4abd6` | 紫藤 | Wisteria |
| `--bamboo` | `#a5d1b5` | 竹 | Bamboo |
| `--pine` | `#007d62` | 松 | Pine |
| `--plum` | `#d1c2d3` | 藤 | Plum |
| `--blossom` | `#f1939c` | 桃花 | Blossom |

#### Contextual Color Assignments

| Context | Colors (progression) |
|---|---|
| Badge tiers | Peach → Sky → Jade → Pine |
| Heatmap intensity | Bamboo → Jade → `#4aab85` → Pine |
| Polyphonic characters | Crabapple accent on `<rt>` |
| "Easy" rating button | Jade background, white text |

### Color Rules

1. **Never hardcode hex values.** All references use CSS custom properties.
2. **Surfaces create depth, not shadows.** Cards are defined by `--bg` / `--bg-subtle` / `--bg-muted` shifts, not `box-shadow`. The only shadow is a faint `0 8px 32px rgba(0,0,0,0.06)` on phone-frame mockups.
3. **Borders are plum mist, not gray.** `--border: #d1c2d3` gives borders a warm violet undertone instead of the cold gray of typical UI frameworks.
4. **Dark mode is pine-tinted, not gray.** Base dark `#1a2120` has a green warmth. This is a forest at night, not a gray room.

---

## Typography

Three voices. Each has a cultural reason for being.

### Voice 1 — Poetry: LXGW WenKai (霞鹜文楷)

```css
--font-poetry: 'LXGW WenKai', 'KaiTi', 'STKaiti', serif;
```

Kai (楷) is the style Chinese children learn to write by hand. Every stroke follows the structure a teacher demonstrates on a blackboard. A child seeing 床前明月光 in LXGW WenKai is also reinforcing how those characters should be handwritten.

- **Weights:** Regular (400) for poem body, Light (300) for prose passages
- **Letter-spacing:** `0.05em` for poetry lines — each character gets room to breathe
- **Coverage:** ~8,000 CJK characters, open source (SIL license)
- **Source:** Google Fonts

### Voice 2 — Headings: Noto Serif SC (思源宋体)

```css
--font-heading: 'Noto Serif SC', 'SimSun', serif;
```

Song/Ming style (宋体) carries the authority of printed books — the title page of a classical collection, the spine of a thread-bound volume (线装书). The Kai/Song pairing has centuries of precedent in Chinese book design: the cover is Song, the interior is Kai.

- **Weights:** SemiBold (600) for page titles and section headers, Regular (400) for secondary headings and metadata (dynasty/author)
- **Source:** Google Fonts

### Voice 3 — UI & Pinyin: System Sans + Inter

```css
--font-ui: 'PingFang SC', 'Microsoft YaHei', 'Noto Sans SC', system-ui, sans-serif;
--font-pinyin: 'Inter', sans-serif;
```

Intentionally invisible typography. System sans loads instantly, signals "this is the app talking to you" as distinct from "this is the poetry." Inter handles pinyin annotations and Latin text — its x-height and letter spacing are optimized for small sizes.

- **Pinyin rendering:** ~45% of base character font size, in `--text-tertiary` color. Present when needed, easy to ignore when not.

### Font Loading Strategy

| Font | Size | Strategy |
|---|---|---|
| LXGW WenKai Regular | ~4–6 MB | `font-display: swap`, preload in `<head>`. Fallback: `KaiTi`, `STKaiti`. Consider subsetting to ~3,000 common characters for initial load. |
| Noto Serif SC | ~2 MB | `font-display: swap`, `<link rel="preload">`. Fallback: `Songti SC`, `SimSun`. |
| Inter | ~100 KB | Variable font, lightweight. |

### Typographic Scale

| Use | Family | Weight | Size | Tracking |
|---|---|---|---|---|
| Page title | Noto Serif SC | 600 | 36px | 0.02em |
| Section header | System sans | 500 | 13px uppercase | 0.1em |
| Subsection | System sans | 500 | 15px | — |
| Poetry body (card) | LXGW WenKai | 400 | 24–28px | 0.05em |
| Poetry body (scroll) | LXGW WenKai | 400 | 26–32px | 0.05em |
| Poem title | Noto Serif SC | 600 | 17–24px | — |
| Metadata (dynasty/author) | Noto Serif SC | 400 | 11–14px | — |
| UI label | System sans | 500 | 14px | — |
| Pinyin annotation | Inter | 400 | ~45% of base | — |
| Stat number | Inter | 500 | 36px | −0.02em |

---

## Spacing & Layout

### The Principle of 留白

Classical Chinese composition prizes negative space as much as the mark. A poem of twenty characters should feel like it's floating in open air, not crammed into a card. When in doubt, remove, don't add.

### Spacing Tokens

| Token | Value | Usage |
|---|---|---|
| `--radius-sm` | `4px` | Small elements, heat cells |
| `--radius-md` | `8px` | Buttons, inputs, cards |
| `--radius-lg` | `12px` | Panel cards, poem specimens |
| `--radius-full` | `9999px` | Circular buttons (theme toggle) |

### Layout

- **Max content width:** 1100px, centered
- **Page padding:** 80px vertical, 32px horizontal
- **Mobile-first:** responsive grid collapses at 860px
- **Touch targets:** all interactive elements ≥ 48×48px on mobile (WCAG 2.5.8)

### Surfaces

No paper grain. No warm tinting. No skeuomorphic textures. Backgrounds are flat solid colors. Visual depth comes from subtle 1px borders (`--border`), not shadows. The effect is architecturally minimal — a white-walled gallery where the poetry is the focus.

---

## Poetry Rendering

Poetry rendering is the heart of the design system. It uses [heti](https://github.com/nicesharp/heti) for classical Chinese typesetting, with custom overrides for equal-width ruby and pinyin alignment.

### Heti Integration

```bash
npm install heti
```

```tsx
// app/layout.tsx
import 'heti/umd/heti.min.css'
```

Heti classes used:

| Class | Purpose |
|---|---|
| `heti` | Base container |
| `heti--annotation` | Grid-aligned interlinear ruby |
| `heti--ancient` | Centered verse, compressed punctuation |
| `heti--vertical` | Top-to-bottom, right-to-left text flow |
| `heti-hang` | Hanging punctuation (，。outside text block) |

### Pinyin Markup

```html
<ruby><rb>床</rb><rp>(</rp><rt lang="zh-Latn">chuáng</rt><rp>)</rp></ruby>
```

- `<rb>` wraps the base character
- `<rp>` provides fallback parentheses for non-ruby browsers
- `lang="zh-Latn"` on `<rt>` triggers correct pronunciation font
- Zero whitespace between tags (whitespace creates text nodes that break alignment)

### Equal-Width Character Spacing

The core CSS technique: every `<ruby>` element in poetry contexts is a fixed-width flex container. Long pinyin overflows visually without pushing characters apart.

```css
.poem-heti ruby,
.type-poetry ruby,
.review-poem-body ruby {
  display: inline-flex;
  flex-direction: column-reverse;
  align-items: center;
  width: 1.8em;
  vertical-align: top;
}

.poem-heti rt,
.type-poetry rt,
.review-poem-body rt {
  display: block;
  font-family: var(--font-pinyin);
  font-size: 0.45em;
  color: var(--text-tertiary);
  font-weight: 400;
  white-space: nowrap;
  line-height: 1.2;
}
```

### Hanging Punctuation

Sentence-ending marks (，。！？) sit outside the text block, matching classical print convention:

```css
.poem-heti .heti-hang {
  display: inline-block;
  vertical-align: top;
  padding-top: 0.54em; /* aligns with character baseline below pinyin */
}
```

### Vertical Mode (Living Scroll / Scroll Gallery)

In vertical mode, `writing-mode: vertical-rl` flows characters as right-to-left columns. Replace `<br>` with spaces between verse lines. Pinyin appears to the left of each character.

```css
.heti--vertical ruby {
  display: inline-flex;
  flex-direction: column-reverse;
  align-items: center;
  height: 1.8em;
  width: auto;
}
```

### Pinyin Visibility Toggle

One CSS class on `<html>`, instant across all `<rt>` elements. No React state. No re-render.

```css
.pinyin-hidden rt {
  display: none;
}
```

```ts
document.documentElement.classList.toggle('pinyin-hidden', !showPinyin)
```

Two layers of control:
1. **Per-student default** (Settings) — parent sets based on child's ability
2. **Quick session toggle** (eye icon in poem header) — session-only override, reverts next session

### Polyphonic Characters

Characters with context-dependent pronunciation are marked with `data-polyphone="true"` on the `<ruby>` element. Their pinyin renders in the crabapple accent color (`--accent`):

```css
.polyphone-mark rt {
  color: var(--accent);
}
```

---

## Components

### Buttons

| Variant | Background | Text | Border | Use |
|---|---|---|---|---|
| Primary | `--primary` | `#FFFFFF` | — | Main CTA: 开始复习 |
| Secondary | `--sky` | `#FFFFFF` | — | Alternate action: 活字卷轴 |
| Ghost | transparent | `--text` | 1px `--border` | Tertiary: 查看诗库 |

```css
.btn {
  padding: 10px 24px;
  border-radius: var(--radius-md);
  font-family: var(--font-ui);
  font-size: 14px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.1s ease;
}
```

Hover states are subtle: primary darkens to `--primary-hover`, ghost border shifts to `--text-tertiary`. No bounce, no scale. Quiet confidence.

### Rating Buttons

Four difficulty levels after review. Equal-width, spanning the viewport.

| Rating | Chinese | Background | Meaning |
|---|---|---|---|
| Forgot | 淡忘 | `--bg` + border | Complete blank |
| Hard | 艰难 | `--bg` + border | Recalled with difficulty |
| Good | 尚可 | `--bg` + border | Recalled correctly |
| Easy | 轻松 | `--jade` | Effortless recall |

Only "Easy" has a filled background — jade signals positive reinforcement without exuberance.

### Form Inputs

```css
.form-input {
  width: 100%;
  padding: 12px 14px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  font-family: var(--font-ui);
  font-size: 15px;
  color: var(--text);
}

.form-input:focus {
  outline: none;
  border-color: var(--text);
}
```

Focus state: border transitions from plum mist to pine-ink. No glow, no ring. A quiet acknowledgment.

### Badges

Palette-coded milestone tiers. Discovered, not announced.

| Tier | Badge | Border/Text Color | Milestone |
|---|---|---|---|
| 1 | 十 | Peach `#f3a694` | 10 poems mastered |
| 2 | 月 | Sky `#66a9c9` | 30-day streak |
| 3 | 百 | Jade `#7bcfa6` | 100 poems mastered |
| 4 | 年 | Pine `#007d62` | 365-day streak |

```css
.badge {
  width: 52px;
  height: 52px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-heading);
  font-size: 22px;
}
```

Unearned badges are ghosted at 35% opacity.

### The Chop Stamp 印章

The cultural moment. A pine-ink seal that appears when a Living Scroll is completed.

```css
.chop-stamp {
  width: 72px;
  height: 72px;
  border-radius: 4px;
  border: 3px solid var(--primary);
  font-family: var(--font-heading);
  font-size: 24px;
  color: var(--primary);
  transform: rotate(-5deg);
}
```

Slightly rotated, as a real chop stamp would be. Bears the student's name. Pine green in light mode, jade in dark mode.

---

## Screens

### 晨光 Home

The landing screen after login. Shows today's review queue.

- **Header:** App logo (跬步 in Noto Serif SC) + student avatar
- **Section title:** 今日诗词 in Noto Serif SC, with streak counter (subtle 🔥 Day N in mist color)
- **Poem cards:** Stacked list with poem title (Noto Serif SC 600), metadata line (author · dynasty · grade), preview line (LXGW WenKai)
- **CTA:** Full-width pine green button — 开始复习
- **Tab bar:** 晨光 (active) · 诗库 · 卷轴馆 · 我的

### 活字卷轴 Living Scroll

The core differentiator. Characters revealed one by one with brush-stroke animation.

- **Poem title and metadata** at top, centered
- **5-column grid** of character cells. Revealed characters have `--bg-subtle` background. Hidden characters have `--bg-muted` background with transparent text. Active character has a 2px `--primary` ring.
- **Chop stamp** appears on completion with `rotate(-5deg)`
- **Rating buttons** appear below the stamp
- Uses `hanzi-writer` for stroke-order animation. Lazy-loaded per character, next 3 preloaded.
- Container uses `heti heti--ancient heti--vertical` for authentic top-to-bottom flow in full-scroll view.

### 诗词复习 Card Review

Standard flashcard with poem display.

- **Front:** Poem title + metadata. Pinyin eye toggle in top-right corner.
- **Body:** Full poem in LXGW WenKai with ruby pinyin, `heti heti--annotation` container. Lines centered, hanging punctuation.
- **After reveal:** Rating row (淡忘 · 艰难 · 尚可 · 轻松) with progress indicator (e.g., 3 of 12)

### Login / Onboarding

- **Logo:** 跬步 in Noto Serif SC 28px, centered
- **Subtitle:** LXGW WenKai 14px in mist color, `letter-spacing: 0.05em`
- **OAuth row:** Square icon buttons (48×48) for Google, Apple, GitHub, Microsoft — 1px border, no fill
- **Divider:** Thin line with centered "或" / "or"
- **Email form:** Email input + CTA button
- **Footer:** Small text link for terms

### 家长数据面板 Analytics

Grid layout with stat cards and activity heatmap.

- **Stat cards:** 2×2 grid separated by 1px `--border` gaps. Each card shows a label (uppercase 11px), value (Inter 36px), and change indicator (jade-colored).
- **Heatmap:** Full-width row spanning both columns. 26-column grid of small cells using the jade intensity scale (Bamboo → Jade → `#4aab85` → Pine).

---

## Theming

### Implementation

```
Tailwind darkMode: 'class' + CSS custom properties + next-themes
```

- System preference respected via `prefers-color-scheme`
- User override stored in `profiles.theme_preference` (system / light / dark)
- Toggle via sun/moon icon button, fixed top-right

### Light Mode

Clean white surfaces. The traditional Chinese palette provides all color. Pine green (`#007d62`) as primary.

### Dark Mode

Pine-tinted dark (`#1a2120`) base — warm, not generic gray. Jade (`#7bcfa6`) replaces pine as primary. The full palette is available with appropriate adjustments for contrast.

### Transition

```css
body {
  transition: background 0.35s ease, color 0.35s ease;
}
```

Deliberate, unhurried. Matches the app's tempo.

---

## Motion

### Principle: Unhurried

Every animation runs slightly slower than a typical app. Not sluggish, but deliberate. The brush strokes in Living Scroll take the time a real brush would take. Page transitions have the weight of turning thick paper. The rating buttons respond with quiet confidence.

### Reduced Motion

Respect `prefers-reduced-motion: reduce`:
- Living Scroll: characters appear instantly (no stroke animation)
- Page transitions: instant
- Chop stamp: appears without animation
- Theme toggle: instant color switch

### Timing Guidelines

| Element | Duration | Easing |
|---|---|---|
| Button hover | 0.1s | ease |
| Theme transition | 0.35s | ease |
| Scroll character reveal | 0.8s | ease |
| Page/card transitions | ~0.3s | ease |

---

## Accessibility

- **Keyboard:** All interactive elements reachable via tab. Living Scroll supports spacebar/enter for next character.
- **Screen readers:** ARIA labels on Living Scroll canvas (poem title, position, completion). Rating buttons: "Rate as Forgot" not just color. `<ruby>/<rt>` is natively accessible. `lang="zh-Latn"` on `<rt>` helps screen readers switch pronunciation.
- **Color contrast:** WCAG AA minimum (4.5:1 body, 3:1 large text). All primary text passes AAA.
- **Touch targets:** ≥ 48×48px on mobile.

---

## File Reference

| File | Purpose |
|---|---|
| `design-kuibu.md` | Full PRD with product requirements, data model, and implementation details |
| `kuibu-design-preview-*.html` | Live HTML/CSS preview of the design system with interactive theme toggle |
| `DESIGN.md` | This file — the visual design system specification |
