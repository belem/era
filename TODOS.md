# TODOS

## Review

### Badge i18n

**What:** Use next-intl message keys for badge names and descriptions instead of hardcoded Chinese strings.

**Why:** The app uses next-intl for localization and profiles have a locale field (default zh-CN). Badge names (初卷, 七日, 明月, 年级通, 百篇) are hardcoded Chinese. If English support is added, all badge text needs refactoring.

**Context:** Currently the app is Chinese-only in practice, but the i18n infrastructure (next-intl, profiles.locale) already exists. ~10 message keys to add. Flagged by eng review outside voice.

**Effort:** S
**Priority:** P3
**Depends on:** Badge implementation in Phase 2

### Resend domain verification

**What:** Configure SPF/DKIM DNS records for the deployment domain to enable Resend email deliverability.

**Why:** Without domain verification, Resend sends from @resend.dev which gets flagged as spam by Gmail/Outlook. Guardian invitation emails that hit spam folders are a broken experience.

**Context:** Resend free tier allows 100 emails/month. Requires DNS access to the custom domain. This is an ops/deployment task, not a code task. Must be done before guardian invites ship to real users. Flagged by eng review outside voice.

**Effort:** S
**Priority:** P2
**Depends on:** Having a custom domain with DNS access, guardian invite feature implementation

## Completed

## Membership Plans (Free / Pro / Max)

The `users.plan` enum (`FREE`, `PRO`, `MAX`, `ADMIN`) exists in the DB and two API routes enforce it. Everything below is unbuilt.

### Tier config map

**What:** Create a shared `tierConfig` object (e.g. `src/lib/tier.ts`) that maps feature keys to minimum required plan:

```ts
export const TIER_ORDER = ["FREE", "PRO", "MAX", "ADMIN"] as const;
export type Plan = (typeof TIER_ORDER)[number];

export const tierConfig = {
  fsrs: "PRO",
  customPoems: "PRO",
  pinyinGen: "PRO",
  advancedAnalytics: "MAX",
  maxStudents: { FREE: 2, PRO: 8, MAX: 120 },
} satisfies Record<string, Plan | Record<Plan, number>>;

export function hasPlan(userPlan: Plan, required: Plan) {
  return TIER_ORDER.indexOf(userPlan) >= TIER_ORDER.indexOf(required);
}
```

**Why:** Currently each API route hard-codes its own `plan !== "PRO" && plan !== "MAX"` check. A shared config lets us move features between tiers in one place, share the same logic in frontend UI gating and backend middleware, and avoid drift.

**Effort:** S  
**Priority:** P1  
**Depends on:** nothing

---

### Display current plan in Settings → Account

**What:** Show the user's current plan (Free / Pro / Max) in the Account tab. Add a "Upgrade" link/button for FREE users.

**Context:** `AccountTab.tsx` currently shows linked providers, MFA, password, and logout. Add a "Plan" row above logout showing `t("plan.free")` / `t("plan.pro")` / `t("plan.max")` with a colored badge, and a `t("upgrade")` CTA for FREE users that links to `/pricing` (stub for now).

**i18n keys to add:**
```json
"plan": { "label": "当前套餐", "free": "免费版", "pro": "Pro", "max": "Max" },
"upgrade": "升级套餐"
```

**Effort:** S  
**Priority:** P2  
**Depends on:** Tier config map

---

### Pricing page (`/pricing`)

**What:** Build a `/pricing` route with a three-column plan comparison table (Free / Pro / Max).

**Feature matrix to show:**

| Feature | Free | Pro | Max |
|---|---|---|---|
| Poems & SRS review | ✓ | ✓ | ✓ |
| SM-2 + Leitner algorithms | ✓ | ✓ | ✓ |
| Student profiles | 2 | 8 | 120 |
| FSRS algorithm | — | ✓ | ✓ |
| Custom poems (拾诗) | — | ✓ | ✓ |
| Pinyin auto-generation | — | ✓ | ✓ |
| Advanced analytics | — | — | ✓ |

**Note:** No payment integration yet — pricing page is informational with a "Contact us" or waitlist CTA. Stripe added when there are users ready to pay.

**Effort:** M  
**Priority:** P2  
**Depends on:** Tier config map, plan display in Settings

---

### Frontend gating: enforce limits in UI

**What:** Use `tierConfig` + the user's plan (fetched once, e.g. via `useStudent` → user query) to gate UI actions client-side:

- Custom poems page: disable "New Poem" button for FREE users, show upgrade prompt
- Settings → Learning: FSRS card already shows "Pro" badge ✓ — wire it to real plan check instead of hardcoded
- Student creation: disable "Add Student" when at `maxStudents` limit for the plan
- Analytics: hide advanced charts section for FREE/PRO where applicable

**Note:** Client-side checks are cosmetic only. Backend API routes are the enforcement layer.

**Effort:** M  
**Priority:** P2  
**Depends on:** Tier config map, plan fetched client-side

---

### Stripe integration

**What:** Add Stripe Checkout for plan upgrades. The `subscriptions` table (user_id, plan, status, stripe_customer_id, current_period_start, current_period_end) is already in the schema.

**Flow:**
1. User clicks "Upgrade" → POST `/api/billing/checkout` → creates Stripe Checkout session → redirect
2. Stripe webhook → POST `/api/billing/webhook` → updates `users.plan` + `subscriptions` row
3. Plan downgrades on subscription cancel (webhook `customer.subscription.deleted`)

**Note:** Do not build until there are actual users who want to pay. Manually set `users.plan` via Supabase admin in the meantime.

**Effort:** L  
**Priority:** P3  
**Depends on:** Pricing page, Stripe account setup, webhook endpoint

---

### Student limit enforcement (backend)

**What:** When creating a new student profile (`POST /api/students` or equivalent), check current student count against `tierConfig.maxStudents[plan]` and return 403 if over limit.

**Effort:** S  
**Priority:** P2  
**Depends on:** Tier config map
