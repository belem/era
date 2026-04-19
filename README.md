# Kuibu (跬步)

A spaced-repetition app for memorizing Chinese poetry. Built for students grades 1-6 using the PEP (部编) textbook curriculum.

**Stack:** Next.js 16, Supabase (auth + Postgres + RLS), Tailwind CSS v4, next-intl (zh-CN / en)

## Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project (free tier works)

## Setup

```bash
git clone https://github.com/belem/era.git
cd era
npm install
cp .env.example .env.local
```

Fill in `.env.local` with your Supabase project URL and anon key (found in Project Settings > API).

## Database

Run the initial migration against your Supabase project:

```bash
npx supabase db push
```

Or apply manually via the Supabase SQL editor: copy `supabase/migrations/001_initial_schema.sql`.

## Development

```bash
npm run dev
```

Open http://localhost:3000. You'll be redirected to the login page. Create an account, then complete onboarding to set up a student profile.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm test` | Run tests (Vitest) |
| `npm run test:watch` | Watch mode |

## Architecture

```
src/
  app/          # Next.js App Router pages (21 routes)
  components/   # Shared React components
  hooks/        # Client-side hooks (useStudent, useReviewQueue, useTTS)
  lib/          # Core logic (SRS algorithms, search, Supabase clients)
  types/        # Shared TypeScript interfaces
  i18n/         # next-intl configuration
messages/       # i18n translation files (zh-CN.json, en.json)
supabase/       # Database migrations
```

## Optional Services

- **Upstash Redis** — Rate limiting on API routes. Without it, rate limiting is disabled gracefully.
- **Resend** — Guardian invitation emails. Without it, invitations are created but emails are skipped.
