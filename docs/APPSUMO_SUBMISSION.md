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

Afrikintel is a self-hosted monitoring project for teams that need signal, not alert noise. It monitors websites, TCP services, DNS, ping targets, blacklist status, server agents, and synthetic journeys, then uses smart deduplication, incident correlation, anomaly detection, and AI-assisted postmortems to reduce operational churn. Buyers use the hosted server as a live demo, then run Afrikintel on their own infrastructure.

## AppSumo LTD Tiers

- Tier 1: `$59`, 1 production instance, project/source package, install guide, 12 months of updates.
- Tier 2: `$99`, up to 5 production instances, commercial use, project/source package, priority setup support.
- LTD tiers include self-hosted license access. Managed hosted monitoring is not included.

## Standard Pricing

- Live demo: `$0`, reviewer access at `/demo`.
- Personal self-hosted license: `$99`, 1 production instance, 12 months of updates.
- Team self-hosted license: `$249`, up to 5 production instances, 12 months of updates, email setup support.

## Operating Model

- Keep the Railway deployment as the live demo and reviewer proof environment.
- Sell self-hosted licenses through AppSumo first.
- Use Stripe only for optional direct self-hosted license purchases outside AppSumo.
- Do not promise managed hosting, monthly SaaS accounts, or ongoing infrastructure operations.

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
- AppSumo listing terms, install guide, license terms, refund policy, and optional Stripe direct-license checkout configured.
- Railway PostgreSQL attached and schema pushed.
- SSL active on `afrikintel.com`.
- Screenshots uploaded.
