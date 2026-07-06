package main

// ============================================================
// Afrikintel Agent - Go Edition (single-binary, cross-platform)
// ============================================================
// Build:
//   GOOS=linux   GOARCH=amd64 go build -o afrikintel-agent-linux-amd64   afrikintel-agent.go
//   GOOS=darwin  GOARCH=amd64 go build -o afrikintel-agent-darwin-amd64  afrikintel-agent.go
//   GOOS=windows GOARCH=amd64 go build -o afrikintel-agent-windows-amd64.exe afrikintel-agent.go
//
// One-line install on target server:
//   curl -fsSL https://your-afrikintel-host/afrikintel-agent-linux-amd64 -o /usr/local/bin/afrikintel-agent
//   chmod +x /usr/local/bin/afrikintel-agent
//   AFRIKINTEL_MONITOR_ID=xxx AFRIKINTEL_HOST=https://your-afrikintel-host afrikintel-agent
//
// Or via env vars:
//   export AFRIKINTEL_MONITOR_ID="your-monitor-id"
//   export AFRIKINTEL_HOST="http://localhost:3000"
//   export AFRIKINTEL_INTERVAL=15  # optional, default 15s
//   export AFRIKINTEL_TOKEN=""     # optional auth token
//   ./afrikintel-agent
//
// Or via flags:
//   ./afrikintel-agent -monitor=xxx -host=http://localhost:3000 -interval=15

import (
	"bytes"
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"os/exec"
	"runtime"
	"strconv"
	"strings"
	"time"
)

type Metrics struct {
	CPUUsage    float64 `json:"cpuUsage"`
	CPUCores    int     `json:"cpuCores"`
	RAMTotal    float64 `json:"ramTotal"`
	RAMUsed     float64 `json:"ramUsed"`
	RAMUsage    float64 `json:"ramUsage"`
	DiskTotal   float64 `json:"diskTotal"`
	DiskUsed    float64 `json:"diskUsed"`
	DiskUsage   float64 `json:"diskUsage"`
	NetworkIn   float64 `json:"networkIn"`
	NetworkOut  float64 `json:"networkOut"`
	LoadAvg1    float64 `json:"loadAvg1"`
	LoadAvg5    float64 `json:"loadAvg5"`
	LoadAvg15   float64 `json:"loadAvg15"`
	Uptime      float64 `json:"uptime"`
	Processes   int     `json:"processes"`
	Temperature float64 `json:"temperature"`
	Hostname    string  `json:"hostname"`
	OS          string  `json:"os"`
}

type Payload struct {
	MonitorID string   `json:"monitorId"`
	Token     string   `json:"token"`
	Metrics   Metrics  `json:"metrics"`
}

var (
	monitorID string
	host      string
	interval  int
	token     string
)

func init() {
	flag.StringVar(&monitorID, "monitor", "", "Monitor ID (required)")
	flag.StringVar(&host, "host", "http://localhost:3000", "Afrikintel host URL")
	flag.IntVar(&interval, "interval", 15, "Report interval in seconds")
	flag.StringVar(&token, "token", "", "Auth token (optional)")
}

func main() {
	flag.Parse()

	// Env var fallback
	if monitorID == "" {
		monitorID = os.Getenv("AFRIKINTEL_MONITOR_ID")
	}
	if host == "http://localhost:3000" && os.Getenv("AFRIKINTEL_HOST") != "" {
		host = os.Getenv("AFRIKINTEL_HOST")
	}
	if os.Getenv("AFRIKINTEL_INTERVAL") != "" {
		if v, err := strconv.Atoi(os.Getenv("AFRIKINTEL_INTERVAL")); err == nil {
			interval = v
		}
	}
	if token == "" {
		token = os.Getenv("AFRIKINTEL_TOKEN")
	}

	if monitorID == "" {
		log.Fatal("Monitor ID is required. Set AFRIKINTEL_MONITOR_ID env var or use -monitor flag.")
	}

	log.Printf("Afrikintel Agent starting...")
	log.Printf("  Monitor: %s", monitorID)
	log.Printf("  Endpoint: %s/api/agent/report", host)
	log.Printf("  Interval: %ds", interval)
	log.Printf("  OS: %s/%s", runtime.GOOS, runtime.GOARCH)

	ticker := time.NewTicker(time.Duration(interval) * time.Second)
	defer ticker.Stop()

	// Send immediately on start
	sendReport()

	for range ticker.C {
		sendReport()
	}
}

func sendReport() {
	metrics, err := collectMetrics()
	if err != nil {
		log.Printf("Error collecting metrics: %v", err)
		return
	}

	payload := Payload{
		MonitorID: monitorID,
		Token:     token,
		Metrics:   metrics,
	}

	body, err := json.Marshal(payload)
	if err != nil {
		log.Printf("Error marshaling payload: %v", err)
		return
	}

	resp, err := http.Post(host+"/api/agent/report", "application/json", bytes.NewReader(body))
	if err != nil {
		log.Printf("[%s] Failed to report: %v", time.Now().Format("15:04:05"), err)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode == 200 {
		log.Printf("[%s] Reported to %s", time.Now().Format("15:04:05"), host)
	} else {
		body, _ := io.ReadAll(resp.Body)
		log.Printf("[%s] HTTP %d: %s", time.Now().Format("15:04:05"), resp.StatusCode, string(body))
	}
}

func collectMetrics() (Metrics, error) {
	m := Metrics{}

	// CPU usage (sample over 1 second)
	m.CPUUsage = getCPUUsage()
	m.CPUCores = runtime.NumCPU()

	// Memory
	m.RAMTotal, m.RAMUsed, m.RAMUsage = getMemory()

	// Disk
	m.DiskTotal, m.DiskUsed, m.DiskUsage = getDisk()

	// Network (sample over 1s)
	m.NetworkIn, m.NetworkOut = getNetwork()

	// Load averages (Unix only)
	if runtime.GOOS != "windows" {
		m.LoadAvg1, m.LoadAvg5, m.LoadAvg15 = getLoadAvg()
	}

	// Uptime
	m.Uptime = getUptime()

	// Process count
	m.Processes = getProcessCount()

	// Hostname / OS
	hostname, _ := os.Hostname()
	m.Hostname = hostname
	m.OS = runtime.GOOS

	return m, nil
}

// ============================================================
// Platform-specific implementations
// ============================================================

func getCPUUsage() float64 {
	// Use /proc/stat on Linux, top on macOS, wmic on Windows
	switch runtime.GOOS {
	case "linux":
		return getCPUUsageLinux()
	case "darwin":
		return getCPUUsageDarwin()
	case "windows":
		return getCPUUsageWindows()
	}
	return 0
}

func getCPUUsageLinux() float64 {
	// Read /proc/stat twice with 1s sleep, compute delta
	data1, err := os.ReadFile("/proc/stat")
	if err != nil {
		return 0
	}
	time.Sleep(time.Second)
	data2, err := os.ReadFile("/proc/stat")
	if err != nil {
		return 0
	}
	return computeCPUPercent(string(data1), string(data2))
}

func computeCPUPercent(s1, s2 string) float64 {
	lines1 := strings.Split(s1, "\n")
	lines2 := strings.Split(s2, "\n")
	if len(lines1) < 1 || len(lines2) < 1 {
		return 0
	}
	fields1 := strings.Fields(lines1[0])
	fields2 := strings.Fields(lines2[0])
	if len(fields1) < 5 || len(fields2) < 5 {
		return 0
	}
	var nums1, nums2 []int64
	for _, f := range fields1[1:] {
		n, _ := strconv.ParseInt(f, 10, 64)
		nums1 = append(nums1, n)
	}
	for _, f := range fields2[1:] {
		n, _ := strconv.ParseInt(f, 10, 64)
		nums2 = append(nums2, n)
	}
	if len(nums1) < 4 || len(nums2) < 4 {
		return 0
	}
	total1 := nums1[0] + nums1[1] + nums1[2] + nums1[3]
	total2 := nums2[0] + nums2[1] + nums2[2] + nums2[3]
	idle1 := nums1[3]
	idle2 := nums2[3]
	totalDelta := total2 - total1
	idleDelta := idle2 - idle1
	if totalDelta == 0 {
		return 0
	}
	return float64(totalDelta-idleDelta) / float64(totalDelta) * 100
}

func getCPUUsageDarwin() float64 {
	// Use top -l 1 on macOS
	out, err := exec.Command("top", "-l", "1", "-n", "0").Output()
	if err != nil {
		return 0
	}
	for _, line := range strings.Split(string(out), "\n") {
		if strings.Contains(line, "CPU usage:") {
			// Parse: CPU usage: 12.5% user, 8.3% sys, 79.2% idle
			parts := strings.Split(line, ",")
			for _, p := range parts {
				p = strings.TrimSpace(p)
				if strings.Contains(p, "idle") {
					pct := strings.TrimSuffix(strings.TrimSpace(strings.Split(p, "%")[0]), " ")
					// Strip non-numeric prefix
					for i, c := range pct {
						if c >= '0' && c <= '9' {
							pct = pct[i:]
							break
						}
					}
					if idle, err := strconv.ParseFloat(pct, 64); err == nil {
						return 100 - idle
					}
				}
			}
		}
	}
	return 0
}

func getCPUUsageWindows() float64 {
	// Use wmic
	out, err := exec.Command("wmic", "cpu", "get", "loadpercentage").Output()
	if err != nil {
		return 0
	}
	lines := strings.Split(strings.TrimSpace(string(out)), "\n")
	if len(lines) >= 2 {
		v := strings.TrimSpace(lines[1])
		if pct, err := strconv.ParseFloat(v, 64); err == nil {
			return pct
		}
	}
	return 0
}

func getMemory() (total, used, usage float64) {
	switch runtime.GOOS {
	case "linux":
		return getMemoryLinux()
	case "darwin":
		return getMemoryDarwin()
	case "windows":
		return getMemoryWindows()
	}
	return 0, 0, 0
}

func getMemoryLinux() (total, used, usage float64) {
	data, err := os.ReadFile("/proc/meminfo")
	if err != nil {
		return 0, 0, 0
	}
	var memTotal, memFree, memAvailable, buffers, cached float64
	for _, line := range strings.Split(string(data), "\n") {
		fields := strings.Fields(line)
		if len(fields) < 2 {
			continue
		}
		val, _ := strconv.ParseFloat(fields[1], 64)
		val /= 1024 * 1024 // KB to GB
		switch fields[0] {
		case "MemTotal:":
			memTotal = val
		case "MemFree:":
			memFree = val
		case "MemAvailable:":
			memAvailable = val
		case "Buffers:":
			buffers = val
		case "Cached:":
			cached = val
		}
	}
	used = memTotal - memAvailable
	if memTotal > 0 {
		usage = (used / memTotal) * 100
	}
	return memTotal, used, usage
}

func getMemoryDarwin() (total, used, usage float64) {
	out, err := exec.Command("vm_stat").Output()
	if err != nil {
		return 0, 0, 0
	}
	var pageSize float64 = 4096
	var free, active, inactive, wired float64
	for _, line := range strings.Split(string(out), "\n") {
		if strings.Contains(line, "Pages free:") {
			parts := strings.Split(line, ":")
			if len(parts) == 2 {
				v := strings.TrimSuffix(strings.TrimSpace(parts[1]), ".")
				if n, err := strconv.ParseFloat(v, 64); err == nil {
					free = n * pageSize / 1e9 // bytes to GB
				}
			}
		}
		if strings.Contains(line, "Pages active:") {
			parts := strings.Split(line, ":")
			if len(parts) == 2 {
				v := strings.TrimSuffix(strings.TrimSpace(parts[1]), ".")
				if n, err := strconv.ParseFloat(v, 64); err == nil {
					active = n * pageSize / 1e9
				}
			}
		}
		if strings.Contains(line, "Pages wired down:") {
			parts := strings.Split(line, ":")
			if len(parts) == 2 {
				v := strings.TrimSuffix(strings.TrimSpace(parts[1]), ".")
				if n, err := strconv.ParseFloat(v, 64); err == nil {
					wired = n * pageSize / 1e9
				}
			}
		}
	}
	// Get total from sysctl
	out, err = exec.Command("sysctl", "-n", "hw.memsize").Output()
	if err == nil {
		if n, err := strconv.ParseFloat(strings.TrimSpace(string(out)), 64); err == nil {
			total = n / 1e9
			used = active + wired
			if total > 0 {
				usage = (used / total) * 100
			}
		}
	}
	return total, used, usage
}

func getMemoryWindows() (total, used, usage float64) {
	out, err := exec.Command("wmic", "OS", "get", "TotalVisibleMemorySize,FreePhysicalMemory").Output()
	if err != nil {
		return 0, 0, 0
	}
	lines := strings.Split(strings.TrimSpace(string(out)), "\n")
	if len(lines) >= 2 {
		fields := strings.Fields(lines[1])
		if len(fields) >= 2 {
			totalKB, _ := strconv.ParseFloat(fields[0], 64)
			freeKB, _ := strconv.ParseFloat(fields[1], 64)
			total = totalKB / 1e6
			used = (totalKB - freeKB) / 1e6
			if total > 0 {
				usage = (used / total) * 100
			}
		}
	}
	return total, used, usage
}

func getDisk() (total, used, usage float64) {
	// Use df on Unix, wmic on Windows
	if runtime.GOOS == "windows" {
		out, err := exec.Command("wmic", "logicaldisk", "get", "size,freespace,caption").Output()
		if err != nil {
			return 0, 0, 0
		}
		lines := strings.Split(strings.TrimSpace(string(out)), "\n")
		var t, u float64
		for i, line := range lines {
			if i == 0 {
				continue
			}
			fields := strings.Fields(line)
			if len(fields) >= 3 {
				free, _ := strconv.ParseFloat(fields[1], 64)
				size, _ := strconv.ParseFloat(fields[2], 64)
				t += size / 1e9
				u += (size - free) / 1e9
			}
		}
		if t > 0 {
			return t, u, (u / t) * 100
		}
		return 0, 0, 0
	}
	out, err := exec.Command("df", "-B1", "/").Output()
	if err != nil {
		return 0, 0, 0
	}
	lines := strings.Split(string(out), "\n")
	if len(lines) >= 2 {
		fields := strings.Fields(lines[1])
		if len(fields) >= 4 {
			total, _ = strconv.ParseFloat(fields[1], 64)
			used, _ = strconv.ParseFloat(fields[2], 64)
			total /= 1e9
			used /= 1e9
			if total > 0 {
				usage = (used / total) * 100
			}
		}
	}
	return total, used, usage
}

func getNetwork() (in, out float64) {
	if runtime.GOOS == "linux" {
		return getNetworkLinux()
	}
	// Cross-platform fallback: just sample /proc/net/dev equivalent or return 0
	return 0, 0
}

func getNetworkLinux() (in, out float64) {
	data1, err := os.ReadFile("/proc/net/dev")
	if err != nil {
		return 0, 0
	}
	time.Sleep(time.Second)
	data2, err := os.ReadFile("/proc/net/dev")
	if err != nil {
		return 0, 0
	}
	in1, out1 := parseNetDev(string(data1))
	in2, out2 := parseNetDev(string(data2))
	return (in2 - in1) / 1024, (out2 - out1) / 1024 // KB/s
}

func parseNetDev(data string) (in, out float64) {
	lines := strings.Split(data, "\n")
	for _, line := range lines {
		if strings.Contains(line, ":") && !strings.Contains(line, "lo:") {
			parts := strings.Split(line, ":")
			if len(parts) != 2 {
				continue
			}
			fields := strings.Fields(parts[1])
			if len(fields) >= 9 {
				rx, _ := strconv.ParseFloat(fields[0], 64)
				tx, _ := strconv.ParseFloat(fields[8], 64)
				in += rx
				out += tx
			}
		}
	}
	return in, out
}

func getLoadAvg() (l1, l5, l15 float64) {
	data, err := os.ReadFile("/proc/loadavg")
	if err != nil {
		return 0, 0, 0
	}
	fields := strings.Fields(string(data))
	if len(fields) >= 3 {
		l1, _ = strconv.ParseFloat(fields[0], 64)
		l5, _ = strconv.ParseFloat(fields[1], 64)
		l15, _ = strconv.ParseFloat(fields[2], 64)
	}
	return l1, l5, l15
}

func getUptime() float64 {
	if runtime.GOOS == "linux" {
		data, err := os.ReadFile("/proc/uptime")
		if err == nil {
			fields := strings.Fields(string(data))
			if len(fields) >= 1 {
				v, _ := strconv.ParseFloat(fields[0], 64)
				return v
			}
		}
	}
	return 0
}

func getProcessCount() int {
	if runtime.GOOS == "linux" {
		entries, err := os.ReadDir("/proc")
		if err == nil {
			count := 0
			for _, e := range entries {
				if e.IsDir() {
					if _, err := strconv.Atoi(e.Name()); err == nil {
						count++
					}
				}
			}
			return count
		}
	}
	return 0
}

// Suppress unused import warning for fmt (used in error messages)
var _ = fmt.Sprintf
