#!/bin/bash
# ============================================================
# Afrikintel Agent - Linux Bash Edition
# Run on any Linux server to report CPU/RAM/Disk/Network metrics
# to your Afrikintel dashboard.
#
# Usage:
#   1. Create a "server" type monitor in Afrikintel dashboard
#   2. Copy the monitor ID (visible in URL when clicking the monitor)
#   3. Edit MONITOR_ID and AFRIKINTEL_HOST below
#   4. Run: chmod +x afrikintel-agent.sh && ./afrikintel-agent.sh
#   5. For daemon mode: ./afrikintel-agent.sh --daemon
# ============================================================

MONITOR_ID="${AFRIKINTEL_MONITOR_ID:-REPLACE_WITH_YOUR_MONITOR_ID}"
AFRIKINTEL_HOST="${AFRIKINTEL_HOST:-http://localhost:3000}"
INTERVAL="${AFRIKINTEL_INTERVAL:-15}"   # seconds between reports
TOKEN="${AFRIKINTEL_TOKEN:-}"            # optional auth token

# ============================================================
# Collect metrics
# ============================================================
collect_metrics() {
  # CPU usage (idle = 100 - busy)
  local cpu_idle=$(top -bn1 | awk '/^%Cpu/ {print $8}' | head -1)
  local cpu_usage=$(awk "BEGIN { print 100 - ${cpu_idle:-0} }")
  local cpu_cores=$(nproc 2>/dev/null || echo 1)

  # RAM
  local ram_total=$(free -b | awk '/^Mem:/ {print $2}')
  local ram_used=$(free -b | awk '/^Mem:/ {print $3}')
  local ram_usage=$(awk "BEGIN { if (${ram_total:-0} > 0) print (${ram_used:-0} / ${ram_total:-0}) * 100; else print 0 }")

  # Disk (root partition)
  local disk_total=$(df -B1 / | awk 'NR==2 {print $2}')
  local disk_used=$(df -B1 / | awk 'NR==2 {print $3}')
  local disk_usage=$(awk "BEGIN { if (${disk_total:-0} > 0) print (${disk_used:-0} / ${disk_total:-0}) * 100; else print 0 }")

  # Network (sample over 1s)
  local net_before=$(cat /proc/net/dev | awk '/eth0|ens|enp/ {print $2"+" $10}' | head -1)
  sleep 1
  local net_after=$(cat /proc/net/dev | awk '/eth0|ens|enp/ {print $2"+" $10}' | head -1)
  local net_in=$(awk "BEGIN { print (${net_after:-0+0} - ${net_before:-0+0}) / 1024 }")  # KB/s
  local net_out=$(awk "BEGIN { split(\"${net_after:-0+0}\", a, \"+\"); split(\"${net_before:-0+0}\", b, \"+\"); print (a[2] - b[2]) / 1024 }")

  # Load averages
  local load=$(cat /proc/loadavg)
  local load1=$(echo $load | awk '{print $1}')
  local load5=$(echo $load | awk '{print $2}')
  local load15=$(echo $load | awk '{print $3}')

  # Uptime
  local uptime=$(awk '{print int($1)}' /proc/uptime)

  # Process count
  local processes=$(ls /proc | grep -E '^[0-9]+$' | wc -l)

  # Temperature (if available)
  local temp=""
  if [ -f /sys/class/thermal/thermal_zone0/temp ]; then
    temp=$(awk '{print $1/1000}' /sys/class/thermal/thermal_zone0/temp)
  fi

  # Hostname
  local hostname=$(hostname)
  local os=$(uname -s)

  # Build JSON payload
  cat <<EOF
{
  "monitorId": "${MONITOR_ID}",
  "token": "${TOKEN}",
  "metrics": {
    "cpuUsage": ${cpu_usage%.*},
    "cpuCores": ${cpu_cores},
    "ramTotal": $(awk "BEGIN { print ${ram_total:-0} / 1073741824 }"),
    "ramUsed": $(awk "BEGIN { print ${ram_used:-0} / 1073741824 }"),
    "ramUsage": ${ram_usage%.*},
    "diskTotal": $(awk "BEGIN { print ${disk_total:-0} / 1073741824 }"),
    "diskUsed": $(awk "BEGIN { print ${disk_used:-0} / 1073741824 }"),
    "diskUsage": ${disk_usage%.*},
    "networkIn": ${net_in%.*},
    "networkOut": ${net_out%.*},
    "loadAvg1": ${load1},
    "loadAvg5": ${load5},
    "loadAvg15": ${load15},
    "uptime": ${uptime},
    "processes": ${processes},
    "temperature": ${temp:-null},
    "hostname": "${hostname}",
    "os": "${os}"
  }
}
EOF
}

# ============================================================
# Send metrics to Afrikintel
# ============================================================
send_report() {
  local payload=$(collect_metrics)
  curl -s -X POST "${AFRIKINTEL_HOST}/api/agent/report" \
    -H "Content-Type: application/json" \
    -d "${payload}" > /dev/null 2>&1
  if [ $? -eq 0 ]; then
    echo "[$(date '+%H:%M:%S')] ✓ Reported to ${AFRIKINTEL_HOST}"
  else
    echo "[$(date '+%H:%M:%S')] ✗ Failed to report"
  fi
}

# ============================================================
# Main loop
# ============================================================
echo "Afrikintel Agent starting..."
echo "  Monitor: ${MONITOR_ID}"
echo "  Endpoint: ${AFRIKINTEL_HOST}/api/agent/report"
echo "  Interval: ${INTERVAL}s"
echo ""

while true; do
  send_report
  sleep ${INTERVAL}
done
