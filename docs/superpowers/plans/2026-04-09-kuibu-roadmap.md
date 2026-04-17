# Kuibu Development Roadmap

> Master plan for the full Kuibu (跬步) development. Each phase has its own detailed implementation plan.

**Source spec:** `doc/design-kuibu.md`
**Design system:** `DESIGN.md` (Apple-inspired + Chinese typography)

---

## Phase 1: Core Experience — "Make a child want to open it"

**Plan:** `2026-04-09-kuibu-phase-1-core.md`
**Goal:** Working app with aesthetic foundation, 50 poems, auth, SM-2 review loop, Living Scroll, and card review.
**Deliverables:**
- Next.js scaffold with Apple design system + Chinese fonts
- Poetry data pipeline (filter chinese-poetry → pypinyin → structured data)
- Supabase schema (all tables, RLS policies)
- Auth (Email + Google + Apple + GitHub + Microsoft)
- Student profile creation and switching
- Card review with ruby pinyin + pinyin toggle
- Living Scroll with character grid reveal
- SM-2 scheduling algorithm
- Home screen (晨光) with today's queue
- Poetry library browser (诗库)
- i18n foundation (zh-CN + en)
- Light/dark theming with glass navigation

---

## Phase 2: Full Feature Set (v1.0)

**Plan:** `TBD-kuibu-phase-2-features.md` (write after Phase 1 ships)
**Goal:** Complete v1.0 with all three SRS algorithms, gamification, fragments, analytics, audio, and ear training.
**Subsystems:**
- Leitner + FSRS algorithms + algorithm factory + migration logic
- Quiet gamification (scroll gallery, streaks, badges)
- 集雅 Fragment module (general flashcards, shared SRS)
- Parent analytics dashboard (charts, retention curves, heatmaps)
- Guardian invitation flow

---

## Phase 3: Paid Features + Polish

**Plan:** `TBD-kuibu-phase-3-paid.md` (write after Phase 2 ships)
**Goal:** Monetization layer, custom poem creation, PWA, expanded library.
**Subsystems:**
- 诗心 Custom poems (flexsearch autocomplete, pinyin editor, tier enforcement)
- PWA (service worker, offline cache, install prompt)
- Expand poetry library to 200-300 verified poems

---

## Phase 4: Admin

**Plan:** TBD
**Subsystems:**
- Admin dashboard (poetry library management, pinyin review)

---

## Future Work (no timeline)

- AI abstraction layer (WebGPU/WebNN inference pipeline)
- Audio/TTS via Transformers.js (client-side Chinese speech synthesis)
- Ear Training: Passive Listening (沉浸听诵)
- Ear Training: Active Listening (听诵复习)
- Native mobile apps
