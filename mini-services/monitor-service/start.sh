#!/bin/bash
# Start the Afrikintel monitor-service in the background
# Used by the project bootstrap

SERVICE_DIR="/home/z/my-project/mini-services/monitor-service"
LOG_FILE="$SERVICE_DIR/service.log"
PID_FILE="$SERVICE_DIR/service.pid"

# Ensure prisma client is up-to-date
mkdir -p "$SERVICE_DIR/node_modules/.prisma"
cp -r /home/z/my-project/node_modules/.prisma/client "$SERVICE_DIR/node_modules/.prisma/" 2>/dev/null || true

# Kill any existing process
pkill -f "monitor-service/index" 2>/dev/null || true
sleep 1

# Start the service
cd "$SERVICE_DIR"
setsid bun index.ts > "$LOG_FILE" 2>&1 < /dev/null &
echo $! > "$PID_FILE"
disown

# Wait for it to come up
for i in $(seq 1 10); do
  if grep -q "running on port" "$LOG_FILE" 2>/dev/null; then
    echo "Afrikintel monitor-service started successfully (PID: $(cat $PID_FILE))"
    exit 0
  fi
  sleep 1
done

echo "ERROR: monitor-service failed to start"
cat "$LOG_FILE"
exit 1
