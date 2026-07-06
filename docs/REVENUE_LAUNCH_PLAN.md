# Afrikintel Revenue Launch Plan

## Decision

Run Afrikintel as an AppSumo-led SaaS with a 6-month exit option.

- Primary launch: AppSumo LTD.
- Long-term upside: hosted SaaS subscriptions.
- Secondary channel: self-hosted licenses.
- Exit option: sell if MRR is weak by Month 6.

## Offers

| Offer | Price | Limit | Purpose |
| --- | ---: | --- | --- |
| AppSumo Tier 1 | $59 lifetime | 50 hosted monitors | Launch cash, reviews, early users |
| AppSumo Tier 2 | $99 lifetime | 200 hosted monitors | Higher-value LTD for agencies |
| Free | $0 | 10 monitors | Trial and word of mouth |
| Hosted Pro | $19/mo | 50 monitors | Core SaaS plan |
| Business | $79/mo | 200 monitors | Higher MRR plan |
| Personal self-hosted | $99 one-time | 1 instance | Passive license revenue |
| Team self-hosted | $249 one-time | 5 instances | Passive license revenue |

AppSumo tiers include hosted access only. Self-hosted licenses are sold separately.

## 4-Week Launch Track

### Week 1 - Revenue readiness

- Create Lemon Squeezy variants for all paid offers.
- Add the production variant IDs to Railway.
- Point `afrikintel.com` at Railway and set `NEXTAUTH_URL=https://afrikintel.com`.
- Test SaaS checkout, LTD checkout, self-hosted checkout, and webhooks.
- Verify `/demo`, GitHub OAuth, SMTP, and one monitor-to-incident workflow.

### Week 2 - AppSumo assets

- Finalize AppSumo listing copy from `docs/APPSUMO_SUBMISSION.md`.
- Capture 5-8 screenshots from the live app.
- Record a short demo walkthrough.
- Publish clear tier limits and support expectations.
- Prepare response templates for onboarding, refunds, and bug reports.

### Week 3 - Soft launch

- Post genuine launch notes to `r/selfhosted`, `r/homelab`, `r/sysadmin`, and Show HN.
- Sell self-hosted licenses quietly through `/pricing`.
- Track objections and fix only launch-blocking bugs.

### Week 4 - AppSumo launch

- Submit AppSumo with `/appsumo`, `/demo`, screenshots, and LTD terms.
- Prioritize support speed, checkout reliability, and review collection.
- Ask active users for reviews and short testimonials.

## Month 6 Gate

- `$3K+ MRR`: keep building toward `$10K MRR`.
- `$1K-$3K MRR`: continue only if support load is manageable and acquisition is repeatable.
- `<$1K MRR`: package AppSumo revenue, users, reviews, and MRR for Acquire.com.

## Pre-Submission Verification

- `https://afrikintel.com/landing` loads.
- `https://afrikintel.com/appsumo` loads.
- `https://afrikintel.com/demo` logs reviewers into the demo account.
- Pricing buttons open the correct Lemon Squeezy checkouts.
- Webhook records subscriptions and one-time purchases.
- SMTP sends a real alert email.
- GitHub OAuth callback works in production.
- Railway logs show no Prisma or runtime errors after a full demo run.
