# Afrikintel Revenue Launch Plan

## Decision

Run Afrikintel as an AppSumo-led self-hosted product with the hosted server used only as a live demo.

- Primary launch: AppSumo self-hosted lifetime licenses.
- Live server: demo and reviewer proof only.
- Secondary channel: optional direct Stripe self-hosted licenses.
- Avoid: managed hosting, monthly SaaS subscriptions, and 24/7 infrastructure obligations.

## Offers

| Offer | Price | Limit | Purpose |
| --- | ---: | --- | --- |
| AppSumo Tier 1 | $59 lifetime | 1 production instance | Launch cash, reviews, early users |
| AppSumo Tier 2 | $99 lifetime | Up to 5 production instances | Higher-value license for agencies |
| Live demo | $0 | Demo data only | Proof for reviewers and buyers |
| Personal self-hosted | $99 one-time | 1 production instance | Optional direct license revenue |
| Team self-hosted | $249 one-time | Up to 5 production instances | Optional direct license revenue |

AppSumo tiers include self-hosted license access. Managed hosted monitoring is not included.

## 4-Week Launch Track

### Week 1 - Revenue readiness

- Create Stripe products and prices only for optional direct self-hosted license offers.
- Add the direct-license price IDs to Railway.
- Point `afrikintel.com` at Railway and set `NEXTAUTH_URL=https://afrikintel.com`.
- Test direct-license checkout, AppSumo terms, `/demo`, `/docs/install`, `/license-terms`, and webhooks.
- Verify `/demo`, GitHub OAuth, SMTP, and one monitor-to-incident workflow.

### Week 2 - AppSumo assets

- Finalize AppSumo listing copy from `docs/APPSUMO_SUBMISSION.md`.
- Capture 5-8 screenshots from the live app.
- Record a short demo walkthrough.
- Publish clear tier limits and support expectations.
- Prepare response templates for onboarding, refunds, and bug reports.

### Week 3 - Soft launch

- Post genuine launch notes to `r/selfhosted`, `r/homelab`, `r/sysadmin`, and Show HN.
- Sell direct self-hosted licenses quietly through `/pricing`.
- Track objections and fix only launch-blocking bugs.

### Week 4 - AppSumo launch

- Submit AppSumo with `/appsumo`, `/demo`, screenshots, and LTD terms.
- Prioritize demo reliability, install clarity, support speed, and review collection.
- Ask active users for reviews and short testimonials.

## Month 6 Gate

- Strong AppSumo sales and low support load: keep selling the self-hosted package and consider a larger code/project sale.
- Weak AppSumo sales or high support load: stop active marketing and package the asset for Acquire.com with revenue, users, reviews, and demo proof.

## Pre-Submission Verification

- `https://afrikintel.com/landing` loads.
- `https://afrikintel.com/appsumo` loads.
- `https://afrikintel.com/demo` logs reviewers into the demo account.
- AppSumo pages clearly state self-hosted license terms.
- Optional Stripe checkout records direct one-time license purchases.
- SMTP sends a real alert email.
- GitHub OAuth callback works in production.
- Railway logs show no Prisma or runtime errors after a full demo run.
