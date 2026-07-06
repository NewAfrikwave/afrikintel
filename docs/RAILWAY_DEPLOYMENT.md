# Railway Deployment

Afrikintel is configured for Railway with `railway.json` and the root `Dockerfile`.

## Services

Recommended first production deploy:

- Web service: this repository, Dockerfile builder, public port `3000`.
- PostgreSQL plugin: attach the generated `DATABASE_URL`.
- Optional worker split: create a second service from the same repo with start command `cd mini-services/monitor-service && bun index.ts` if you want the monitor worker independently scalable. The Docker start script already runs both app and worker for a single-service launch.

## Required Variables

Set these in Railway:

```env
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="https://afrikintel.com"
GITHUB_ID="github-oauth-client-id"
GITHUB_SECRET="github-oauth-client-secret"
SMTP_HOST="smtp.provider.com"
SMTP_PORT="587"
SMTP_USER="alerts@afrikintel.com"
SMTP_PASS="smtp-password"
SMTP_FROM="alerts@afrikintel.com"
LEMONSQUEEZY_API_KEY="live-or-test-api-key"
LEMONSQUEEZY_WEBHOOK_SECRET="webhook-secret"
LS_STORE_ID="lemon-squeezy-store-id"
LS_PRO_VARIANT_ID="pro-variant-id"
LS_BUSINESS_VARIANT_ID="business-variant-id"
CHECK_REGIONS="us-east,eu-west,ap-southeast"
```

Optional:

```env
UPSTASH_REDIS_REST_URL="..."
UPSTASH_REDIS_REST_TOKEN="..."
SENTRY_DSN="..."
SENTRY_TRACES_SAMPLE_RATE="0.1"
```

## Post-Deploy Steps

1. Add the custom domain `afrikintel.com` in Railway and point DNS to Railway.
2. Set the GitHub OAuth callback to `https://afrikintel.com/api/auth/callback/github`.
3. Set the Lemon Squeezy webhook URL to `https://afrikintel.com/api/lemonsqueezy/webhook`.
4. Run `bun run seed:demo` against the production database once to create the reviewer account.
5. Verify `/landing`, `/pricing`, `/demo`, `/dashboard`, and `/api/engine`.
