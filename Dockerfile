# ============================================================
# Afrikintel — Multi-stage Dockerfile
# Builds a production image with Next.js + monitor-service
# ============================================================

# ---- Base stage: install deps ----
FROM oven/bun:1 AS base
WORKDIR /app

# Copy lockfile and package manifests
COPY package.json bun.lock ./
COPY mini-services/monitor-service/package.json ./mini-services/monitor-service/package.json

# Install root dependencies
RUN bun install --frozen-lockfile

# Install monitor-service dependencies
RUN cd mini-services/monitor-service && bun install

# ---- Build stage ----
FROM base AS builder
WORKDIR /app

# Copy source
COPY . .

# Generate Prisma client
RUN bun run db:generate

# Copy Prisma client into monitor-service
RUN mkdir -p mini-services/monitor-service/node_modules/.prisma && \
    rm -rf mini-services/monitor-service/node_modules/.prisma/client && \
    cp -r node_modules/.prisma/client mini-services/monitor-service/node_modules/.prisma/client && \
    rm -rf mini-services/monitor-service/node_modules/@prisma/client && \
    cp -r node_modules/@prisma/client mini-services/monitor-service/node_modules/@prisma/client

# Build Next.js (standalone output)
RUN bun run build

# ---- Production stage ----
FROM oven/bun:1-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Install necessary system packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    netcat-openbsd \
    && rm -rf /var/lib/apt/lists/*

# Copy standalone Next.js build
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules

# Copy Prisma files
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/scripts ./scripts

# Copy monitor-service
COPY --from=builder /app/mini-services ./mini-services

# Copy startup script
COPY start.sh ./start.sh
RUN chmod +x start.sh

# Create data directory for SQLite (fallback)
RUN mkdir -p /app/db

EXPOSE 3000
EXPOSE 3003

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:3000/api/engine || exit 1

CMD ["./start.sh"]
