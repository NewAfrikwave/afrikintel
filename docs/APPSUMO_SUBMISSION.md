# AppSumo Submission Pack

## Product URL

Use `https://afrikintel.com/landing` until the custom domain root is pointed at the app. The app root redirects to `/landing`.

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

## Pricing Tiers

- Free self-hosted: `$0`, 10 monitors, smart alert dedup, public status page, community support.
- Hosted Pro: `$19/mo`, 50 monitors, AI postmortems, multi-region checks, email support.
- Business: `$79/mo`, 200 monitors, priority support, team seats, 30-second checks.

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
- Demo account seeded and tested.
- GitHub OAuth callback points to production.
- SMTP credentials configured.
- Lemon Squeezy checkout and webhook configured.
- Railway PostgreSQL attached and schema pushed.
- SSL active on `afrikintel.com`.
- Screenshots uploaded.
