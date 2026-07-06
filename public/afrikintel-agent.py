#!/usr/bin/env python3
"""
Afrikintel Agent - Python Edition (cross-platform)
Reports CPU/RAM/Disk/Network metrics to Afrikintel.

Usage:
  pip install psutil requests
  export AFRIKINTEL_MONITOR_ID="your-monitor-id"
  export AFRIKINTEL_HOST="http://localhost:3000"
  python3 afrikintel-agent.py
"""

import os
import sys
import time
import json
import platform
import socket
try:
    import psutil
    import requests
except ImportError:
    print("Missing dependencies. Install with:")
    print("  pip install psutil requests")
    sys.exit(1)

MONITOR_ID = os.environ.get("AFRIKINTEL_MONITOR_ID", "REPLACE_WITH_YOUR_MONITOR_ID")
AFRIKINTEL_HOST = os.environ.get("AFRIKINTEL_HOST", "http://localhost:3000")
INTERVAL = int(os.environ.get("AFRIKINTEL_INTERVAL", "15"))
TOKEN = os.environ.get("AFRIKINTEL_TOKEN", "")


def collect_metrics():
    cpu_usage = psutil.cpu_percent(interval=1)
    cpu_cores = psutil.cpu_count() or 1

    mem = psutil.virtual_memory()
    ram_total = mem.total / (1024 ** 3)
    ram_used = mem.used / (1024 ** 3)
    ram_usage = mem.percent

    disk = psutil.disk_usage("/")
    disk_total = disk.total / (1024 ** 3)
    disk_used = disk.used / (1024 ** 3)
    disk_usage = disk.percent

    net1 = psutil.net_io_counters()
    time.sleep(1)
    net2 = psutil.net_io_counters()
    network_in = (net2.bytes_recv - net1.bytes_recv) / 1024  # KB/s
    network_out = (net2.bytes_sent - net1.bytes_sent) / 1024

    load_avg = os.getloadavg() if hasattr(os, "getloadavg") else (0, 0, 0)

    return {
        "cpuUsage": cpu_usage,
        "cpuCores": cpu_cores,
        "ramTotal": round(ram_total, 2),
        "ramUsed": round(ram_used, 2),
        "ramUsage": ram_usage,
        "diskTotal": round(disk_total, 2),
        "diskUsed": round(disk_used, 2),
        "diskUsage": disk_usage,
        "networkIn": round(network_in, 2),
        "networkOut": round(network_out, 2),
        "loadAvg1": load_avg[0],
        "loadAvg5": load_avg[1],
        "loadAvg15": load_avg[2],
        "uptime": int(time.time() - psutil.boot_time()),
        "processes": len(psutil.pids()),
        "temperature": None,
        "hostname": socket.gethostname(),
        "os": platform.system(),
    }


def main():
    print(f"Afrikintel Agent starting...")
    print(f"  Monitor: {MONITOR_ID}")
    print(f"  Endpoint: {AFRIKINTEL_HOST}/api/agent/report")
    print(f"  Interval: {INTERVAL}s")
    print()

    while True:
        try:
            metrics = collect_metrics()
            payload = {
                "monitorId": MONITOR_ID,
                "token": TOKEN,
                "metrics": metrics,
            }
            r = requests.post(
                f"{AFRIKINTEL_HOST}/api/agent/report",
                json=payload,
                timeout=10,
            )
            ts = time.strftime("%H:%M:%S")
            if r.ok:
                data = r.json()
                print(f"[{ts}] ✓ Reported · status={data.get('status', '?')}")
            else:
                print(f"[{ts}] ✗ HTTP {r.status_code}: {r.text}")
        except Exception as e:
            print(f"[{time.strftime('%H:%M:%S')}] ✗ Error: {e}")
        time.sleep(INTERVAL)


if __name__ == "__main__":
    main()
