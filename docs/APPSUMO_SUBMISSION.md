# AppSumo Submission Pack

## Product URLs

- Landing: `https://afrikintel.com/landing`
- AppSumo offer page: `https://afrikintel.com/appsumo`
- Pricing/checkout: `https://afrikintel.com/pricing`
- Reviewer demo: `https://afrikintel.com/demo`

## Demo Account

- Email: `demo@afrikintel.com`
- Password: `demo1234`
- Role: `viewer`
- Auto-login URL: `https://afrikintel.com/demo`

Create or refresh it with:

```bash
bun run seed:demo
```

## Product Description

Afrikintel is self-hosted monitoring for teams that need signal, not alert noise. It monitors websites, TCP services, DNS, ping targets, blacklist status, and server agents, then uses smart deduplication, incident correlation, anomaly detection, and AI-assisted postmortems to reduce operational churn. Teams can run it free on their own infrastructure or use hosted plans when they want Afrikintel to manage the stack.

## AppSumo LTD Tiers

- Tier 1: `$59`, 50 hosted monitors, smart alert dedup, AI postmortems, multi-region checks.
- Tier 2: `$99`, 200 hosted monitors, priority support queue, team-ready dashboard, future hosted updates.
- LTD tiers include hosted access only. Source-code ownership is not included.

## Standard Pricing

- Free hosted/self-hosted trial: `$0`, 10 monitors, public status page, community support.
- Hosted Pro: `$19/mo`, 50 monitors, AI postmortems, multi-region checks, email support.
- Business: `$79/mo`, 200 monitors, priority support, team seats, 30-second checks.
- Personal self-hosted license: `$99`, 1 instance, 12 months of updates.
- Team self-hosted license: `$249`, up to 5 instances, 12 months of updates, email support.

## 6-Month Decision Gate

- `$3K+ MRR`: keep building toward `$10K MRR`.
- `$1K-$3K MRR`: continue only if support load is manageable and acquisition is repeatable.
- `<$1K MRR`: package AppSumo revenue, users, reviews, and MRR for Acquire.com.

## Required Screenshots

Use at least five from `download/`:

- `download/dashboard-final.png`
- `download/monitors-view.png`
- `download/incidents-view.png`
- `download/notifications-view.png`
- `download/status-final.png`
- `download/settings-view.png`

## Submission Checklist

- Landing page live at `afrikintel.com`.
- AppSumo page live at `/appsumo`.
- Demo account seeded and tested.
- GitHub OAuth callback points to production.
- SMTP credentials configured.
- Stripe checkout and webhook configured for SaaS, AppSumo LTD, and self-hosted license prices.
- Railway PostgreSQL attached and schema pushed.
- SSL active on `afrikintel.com`.
- Screenshots uploaded.
