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
