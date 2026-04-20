# 跬步 Design System

> *A thousand-mile journey begins with a single step.*
>
> Design philosophy: **Controlled clarity** — inspired by Apple's reductive aesthetic. The interface retreats until it becomes invisible. The poetry is the content; the app is the white wall of the gallery.

---

## Thesis

A poetry app that combines Apple's cinematic minimalism with classical Chinese typographic tradition. Cultural identity comes through the ink, the space, and the carefully chosen Chinese typefaces — not through ornament or surface decoration. The design should feel like a precision-crafted instrument, not a museum exhibit.

Three principles guide every decision:

1. **Poetry is the content; the app is the frame.** Vast whitespace, invisible chrome. The screen should never feel full. Each poem gets a full "scene."
2. **One accent color.** Apple Blue (`#0071e3`) is the singular interactive color. Every clickable element gets unmistakable visibility through this single hue.
3. **Compression within, expansion between.** Text blocks are tightly set (negative letter-spacing, tight line-heights) while the space surrounding them is vast.

---

## Color

### Surface System — Binary Light/Dark

The palette is starkly binary. Light sections use white and near-white gray. Dark sections use pure black and dark surfaces. This creates cinematic pacing.

#### Light Mode

| Token | Value | Role |
|---|---|---|
| `--bg` | `#ffffff` | Primary background |
| `--bg-subtle` | `#f5f5f7` | Elevated surfaces, cards, alternate sections |
| `--bg-muted` | `#e8e8ed` | Disabled, skeleton states |
| `--bg-card` | `#f5f5f7` | Card surfaces |

#### Dark Mode

| Token | Value | Role |
|---|---|---|
| `--bg` | `#000000` | Primary background |
| `--bg-subtle` | `#1c1c1e` | Elevated surfaces, cards |
| `--bg-muted` | `#2c2c2e` | Disabled, skeleton states |
| `--bg-card` | `#1c1c1e` | Card surfaces |

#### Text

| Token | Light | Dark | Role |
|---|---|---|---|
| `--text` | `#1d1d1f` | `#f5f5f7` | Primary text, headings |
| `--text-secondary` | `#6e6e73` | `#a1a1a6` | Secondary copy, metadata |
| `--text-tertiary` | `#86868b` | `#636366` | Hints, disabled labels, pinyin |

#### Borders

| Token | Light | Dark |
|---|---|---|
| `--border` | `#d2d2d7` | `#38383a` |
| `--border-subtle` | `#e5e5ea` | `#2c2c2e` |

> **Note:** Borders are used sparingly. Apple almost never uses visible borders on cards or containers. Prefer background-color shifts for depth.

#### Primary — Apple Blue

The singular interactive accent. CTAs, links, focus rings, active states.

| Token | Light | Dark |
|---|---|---|
| `--primary` | `#0071e3` | `#2997ff` |
| `--primary-hover` | `#0077ed` | `#40a9ff` |
| `--primary-soft` | `#e1ecf7` | `#1a3a5c` |

In dark mode, **Bright Blue replaces Apple Blue** for contrast against dark surfaces.

#### Accent

In Apple's system, there is no separate accent — blue is the only chromatic color for UI. For content-level highlights (polyphonic character markers in poetry), a warm coral is used:

| Token | Light | Dark |
|---|---|---|
| `--accent` | `#ff6b6b` | `#ff6b6b` |
| `--accent-hover` | `#ff5252` | `#ff8a8a` |
| `--accent-soft` | `#fff0f0` | `#3a2020` |

> This accent is **content-only** — used for polyphonic character annotations, never for buttons or interactive elements.

#### Semantic

| Token | Light | Dark | Usage |
|---|---|---|---|
| `--success` | `#34c759` | `#30d158` | Positive states, "Easy" rating |
| `--error` | `#ff3b30` | `#ff453a` | Errors, "Forgot" indication |
| `--info` | `#0071e3` | `#2997ff` | Informational (same as primary) |
| `--warning` | `#ff9500` | `#ff9f0a` | Warnings |

#### Extended Palette (Content Layer Only)

Available for badges, heatmaps, and charts. These never appear as UI chrome — only as data visualization.

| Token | Hex | Usage |
|---|---|---|
| `--badge-1` | `#ff9500` | 10 poems mastered (十) |
| `--badge-2` | `#0071e3` | 30-day streak (月) |
| `--badge-3` | `#34c759` | 100 poems mastered (百) |
| `--badge-4` | `#1d1d1f` | 365-day streak (年) |

### Color Rules

1. **Never hardcode hex values.** All references use CSS custom properties.
2. **Apple Blue is the only interactive color.** Buttons, links, focus rings — all blue. No other chromatic accent for UI elements.
3. **Depth through background shifts, not shadows.** Cards are defined by `--bg` / `--bg-subtle` / `--bg-muted` shifts. Shadow is rare and always soft.
4. **Dark mode is pure black, not gray.** Base dark `#000000` creates the cinematic Apple feel.

---

## Typography

Three voices. Each has a cultural reason for being, adapted with Apple's typographic discipline.

### Voice 1 — Poetry: LXGW WenKai TC (霞鹜文楷)

```css
--font-poetry: 'LXGW WenKai TC', 'KaiTi', 'STKaiti', serif;
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

Song/Ming style (宋体) carries the authority of printed books. The Kai/Song pairing has centuries of precedent in Chinese book design.

- **Weights:** SemiBold (600) for page titles and section headers, Regular (400) for secondary headings
- **Line-height:** Tight, Apple-style: 1.10–1.14 for display headings
- **Letter-spacing:** Slight negative tracking (`-0.01em`) for headings — machined precision
- **Source:** Google Fonts

### Voice 3 — UI & Pinyin: System Sans + Inter

```css
--font-ui: 'PingFang SC', 'Microsoft YaHei', 'Noto Sans SC', system-ui, sans-serif;
--font-pinyin: 'Inter', sans-serif;
```

Intentionally invisible typography. System sans loads instantly. Inter handles pinyin annotations — its x-height and letter spacing are optimized for small sizes.

- **Pinyin rendering:** ~45% of base character font size, in `--text-tertiary` color
- **Letter-spacing:** Negative at body sizes (`-0.01em` at 17px, `-0.006em` at 14px) — Apple tracks tight universally

### Font Loading Strategy

| Font | Size | Strategy |
|---|---|---|
| LXGW WenKai TC Regular | ~4–6 MB | `font-display: swap`, preload in `<head>`. Fallback: `KaiTi`, `STKaiti`. |
| Noto Serif SC | ~2 MB | `font-display: swap`, `<link rel="preload">`. Fallback: `Songti SC`, `SimSun`. |
| Inter | ~100 KB | Variable font, lightweight. |

### Typographic Scale

| Use | Family | Weight | Size | Line-Height | Tracking |
|---|---|---|---|---|---|
| Display hero | Noto Serif SC | 600 | 40px | 1.10 | -0.01em |
| Page title | Noto Serif SC | 600 | 28px | 1.14 | -0.005em |
| Section header | System sans | 500 | 13px uppercase | 1.33 | 0.08em |
| Poetry body (card) | LXGW WenKai | 400 | 24–28px | 2.0 | 0.05em |
| Poetry body (scroll) | LXGW WenKai | 400 | 26–32px | 2.0 | 0.05em |
| Poem title | Noto Serif SC | 600 | 17–21px | 1.19 | -0.005em |
| Metadata | System sans | 400 | 14px | 1.43 | -0.006em |
| UI label | System sans | 400 | 17px | 1.47 | -0.01em |
| Button | System sans | 400 | 17px | 1.0 | normal |
| Pinyin | Inter | 400 | ~45% of base | 1.2 | normal |
| Caption | System sans | 400 | 14px | 1.29 | -0.006em |
| Micro | System sans | 400 | 12px | 1.33 | -0.004em |

---

## Spacing & Layout

### Apple's Whitespace Philosophy

Cinematic breathing room. Each section occupies generous vertical space. The whitespace between elements is not empty — it is the pause between scenes.

### Spacing Tokens

| Token | Value | Usage |
|---|---|---|
| `--radius-sm` | 5px | Small elements, tags |
| `--radius-md` | 8px | Buttons, inputs, cards |
| `--radius-lg` | 12px | Panel cards, feature containers |
| `--radius-pill` | 980px | Pill CTAs — the signature Apple shape |
| `--radius-full` | 9999px | Circular buttons (theme toggle) |

### Layout

- **No max-width constraint.** Content uses responsive padding instead of a fixed container.
- **Page padding:** `px-6 py-10` mobile, `md:px-12 md:py-14`, `lg:px-20`, `xl:px-32`
- **Focused pages** (review, settings): `lg:px-[20%] xl:px-[28%]`
- **Review cards:** `max-w-[480px] mx-auto` for comfortable reading width
- **Mobile-first:** responsive, single column by default
- **Touch targets:** all interactive elements ≥ 44×44px

### Surfaces & Depth

No textures. No gradients. Backgrounds are flat solid colors. Visual depth comes primarily from background-color contrast, not shadows.

| Level | Treatment | Use |
|---|---|---|
| Flat (Level 0) | Solid background, no shadow | Standard content sections |
| Glass | `backdrop-filter: saturate(180%) blur(20px)` on translucent bg | Navigation bar |
| Subtle Lift | `0 3px 30px rgba(0,0,0,0.08)` | Floating cards (rare) |
| Focus Ring | `2px solid var(--primary)` outline | Keyboard focus on interactive elements |

---

## Poetry Rendering

Poetry rendering is the heart of the design system. It uses custom CSS for classical Chinese typesetting with equal-width ruby and pinyin alignment.

### Pinyin Markup

```html
<ruby><rb>床</rb><rp>(</rp><rt lang="zh-Latn">chuáng</rt><rp>)</rp></ruby>
```

### Equal-Width Character Spacing

Every `<ruby>` element in poetry contexts is a fixed-width flex container. Long pinyin overflows visually without pushing characters apart.

```css
.poem-ruby ruby {
  display: inline-flex;
  flex-direction: column-reverse;
  align-items: center;
  width: 1.6em;
  vertical-align: top;
}

.poem-ruby rt {
  font-family: var(--font-pinyin);
  font-size: 0.45em;
  color: var(--text-tertiary);
  white-space: nowrap;
  line-height: 1.2;
}
```

### Hanging Punctuation

Sentence-ending marks sit outside the text block:

```css
.poem-ruby .heti-hang {
  display: inline-block;
  vertical-align: top;
  padding-top: 0.54em;
}
```

### Vertical Mode (Living Scroll)

`writing-mode: vertical-rl` flows characters as right-to-left columns.

```css
.poem-vertical ruby {
  display: inline-flex;
  flex-direction: column-reverse;
  align-items: center;
  height: 1.8em;
  width: auto;
}
```

### Pinyin Visibility Toggle

One CSS class on `<html>`, instant across all `<rt>` elements. Must target `.poem-ruby rt` specifically to override the more specific poem-ruby styles:

```css
.pinyin-hidden rt,
.pinyin-hidden .poem-ruby rt {
  display: none;
}
```

### Polyphonic Characters

Characters with context-dependent pronunciation are marked with `data-polyphone="true"`. Their pinyin renders in the content accent color (`--accent`):

```css
.polyphone-mark rt {
  color: var(--accent);
}
```

---

## Components

### Buttons

| Variant | Background | Text | Border | Radius | Use |
|---|---|---|---|---|---|
| Primary Blue | `--primary` | `#ffffff` | transparent | 8px | Main CTA: 开始复习 |
| Primary Dark | `--text` | `--bg` | transparent | 8px | Secondary CTA |
| Pill Link | transparent | `--primary` | 1px `--primary` | 980px | "Learn more" style links |
| Ghost | transparent | `--text-secondary` | 1px `--border` | 8px | Tertiary actions |

```css
.btn {
  padding: 8px 20px;
  border-radius: var(--radius-md);
  font-family: var(--font-ui);
  font-size: 17px;
  font-weight: 400;
  border: none;
  cursor: pointer;
  transition: all 0.15s ease;
}
```

Hover: primary brightens slightly. Ghost border darkens. No bounce, no scale.

### Rating Buttons

Four difficulty levels. Equal-width, spanning the container.

| Rating | Chinese | Style | Meaning |
|---|---|---|---|
| Forgot | 淡忘 | Ghost (border only) | Complete blank |
| Hard | 艰难 | Ghost (border only) | Recalled with difficulty |
| Good | 尚可 | Ghost (border only) | Recalled correctly |
| Easy | 轻松 | Filled `--success` | Effortless recall |

### Cards & Containers

- Background: `--bg-subtle` (light) or `--bg-subtle` (dark)
- Border: none — borders are rare in this system
- Radius: 12px for cards, 8px for smaller containers
- Shadow: rare, soft when used — `0 3px 30px rgba(0,0,0,0.08)`
- Hover: no standard hover state on cards

### Navigation

Desktop header uses a solid background with a subtle bottom border:

```css
.app-header {
  background: var(--bg);
  border-bottom: 1px solid var(--border-subtle);
}
```

Mobile bottom tab bar uses the glass effect:

```css
.glass-nav {
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: saturate(180%) blur(20px);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  border-top: 1px solid var(--border-subtle);
}
```

All nav text uses theme tokens (`text-text`, `text-text-secondary`, `text-primary`) for correct visibility in both light and dark modes.

### The Chop Stamp 印章

The cultural moment. A blue-ink seal that appears when a Living Scroll is completed.

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

---

## Theming

### Implementation

```
Tailwind darkMode: 'class' + CSS custom properties + next-themes
```

- System preference respected via `prefers-color-scheme`
- Toggle via sun/moon icon button

### Light Mode

Clean white surfaces. Apple Blue as the singular interactive accent. Chinese typefaces provide all the cultural character.

### Dark Mode

Pure black (`#000000`) base — cinematic, immersive. Bright Blue (`#2997ff`) replaces Apple Blue for contrast. The full surface system adjusts for dark contexts.

### Transition

```css
body {
  transition: background 0.3s ease, color 0.3s ease;
}
```

---

## Motion

### Principle: Precise and Restrained

Animations are subtle, fast, and functional — not decorative. Apple's motion language: things appear, they don't bounce.

### Reduced Motion

Respect `prefers-reduced-motion: reduce`:
- Living Scroll: characters appear instantly
- Page transitions: instant
- Chop stamp: appears without animation

### Timing Guidelines

| Element | Duration | Easing |
|---|---|---|
| Button hover | 0.15s | ease |
| Theme transition | 0.3s | ease |
| Scroll character reveal | 0.6s | ease-out |
| Page/card transitions | 0.25s | ease |
| Fade in | 0.4s | ease |

---

## Accessibility

- **Keyboard:** All interactive elements reachable via tab. Focus ring: `2px solid var(--primary)`.
- **Screen readers:** ARIA labels on Living Scroll. Rating buttons have descriptive labels.
- **Color contrast:** WCAG AA minimum (4.5:1 body, 3:1 large text). Primary text on both modes passes AAA.
- **Touch targets:** ≥ 44×44px.

---

## Do's and Don'ts

### Do
- Use Apple Blue (`#0071e3`) ONLY for interactive elements
- Apply slight negative letter-spacing at body sizes
- Keep headings tight (line-height 1.10–1.14)
- Use 980px pill radius for link-style CTAs
- Use the glass effect for sticky navigation
- Alternate between white and `#f5f5f7` sections for rhythm
- Let the Chinese typefaces carry the cultural identity

### Don't
- Don't introduce additional accent colors for UI — blue is the entire chromatic budget
- Don't use heavy shadows or multiple shadow layers
- Don't use borders on cards — prefer background-color shifts
- Don't use wide letter-spacing on UI text (except uppercase section headers)
- Don't add textures, patterns, or gradients to backgrounds
- Don't center-align body text — only headlines and poetry center
- Don't use rounded corners larger than 12px on rectangular elements (980px for pills only)

---

## File Reference

| File | Purpose |
|---|---|
| `DESIGN.md` | This file — the visual design system specification |
| `CLAUDE.md` | Project instructions and skill routing |
| `src/app/globals.css` | CSS custom properties, theme tokens, poetry rendering styles |
| `src/components/CardReview.tsx` | Card-mode review component |
| `src/components/LivingScroll.tsx` | Scroll-mode review component |
| `src/components/ProfileSwitcher.tsx` | Avatar/profile dropdown with CJK-aware initials |
