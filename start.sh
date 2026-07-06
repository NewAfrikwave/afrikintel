#!/bin/bash
# ============================================================
# Afrikintel — Container startup script
# Runs both Next.js (port 3000) and monitor-service (port 3003)
# ============================================================
set -e

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting Afrikintel..."

# Wait for database to be ready (if using external PostgreSQL)
if [ -n "$DATABASE_URL" ] && echo "$DATABASE_URL" | grep -q "postgresql"; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Waiting for PostgreSQL..."
    # Extract host and port from DATABASE_URL
    DB_HOST=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
    DB_PORT=$(echo "$DATABASE_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
    DB_PORT=${DB_PORT:-5432}
    
    for i in $(seq 1 30); do
        if curl -s "http://$DB_HOST:$DB_PORT" >/dev/null 2>&1 || nc -z "$DB_HOST" "$DB_PORT" 2>/dev/null; then
            echo "[$(date '+%Y-%m-%d %H:%M:%S')] PostgreSQL is ready"
            break
        fi
        echo "  Attempt $i/30: waiting for $DB_HOST:$DB_PORT..."
        sleep 2
    done
fi

# Push Prisma schema to database (creates tables if missing)
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Syncing database schema..."
cd /app
./node_modules/.bin/prisma db push --skip-generate || echo "Schema sync skipped (will use existing)"

if [ "$SEED_DEMO" = "1" ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Seeding demo account..."
    bun scripts/seed-demo.ts || echo "Demo seed skipped"
fi

# Start monitor-service in background
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting monitor-service on port 3003..."
cd /app/mini-services/monitor-service
bun index.ts &
MONITOR_PID=$!
echo "  Monitor service PID: $MONITOR_PID"

# Start Next.js in foreground
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting Next.js on port 3000..."
cd /app
exec node server.js
