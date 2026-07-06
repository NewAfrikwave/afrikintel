# Afrikintel — Handoff Document for Codex / Developer

> **Purpose**: This document tells a developer (human or AI like Codex) exactly what to do to take Afrikintel from sandbox to production-ready, deployed, and submittable to AppSumo.

## Current State

The project is a **fully functional Next.js 16 application** running in a sandbox preview. All features work:
- Real-time monitoring (HTTP, TCP, DNS, Ping, Blacklist, Server agents)
- Anomaly detection (EWMA + z-score)
- Incident correlation
- Smart alert dedup
- AI postmortems (GLM-4 via z-ai-web-dev-sdk)
- Synthetic monitoring (journeys)
- Multi-region checks
- 8 notification channels
- Auth (NextAuth credentials + GitHub OAuth ready)
- Public status page

**What's missing for production**: deployment, billing, a landing page, and operational config.

---

## Task List (in priority order)

### Task 1: Create GitHub Repository (15 min)

```bash
# Initialize git repo
cd afrikintel
git init
git add .
git commit -m "Initial commit: Afrikintel v3.0"

# Create a .gitignore (CRITICAL — don't commit node_modules, .env, db)
cat > .gitignore << 'EOF'
node_modules/
.next/
.env
.env.local
db/*.db
db/*.db-journal
*.log
download/
upload/
.zscripts/
mini-services/*/node_modules/
mini-services/*/service.log
EOF

git add .gitignore
git commit -m "Add .gitignore"

# Create repo on GitHub (use gh CLI or web UI)
gh repo create afrikintel --public --source=. --push
```

### Task 2: Create Dockerfile (30 min)

The README mentions Docker but no Dockerfile exists. Create one:

```dockerfile
# Dockerfile
FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Copy source
COPY . .

# Generate Prisma client
RUN bun run db:generate

# Build Next.js
RUN bun run build

# Production image
FROM oven/bun:1-slim
WORKDIR /app

COPY --from=base /app/.next/standalone ./
COPY --from=base /app/public ./public
COPY --from=base /app/prisma ./prisma
COPY --from=base /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=base /app/node_modules/@prisma ./node_modules/@prisma

# Copy monitor service
COPY --from=base /app/mini-services ./mini-services

EXPOSE 3000
ENV PORT=3000
ENV NODE_ENV=production

# Start both Next.js and monitor-service
COPY --from=base /app/start.sh ./start.sh
RUN chmod +x start.sh
CMD ["./start.sh"]
```

Create `start.sh`:
```bash
#!/bin/bash
# Start monitor service in background
cd /app/mini-services/monitor-service
bun index.ts &
MONITOR_PID=$!

# Start Next.js
cd /app
bun .next/standalone/server.js &
NEXT_PID=$!

# Wait for either to exit
wait -n $MONITOR_PID $NEXT_PID
```

Create `docker-compose.yml`:
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://afrikintel:password@db:5432/afrikintel
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - NEXTAUTH_URL=${NEXTAUTH_URL}
    depends_on:
      - db
  
  db:
    image: postgres:16-alpine
    environment:
      - POSTGRES_DB=afrikintel
      - POSTGRES_USER=afrikintel
      - POSTGRES_PASSWORD=password
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  pgdata:
```

### Task 3: Add PostgreSQL Support (30 min)

The schema is ready (`prisma/schema.postgres.prisma`). To activate:

1. Swap the schema:
```bash
cp prisma/schema.postgres.prisma prisma/schema.prisma
```

2. Update `.env`:
```env
DATABASE_URL="postgresql://afrikintel:password@localhost:5432/afrikintel?schema=public"
```

3. Push schema:
```bash
bun run db:push
```

4. Update the monitor-service `.env` too:
```bash
echo 'DATABASE_URL="postgresql://afrikintel:password@localhost:5432/afrikintel?schema=public"' > mini-services/monitor-service/.env
```

### Task 4: Create a Landing Page (2-3 hours)

AppSumo requires a **marketing site** at your product URL — not just the app dashboard. Create a new route `/landing` or better, make the root `/` show the landing page and move the dashboard to `/dashboard`.

**Landing page must include:**
- Hero section: "Self-hosted monitoring that doesn't drown you in alerts"
- Feature grid (6 features with icons)
- Pricing section (3 tiers: Free self-hosted, $19/mo hosted, $79/mo business)
- "How it works" section (3 steps)
- Footer with links
- CTA buttons: "Get Started Free" and "View Demo"

**Create**: `src/app/landing/page.tsx` (or restructure routing)

**The current root `/` shows the dashboard.** You need to either:
- Option A: Move dashboard to `/app` and make `/` the landing page
- Option B: Use a separate domain for the landing page (e.g., afrikintel.com → landing, app.afrikintel.com → dashboard)

Option A is simpler. Do that.

### Task 5: Add Billing with Lemon Squeezy (2-3 hours)

Lemon Squeezy handles global VAT/tax and is easier than Stripe for SaaS.

1. **Install:**
```bash
bun add @lemonsqueezy/lemonsqueezy.js
```

2. **Create pricing page** at `src/app/pricing/page.tsx`:
- Free: $0, self-hosted, 10 monitors
- Pro: $19/mo, 50 monitors, all features
- Business: $79/mo, 200 monitors, priority support

3. **Create checkout API** at `src/app/api/checkout/route.ts`:
```typescript
import { Lemonsqueezy } from '@lemonsqueezy/lemonsqueezy.js'
const ls = new Lemonsqueezy(process.env.LEMONSQUEZY_API_KEY)

export async function POST(req: Request) {
  const { plan } = await req.json()
  const variantId = plan === 'pro' ? process.env.LS_PRO_VARIANT_ID : process.env.LS_BUSINESS_VARIANT_ID
  const checkout = await ls.createCheckout({
    variantId,
    redirectUrl: `${process.env.NEXTAUTH_URL}/dashboard?upgraded=1`,
  })
  return Response.json({ url: checkout.url })
}
```

4. **Environment variables to add:**
```env
LEMONSQUEZY_API_KEY=your_api_key
LEMONSQUEZY_WEBHOOK_SECRET=your_webhook_secret
LS_PRO_VARIANT_ID=variant_id_for_pro_plan
LS_BUSINESS_VARIANT_ID=variant_id_for_business_plan
```

5. **Create webhook handler** at `src/app/api/lemonsqueezy/webhook/route.ts` to handle subscription events (created, updated, cancelled).

6. **Add subscription model** to Prisma schema:
```prisma
model Subscription {
  id          String   @id @default(cuid())
  userId      String
  plan        String   // free | pro | business
  status      String   // active | cancelled | expired
  lsCustomerId String?
  lsSubscriptionId String?
  currentPeriodEnd DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### Task 6: Deploy to Production (1-2 hours)

**Option A: Railway (easiest, recommended for first deploy)**

1. Create account at railway.app
2. Connect GitHub repo
3. Create 2 services:
   - **Web service**: Next.js app, port 3000
   - **Worker service**: monitor-service (Bun), port 3003
4. Add PostgreSQL plugin
5. Set environment variables:
   - `DATABASE_URL` (from Railway PostgreSQL plugin)
   - `NEXTAUTH_SECRET` (generate with `openssl rand -base64 32`)
   - `NEXTAUTH_URL` (your Railway URL)
   - `GITHUB_ID`, `GITHUB_SECRET` (if using GitHub OAuth)
6. Deploy both services
7. Add custom domain (afrikintel.com → Railway)

**Option B: VPS with Docker (more control, cheaper at scale)**

1. Rent a VPS (Hetzner $5/mo, DigitalOcean $6/mo)
2. Install Docker:
```bash
curl -fsSL https://get.docker.com | sh
```
3. Clone repo:
```bash
git clone https://github.com/youruser/afrikintel.git
cd afrikintel
```
4. Create `.env` with production values
5. Start:
```bash
docker-compose up -d
```
6. Set up Nginx reverse proxy + Let's Encrypt SSL:
```bash
apt install nginx certbot python3-certbot-nginx
certbot --nginx -d afrikintel.com -d www.afrikintel.com
```

**Option C: Vercel (frontend) + Railway (backend + DB)**

- Frontend on Vercel (free tier)
- Backend (monitor-service) on Railway
- Database on Railway PostgreSQL or Supabase
- More complex but scales well

### Task 7: Set Up GitHub OAuth (30 min)

1. Go to GitHub → Settings → Developer settings → OAuth Apps → New OAuth App
2. Set:
   - Application name: Afrikintel
   - Homepage URL: https://your-domain.com
   - Authorization callback URL: https://your-domain.com/api/auth/callback/github
3. Copy Client ID and Client Secret
4. Add to environment variables:
```env
GITHUB_ID=your_client_id
GITHUB_SECRET=your_client_secret
```

### Task 8: Email Verification (1 hour)

Currently, NextAuth credentials provider doesn't verify emails. For production:

1. Configure SMTP in Settings (already built into the UI)
2. Add email verification to NextAuth:
```typescript
// In auth-options.ts, add EmailProvider
import EmailProvider from 'next-auth/providers/email'
providers.push(EmailProvider({
  server: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  },
  from: process.env.SMTP_FROM,
}))
```

### Task 9: Rate Limiting (30 min)

Add rate limiting to API routes to prevent abuse:

```bash
bun add @upstash/ratelimit @upstash/redis
```

Create `src/lib/rate-limit.ts`:
```typescript
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

export const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(60, '1 m'), // 60 requests per minute
})
```

Apply to API routes (especially `/api/agent/report` and `/api/auth/*`).

### Task 10: Error Tracking (15 min)

Add Sentry for production error monitoring:

```bash
bun add @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

### Task 11: Set Up a Demo Account (15 min)

For AppSumo reviewers and demo purposes, create a public demo:
- Email: demo@afrikintel.com
- Password: demo1234
- Role: viewer (read-only)
- Pre-populated with sample monitors and incidents

Add a "Try Demo" button on the landing page that auto-logs in as this account.

### Task 12: Create AppSumo Submission Assets (1 hour)

AppSumo requires:
- Product URL (your deployed landing page)
- Demo account credentials
- Product description (use `download/launch-materials/product-hunt.md` as base)
- Screenshots (5 minimum)
- Pricing tiers

---

## Environment Variables (Production .env)

```env
# Database
DATABASE_URL="postgresql://afrikintel:PASSWORD@HOST:5432/afrikintel?schema=public"

# Auth
NEXTAUTH_SECRET="GENERATED_SECRET_32_CHARS"
NEXTAUTH_URL="https://afrikintel.com"
GITHUB_ID="your_github_oauth_client_id"
GITHUB_SECRET="your_github_oauth_client_secret"

# Billing (Lemon Squeezy)
LEMONSQUEZY_API_KEY="your_api_key"
LEMONSQUEZY_WEBHOOK_SECRET="your_webhook_secret"
LS_PRO_VARIANT_ID="variant_id"
LS_BUSINESS_VARIANT_ID="variant_id"

# Email (SMTP)
SMTP_HOST="smtp.your-provider.com"
SMTP_PORT="587"
SMTP_USER="alerts@afrikintel.com"
SMTP_PASS="your_smtp_password"
SMTP_FROM="alerts@afrikintel.com"

# SMS (Twilio, optional)
TWILIO_SID="your_twilio_sid"
TWILIO_TOKEN="your_twilio_token"
TWILIO_FROM="+15551234567"

# Rate Limiting (Upstash Redis, optional)
UPSTASH_REDIS_REST_URL="your_redis_url"
UPSTASH_REDIS_REST_TOKEN="your_redis_token"

# Error Tracking (Sentry, optional)
SENTRY_DSN="your_sentry_dsn"

# App
CHECK_REGIONS="us-east,eu-west,ap-southeast"
```

---

## Deployment Checklist

- [ ] GitHub repo created and code pushed
- [ ] Dockerfile and docker-compose.yml created
- [ ] PostgreSQL schema activated (swap schema.prisma)
- [ ] Landing page built at `/`
- [ ] Dashboard moved to `/dashboard` (or `/app`)
- [ ] Lemon Squeezy billing integrated
- [ ] Pricing page created
- [ ] Deployed to Railway/VPS/Vercel
- [ ] Custom domain configured (afrikintel.com)
- [ ] SSL certificate active (Let's Encrypt)
- [ ] GitHub OAuth configured
- [ ] SMTP configured and email alerts tested
- [ ] Demo account created
- [ ] Rate limiting added
- [ ] Error tracking (Sentry) added
- [ ] 5 screenshots taken for AppSumo
- [ ] AppSumo submission form filled out

---

## What Codex Should Ask You

Before starting, Codex needs these from you:

1. **Domain name**: Do you own afrikintel.com? (Register on Namecheap/Cloudflare ~$10/yr)
2. **Hosting preference**: Railway (easy, ~$5/mo), VPS (cheaper, more work), or Vercel + Railway?
3. **Lemon Squeezy account**: Create at lemonsqueezy.com (free to start)
4. **GitHub OAuth app**: Create at github.com/settings/developers
5. **SMTP provider**: Gmail (free, limited), SendGrid (free 100/day), Postmark (paid, reliable)
6. **AppSumo account**: You already have one (I can see from your screenshot)

---

## Honest Estimate

- **Time for Codex to complete**: 1-2 days of focused work (8-16 hours)
- **Monthly costs**: $5-20 hosting + $0-10 database + domain ($10/yr)
- **What you'll have**: A deployed, billed, production-ready Afrikintel at afrikintel.com, ready for AppSumo submission

## What to Tell Codex

Copy-paste this prompt to Codex:

```
I have a Next.js 16 monitoring application called Afrikintel. The code is complete and working in a sandbox. I need you to:

1. Read the HANDOFF.md file in the project root
2. Complete tasks 1-12 in order
3. Deploy to [Railway / VPS / Vercel — your choice]
4. Set up billing with Lemon Squeezy
5. Create a landing page at / and move the dashboard to /dashboard
6. Make it ready for AppSumo submission

The project uses:
- Next.js 16 (App Router)
- Prisma (SQLite → PostgreSQL)
- Socket.io (separate Bun service on port 3003)
- NextAuth (credentials + GitHub OAuth)
- z-ai-web-dev-sdk (for AI postmortems)

All code is in /home/z/my-project/ (or the GitHub repo after Task 1).

Start with Task 1 (GitHub repo) and work through in order.
```
