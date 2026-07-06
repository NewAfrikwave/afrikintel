# Afrikintel — Infrastructure Monitoring

> Real-time monitoring for websites, services, servers, and infrastructure. Self-hostable, AI-assisted, and built for ops teams who hate alert noise.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6-indigo)](https://www.prisma.io/)

![Afrikintel Dashboard](https://your-host/screenshot.png)

## What is Afrikintel?

Afrikintel is a full-stack infrastructure monitoring platform that combines:

- **Website monitoring** — HTTP/HTTPS checks with status code + response time tracking
- **Service monitoring** — TCP port checks for any service (SMTP, FTP, Redis, databases)
- **Server monitoring** — Agent-based CPU/RAM/Disk/Network metrics
- **DNS monitoring** — Resolution checks against any DNS server
- **Ping monitoring** — ICMP reachability checks
- **Blacklist monitoring** — IP reputation checks against 6 major DNSBLs
- **Synthetic monitoring** — Multi-step user journey checks (navigate → click → type → assert)
- **Anomaly detection** — EWMA + z-score baselines that alert *before* thresholds trip
- **Incident correlation** — Groups related failures into a single incident with root-cause hypothesis
- **Smart alert dedup** — Suppresses alert storms (the #1 differentiator for ops tools)
- **AI-assisted postmortems** — Generates structured RCAs from incident timelines using GLM-4
- **Multi-region checks** — Monitor from us-east, eu-west, ap-southeast simultaneously
- **Public status page** — 90-day uptime history, no auth required
- **8 notification channels** — Email, Slack, Discord, Webhook, SMS, Pushover, Pushbullet, Twitter

## Quick Start (5 minutes)

### Prerequisites

- **Node.js 18+** or **Bun** (recommended)
- **SQLite** (default, no setup needed) or **PostgreSQL** (for production)

### Installation

```bash
# Clone the repo
git clone https://github.com/yourusername/afrikintel.git
cd afrikintel

# Install dependencies
bun install

# Set up the database
cp .env.example .env
bun run db:push

# Start the development server
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) — you're running Afrikintel!

### Default Login

The first run seeds 3 demo accounts:

| Email | Password | Role |
|-------|----------|------|
| admin@afrikintel.com | admin | Admin (full access) |
| ops@afrikintel.com | ops | Editor (manage monitors) |
| viewer@afrikintel.com | view | Viewer (read-only) |

## Self-Hosting Guide

### Production Deployment

#### Option 1: VPS with PM2

```bash
# Install PM2
npm install -g pm2

# Build the app
bun run build

# Start with PM2
pm2 start "bun .next/standalone/server.js" --name afrikintel
pm2 startup
pm2 save
```

#### Option 2: Docker

```dockerfile
FROM oven/bun:1 AS base
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

FROM oven/bun:1-slim
WORKDIR /app
COPY --from=base /app/.next/standalone ./
COPY --from=base /app/public ./public
EXPOSE 3000
CMD ["bun", "server.js"]
```

```bash
docker build -t afrikintel .
docker run -p 3000:3000 -v $(pwd)/data:/app/data afrikintel
```

#### Option 3: Vercel (frontend) + Railway (backend + DB)

- **Frontend**: Deploy to Vercel, set env vars
- **Database**: PostgreSQL on Railway or Supabase
- **Monitor engine**: Run `mini-services/monitor-service` as a separate Railway service

### PostgreSQL Setup (recommended for production)

1. **Create a database:**
   ```sql
   CREATE DATABASE afrikintel;
   CREATE USER afrikintel WITH PASSWORD 'your-password';
   GRANT ALL PRIVILEGES ON DATABASE afrikintel TO afrikintel;
   ```

2. **Update `prisma/schema.prisma`:**
   ```prisma
   datasource db {
     provider = "postgresql"  // change from "sqlite"
     url      = env("DATABASE_URL")
   }
   ```

   Or use the pre-built PostgreSQL schema:
   ```bash
   cp prisma/schema.postgres.prisma prisma/schema.prisma
   ```

3. **Set `DATABASE_URL` in `.env`:**
   ```env
   DATABASE_URL="postgresql://afrikintel:password@localhost:5432/afrikintel?schema=public"
   ```

4. **Push the schema:**
   ```bash
   bun run db:push
   ```

### Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | `file:./db/custom.db` | SQLite path or PostgreSQL URL |
| `NEXTAUTH_SECRET` | Yes | — | Random string for JWT signing (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | Yes | `http://localhost:3000` | Your public URL |
| `GITHUB_ID` | No | — | GitHub OAuth app client ID |
| `GITHUB_SECRET` | No | — | GitHub OAuth app secret |
| `TWILIO_SID` | No | — | Twilio account SID (for SMS alerts) |
| `TWILIO_TOKEN` | No | — | Twilio auth token |
| `TWILIO_FROM` | No | — | Twilio phone number |
| `CHECK_REGIONS` | No | `us-east,eu-west,ap-southeast` | Comma-separated regions |

## Server Agent Setup

Afrikintel ships with 3 agent options for monitoring server metrics (CPU, RAM, Disk, Network).

### Option 1: Go Binary (recommended)

Single binary, no dependencies, cross-platform.

```bash
# Download the agent
curl -fsSL https://your-afrikintel-host/afrikintel-agent-linux-amd64 -o /usr/local/bin/afrikintel-agent
chmod +x /usr/local/bin/afrikintel-agent

# Set environment variables
export AFRIKINTEL_MONITOR_ID="your-monitor-id"
export AFRIKINTEL_HOST="https://your-afrikintel-host"

# Run
afrikintel-agent
```

**As a systemd service:**
```ini
# /etc/systemd/system/afrikintel-agent.service
[Unit]
Description=Afrikintel Monitoring Agent
After=network.target

[Service]
Type=simple
Environment=AFRIKINTEL_MONITOR_ID=your-monitor-id
Environment=AFRIKINTEL_HOST=https://your-afrikintel-host
ExecStart=/usr/local/bin/afrikintel-agent
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
systemctl enable afrikintel-agent
systemctl start afrikintel-agent
```

### Option 2: Bash Script (Linux)

```bash
curl -O https://your-afrikintel-host/afrikintel-agent.sh
chmod +x afrikintel-agent.sh

export AFRIKINTEL_MONITOR_ID="your-monitor-id"
export AFRIKINTEL_HOST="https://your-afrikintel-host"
./afrikintel-agent.sh
```

### Option 3: Python (cross-platform)

```bash
pip install psutil requests

export AFRIKINTEL_MONITOR_ID="your-monitor-id"
export AFRIKINTEL_HOST="https://your-afrikintel-host"
python3 afrikintel-agent.py
```

### Getting your Monitor ID

1. In Afrikintel, go to **Monitors → Add Monitor**
2. Select type **Server**, fill in the target hostname
3. Save the monitor
4. Click on the monitor to open the detail panel — the Monitor ID is in the URL
5. Use that ID as `AFRIKINTEL_MONITOR_ID`

## API Reference

### Authentication

All API endpoints (except `/api/auth/*` and `/api/status-page`) require authentication via NextAuth session cookie.

```bash
# Sign in to get a session cookie
curl -c cookies.txt -X POST http://localhost:3000/api/auth/callback/credentials \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "email=admin@afrikintel.com&password=admin&csrfToken=YOUR_CSRF_TOKEN&json=true"
```

### Monitors

```http
GET /api/monitors
POST /api/monitors
GET /api/monitors/:id
PUT /api/monitors/:id
DELETE /api/monitors/:id
POST /api/monitors/test          # Test a connection before creating
GET /api/monitors/:id/checks     # Recent check history
GET /api/monitors/:id/metrics    # Server metric history (server monitors)
GET /api/monitors/:id/incidents  # Incidents for this monitor
POST /api/monitors/:id/pause     # Pause monitoring
DELETE /api/monitors/:id/pause   # Resume monitoring
```

**Create a monitor:**
```http
POST /api/monitors
Content-Type: application/json

{
  "name": "My Website",
  "type": "website",
  "target": "https://example.com",
  "interval": 30,
  "timeout": 30,
  "region": "us-east",
  "checkRegions": "us-east,eu-west",
  "thresholdResponseTime": 2000,
  "public": true,
  "tags": "production,web"
}
```

### Incidents

```http
GET /api/incidents?status=open&limit=50
POST /api/incidents/:id/acknowledge
POST /api/incidents/:id/resolve
```

### Anomalies

```http
GET /api/anomalies?status=open
```

### Incident Groups (Correlation)

```http
GET /api/incident-groups
```

### Postmortems (AI)

```http
GET /api/postmortems/:incidentId
POST /api/postmortems/:incidentId/generate   # Generate RCA via GLM-4
```

### Journeys (Synthetic Monitoring)

```http
GET /api/journeys
POST /api/journeys
GET /api/journeys/:id
PUT /api/journeys/:id
DELETE /api/journeys/:id
GET /api/journeys/:id/runs
```

### Notifications

```http
GET /api/notifications
POST /api/notifications
PUT /api/notifications/:id
DELETE /api/notifications/:id
POST /api/notifications/:id/test    # Send a test alert
```

### Agent Reporting

```http
POST /api/agent/report
Content-Type: application/json

{
  "monitorId": "monitor-uuid",
  "token": "optional-auth-token",
  "metrics": {
    "cpuUsage": 42.5,
    "cpuCores": 4,
    "ramTotal": 16,
    "ramUsed": 8.2,
    "ramUsage": 51.25,
    "diskTotal": 256,
    "diskUsed": 120,
    "diskUsage": 46.9,
    "networkIn": 245.5,
    "networkOut": 98.2,
    "loadAvg1": 1.2,
    "loadAvg5": 1.0,
    "loadAvg15": 0.9,
    "uptime": 86400,
    "processes": 142,
    "hostname": "my-server",
    "os": "Linux"
  }
}
```

### Stats & Analytics

```http
GET /api/stats              # Dashboard aggregate stats
GET /api/analytics          # Tier 3 analytics (anomalies, groups, dedup, journeys)
GET /api/engine             # Engine status (running, check counts, demo mode)
PUT /api/engine             # Toggle demo mode
GET /api/status-page        # Public status page data (no auth)
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (Client)                      │
│  Next.js 16 App Router · React 19 · Tailwind · shadcn   │
└────────────┬──────────────────────────┬─────────────────┘
             │ HTTP (REST API)          │ WebSocket (Socket.io)
             ▼                          ▼
┌────────────────────────┐   ┌─────────────────────────────┐
│   Next.js API Routes   │   │   Monitor Service (port 3003)│
│  /api/monitors         │   │   - Real check engine        │
│  /api/incidents        │   │   - Anomaly detection (EWMA) │
│  /api/analytics        │   │   - Incident correlation     │
│  /api/postmortems      │   │   - Alert dedup              │
│  /api/auth/*           │   │   - Journey runner           │
└───────────┬────────────┘   └──────────────┬──────────────┘
            │                                │
            ▼                                ▼
┌─────────────────────────────────────────────────────────┐
│              Prisma ORM (SQLite / PostgreSQL)            │
│  Monitor · Check · Incident · AnomalyAlert · Journey     │
│  IncidentGroup · Postmortem · AlertDedup · User          │
└─────────────────────────────────────────────────────────┘
```

### Key Files

- `src/app/` — Next.js App Router pages and API routes
- `src/components/` — React UI components (views, layout, shared)
- `src/lib/` — Shared utilities (db, auth, notifications, socket, types)
- `mini-services/monitor-service/` — Bun-powered WebSocket + check engine
  - `index.ts` — Main service: scheduler, incident management, alert dispatch
  - `checks.ts` — Real check implementations (HTTP, TCP, DNS, Ping, Blacklist)
  - `analytics.ts` — Anomaly detection, incident correlation, dedup, journeys
- `prisma/schema.prisma` — SQLite schema (default)
- `prisma/schema.postgres.prisma` — PostgreSQL schema (production)
- `public/afrikintel-agent.{go,sh,py}` — Server agents (3 languages)

## Development

```bash
# Install dependencies
bun install

# Run database migrations
bun run db:push

# Start dev server (Next.js + monitor-service auto-starts)
bun run dev

# Lint
bun run lint

# Build for production
bun run build

# Reset database
bun run db:reset
```

### Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4 + shadcn/ui (New York)
- **Database**: Prisma ORM (SQLite default, PostgreSQL ready)
- **Real-time**: Socket.io (WebSocket)
- **Auth**: NextAuth.js v4 (Credentials + GitHub OAuth)
- **Charts**: Recharts
- **Animations**: Framer Motion
- **AI**: z-ai-web-dev-sdk (GLM-4 for postmortems)
- **Email**: Nodemailer
- **State**: Zustand + TanStack Query patterns

## Roadmap

### v3.1 (Q1 2026)
- [ ] SSO (SAML/OIDC) for enterprise
- [ ] On-call schedules and escalation policies
- [ ] Maintenance windows
- [ ] Audit log
- [ ] API keys for programmatic access

### v3.2 (Q2 2026)
- [ ] Mobile app (React Native)
- [ ] Terraform provider
- [ ] Webhook signing (HMAC)
- [ ] SLA reporting
- [ ] Custom dashboards

### v4.0 (Q3 2026)
- [ ] Distributed check workers (true multi-region)
- [ ] Time-series database (TimescaleDB/InfluxDB)
- [ ] Prometheus-compatible metrics endpoint
- [ ] Grafana datasource plugin

## License

MIT — see [LICENSE](LICENSE)

## Acknowledgments

- Inspired by [nMon](https://codecanyon.net/item/nmon-website-service-server-monitoring) (original concept)
- UI influenced by [Better Stack](https://betterstack.com), [Linear](https://linear.app), [Vercel](https://vercel.com)
- Built with [Next.js](https://nextjs.org), [Prisma](https://prisma.io), [shadcn/ui](https://ui.shadcn.com)

---

**Afrikintel** — *Intelligent infrastructure monitoring, built for the world.*
